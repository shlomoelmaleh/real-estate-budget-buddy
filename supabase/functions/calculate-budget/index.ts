import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// CORS headers - allow all origins for this public calculator
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============= PARTNER CONFIGURATION =============

interface PartnerConfig {
  max_dti_ratio: number;
  max_age: number;
  max_loan_term_years: number;
  rent_recognition_first_property: number;
  rent_recognition_investment: number;
  default_interest_rate: number;
  lawyer_fee_percent: number;
  broker_fee_percent: number;
  vat_percent: number;
  advisor_fee_fixed: number;
  other_fee_fixed: number;
  rental_yield_default: number;
  rent_warning_high_multiplier: number;
  rent_warning_low_multiplier: number;
  enable_rent_validation: boolean;
  enable_what_if_calculator: boolean;
  show_amortization_table: boolean;
  max_amortization_months: number;
}

const DEFAULT_PARTNER_CONFIG: PartnerConfig = {
  max_dti_ratio: 0.33,
  max_age: 80,
  max_loan_term_years: 30,
  rent_recognition_first_property: 0.0,
  rent_recognition_investment: 0.8,
  default_interest_rate: 5.0,
  lawyer_fee_percent: 1.0,
  broker_fee_percent: 2.0,
  vat_percent: 17.0,
  advisor_fee_fixed: 9000,
  other_fee_fixed: 3000,
  rental_yield_default: 3.0,
  rent_warning_high_multiplier: 1.5,
  rent_warning_low_multiplier: 0.7,
  enable_rent_validation: true,
  enable_what_if_calculator: true,
  show_amortization_table: true,
  max_amortization_months: 60,
};

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
  // Expected rent: null = use 3% yield formula; positive number = fixed rent amount
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

// ============= PROTECTED CALCULATION LOGIC =============
// This code is hidden from the browser - runs only on server

// Binary search parameters
const TOLERANCE = 100; // ₪100 precision
const MAX_ITERATIONS = 50; // Safety break

// Tax Profile Types
type TaxProfile = 'SINGLE_HOME' | 'INVESTOR';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// 2024/2025 Israeli Tax Brackets (PROTECTED)
const TAX_BRACKETS: Record<TaxProfile, TaxBracket[]> = {
  SINGLE_HOME: [
    { min: 0, max: 1_978_745, rate: 0 },
    { min: 1_978_745, max: 2_347_040, rate: 0.035 },
    { min: 2_347_040, max: 6_055_070, rate: 0.05 },
    { min: 6_055_070, max: 20_183_565, rate: 0.08 },
    { min: 20_183_565, max: Infinity, rate: 0.10 },
  ],
  INVESTOR: [
    { min: 0, max: 6_055_070, rate: 0.08 },
    { min: 6_055_070, max: Infinity, rate: 0.10 },
  ],
};

interface CalculatorResults {
  maxPropertyValue: number;
  loanAmount: number;
  actualLTV: number;
  monthlyPayment: number;
  rentIncome: number;
  netPayment: number;
  closingCosts: number;
  totalInterest: number;
  totalCost: number;
  loanTermYears: number;
  purchaseTax: number;
  taxProfile: TaxProfile;
  equityUsed: number;
  equityRemaining: number;
  lawyerFeeTTC: number;
  brokerFeeTTC: number;
  limitingFactor: 'EQUITY_LIMIT' | 'INCOME_LIMIT' | 'LTV_LIMIT' | 'AGE_LIMIT' | 'INSUFFICIENT_DATA';
  estimatedMarketRent: number;
  rentWarning: 'high' | 'low' | null;
}

interface AmortizationRow {
  month: number;
  opening: number;
  payment: number;
  interest: number;
  principal: number;
  closing: number;
}

function determineTaxProfile(isFirstProperty: boolean, isIsraeliTaxResident: boolean): TaxProfile {
  if (isFirstProperty && isIsraeliTaxResident) {
    return 'SINGLE_HOME';
  }
  return 'INVESTOR';
}

