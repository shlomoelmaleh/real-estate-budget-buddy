import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Import canonical engine from _shared (single source of truth)
import {
  calculateMaxBudget,
  generateAmortizationTable,
  type PartnerConfig,
  type CalculatorResults,
  type TaxBracket,
  type TaxProfile,
} from "../_shared/calculatorEngine.ts";
import { loadPartnerConfig, loadSystemTaxBrackets } from "../_shared/configLoader.ts";
import { toILS, fromILS, SupportedCurrency, ExchangeRates } from "../_shared/currencyUtils.ts";
import { calculateLeadScore } from "../_shared/leadScoring.ts";

// CORS headers - allow all origins for this public calculator
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============= DEFAULT PARTNER CONFIG (for fallback) =============

const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
  max_dti_ratio: 0.33,
  max_age: 80,
  max_loan_term_years: 30,
  rent_recognition_first_property: 0.0,
  rent_recognition_investment: 0.8,
  default_interest_rate: 5.0,
  lawyer_fee_percent: 1.0,
  broker_fee_percent: 2.0,
  vat_percent: 18.0,
  advisor_fee_fixed: 9000,
  other_fee_fixed: 3000,
  rental_yield_default: 3.0,
  rent_warning_high_multiplier: 1.5,
  rent_warning_low_multiplier: 0.7,
  enable_rent_validation: true,
  enable_what_if_calculator: true,
  show_amortization_table: true,
  max_amortization_months: 360,
};

// ============= INPUT VALIDATION SCHEMA =============

const CalculatorInputSchema = z.object({
  equity: z.number().nonnegative().max(1e12),
  ltv: z.number().min(0).max(100),
  netIncome: z.number().nonnegative().max(1e9),
  ratio: z.number().min(0).max(100),
  age: z.number().int().min(18).max(120),
  maxAge: z.number().int().min(50).max(120),
  interest: z.number().min(0).max(30),
  isRented: z.boolean(),
  rentalYield: z.number().min(0).max(20),
  rentRecognition: z.number().min(0).max(100),
  budgetCap: z.number().nonnegative().max(1e9).nullable(),
  maxLoanTerm: z.number().int().min(1).max(50).nullable().optional(),
  targetPropertyPrice: z.number().nonnegative().max(1e12).nullable().optional(),
  isFirstProperty: z.boolean(),
  isIsraeliTaxResident: z.boolean(),
  expectedRent: z.number().nonnegative().max(1e9).nullable(),
  lawyerPct: z.number().min(0).max(10),
  brokerPct: z.number().min(0).max(10),
  vatPct: z.number().min(0).max(50),
  advisorFee: z.number().nonnegative().max(1e6),
  otherFee: z.number().nonnegative().max(1e6),
  partnerId: z.string().uuid().nullable().optional(),
  config: z.any().optional(),
  currency: z.string().optional(),
});

type CalculatorInputs = z.infer<typeof CalculatorInputSchema>;

// ============= RATE LIMITING =============

async function checkRateLimitAtomic(
  supabaseAdmin: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const { data, error } = await supabaseAdmin.rpc("atomic_rate_limit", {
    p_identifier: identifier,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_minutes: windowMinutes,
  });

  if (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true, remaining: 0 };
  }

  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: result?.allowed ?? true,
    remaining: result?.remaining ?? 0,
  };
}

