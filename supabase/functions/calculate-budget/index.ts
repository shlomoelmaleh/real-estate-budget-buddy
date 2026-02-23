import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Import canonical engine from _shared (single source of truth)
import {
  calculateMaxBudget,
  generateAmortizationTable,
  type PartnerConfig,
  type CalculatorResults,
} from "../_shared/calculatorEngine.ts";

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

// ============= LOAD PARTNER CONFIG FROM DB =============

async function loadPartnerConfig(
  supabaseClient: any,
  partnerId: string | null
): Promise<PartnerConfig> {
  if (!partnerId) {
    return DEFAULT_PARTNER_CONFIG;
  }

  try {
    const { data, error } = await supabaseClient
      .from('partners')
      .select(`
        max_dti_ratio,
        max_age,
        max_loan_term_years,
        rent_recognition_first_property,
        rent_recognition_investment,
        default_interest_rate,
        lawyer_fee_percent,
        broker_fee_percent,
        vat_percent,
        advisor_fee_fixed,
        other_fee_fixed,
        rental_yield_default,
        rent_warning_high_multiplier,
        rent_warning_low_multiplier,
        enable_rent_validation,
        enable_what_if_calculator,
        show_amortization_table,
        max_amortization_months
      `)
      .eq('id', partnerId)
      .single();

    if (error || !data) {
      console.error('Failed to load partner config:', error);
      return DEFAULT_PARTNER_CONFIG;
    }

    return {
      max_dti_ratio: data.max_dti_ratio ?? DEFAULT_PARTNER_CONFIG.max_dti_ratio,
      max_age: data.max_age ?? DEFAULT_PARTNER_CONFIG.max_age,
      max_loan_term_years: data.max_loan_term_years ?? DEFAULT_PARTNER_CONFIG.max_loan_term_years,
      rent_recognition_first_property: data.rent_recognition_first_property ?? DEFAULT_PARTNER_CONFIG.rent_recognition_first_property,
      rent_recognition_investment: data.rent_recognition_investment ?? DEFAULT_PARTNER_CONFIG.rent_recognition_investment,
      default_interest_rate: data.default_interest_rate ?? DEFAULT_PARTNER_CONFIG.default_interest_rate,
      lawyer_fee_percent: data.lawyer_fee_percent ?? DEFAULT_PARTNER_CONFIG.lawyer_fee_percent,
      broker_fee_percent: data.broker_fee_percent ?? DEFAULT_PARTNER_CONFIG.broker_fee_percent,
      vat_percent: data.vat_percent ?? DEFAULT_PARTNER_CONFIG.vat_percent,
      advisor_fee_fixed: data.advisor_fee_fixed ?? DEFAULT_PARTNER_CONFIG.advisor_fee_fixed,
      other_fee_fixed: data.other_fee_fixed ?? DEFAULT_PARTNER_CONFIG.other_fee_fixed,
      rental_yield_default: data.rental_yield_default ?? DEFAULT_PARTNER_CONFIG.rental_yield_default,
      rent_warning_high_multiplier: data.rent_warning_high_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_high_multiplier,
      rent_warning_low_multiplier: data.rent_warning_low_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_low_multiplier,
      enable_rent_validation: data.enable_rent_validation ?? DEFAULT_PARTNER_CONFIG.enable_rent_validation,
      enable_what_if_calculator: data.enable_what_if_calculator ?? DEFAULT_PARTNER_CONFIG.enable_what_if_calculator,
      show_amortization_table: data.show_amortization_table ?? DEFAULT_PARTNER_CONFIG.show_amortization_table,
      max_amortization_months: data.max_amortization_months ?? DEFAULT_PARTNER_CONFIG.max_amortization_months,
    };
  } catch (error) {
    console.error('Exception loading partner config:', error);
    return DEFAULT_PARTNER_CONFIG;
  }
}

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

    // Load partner configuration
    const config = inputConfig || await loadPartnerConfig(supabaseAdmin, partnerId || null);

    // Perform calculation using the canonical shared engine
    const results = calculateMaxBudget(inputs, config);

    if (!results) {
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

    // Generate amortization table (already included by calculateMaxBudget if enabled)
    // Extract separately for backwards compatibility
    const amortization = results.amortizationTable || [];
    // Remove from results to keep payload clean
    const { amortizationTable: _, ...cleanResults } = results;

    return new Response(
      JSON.stringify({
        results: cleanResults,
        amortization,
        config: {
          enable_what_if_calculator: config.enable_what_if_calculator,
        }
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