function computePurchaseTax(price: number, profile: TaxProfile): number {
  const brackets = TAX_BRACKETS[profile];
  let tax = 0;

  for (const bracket of brackets) {
    if (price <= bracket.min) break;
    const taxableAmount = Math.min(price, bracket.max) - bracket.min;
    tax += taxableAmount * bracket.rate;
  }

  return tax;
}

function calculateClosingCosts(
  price: number,
  purchaseTax: number,
  lawyerPct: number,
  brokerPct: number,
  vatPct: number,
  advisorFee: number,
  otherFee: number
): number {
  const lawyerFee = price * (lawyerPct / 100) * (1 + vatPct / 100);
  const brokerFee = price * (brokerPct / 100) * (1 + vatPct / 100);
  return purchaseTax + lawyerFee + brokerFee + advisorFee + otherFee;
}

function solveMaximumBudget(
  inputs: CalculatorInputs,
  taxProfile: TaxProfile,
  amortizationFactor: number,
  maxLoanTermMonths: number,
  config: PartnerConfig
): CalculatorResults | null {
  const {
    equity,
    ltv,
    netIncome,
    ratio,
    rentalYield,
    budgetCap,
    isRented,
    isFirstProperty,
    expectedRent,
    lawyerPct,
    brokerPct,
    vatPct,
    advisorFee,
    otherFee,
    interest,
    age
  } = inputs;

  // Unified Rent Handling Logic
  // Decouple isFirstProperty (regulatory/LTV) from isRented (cash flow)

  let low = 0;
  let high = equity * 20;
  let iterations = 0;
  let bestResult: CalculatorResults | null = null;

  while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
    iterations++;
    const price = (low + high) / 2;

    const purchaseTax = computePurchaseTax(price, taxProfile);
    const closingCosts = calculateClosingCosts(price, purchaseTax, lawyerPct, brokerPct, vatPct, advisorFee, otherFee);

    // 1. Determine Actual Rent (User Input overrides 3% Yield)
    const hasUserRent = expectedRent !== null && expectedRent > 0;
    const actualRent = hasUserRent
      ? expectedRent
      : (isRented ? (price * (rentalYield / 100)) / 12 : 0);

    // 2. Bank Regulatory Income (The "Bank" View)
    // Rule: First property = config.rent_recognition_first_property. Investment property = config.rent_recognition_investment.
    const rentRecognitionRate = isFirstProperty
      ? config.rent_recognition_first_property
      : config.rent_recognition_investment;
    const bankRecognizedIncome = netIncome + (actualRent * rentRecognitionRate);
    const bankMaxPayment = bankRecognizedIncome * (ratio / 100);

    // 3. User Cash Flow Limit (The "Real World" View)
    const userEffectiveLimit = (budgetCap && budgetCap > 0) ? budgetCap + actualRent : Infinity;

    // 4. Final Constraints
    const maxPayment = Math.min(bankMaxPayment, userEffectiveLimit);
    const maxLoanByPayment = maxPayment / amortizationFactor;
    const maxLoanByLTV = price * (ltv / 100);
    const maxLoan = Math.min(maxLoanByPayment, maxLoanByLTV);
    const requiredEquity = price + closingCosts - maxLoan;

    if (requiredEquity <= equity + TOLERANCE) {
      low = price;
      const loan = maxLoan;
      const payment = loan * amortizationFactor;
      const lawyerFeeTTC = price * (lawyerPct / 100) * (1 + vatPct / 100);
      const brokerFeeTTC = price * (brokerPct / 100) * (1 + vatPct / 100);

      // LIMITING FACTOR LOGIC
      let limitingFactor: CalculatorResults['limitingFactor'] = 'EQUITY_LIMIT'; // Default

      const equityUsed = price + closingCosts - loan;
      const hasExcessEquity = equity - equityUsed >= 1000;

      if (hasExcessEquity) {
        // We have excess equity, so limit is Income or LTV
        if (maxLoanByPayment < maxLoanByLTV) {
          limitingFactor = 'INCOME_LIMIT';
          if (maxLoanTermMonths < 360 && age > 45) {
            limitingFactor = 'AGE_LIMIT';
          }
        } else {
          limitingFactor = 'LTV_LIMIT';
        }
      } else {
        // Used almost all equity -> Equity Limit
        limitingFactor = 'EQUITY_LIMIT';
      }

      // RENT VALIDATION ENGINE
      // Calculate market rent using the user's rentalYield parameter
      const estimatedMarketRent = (price * (rentalYield / 100)) / 12;

      // Determine rent warning flags
      let rentWarning: 'high' | 'low' | null = null;
      if (config.enable_rent_validation) {
        if (actualRent > estimatedMarketRent * config.rent_warning_high_multiplier) {
          rentWarning = 'high';
        } else if (actualRent > 0 && actualRent < estimatedMarketRent * config.rent_warning_low_multiplier) {
          rentWarning = 'low';
        }
      }

      bestResult = {
        maxPropertyValue: price,
        loanAmount: loan,
        actualLTV: (loan / price) * 100,
        monthlyPayment: payment,
        rentIncome: actualRent,
        netPayment: payment - actualRent,
        closingCosts: closingCosts,
        totalInterest: (payment * maxLoanTermMonths) - loan,
        totalCost: payment * maxLoanTermMonths,
        loanTermYears: maxLoanTermMonths / 12,
        purchaseTax,
        taxProfile,
        equityUsed: equityUsed,
        equityRemaining: equity - equityUsed,
        lawyerFeeTTC,
        brokerFeeTTC,
        limitingFactor,
        estimatedMarketRent,
        rentWarning
      };
    } else {
      high = price;
    }
  }

  return bestResult;
}