// ============= MAIN HANDLER =============

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Rate limit: 30 calculations per minute per IP
    const rateLimitCheck = await checkRateLimitAtomic(
      supabaseAdmin,
      `ip:${clientIP}`,
      "calculate-budget",
      30,
      1
    );

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment before trying again.",
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...corsHeaders
          },
        }
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parseResult = CalculatorInputSchema.safeParse(body);

    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid input data. Please check your values and try again.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const inputs = parseResult.data;
    const partnerId = inputs.partnerId;
    const inputConfig = inputs.config;

    // Load partner configuration, system tax brackets, and exchange rates in parallel
    const [config, systemBrackets, ratesData] = await Promise.all([
      inputConfig || loadPartnerConfig(supabaseAdmin, partnerId || null),
      loadSystemTaxBrackets(supabaseAdmin),
      supabaseAdmin.from('system_settings').select('value, updated_at').eq('key', 'exchange_rates').single()
    ]);

    const rates: ExchangeRates | null = ratesData.data?.value || null;
    const ratesDate = ratesData.data?.updated_at || null;
    const inputCurrency = (inputs.currency as SupportedCurrency) || 'ILS';

    // Convert inputs to ILS if necessary
    let processInputs = { ...inputs };
    let currentRate = 1;

    if (inputCurrency !== 'ILS' && rates) {
      currentRate = rates.rates[inputCurrency] || 1;
      processInputs.equity = toILS(inputs.equity, inputCurrency, rates);
      processInputs.netIncome = toILS(inputs.netIncome, inputCurrency, rates);
      if (inputs.budgetCap) processInputs.budgetCap = toILS(inputs.budgetCap, inputCurrency, rates);
      if (inputs.expectedRent) processInputs.expectedRent = toILS(inputs.expectedRent, inputCurrency, rates);
      if (inputs.targetPropertyPrice) processInputs.targetPropertyPrice = toILS(inputs.targetPropertyPrice, inputCurrency, rates);
    }

    // Perform calculation using the canonical shared engine with dynamic tax brackets (always in ILS)
    const ilsResults = calculateMaxBudget(processInputs, config, systemBrackets);

    if (!ilsResults) {
      return new Response(
        JSON.stringify({
          error: "Could not calculate budget. Please check your input values.",
          code: "CALCULATION_FAILED"
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Convert results back to the requested currency
    const results = { ...ilsResults };
    if (inputCurrency !== 'ILS' && rates) {
      results.maxPropertyValue = fromILS(ilsResults.maxPropertyValue, inputCurrency, rates);
      results.loanAmount = fromILS(ilsResults.loanAmount, inputCurrency, rates);
      results.monthlyPayment = fromILS(ilsResults.monthlyPayment, inputCurrency, rates);
      results.rentIncome = fromILS(ilsResults.rentIncome, inputCurrency, rates);
      results.netPayment = fromILS(ilsResults.netPayment, inputCurrency, rates);
      results.closingCosts = fromILS(ilsResults.closingCosts, inputCurrency, rates);
      results.totalInterest = fromILS(ilsResults.totalInterest, inputCurrency, rates);
      results.totalCost = fromILS(ilsResults.totalCost, inputCurrency, rates);
      results.purchaseTax = fromILS(ilsResults.purchaseTax, inputCurrency, rates);
      results.equityUsed = fromILS(ilsResults.equityUsed, inputCurrency, rates);
      results.equityRemaining = fromILS(ilsResults.equityRemaining, inputCurrency, rates);
      results.lawyerFeeTTC = fromILS(ilsResults.lawyerFeeTTC, inputCurrency, rates);
      results.brokerFeeTTC = fromILS(ilsResults.brokerFeeTTC, inputCurrency, rates);
      if (results.estimatedMarketRent) results.estimatedMarketRent = fromILS(results.estimatedMarketRent, inputCurrency, rates);

      if (results.amortizationTable) {
        results.amortizationTable = results.amortizationTable.map(row => ({
          ...row,
          payment: fromILS(row.payment, inputCurrency, rates),
          interest: fromILS(row.interest, inputCurrency, rates),
          principal: fromILS(row.principal, inputCurrency, rates),
          closing: fromILS(row.closing, inputCurrency, rates),
        }));
      }
    }

    // Generate amortization table (already included by calculateMaxBudget if enabled)
    // Extract separately for backwards compatibility
    const amortization = results.amortizationTable || [];
    // Remove from results to keep payload clean
    const { amortizationTable: _, ...cleanResults } = results;

    const leadAnalysis = calculateLeadScore(
      processInputs as any,
      ilsResults as any,
      (inputs as any).language || 'en'
    );

    return new Response(
      JSON.stringify({
        results: cleanResults,
        amortization,
        config: {
          enable_what_if_calculator: config.enable_what_if_calculator,
        },
        currency: inputCurrency,
        exchangeRate: currentRate,
        ratesDate: ratesDate,
        leadScore: leadAnalysis.score,
        leadTier: leadAnalysis.priorityLabel,
        leadTimeline: leadAnalysis.predictedTimeline,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    const errorId = crypto.randomUUID().slice(0, 8);
    console.error(`[${errorId}] Calculate error:`, error);

    return new Response(
      JSON.stringify({
        error: "An error occurred during calculation. Please try again.",
        errorId
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