/**
 * Main calculation function
 */
function calculate(inputs: CalculatorInputs, config: PartnerConfig): CalculatorResults | null {
  const {
    age,
    maxAge,
    interest,
    isFirstProperty,
    isIsraeliTaxResident,
  } = inputs;

  const effectiveMaxAge = Math.min(config.max_age, maxAge || config.max_age);
  const years = Math.min(config.max_loan_term_years, effectiveMaxAge - age);
  if (years <= 0) return null;

  const n = years * 12;
  const rate = interest / 100;
  const mRate = rate / 12;
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

  // Determine tax profile
  const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);

  // Solve
  return solveMaximumBudget(inputs, taxProfile, A, n, config);
}

/**
 * Generate amortization table
 */
function generateAmortizationTable(
  loanAmount: number,
  annualInterest: number,
  years: number
): AmortizationRow[] {
  const mRate = annualInterest / 100 / 12;
  const n = years * 12;
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));
  const monthlyPayment = A * loanAmount;

  const rows: AmortizationRow[] = [];
  let balance = loanAmount;

  for (let i = 1; i <= Math.min(n, 360) && balance > 0.1; i++) {
    const interest = balance * mRate;
    const principal = monthlyPayment - interest;
    const closing = Math.max(0, balance - principal);

    rows.push({
      month: i,
      opening: balance,
      payment: monthlyPayment,
      interest,
      principal,
      closing,
    });

    balance = closing;
  }

  return rows;
}

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
    // On error, allow but log for monitoring
    return { allowed: true, remaining: 0 };
  }

  // The function returns an array with one row
  const result = Array.isArray(data) ? data[0] : data;
  return {
    allowed: result?.allowed ?? true,
    remaining: result?.remaining ?? 0,
  };
}

// ============= MAIN HANDLER =============

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    // Initialize Supabase admin client for rate limiting
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
          error: "Invalid input data",
          details: parseResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
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

    // Load partner configuration (use from input if available for optimization)
    const config = inputConfig || await loadPartnerConfig(supabaseAdmin, partnerId || null);

    // Perform calculation
    const results = calculate(inputs, config);

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

    // Generate amortization table
    const fullAmortization = config.show_amortization_table
      ? generateAmortizationTable(
        results.loanAmount,
        inputs.interest,
        results.loanTermYears
      )
      : [];

    // Truncate according to config
    const amortization = fullAmortization.slice(0, config.max_amortization_months);

    // Return results
    return new Response(
      JSON.stringify({
        results,
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
