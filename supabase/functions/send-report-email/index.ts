import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// DEPLOYMENT VERSION DETECTION (auto-detected, no manual increment needed)
// ============================================================================
const FUNCTION_VERSION = (() => {
  // Priority order for Git SHA detection from various CI/CD environments
  const envVars = [
    "GIT_SHA",
    "GITHUB_SHA", 
    "COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "NETLIFY_COMMIT_REF",
    "CF_PAGES_COMMIT_SHA",
    "DENO_DEPLOYMENT_ID",
  ];
  
  for (const envVar of envVars) {
    const value = Deno.env.get(envVar);
    if (value && value.trim()) {
      return value.trim().slice(0, 7); // First 7 chars of SHA
    }
  }
  
  // Fallback: timestamp-based version (deterministic per deployment)
  return `build-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
})();

// Captured at module load time (deployment time), NOT per-request
const DEPLOYED_AT = new Date().toISOString();

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADVISOR_EMAIL = "shlomo.elmaleh@gmail.com";

// Whitelist of emails exempt from rate limiting (for testing)
const WHITELISTED_EMAILS = [
  "office@eshel-f.com",
  "shlomo.elmaleh@gmail.com",
];

// CORS headers - allow all origins for this public calculator
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-build-sha",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Input validation schema with strict character set restrictions
const EmailRequestSchema = z.object({
  recipientEmail: z.string().email().max(254),
  recipientName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\p{N}\s\-'.,]+$/u, "Name contains invalid characters"),
  recipientPhone: z
    .string()
    .max(30)
    .regex(/^[+0-9\s\-()]*$/, "Phone contains invalid characters"),
  language: z.enum(["he", "en", "fr"]),
  inputs: z.object({
    equity: z.string().max(30),
    ltv: z.string().max(10),
    isFirstProperty: z.boolean(),
    isIsraeliCitizen: z.boolean(),
    isIsraeliTaxResident: z.boolean(),
    netIncome: z.string().max(30),
    ratio: z.string().max(10),
    age: z.string().max(10),
    maxAge: z.string().max(10),
    interest: z.string().max(10),
    isRented: z.boolean(),
    rentalYield: z.string().max(10),
    rentRecognition: z.string().max(10),
    budgetCap: z.string().max(30),
    lawyerPct: z.string().max(10),
    brokerPct: z.string().max(10),
    vatPct: z.string().max(10),
    advisorFee: z.string().max(30),
    otherFee: z.string().max(30),
    targetPropertyPrice: z.string().max(30).optional(),
  }),
  results: z.object({
    maxPropertyValue: z.number().nonnegative().max(1e12),
    loanAmount: z.number().nonnegative().max(1e12),
    actualLTV: z.number().min(0).max(100),
    monthlyPayment: z.number().nonnegative().max(1e9),
    rentIncome: z.number().nonnegative().max(1e9),
    netPayment: z.number().max(1e9),
    closingCosts: z.number().nonnegative().max(1e12),
    totalInterest: z.number().nonnegative().max(1e12),
    totalCost: z.number().nonnegative().max(1e12),
    loanTermYears: z.number().int().positive().max(50),
    shekelRatio: z.number().positive().max(100),
    purchaseTax: z.number().nonnegative().max(1e12),
    taxProfile: z.enum(["SINGLE_HOME", "INVESTOR"]),
    equityUsed: z.number().nonnegative().max(1e12),
    equityRemaining: z.number().max(1e12),
    lawyerFeeTTC: z.number().nonnegative().max(1e9),
    brokerFeeTTC: z.number().nonnegative().max(1e9),
  }),
  amortizationSummary: z.object({
    totalMonths: z.number().int().positive().max(600),
    firstPayment: z.object({
      principal: z.number().nonnegative(),
      interest: z.number().nonnegative(),
    }),
    lastPayment: z.object({
      principal: z.number().nonnegative(),
      interest: z.number().nonnegative(),
    }),
  }),
  yearlyBalanceData: z
    .array(
      z.object({
        year: z.number().int().positive().max(50),
        balance: z.number().nonnegative(),
      }),
    )
    .max(50)
    .optional(),
  paymentBreakdownData: z
    .array(
      z.object({
        year: z.number().int().positive().max(50),
        interest: z.number().nonnegative(),
        principal: z.number().nonnegative(),
      }),
    )
    .max(50)
    .optional(),
  csvData: z.string().optional(),
  partnerId: z.string().uuid().nullable().optional(),
  partner_id: z.string().uuid().nullable().optional(),
  buildSha: z.string().max(40).nullable().optional(),
});

// Atomic rate limiting helper using database function to prevent race conditions
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

// Multi-layer rate limiting: checks both IP and email limits
async function checkMultiLayerRateLimit(
  supabaseAdmin: any,
  clientIP: string,
  recipientEmail: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // Skip rate limiting for whitelisted emails (testing accounts)
  if (WHITELISTED_EMAILS.includes(recipientEmail.toLowerCase())) {
    console.log(`Whitelisted email bypassing rate limit: ${recipientEmail}`);
    return { allowed: true };
  }

  // Layer 1: IP-based rate limit (10 emails per hour from same IP)
  const ipCheck = await checkRateLimitAtomic(supabaseAdmin, `ip:${clientIP}`, "send-report-email", 10, 60);

  if (!ipCheck.allowed) {
    return { allowed: false, reason: "ip_limit" };
  }

  // Layer 2: Email-based rate limit (5 emails per hour to same address)
  // This prevents IP spoofing attacks since email address is harder to forge
  const emailCheck = await checkRateLimitAtomic(
    supabaseAdmin,
    `email:${recipientEmail.toLowerCase()}`,
    "send-report-email",
    5,
    60,
  );

  if (!emailCheck.allowed) {
    return { allowed: false, reason: "email_limit" };
  }

  return { allowed: true };
}

interface ReportEmailRequest {
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  language: "he" | "en" | "fr";
  inputs: {
    equity: string;
    ltv: string;
    isFirstProperty: boolean;
    isIsraeliCitizen: boolean;
    isIsraeliTaxResident: boolean;
    netIncome: string;
    ratio: string;
    age: string;
    maxAge: string;
    interest: string;
    isRented: boolean;
    rentalYield: string;
    rentRecognition: string;
    budgetCap: string;
    lawyerPct: string;
    brokerPct: string;
    vatPct: string;
    advisorFee: string;
    otherFee: string;
    targetPropertyPrice?: string;
  };
  results: {
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
    shekelRatio: number;
    purchaseTax: number;
    taxProfile: "SINGLE_HOME" | "INVESTOR";
    equityUsed: number;
    equityRemaining: number;
    lawyerFeeTTC: number;
    brokerFeeTTC: number;
  };
  amortizationSummary: {
    totalMonths: number;
    firstPayment: { principal: number; interest: number };
    lastPayment: { principal: number; interest: number };
  };
  yearlyBalanceData?: { year: number; balance: number }[];
  paymentBreakdownData?: { year: number; interest: number; principal: number }[];
  csvData?: string;
  partnerId?: string | null;
  partner_id?: string | null;
  buildSha?: string | null;
}

function formatNumber(num: number): string {
  return Math.round(num).toLocaleString("en-US");
}

// HTML escape function to prevent XSS attacks in email HTML
function escapeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper to safely encode UTF-8 string to Base64 for Deno/Supabase
function toBase64(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  let binary = "";
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

type PartnerContactOverride = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
};

interface EmailVersion {
  subject: string;
  html: string;
}

function generateEmailHtml(
  data: ReportEmailRequest,
  isAdvisorCopy: boolean,
  partnerContact?: PartnerContactOverride,
): string {
  const {
    language,
    recipientName: rawRecipientName,
    recipientPhone: rawRecipientPhone,
    recipientEmail: rawRecipientEmail,
    inputs,
    results,
    amortizationSummary,
    yearlyBalanceData,
    paymentBreakdownData,
  } = data;

  // Sanitize all user-provided strings to prevent XSS in HTML body
  const recipientNameEscaped = escapeHtml(rawRecipientName);
  const recipientPhoneEscaped = escapeHtml(rawRecipientPhone);
  const recipientEmailEscaped = escapeHtml(rawRecipientEmail);

  const parseNumber = (str: string): number => {
    if (!str) return 0;
    return parseFloat(str.replace(/,/g, "")) || 0;
  };

  const incomeNet = parseNumber(inputs.netIncome);
  const monthlyPayment = results.monthlyPayment;
  const equityInitial = parseNumber(inputs.equity);
  const equityRemaining = results.equityRemaining;
  const advisorFeeValue = parseNumber(inputs.advisorFee);
  const otherFeeValue = parseNumber(inputs.otherFee);
  const closingCostsTotal =
    results.purchaseTax + results.lawyerFeeTTC + results.brokerFeeTTC + advisorFeeValue + otherFeeValue;

  // Normalize DTI max allowed (could be 33 or 0.33)
  const dtiMaxAllowedRaw = parseFloat(inputs.ratio) || 0;
  const dtiMaxAllowed = dtiMaxAllowedRaw > 1 ? dtiMaxAllowedRaw / 100 : dtiMaxAllowedRaw;

  // Calculate estimated DTI
  const dtiEstimated = incomeNet > 0 ? monthlyPayment / incomeNet : null;
  const thresholdDelta = 0.01;

  // Calculate adjusted income for DTI when rental income is applicable
  const rentRecognitionPct = parseNumber(inputs.rentRecognition) || 80;
  const recognizedRent = !inputs.isFirstProperty && inputs.isRented ? results.rentIncome * (rentRecognitionPct / 100) : 0;
  const adjustedIncomeForDTI = incomeNet + recognizedRent;

  // Calculate correct DTI using adjusted income (income + recognized rent)
  const dtiEstimatedCorrected = adjustedIncomeForDTI > 0 ? monthlyPayment / adjustedIncomeForDTI : null;

  // Financial Dashboard calculations
  const monthlyRent = results.rentIncome || 0;
  const propertyPrice = results.maxPropertyValue || 0;
  const totalCashInvested = results.equityUsed || (equityInitial - results.equityRemaining);

  // Gross Annual Yield: (Monthly Rent * 12) / Property Price
  const grossYield = monthlyRent > 0 && propertyPrice > 0 ? (monthlyRent * 12) / propertyPrice : null;

  // Net Monthly Cash Flow: Monthly Rent - Monthly Mortgage Payment
  const netCashFlow = monthlyRent - monthlyPayment;

  // Cash-on-Cash Return (ROI): (Net Cash Flow * 12) / Total Cash Invested
  const cashOnCash = monthlyRent > 0 && totalCashInvested > 0 ? (netCashFlow * 12) / totalCashInvested : null;

  // ========== TRAFFIC LIGHT CALCULATION (Deal Feasibility - Advisor Only) ==========
  const targetPrice = parseNumber(inputs.targetPropertyPrice || '');
  const maxBudget = results.maxPropertyValue;
  
  let trafficLightStatus: 'green' | 'orange' | 'red' | null = null;
  let trafficLightGap = 0;
  
  if (targetPrice > 0) {
    trafficLightGap = maxBudget - targetPrice;
    const ratio = maxBudget / targetPrice;
    
    if (ratio >= 1.0) {
      trafficLightStatus = 'green';  // Deal is safe
    } else if (ratio >= 0.90) {
      trafficLightStatus = 'orange'; // Borderline
    } else {
      trafficLightStatus = 'red';    // Gap too high
    }
  }

  const texts = {
    he: {
      subject: "דוח מחשבון תקציב רכישת נכס",
      subjectWithName: "דוח תיק של",
      fromPartner: "מאת",
      // Greeting
      greeting: "שלום",
      // Section 1 - Hero
      heroTitle: 'סיכום פרויקט הנדל"ן שלך',
      heroTitleWithName: "דוח תיק של",
      // Client info for advisor copy
      clientInfoTitle: "פרטי הלקוח",
      clientName: "שם",
      clientPhone: "טלפון",
      clientEmail: "אימייל",
      maxPropertyLabel: "שווי נכס מקסימלי",
      limitingFactorLabel: "גורם מגביל לתקציב",
      limitingCash: "מוגבל לפי ההון העצמי (Cash)",
      limitingIncome: "מוגבל לפי הכנסה (יחס החזר)",
      limitingPaymentCap: "מוגבל לפי תקרת משכנתא (יכולת תזרימית)",
      limitingAge: "מוגבל לפי גיל (משך הלוואה מקוצר)",
      limitingComfortable: "פרופיל נוח (מרווח זמין)",
      limitingInsufficient: "נתונים חסרים (לאימות)",
      // Section 2 - Funding
      fundingTitle: "פירוט מימון",
      loanAmount: "סכום משכנתא",
      equityOnProperty: "הון עצמי על הנכס",
      fundingNote: "הלוואה + הון עצמי = מחיר הנכס",
      // Section 3 - Transaction
      transactionTitle: "פירוט עלויות רכישה",
      purchaseTax: "מס רכישה",
      lawyerLabel: 'עו"ד (1% + מע"מ)',
      brokerLabel: 'תיווך (2% + מע"מ)',
      advisorFeeLabel: "שכר יועץ משכנתאות",
      advisorFeeDisclaimer: "המחיר עשוי להשתנות בהתאם למורכבות התיק. הסכום המוצג הוא ממוצע משוער.",
      other: "שונות",
      transactionTotal: "סך עלויות רכישה",
      taxDisclaimer: 'מס רכישה מחושב לפי מדרגות סטנדרטיות בלבד; הטבות מיוחדות לא נכללות. יש לאמת עם עו"ד.',
      ttc: 'כולל מע"מ',
      incVat: '(כולל מע״מ)',
      // Section 5 - Feasibility
      feasibilityTitle: "ניתוח היתכנות",
      ltvRatio: "יחס מימון (LTV)",
      dtiMaxLabel: "יחס החזר מקסימלי",
      dtiEstimatedLabel: "יחס החזר משוער",
      notAvailable: "לא זמין",
      chartBalanceTitle: "יתרת הלוואה לאורך זמן",
      chartPaymentTitle: "פירוט תשלומים שנתי",
      principal: "קרן",
      interestLabel: "ריבית",
      // Amortization Summary
      amortizationSummaryTitle: "סיכום לוח סילוקין",
      loanTermLabel: "משך ההלוואה",
      monthlyPaymentLabel: "תשלום חודשי משוער",
      totalInterestLabel: 'סה"כ ריבית',
      totalRepaidLabel: 'סה"כ להחזר',
      firstPaymentLabel: "תשלום ראשון",
      lastPaymentLabel: "תשלום אחרון",
      amortizationNote: "טיפ: הסכום הסופי תלוי במידה רבה בריבית ובמשך ההלוואה – ייעול המימון יכול להפחית אותו.",
      // Section 6 - Assumptions
      assumptionsTitle: "פרמטרים לסימולציה",
      age: "גיל לווה",
      citizenship: "אזרחות ישראלית",
      taxResident: "תושב מס",
      firstProperty: "נכס ראשון",
      netIncome: "הכנסה פנויה",
      initialEquity: "הון עצמי ראשוני",
      interestRate: "ריבית שנתית",
      loanTerm: "משך ההלוואה",
      years: "שנים",
      yes: "כן",
      no: "לא",
      // CTA
      ctaTitle: "יש לך שאלות? אני כאן לעזור!",
      ctaWhatsApp: "📞 לקביעת פגישה",
      ctaEmail: "✉️ לשאלות נוספות",
      // Footer
      footer: "Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן",
      note: "הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.",
      simulationDisclaimer: "הסימולציה היא הערכה לצורך קבלת סדר גודל ראשוני ותחילת התהליך.",
      advisorName: "שלמה אלמליח",
      advisorPhone: "054-9997711",
      advisorEmail: "shlomo.elmaleh@gmail.com",
      // Monthly Summary
      monthlySummary: "סיכום חודשי",
      monthlyPaymentUsed: "החזר חודשי בסימולציה",
      monthlyPaymentCap: "תקרת החזר חודשי (אופציונלי)",
      estimatedRentalIncome: "הכנסה משכירות משוערת (3% שנתי)",
      rentalIncomeRetained: "הכנסה משכירות מוכרת (80%)",
      netMonthlyBalance: "יתרה חודשית נטו",
      monthlySummaryNote: "אינדיקטיבי: לאימות בהתאם לחוזה השכירות והוצאות.",
      csvNotice: "מצורף לדוח זה קובץ CSV המכיל את לוח הסילוקין המלא (חודש אחר חודש).",
      // DTI adjusted income
      adjustedIncomeForDTI: "הכנסה לחישוב DTI (כולל 80% שכירות)",
      incomeLabel: "הכנסה פנויה",
      recognizedRentLabel: "שכירות מוכרת (80%)",
      // Financial Dashboard
      financialDashboardTitle: "ניתוח פיננסי",
      grossYield: "תשואה שנתית גולמית",
      netCashFlow: "תזרים חודשי נטו",
      cashOnCash: "תשואה שנתית על ההון (ROI)",
      cashOnCashSubtitle: "*ביחס להון העצמי וההוצאות שהושקעו בפועל",
      notRelevant: "לא רלוונטי",
      positiveBalance: "עודף חודשי",
      negativeBalance: "גרעון חודשי",
      // Traffic Light (Deal Feasibility)
      dealFeasibility: "בדיקת היתכנות עסקה",
      askingPrice: "מחיר מבוקש",
      maxBudgetLabel: "תקציב מקסימלי",
      budgetGap: "פער",
      statusGreen: "עסקה טובה",
      statusOrange: "גבולי",
      statusRed: "פער גבוה",
      // Client Deal Summary (neutral, no traffic light)
      dealSummaryTitle: "סיכום עסקה",
      targetPropertyPriceLabel: "מחיר הנכס המבוקש",
      estimatedBudgetLabel: "התקציב המשוער שלך",
      differenceLabel: "הפרש",
      bridgeSentence: "פערים בתקציב ניתנים לעיתים לגישור באמצעות תכנון פיננסי יצירתי. הצוות שלנו יבדוק זאת לעומק.",
    },
    en: {
      subject: "Property Budget Calculator - Complete Report",
      subjectWithName: "Report for",
      fromPartner: "from",
      greeting: "Hello",
      heroTitle: "Your Property Project Summary",
      heroTitleWithName: "Report for",
      clientInfoTitle: "Client Information",
      clientName: "Name",
      clientPhone: "Phone",
      clientEmail: "Email",
      maxPropertyLabel: "Max Property Value",
      limitingFactorLabel: "Budget Limiting Factor",
      limitingCash: "Limited by Equity (Cash)",
      limitingIncome: "Limited by Income (DTI)",
      limitingPaymentCap: "Limited by Payment Cap (Cash Flow)",
      limitingAge: "Limited by Age (Shorter Loan Term)",
      limitingComfortable: "Comfortable Profile (Margin Available)",
      limitingInsufficient: "Insufficient Data (To Confirm)",
      fundingTitle: "Funding Breakdown",
      loanAmount: "Loan Amount",
      equityOnProperty: "Equity on Property",
      fundingNote: "Loan + Equity = Property Price",
      transactionTitle: "Transaction Costs Details",
      purchaseTax: "Purchase Tax",
      lawyerLabel: "Lawyer (1% + VAT)",
      brokerLabel: "Agency (2% + VAT)",
      advisorFeeLabel: "Mortgage Advisor Fee",
      advisorFeeDisclaimer: "Price may vary based on case complexity. The displayed amount is an estimated average.",
      other: "Other",
      transactionTotal: "Total Transaction Costs",
      taxDisclaimer:
        "Tax calculated using standard brackets only; special exemptions not included. Verify with attorney.",
      ttc: "incl. VAT",
      incVat: "(Inc. VAT)",
      feasibilityTitle: "Feasibility Analysis",
      ltvRatio: "LTV Ratio",
      dtiMaxLabel: "Max DTI Allowed",
      dtiEstimatedLabel: "Estimated DTI",
      notAvailable: "N/A",
      chartBalanceTitle: "Loan Balance Over Time",
      chartPaymentTitle: "Annual Payment Breakdown",
      principal: "Principal",
      interestLabel: "Interest",
      amortizationSummaryTitle: "Amortization Summary",
      loanTermLabel: "Loan Term",
      monthlyPaymentLabel: "Estimated Monthly Payment",
      totalInterestLabel: "Total Interest",
      totalRepaidLabel: "Total Repaid",
      firstPaymentLabel: "First Payment",
      lastPaymentLabel: "Last Payment",
      amortizationNote:
        "Quick read: this total depends heavily on the rate and term — optimizing the structure can reduce it.",
      assumptionsTitle: "Simulation Assumptions",
      age: "Borrower Age",
      citizenship: "Israeli Citizenship",
      taxResident: "Tax Resident",
      firstProperty: "First Property",
      netIncome: "Net Income",
      initialEquity: "Initial Equity",
      interestRate: "Annual Interest",
      loanTerm: "Loan Term",
      years: "years",
      yes: "Yes",
      no: "No",
      ctaTitle: "Have questions? I am here to help!",
      ctaWhatsApp: "📞 Book an Appointment",
      ctaEmail: "✉️ Ask a Question",
      footer: "Property Budget Pro - Professional Real Estate Planning Tool",
      note: "This simulation is for illustrative purposes only and does not constitute a binding offer. Final rates and terms are subject to lender approval.",
      simulationDisclaimer: "This simulation is an estimate to give an initial ballpark and start the process.",
      advisorName: "Shlomo Elmaleh",
      advisorPhone: "+972-054-9997711",
      advisorEmail: "shlomo.elmaleh@gmail.com",
      // Monthly Summary
      monthlySummary: "Monthly Summary",
      monthlyPaymentUsed: "Monthly mortgage payment used in the simulation",
      monthlyPaymentCap: "Monthly payment cap (optional)",
      estimatedRentalIncome: "Estimated rental income (3% annual)",
      rentalIncomeRetained: "Rental income retained (80%)",
      netMonthlyBalance: "Net monthly balance",
      monthlySummaryNote: "Indicative: to be confirmed based on lease and expenses.",
      csvNotice: "Attached to this report is a CSV file containing the full monthly amortization table.",
      // DTI adjusted income
      adjustedIncomeForDTI: "Income for DTI calculation (incl. 80% rent)",
      incomeLabel: "Net Income",
      recognizedRentLabel: "Recognized Rent (80%)",
      // Financial Dashboard
      financialDashboardTitle: "Financial Analysis",
      grossYield: "Gross Annual Yield",
      netCashFlow: "Net Monthly Cash Flow",
      cashOnCash: "Annual Cash-on-Cash Return (ROI)",
      cashOnCashSubtitle: "*Based on actual equity and costs invested",
      notRelevant: "N/A",
      positiveBalance: "Monthly surplus",
      negativeBalance: "Monthly deficit",
      // Traffic Light (Deal Feasibility)
      dealFeasibility: "Deal Feasibility Check",
      askingPrice: "Asking Price",
      maxBudgetLabel: "Max Budget",
      budgetGap: "Gap",
      statusGreen: "Excellent Fit",
      statusOrange: "Borderline",
      statusRed: "High Gap",
      // Client Deal Summary (neutral, no traffic light)
      dealSummaryTitle: "Deal Summary",
      targetPropertyPriceLabel: "Target Property Price",
      estimatedBudgetLabel: "Your Estimated Budget",
      differenceLabel: "Difference",
      bridgeSentence: "Budget gaps can often be bridged with creative financial planning. Our team will review this.",
    },
    fr: {
      subject: "Simulateur Budget Immobilier - Rapport Complet",
      subjectWithName: "Rapport du dossier de",
      fromPartner: "de la part de",
      greeting: "Bonjour",
      heroTitle: "Synthèse de votre projet immobilier",
      heroTitleWithName: "Rapport du dossier de",
      clientInfoTitle: "Coordonnées du client",
      clientName: "Nom",
      clientPhone: "Téléphone",
      clientEmail: "Email",
      maxPropertyLabel: "Valeur Max du Bien",
      limitingFactorLabel: "Facteur déterminant du budget",
      limitingCash: "Limité par l'apport (Cash)",
      limitingIncome: "Limité par les revenus (DTI bancaire)",
      limitingPaymentCap: "Limité par le plafond mensualité",
      limitingAge: "Limité par l'âge (durée de prêt réduite)",
      limitingComfortable: "Profil confortable (marge disponible)",
      limitingInsufficient: "Données insuffisantes (à confirmer)",
      fundingTitle: "Le montage financier",
      loanAmount: "Montant du Prêt",
      equityOnProperty: "Apport net sur le prix du bien",
      fundingNote: "Prêt + Apport = Prix du bien",
      transactionTitle: "Détail des frais de transaction",
      purchaseTax: "Taxe d'acquisition",
      lawyerLabel: "Avocat (1% H.T)",
      brokerLabel: "Frais d'agence (2% H.T)",
      advisorFeeLabel: "Frais de conseiller hypothécaire",
      advisorFeeDisclaimer:
        "Le prix peut varier selon la complexité du dossier. Le montant affiché est une moyenne estimée.",
      other: "Divers",
      transactionTotal: "Total des frais de transaction",
      taxDisclaimer: "Barèmes standards uniquement ; exonérations non incluses. Vérifiez auprès d'un avocat.",
      ttc: "T.T.C",
      incVat: "(TTC)",
      feasibilityTitle: "Analyse de faisabilité",
      ltvRatio: "Ratio LTV",
      dtiMaxLabel: "DTI Max autorisé",
      dtiEstimatedLabel: "DTI Estimé",
      notAvailable: "N/A",
      chartBalanceTitle: "Solde du Prêt dans le Temps",
      chartPaymentTitle: "Répartition Annuelle des Paiements",
      principal: "Capital",
      interestLabel: "Intérêts",
      amortizationSummaryTitle: "Résumé du tableau d'amortissement",
      loanTermLabel: "Durée du prêt",
      monthlyPaymentLabel: "Mensualité estimée",
      totalInterestLabel: "Total des intérêts",
      totalRepaidLabel: "Montant total remboursé",
      firstPaymentLabel: "Première mensualité",
      lastPaymentLabel: "Dernière mensualité",
      amortizationNote:
        "Lecture rapide : ce total dépend fortement du taux et de la durée — l'optimisation du montage peut le réduire.",
      assumptionsTitle: "Hypothèses de la simulation",
      age: "Âge de l'emprunteur",
      citizenship: "Nationalité israélienne",
      taxResident: "Résident fiscal",
      firstProperty: "Premier bien",
      netIncome: "Revenu Net",
      initialEquity: "Apport initial",
      interestRate: "Taux d'intérêt annuel",
      loanTerm: "Durée du Prêt",
      years: "ans",
      yes: "Oui",
      no: "Non",
      ctaTitle: "Vous avez des questions ? Je suis là pour vous aider !",
      ctaWhatsApp: "📞 Prendre RDV",
      ctaEmail: "✉️ Poser une question",
      footer: "Property Budget Pro - Outil Professionnel de Planification Immobilière",
      note: "Cette simulation est fournie à titre indicatif uniquement et ne constitue pas une offre contractuelle. Les taux et conditions définitifs dépendent de l'organisme prêteur.",
      simulationDisclaimer: "Cette simulation est une estimation pour donner un ordre d'idée et démarrer le projet.",
      advisorName: "Shlomo Elmaleh",
      advisorPhone: "+972-054-9997711",
      advisorEmail: "shlomo.elmaleh@gmail.com",
      // Monthly Summary
      monthlySummary: "Récapitulatif mensuel",
      monthlyPaymentUsed: "Mensualité utilisée dans la simulation",
      monthlyPaymentCap: "Plafond de mensualité (optionnel)",
      estimatedRentalIncome: "Revenu locatif estimé (3% annuel)",
      rentalIncomeRetained: "Revenu locatif retenu (80%)",
      netMonthlyBalance: "Solde mensuel net",
      monthlySummaryNote: "Indicatif : à confirmer selon le bail et les charges.",
      csvNotice:
        "Vous trouverez en pièce jointe de ce rapport un fichier CSV contenant le tableau d'amortissement complet mois par mois.",
      // DTI adjusted income
      adjustedIncomeForDTI: "Revenu pour calcul DTI (incl. 80% loyer)",
      incomeLabel: "Revenu net",
      recognizedRentLabel: "Loyer retenu (80%)",
      // Financial Dashboard
      financialDashboardTitle: "Analyse Financière",
      grossYield: "Rendement Locatif Brut",
      netCashFlow: "Cash-flow Mensuel Net",
      cashOnCash: "Rendement Annuel sur Fonds Propres (ROI)",
      cashOnCashSubtitle: "*Basé sur l'apport et les frais investis",
      notRelevant: "N/A",
      positiveBalance: "Excédent mensuel",
      negativeBalance: "Déficit mensuel",
      // Traffic Light (Deal Feasibility)
      dealFeasibility: "Vérification de faisabilité",
      askingPrice: "Prix demandé",
      maxBudgetLabel: "Budget maximum",
      budgetGap: "Écart",
      statusGreen: "Excellente affaire",
      statusOrange: "À la limite",
      statusRed: "Écart élevé",
      // Client Deal Summary (neutral, no traffic light)
      dealSummaryTitle: "Résumé de l'opération",
      targetPropertyPriceLabel: "Prix du bien visé",
      estimatedBudgetLabel: "Votre budget estimé",
      differenceLabel: "Différence",
      bridgeSentence: "Un écart peut souvent être comblé par une ingénierie financière adaptée. Notre équipe va analyser cela.",
    },
  };

  const t = texts[language];

  const advisorName = partnerContact?.name || t.advisorName;
  const advisorPhone = partnerContact?.phone || t.advisorPhone;
  const advisorEmail = partnerContact?.email || t.advisorEmail;
  const advisorNameEscaped = escapeHtml(advisorName);

  const normalizeToWaMeDigits = (raw: string) => {
    const digitsOnly = (raw || "").replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";

    // Convert international dialing prefix "00" -> ""
    let d = digitsOnly.startsWith("00") ? digitsOnly.slice(2) : digitsOnly;

    // Israel-friendly normalization:
    // - Local often written as 0XXXXXXXXX -> 972XXXXXXXXX
    // - Sometimes written as 9720XXXXXXXXX -> 972XXXXXXXXX
    if (d.startsWith("9720")) d = `972${d.slice(4)}`;
    else if (d.startsWith("0")) d = `972${d.slice(1)}`;
    else if (d.length === 9 && d.startsWith("5")) d = `972${d}`;

    return d;
  };

  const normalizeWhatsAppHref = (raw: string | null | undefined, fallbackPhone: string) => {
    if (raw) {
      if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
      const digits = normalizeToWaMeDigits(raw);
      if (digits) return `https://wa.me/${digits}`;
    }

    const phoneDigits = normalizeToWaMeDigits(fallbackPhone || "");
    if (phoneDigits) return `https://wa.me/${phoneDigits}`;

    return "https://wa.me/972549997711";
  };

  const advisorWhatsAppHref = normalizeWhatsAppHref(partnerContact?.whatsapp, advisorPhone);

  const withTextQuery = (baseHref: string, text: string) => {
    const separator = baseHref.includes("?") ? "&" : "?";
    return `${baseHref}${separator}text=${encodeURIComponent(text)}`;
  };
  const dir = language === "he" ? "rtl" : "ltr";
  const isRTL = language === "he";
  const alignStart = isRTL ? "right" : "left";
  const alignEnd = isRTL ? "left" : "right";

  // Compute limiting factors - analyze ALL potential constraints and list them all
  let limitingFactor: string;
  const hasCriticalData = equityInitial > 0 && incomeNet > 0 && monthlyPayment > 0;

  if (!hasCriticalData) {
    limitingFactor = t.limitingInsufficient;
  } else {
    // Calculate all limiting factor metrics
    const equityUsageRatio = equityRemaining / equityInitial; // Low = equity is the limit
    const isEquityLimited = equityUsageRatio <= 0.02; // Less than 2% remaining

    // DTI constraint check
    const isDTILimited = dtiMaxAllowed > 0 && dtiEstimated !== null && dtiEstimated >= dtiMaxAllowed - thresholdDelta;

    // Budget cap constraint check
    const budgetCapValue = parseNumber(inputs.budgetCap);
    const rentIncome = results.rentIncome || 0;
    const effectiveBudgetCap = budgetCapValue > 0 ? budgetCapValue + rentIncome : 0;
    const isPaymentCapLimited = budgetCapValue > 0 && monthlyPayment >= effectiveBudgetCap - 50; // Within 50 ILS

    // Age constraint check - if loan term is shorter than max possible (30 years)
    const userAge = parseInt(inputs.age) || 30;
    const maxAgeAtEnd = parseInt(inputs.maxAge) || 75;
    const maxPossibleTerm = 30; // Standard max in Israel
    const actualLoanTerm = results.loanTermYears;
    const ageRestrictedTerm = maxAgeAtEnd - userAge;
    const isAgeLimited = ageRestrictedTerm < maxPossibleTerm && actualLoanTerm <= ageRestrictedTerm;

    // Collect ALL active limiting factors
    const limitingFactors: string[] = [];

    if (isEquityLimited) {
      limitingFactors.push(t.limitingCash);
    }
    if (isPaymentCapLimited) {
      limitingFactors.push(t.limitingPaymentCap);
    }
    if (isDTILimited) {
      limitingFactors.push(t.limitingIncome);
    }
    if (isAgeLimited) {
      limitingFactors.push(t.limitingAge);
    }

    // If no limiting factors detected, profile is comfortable
    if (limitingFactors.length === 0) {
      limitingFactor = t.limitingComfortable;
    } else {
      // Join all limiting factors with " + "
      limitingFactor = limitingFactors.join(" + ");
    }
  }

  // Computed values
  const equityOnProperty = results.maxPropertyValue - results.loanAmount;
  // Use corrected DTI (with recognized rent for investment properties)
  const dtiEstimatedDisplay = dtiEstimatedCorrected !== null ? `${(dtiEstimatedCorrected * 100).toFixed(1)}%` : t.notAvailable;

  // Net balance calculation (rent - payment; negative means out-of-pocket expense)
  const netMonthlyBalanceValue = results.rentIncome - results.monthlyPayment;
  const isNetBalancePositive = netMonthlyBalanceValue >= 0;
  const netBalanceColor = isNetBalancePositive ? "#10b981" : "#dc2626"; // Green or Red
  const netBalanceFormatted = isNetBalancePositive
    ? `₪ ${formatNumber(netMonthlyBalanceValue)}`
    : `-₪ ${formatNumber(Math.abs(netMonthlyBalanceValue))}`;

  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${language}" style="direction: ${dir};">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!--[if mso]>
      <style type="text/css">
        body, table, td {direction: ${dir}; text-align: ${alignStart};}
      </style>
      <![endif]-->
      <style>
        * { direction: ${dir} !important; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          max-width: 600px;
          margin: 0 auto;
          padding: 16px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%);
          direction: ${dir} !important;
          text-align: ${alignStart} !important;
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #0891b2 50%, #059669 100%);
          color: white;
          padding: 24px 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 30px rgba(30, 64, 175, 0.25);
        }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          ${isRTL ? "flex-direction: row-reverse;" : ""}
        }
        .header-info p { margin: 3px 0; font-size: 13px; opacity: 0.9; }
        .header-info a { color: white; text-decoration: underline; }
        
        .section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 14px;
          box-shadow: 0 3px 15px rgba(0,0,0,0.05);
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
          ${isRTL ? "flex-direction: row-reverse; justify-content: flex-end;" : ""}
        }
        .row {
          display: table;
          width: 100%;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          direction: ${dir} !important;
        }
        .row:last-child { border-bottom: none; }
        .label {
          display: table-cell;
          width: 55%;
          color: #64748b;
          font-size: 13px;
          text-align: ${alignStart} !important;
          padding-${alignEnd}: 12px;
          vertical-align: middle;
        }
        .value {
          display: table-cell;
          width: 45%;
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
          text-align: ${alignEnd} !important;
          /* Keep minus signs/currency/percent glued to the number across RTL/LTR */
          direction: ltr !important;
          unicode-bidi: isolate;
          vertical-align: middle;
        }
        
        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #34d399;
          border-${alignStart}: 6px solid #10b981;
          text-align: center;
          padding: 28px 20px;
        }
        .hero-section .section-title {
          justify-content: center;
          color: #047857;
        }
        .hero-value {
          font-size: 32px;
          font-weight: 800;
          color: #059669;
          margin: 12px 0;
          letter-spacing: -0.5px;
        }
        .hero-factor {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 10px 16px;
          margin-top: 14px;
          font-size: 13px;
          color: #92400e;
          display: inline-block;
        }
        .hero-factor-label { font-weight: 600; }
        
        /* Funding Section */
        .funding-section { border-${alignStart}: 5px solid #3b82f6; }
        .funding-note {
          background: #f0f9ff;
          border-radius: 6px;
          padding: 10px;
          margin-top: 10px;
          font-size: 12px;
          color: #1e40af;
          text-align: center;
        }
        
        /* Transaction Section */
        .transaction-section { border-${alignStart}: 5px solid #f59e0b; }
        .transaction-section .section-title { color: #b45309; }
        .tax-disclaimer {
          font-size: 11px;
          font-style: italic;
          color: #9a3412;
          margin-top: 4px;
          padding-${alignStart}: 0;
        }
        .advisor-disclaimer {
          font-size: 10px;
          color: #666;
          font-style: italic;
          margin-top: 4px;
        }
        .total-row {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 8px;
          margin-top: 10px;
          padding: 12px !important;
        }
        .total-row .label { font-weight: 600; color: #92400e; }
        .total-row .value { font-weight: 700; color: #d97706; font-size: 16px; }
        
        /* Feasibility Section */
        .feasibility-section { border-${alignStart}: 5px solid #8b5cf6; }
        .feasibility-section .section-title { color: #7c3aed; }
        
        /* Charts */
        .chart-container { margin-top: 16px; }
        .chart-title-small {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          ${isRTL ? "flex-direction: row-reverse; justify-content: flex-end;" : ""}
        }
        .vchart {
          width: 100%;
          max-width: 100%;
          height: 140px;
          table-layout: fixed;
          border-collapse: collapse;
          border-bottom: 2px solid #e2e8f0;
          direction: ltr !important;
          unicode-bidi: bidi-override;
          margin-bottom: 6px;
        }
        .vchart td { vertical-align: bottom; text-align: center; padding: 0 2px; }
        .vbar { width: 100%; border-radius: 3px 3px 0 0; display: block; margin: 0 auto; }
        .vbar-balance { background: linear-gradient(180deg, #3b82f6, #60a5fa); }
        .vstack { width: 100%; display: block; border-radius: 3px 3px 0 0; overflow: hidden; }
        .vbar-principal { background: linear-gradient(180deg, #10b981, #34d399); display: block; }
        .vbar-interest { background: linear-gradient(180deg, #f59e0b, #fbbf24); display: block; }
        .vlabel { font-size: 9px; color: #64748b; margin-top: 4px; line-height: 1; direction: ltr !important; }
        .chart-legend {
          display: flex;
          gap: 16px;
          margin-top: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .chart-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; }
        .chart-legend-color { width: 12px; height: 12px; border-radius: 2px; }
        
        /* Assumptions Section */
        .assumptions-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .assumptions-section .section-title { color: #64748b; border-bottom-color: #cbd5e1; }
        .assumptions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .assumption-item {
          background: white;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          flex: 1 1 45%;
          min-width: 120px;
        }
        .assumption-item .a-label { color: #64748b; font-size: 11px; }
        .assumption-item .a-value { font-weight: 600; color: #0f172a; margin-top: 2px; }
        
        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 24px;
          border-radius: 12px;
          margin: 14px 0;
          text-align: center;
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.25);
        }
        .cta-section h3 { color: white; font-size: 16px; margin: 0 0 14px 0; }
        .cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cta-button {
          display: inline-block;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 14px;
        }
        .cta-whatsapp { background: #25D366; color: white; }
        .cta-email { background: white; color: #1e40af; }
        
        .note {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 1px solid #fb923c;
          padding: 12px 14px;
          border-radius: 8px;
          margin-top: 14px;
          font-size: 11px;
          color: #9a3412;
          text-align: ${alignStart} !important;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          ${isRTL ? "flex-direction: row-reverse;" : ""}
        }
        
        .footer {
          text-align: center;
          margin-top: 20px;
          padding: 16px;
          color: #64748b;
          font-size: 12px;
          background: white;
          border-radius: 10px;
        }
        .footer p { margin: 4px 0; }
      </style>
    </head>
    <body style="direction: ${dir}; text-align: ${alignStart};">
      <!-- Header -->
      <div class="header">
        <div class="header-info">
          <div style="text-align: ${alignStart}; ${isRTL ? "direction: rtl;" : ""}">
            <p style="font-weight: 700; font-size: 16px; margin: 0 0 4px 0;">${advisorNameEscaped}</p>
            <p>📞 <a href="${advisorWhatsAppHref}" target="_blank">${escapeHtml(advisorPhone)}</a></p>
            <p>✉️ <a href="mailto:${escapeHtml(advisorEmail)}">${escapeHtml(advisorEmail)}</a></p>
          </div>
          <p style="font-size: 12px; margin: 0;">📅 ${new Date().toLocaleDateString()}</p>
        </div>
        <h1>🏠 ${t.heroTitleWithName} ${recipientNameEscaped}</h1>
      </div>

      <!-- Personalized Greeting -->
      <div style="padding: 16px 20px; font-size: 15px; color: #1e293b;">
        ${recipientNameEscaped ? `${t.greeting} ${recipientNameEscaped},` : `${t.greeting},`}
      </div>

      ${isAdvisorCopy
      ? `
      <!-- CLIENT INFO SECTION (Advisor Only) -->
      <div class="section" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 5px solid #3b82f6; border-right: ${isRTL ? "5px solid #3b82f6" : "none"}; border-left: ${isRTL ? "none" : "5px solid #3b82f6"};">
        <div class="section-title" style="color: #1d4ed8;">👤 ${t.clientInfoTitle}</div>
        <div class="row">
          <span class="label">${t.clientName}</span>
          <span class="value" style="font-weight: 700;">${recipientNameEscaped}</span>
        </div>
        <div class="row">
          <span class="label">${t.clientPhone}</span>
          <span class="value"><a href="tel:${recipientPhoneEscaped}" style="color: #1d4ed8; text-decoration: none;">${recipientPhoneEscaped}</a></span>
        </div>
        <div class="row">
          <span class="label">${t.clientEmail}</span>
          <span class="value"><a href="mailto:${recipientEmailEscaped}" style="color: #1d4ed8; text-decoration: none;">${recipientEmailEscaped}</a></span>
        </div>
      </div>
      `
      : ""
    }

      <!-- TRAFFIC LIGHT SECTION - Advisor/Partner Only -->
      ${isAdvisorCopy && trafficLightStatus !== null ? `
      <div class="section" style="background: #2d3748; border-radius: 20px; padding: 20px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap; ${isRTL ? "flex-direction: row-reverse;" : ""}">
          <!-- Traffic Light Visual -->
          <div style="background: #1a202c; border-radius: 16px; padding: 12px 16px; display: inline-block;">
            <div style="width: 24px; height: 24px; border-radius: 50%; margin-bottom: 6px; ${trafficLightStatus === 'red' ? 'background: #ef4444; box-shadow: 0 0 12px #ef4444;' : 'background: rgba(255,255,255,0.2);'}"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; margin-bottom: 6px; ${trafficLightStatus === 'orange' ? 'background: #f97316; box-shadow: 0 0 12px #f97316;' : 'background: rgba(255,255,255,0.2);'}"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; ${trafficLightStatus === 'green' ? 'background: #22c55e; box-shadow: 0 0 12px #22c55e;' : 'background: rgba(255,255,255,0.2);'}"></div>
          </div>
          
          <!-- Status & Values -->
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 14px; font-weight: 700; color: white; margin-bottom: 8px; ${isRTL ? "text-align: right;" : ""}">🚦 ${t.dealFeasibility}</div>
            <div style="font-size: 18px; font-weight: 800; color: ${trafficLightStatus === 'green' ? '#22c55e' : trafficLightStatus === 'orange' ? '#f97316' : '#ef4444'}; margin-bottom: 12px; ${isRTL ? "text-align: right;" : ""}">
              ${trafficLightStatus === 'green' ? t.statusGreen : trafficLightStatus === 'orange' ? t.statusOrange : t.statusRed}
            </div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
                <span style="color: #a0aec0; font-size: 13px;">${t.askingPrice}</span>
                <span style="color: white; font-weight: 600; font-size: 13px; direction: ltr;">₪ ${formatNumber(targetPrice)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; ${isRTL ? "flex-direction: row-reverse;" : ""}">
                <span style="color: #a0aec0; font-size: 13px;">${t.maxBudgetLabel}</span>
                <span style="color: white; font-weight: 600; font-size: 13px; direction: ltr;">₪ ${formatNumber(maxBudget)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; ${isRTL ? "flex-direction: row-reverse;" : ""}">
                <span style="color: #a0aec0; font-size: 13px;">${t.budgetGap}</span>
                <span style="color: ${trafficLightGap >= 0 ? '#22c55e' : '#ef4444'}; font-weight: 700; font-size: 13px; direction: ltr;">${trafficLightGap >= 0 ? '+' : ''}₪ ${formatNumber(trafficLightGap)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- CLIENT DEAL SUMMARY - Client Only (no traffic light, neutral styling) -->
      ${!isAdvisorCopy && targetPrice > 0 ? `
      <div class="section" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px;">
        <div class="section-title" style="color: #475569;">📋 ${t.dealSummaryTitle}</div>
        <div class="row">
          <span class="label">${t.targetPropertyPriceLabel}</span>
          <span class="value" style="direction: ltr !important; unicode-bidi: isolate;">₪ ${formatNumber(targetPrice)}</span>
        </div>
        <div class="row">
          <span class="label">${t.estimatedBudgetLabel}</span>
          <span class="value" style="direction: ltr !important; unicode-bidi: isolate;">₪ ${formatNumber(maxBudget)}</span>
        </div>
        <div class="row" style="border-bottom: none;">
          <span class="label">${t.differenceLabel}</span>
          <span class="value" style="font-weight: 700; direction: ltr !important; unicode-bidi: isolate;">${trafficLightGap >= 0 ? '' : '-'}₪ ${formatNumber(Math.abs(trafficLightGap))}</span>
        </div>
        ${trafficLightGap < 0 ? `
        <div style="margin-top: 12px; padding: 12px; background: #e0f2fe; border-radius: 8px; font-size: 13px; color: #0369a1; text-align: ${alignStart};">
          💡 ${t.bridgeSentence}
        </div>
        ` : ''}
      </div>
      ` : ''}

      <!-- SECTION 1: Hero - Maximum Purchasing Power -->
      <div class="section hero-section">
        <div class="section-title">💎 ${t.heroTitle}</div>
        <div style="font-size: 13px; color: #047857; margin-bottom: 4px;">${t.maxPropertyLabel}</div>
        <div class="hero-value">₪ ${formatNumber(results.maxPropertyValue)}</div>
        <div class="hero-factor">
          <span class="hero-factor-label">${t.limitingFactorLabel}:</span> ${limitingFactor}
        </div>
      </div>

      <!-- SECTION 2: Funding Breakdown -->
      <div class="section funding-section">
        <div class="section-title">🏦 ${t.fundingTitle}</div>
        <div class="row">
          <span class="label">${t.loanAmount}</span>
          <span class="value">₪ ${formatNumber(results.loanAmount)}</span>
        </div>
        <div class="row">
          <span class="label">${t.equityOnProperty}</span>
          <span class="value">₪ ${formatNumber(equityOnProperty)}</span>
        </div>
        <div class="funding-note">💡 ${t.fundingNote}</div>
      </div>

      <!-- SECTION 3: Transaction Envelope -->
      <div class="section transaction-section">
        <div class="section-title">📑 ${t.transactionTitle}</div>
        <div class="row">
          <span class="label">${t.purchaseTax}</span>
          <span class="value">₪ ${formatNumber(results.purchaseTax)}</span>
        </div>
        <div class="tax-disclaimer">${t.taxDisclaimer}</div>
        <div class="row">
          <span class="label">${t.lawyerLabel}</span>
          <span class="value">₪ ${formatNumber(results.lawyerFeeTTC)} ${t.ttc}</span>
        </div>
        <div class="row">
          <span class="label">${t.brokerLabel}</span>
          <span class="value">₪ ${formatNumber(results.brokerFeeTTC)} ${t.ttc}</span>
        </div>
        <div class="row">
          <span class="label">${t.advisorFeeLabel}</span>
          <span class="value">₪ ${inputs.advisorFee || "0"} ${t.ttc}</span>
        </div>
        <div class="advisor-disclaimer">${t.advisorFeeDisclaimer}</div>
        <div class="row">
          <span class="label">${t.other}</span>
          <span class="value">₪ ${inputs.otherFee || "0"}</span>
        </div>
        <div class="row total-row">
          <span class="label">${t.transactionTotal}</span>
          <span class="value">₪ ${formatNumber(closingCostsTotal)}</span>
        </div>
      </div>

      <!-- FINANCIAL DASHBOARD SECTION -->
      ${isAdvisorCopy ? `
      <div class="section" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-${alignStart}: 5px solid #6366f1;">
        <div class="section-title" style="color: #4f46e5;">📈 ${t.financialDashboardTitle}</div>
        <div class="row">
          <span class="label">${t.grossYield}</span>
          <span class="value" style="${grossYield === null ? 'color: #9ca3af;' : ''}">${grossYield !== null ? `${(grossYield * 100).toFixed(2)}%` : t.notRelevant}</span>
        </div>
        <div class="row">
          <span class="label">${t.netCashFlow}</span>
          <span class="value" style="color: ${netCashFlow < 0 ? '#dc2626' : '#0f172a'}; font-weight: 700;">${netCashFlow < 0 ? `-₪ ${formatNumber(Math.abs(netCashFlow))}` : `₪ ${formatNumber(netCashFlow)}`}</span>
        </div>
        <div class="row">
          <span class="label">${t.cashOnCash}</span>
          <span class="value" style="${cashOnCash === null ? 'color: #9ca3af;' : cashOnCash < 0 ? 'color: #dc2626; font-weight: 700;' : ''}">${cashOnCash !== null ? `${cashOnCash < 0 ? '' : ''}${(cashOnCash * 100).toFixed(2)}%` : t.notRelevant}</span>
        </div>
        <!-- ROI subtitle: force it to sit under the label column (not under the value) -->
        <div class="row" style="border-bottom: none; padding-top: 0; padding-bottom: 6px;">
          <span class="label" style="font-size: 12px; color: #666666; font-weight: 400;">
            ${t.cashOnCashSubtitle}
          </span>
          <span class="value" style="font-size: 12px; color: transparent;">.</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 12px; font-style: italic; padding: 8px; background: #e0e7ff; border-radius: 6px;">
          💡 ${language === 'he' ? 'התשואות מחושבות על בסיס ההנחות בסימולציה בלבד.' : language === 'fr' ? 'Rendements calculés sur la base des hypothèses de la simulation uniquement.' : 'Yields are calculated based on simulation assumptions only.'}
        </div>
      </div>
      ` : ''}

      <!-- SECTION 5: Feasibility & Analysis -->
      <div class="section feasibility-section">
        <div class="section-title">📊 ${t.feasibilityTitle}</div>
        <div class="row">
          <span class="label">${t.ltvRatio}</span>
          <span class="value">${results.actualLTV.toFixed(1)}%</span>
        </div>
        ${recognizedRent > 0 ? `
        <div class="row" style="background: #fef3c7; border-radius: 6px; padding: 8px !important; margin: 8px 0;">
          <span class="label" style="color: #92400e; font-weight: 600;">${t.adjustedIncomeForDTI}</span>
          <span class="value" style="color: #b45309; font-weight: 700;">₪ ${formatNumber(adjustedIncomeForDTI)}</span>
        </div>
        <div style="font-size: 10px; color: #92400e; margin-bottom: 8px; padding-${alignStart}: 8px;">
          ${t.incomeLabel}: ₪${formatNumber(incomeNet)} + ${t.recognizedRentLabel}: ₪${formatNumber(recognizedRent)}
        </div>
        ` : ''}
        ${isAdvisorCopy ? `
        <div class="row">
          <span class="label">${t.dtiMaxLabel}</span>
          <span class="value">${dtiMaxAllowed > 0 ? `${(dtiMaxAllowed * 100).toFixed(0)}%` : t.notAvailable}</span>
        </div>
        <div class="row">
          <span class="label">${t.dtiEstimatedLabel}</span>
          <span class="value">${dtiEstimatedDisplay}</span>
        </div>
        ` : ''}

        <!-- Monthly Summary Block -->
        <div style="margin-top: 16px; padding: 14px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; border: 1px solid #86efac;">
          <div style="font-size: 13px; font-weight: 600; color: #166534; margin-bottom: 10px;">📋 ${t.monthlySummary}</div>
          <div class="row" style="margin-bottom: 4px;">
            <span class="label">${t.monthlyPaymentUsed}</span>
            <span class="value">₪ ${formatNumber(results.monthlyPayment)}</span>
          </div>
          ${parseNumber(inputs.budgetCap) > 0
      ? `
          <div class="row" style="margin-bottom: 4px;">
            <span class="label">${t.monthlyPaymentCap}</span>
            <span class="value">₪ ${inputs.budgetCap}</span>
          </div>
          `
      : ""
    }
          ${inputs.isRented
      ? `
          <div class="row" style="margin-bottom: 4px;">
            <span class="label">${t.estimatedRentalIncome}</span>
            <span class="value">₪ ${formatNumber(results.rentIncome)}</span>
          </div>
          ${!inputs.isFirstProperty
        ? `
          <div class="row" style="margin-bottom: 4px;">
            <span class="label">${t.rentalIncomeRetained}</span>
            <span class="value">₪ ${formatNumber(results.rentIncome * (parseNumber(inputs.rentRecognition) / 100))}</span>
          </div>
          `
        : ""
      }
          <div class="row" style="margin-bottom: 4px; background: ${isNetBalancePositive ? '#dcfce7' : '#fee2e2'}; border-radius: 6px; padding: 10px !important;">
            <span class="label" style="font-weight: 600; color: ${isNetBalancePositive ? '#166534' : '#991b1b'};">${t.netMonthlyBalance}</span>
            <span class="value" style="font-weight: 700; color: ${netBalanceColor}; font-size: 15px;">${netBalanceFormatted}</span>
          </div>
          <div style="font-size: 10px; color: ${isNetBalancePositive ? '#166534' : '#991b1b'}; margin-top: 4px; font-style: italic;">
            ${isNetBalancePositive ? (language === 'he' ? '✅ ' + t.positiveBalance : language === 'fr' ? '✅ ' + t.positiveBalance : '✅ ' + t.positiveBalance) : (language === 'he' ? '⚠️ ' + t.negativeBalance : language === 'fr' ? '⚠️ ' + t.negativeBalance : '⚠️ ' + t.negativeBalance)}
          </div>
          `
      : ""
    }
          <div style="font-size: 10px; color: #64748b; margin-top: 8px; font-style: italic;">${t.monthlySummaryNote}</div>
        </div>
        
        <!-- Charts -->
        ${yearlyBalanceData && yearlyBalanceData.length > 0
      ? `
        <div class="chart-container">
          <div class="chart-title-small">📉 ${t.chartBalanceTitle}</div>
          ${(() => {
        const CHART_H = 120;
        const maxBalance = Math.max(...yearlyBalanceData.map((d) => d.balance));
        return `
              <table class="vchart" role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  ${yearlyBalanceData
            .slice()
            .sort((a, b) => a.year - b.year)
            .map((d) => {
              const barH = Math.max(4, Math.round((d.balance / maxBalance) * CHART_H));
              return `
                        <td>
                          <div class="vbar vbar-balance" style="height: ${barH}px;"></div>
                          <div class="vlabel" dir="ltr">${d.year}</div>
                        </td>
                      `;
            })
            .join("")}
                </tr>
              </table>
            `;
      })()}
        </div>
        `
      : ""
    }
        
        ${paymentBreakdownData && paymentBreakdownData.length > 0
      ? `
        <div class="chart-container">
          <div class="chart-title-small">📊 ${t.chartPaymentTitle}</div>
          ${(() => {
        const CHART_H = 120;
        const rows = paymentBreakdownData.slice().sort((a, b) => a.year - b.year);
        const maxTotal = Math.max(...rows.map((d) => d.principal + d.interest));
        return `
              <table class="vchart" role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  ${rows
            .map((d) => {
              const total = d.principal + d.interest;
              const totalH = Math.max(4, Math.round((total / maxTotal) * CHART_H));
              const interestH = Math.max(1, Math.round((d.interest / total) * totalH));
              const principalH = Math.max(1, totalH - interestH);
              return `
                        <td>
                          <div class="vstack" style="height: ${totalH}px;">
                            <div class="vbar vbar-interest" style="height: ${interestH}px;"></div>
                            <div class="vbar vbar-principal" style="height: ${principalH}px;"></div>
                          </div>
                          <div class="vlabel" dir="ltr">${d.year}</div>
                        </td>
                      `;
            })
            .join("")}
                </tr>
              </table>
            `;
      })()}
          <div class="chart-legend">
            <div class="chart-legend-item">
              <div class="chart-legend-color" style="background: linear-gradient(180deg, #10b981, #34d399);"></div>
              <span>${t.principal}</span>
            </div>
            <div class="chart-legend-item">
              <div class="chart-legend-color" style="background: linear-gradient(180deg, #f59e0b, #fbbf24);"></div>
              <span>${t.interestLabel}</span>
            </div>
          </div>
        </div>
        `
      : ""
    }

        <!-- Amortization Summary Block -->
        <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #e2e8f0;">
          <div class="section-title" style="font-size: 14px; margin-bottom: 12px;">📋 ${t.amortizationSummaryTitle}</div>
          <div class="row">
            <span class="label">${t.loanTermLabel}</span>
            <span class="value">${results.loanTermYears} ${t.years}</span>
          </div>
          <div class="row">
            <span class="label">${t.monthlyPaymentLabel}</span>
            <span class="value">₪ ${formatNumber(results.monthlyPayment)}</span>
          </div>
          <div class="row">
            <span class="label">${t.totalInterestLabel}</span>
            <span class="value">₪ ${formatNumber(results.totalInterest)}</span>
          </div>
          ${results.loanAmount > 0 && results.totalInterest >= 0
      ? `
          <div class="row" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 12px !important; margin-top: 8px;">
            <span class="label" style="font-weight: 600; color: #0369a1;">${t.totalRepaidLabel}</span>
            <span class="value" style="font-weight: 700; color: #0284c7; font-size: 16px;">₪ ${formatNumber(results.loanAmount + results.totalInterest)}</span>
          </div>
          `
      : ""
    }
          ${amortizationSummary.firstPayment && amortizationSummary.lastPayment
      ? `
          <div style="display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 140px; background: #f8fafc; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b;">${t.firstPaymentLabel}</div>
              <div style="font-size: 12px; margin-top: 4px;">
                <span style="color: #10b981; font-weight: 600;">${t.principal}: ₪${formatNumber(amortizationSummary.firstPayment.principal)}</span>
                <span style="color: #64748b; margin: 0 4px;">|</span>
                <span style="color: #f59e0b; font-weight: 600;">${t.interestLabel}: ₪${formatNumber(amortizationSummary.firstPayment.interest)}</span>
              </div>
            </div>
            <div style="flex: 1; min-width: 140px; background: #f8fafc; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b;">${t.lastPaymentLabel}</div>
              <div style="font-size: 12px; margin-top: 4px;">
                <span style="color: #10b981; font-weight: 600;">${t.principal}: ₪${formatNumber(amortizationSummary.lastPayment.principal)}</span>
                <span style="color: #64748b; margin: 0 4px;">|</span>
                <span style="color: #f59e0b; font-weight: 600;">${t.interestLabel}: ₪${formatNumber(amortizationSummary.lastPayment.interest)}</span>
              </div>
            </div>
          </div>
          `
      : ""
    }
          <div style="font-size: 11px; color: #64748b; margin-top: 12px; font-style: italic; background: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fde68a;">
            💡 ${t.amortizationNote}
          </div>
        </div>
      </div>

      <!-- SECTION 6: Simulation Assumptions -->
      <div class="section assumptions-section">
        <div class="section-title">⚙️ ${t.assumptionsTitle}</div>
        <div class="assumptions-grid">
          <div class="assumption-item">
            <div class="a-label">${t.age}</div>
            <div class="a-value">${inputs.age}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.citizenship}</div>
            <div class="a-value">${inputs.isIsraeliCitizen ? t.yes : t.no}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.taxResident}</div>
            <div class="a-value">${inputs.isIsraeliTaxResident ? t.yes : t.no}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.firstProperty}</div>
            <div class="a-value">${inputs.isFirstProperty ? t.yes : t.no}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.netIncome}</div>
            <div class="a-value">₪ ${inputs.netIncome}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.initialEquity}</div>
            <div class="a-value">₪ ${inputs.equity}</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.interestRate}</div>
            <div class="a-value">${inputs.interest}%</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.loanTerm}</div>
            <div class="a-value">${results.loanTermYears} ${t.years}</div>
          </div>
        </div>

        ${data.csvData
      ? `
        <div style="margin: 16px 0; padding: 12px; background: #f0fdf4; border: 1px dashed #22c55e; border-radius: 8px; text-align: center; color: #166534; font-size: 13px;">
          📎 ${t.csvNotice}
        </div>
        `
      : ""
    }

        <div style="font-size: 11px; color: #64748b; margin-top: 12px; text-align: ${alignStart};">
          ${t.simulationDisclaimer}
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <h3>${t.ctaTitle}</h3>
        <div class="cta-buttons">
          <a href="${withTextQuery(advisorWhatsAppHref, `Bonjour ${advisorName}, je viens d'utiliser votre simulateur et j'aimerais en discuter.`)}" class="cta-button cta-whatsapp" target="_blank">${t.ctaWhatsApp}</a>
          <a href="mailto:${advisorEmail}?subject=${encodeURIComponent(`Question suite à ma simulation`)}" class="cta-button cta-email">${t.ctaEmail}</a>
        </div>
      </div>

      <div class="note">
        ⚠️ ${t.note}
      </div>

      <div class="footer">
        <p>${t.footer}</p>
        <p>© ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    // קריאת המידע מהבקשה וביצוע ולידציה
    const rawBody = await req.json();
    const rawAdvisorFee = rawBody?.inputs?.advisorFee;
    const parseResult = EmailRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.format());
      const headerBuildSha = req.headers.get("x-build-sha") || null;
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: parseResult.error.issues.map((i) => i.message).join(", "),
          version: {
            functionVersion: FUNCTION_VERSION,
            deployedAt: DEPLOYED_AT,
            clientBuildSha: headerBuildSha,
            mismatch: false,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const data = parseResult.data as ReportEmailRequest;
    data.inputs.advisorFee = data.inputs.advisorFee || rawAdvisorFee || "0";

    // בדיקות Rate Limit (נשאר כפי שהיה)
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

    const rateCheck = await checkMultiLayerRateLimit(supabaseAdmin, clientIP, data.recipientEmail);

    if (!rateCheck.allowed) {
      const errorMsg = rateCheck.reason === "email_limit"
        ? "Rate limit exceeded. Maximum 5 emails per hour to this address."
        : "Rate limit exceeded. Maximum 10 emails per hour.";
      
      // Extract clientBuildSha for version metadata (even in rate limit response)
      const clientBuildSha = req.headers.get("x-build-sha") || data.buildSha || null;
      const versionMismatch = !!(
        clientBuildSha && 
        FUNCTION_VERSION && 
        FUNCTION_VERSION !== "unknown" && 
        !FUNCTION_VERSION.startsWith("build-") &&
        clientBuildSha !== FUNCTION_VERSION
      );
      
      return new Response(
        JSON.stringify({ 
          error: errorMsg, 
          retryAfter: 3600,
          version: {
            functionVersion: FUNCTION_VERSION,
            deployedAt: DEPLOYED_AT,
            clientBuildSha: clientBuildSha,
            mismatch: versionMismatch,
          },
        }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders } },
      );
    }

    // Extract clientBuildSha from header or payload
    const clientBuildSha = req.headers.get("x-build-sha") || data.buildSha || null;
    
    // Calculate version mismatch
    const versionMismatch = !!(
      clientBuildSha && 
      FUNCTION_VERSION && 
      FUNCTION_VERSION !== "unknown" && 
      !FUNCTION_VERSION.startsWith("build-") &&
      clientBuildSha !== FUNCTION_VERSION
    );

    const requestId = crypto.randomUUID().substring(0, 8);
    
    // Version verification log (non-PII)
    console.log(`[send-report-email] version: ${FUNCTION_VERSION} | deployed: ${DEPLOYED_AT} | clientBuildSha: ${clientBuildSha || 'none'}`);
    console.log(`[${requestId}] Email request received`);

    // Normalize partner ID
    const effectivePartnerId = data.partnerId || data.partner_id || null;
    console.log(`[${requestId}] Received partnerId:`, effectivePartnerId, 'Type:', typeof effectivePartnerId);
    console.log(`[${requestId}] Raw data.partnerId:`, data.partnerId, 'Raw data.partner_id:', data.partner_id);

    // שמירה לדאטה בייס (נשאר כפי שהיה)
    const { error: insertError } = await supabaseAdmin.from("simulations").insert({
      client_name: data.recipientName,
      email: data.recipientEmail,
      phone: data.recipientPhone,
      language: data.language,
      inputs: data.inputs,
      results: data.results,
      partner_id: effectivePartnerId,
    });

    if (insertError) console.error(`[${requestId}] Database insert failed:`, insertError.message);

    // שליפת פרטי שותף (אם קיים ID)
    let partnerEmail: string | null = null;
    let partnerContact: PartnerContactOverride | undefined;

    if (effectivePartnerId) {
      console.log(`[${requestId}] Querying partners table for ID: ${effectivePartnerId}`);
      const { data: partnerData, error: partnerError } = await supabaseAdmin
        .from("partners")
        .select("name, phone, whatsapp, email, is_active")
        .eq("id", effectivePartnerId)
        .maybeSingle();

      if (partnerError) {
        console.error(`[${requestId}] Partner DB Query Error:`, partnerError.message, partnerError.details, partnerError.hint);
      } else if (partnerData) {
        console.log(`[${requestId}] Partner found - Name: "${partnerData.name}", Email: "${partnerData.email}", Active: ${partnerData.is_active}`);
        partnerEmail = partnerData.is_active !== false ? (partnerData.email ?? null) : null;
        partnerContact = {
          name: partnerData.name ?? null,
          phone: partnerData.phone ?? null,
          whatsapp: partnerData.whatsapp ?? null,
          email: partnerData.email ?? null,
        };
        console.log(`[${requestId}] partnerContact constructed:`, JSON.stringify(partnerContact));
      } else {
        console.log(`[${requestId}] No partner found in DB with ID: ${effectivePartnerId}`);
      }
    } else {
      console.log(`[${requestId}] No partnerId provided, skipping partner lookup`);
    }

    // יצירת תוכן האימייל (גרסאות נפרדות ללקוח ולאדמין)
    const t = (({
      he: { subjectWithName: "דוח תיק של", fromPartner: "מאת" },
      en: { subjectWithName: "Report for", fromPartner: "from" },
      fr: { subjectWithName: "Rapport du dossier de", fromPartner: "de la part de" }
    }) as Record<string, Record<string, string>>)[data.language] || { subjectWithName: "Report for", fromPartner: "from" };

    console.log(`[${requestId}] Before subject construction - partnerContact:`, JSON.stringify(partnerContact));
    console.log(`[${requestId}] partnerContact?.name exists:`, !!partnerContact?.name, 'Value:', partnerContact?.name);

    const clientSubject = `${t.subjectWithName} ${data.recipientName}`;
    let adminSubject = clientSubject;
    if (partnerContact?.name) {
      adminSubject = `${clientSubject} ${t.fromPartner} ${partnerContact.name}`;
      console.log(`[${requestId}] Partner name found, admin subject modified to: "${adminSubject}"`);
    } else {
      console.log(`[${requestId}] No partner name available, admin subject unchanged: "${adminSubject}"`);
    }

    const clientHtml = generateEmailHtml(data, false, partnerContact);
    const adminHtml = generateEmailHtml(data, true, partnerContact);

    console.log(`[${requestId}] Final Subjects -> Client: "${clientSubject}", Admin: "${adminSubject}"`);

    // הכנת קובץ CSV
    const csvFilenames: Record<string, string> = {
      he: "loach-silkukin.csv",
      en: "amortization-table.csv",
      fr: "tableau-amortissement.csv",
    };

    const attachments = data.csvData
      ? [{
        filename: csvFilenames[data.language] || "report.csv",
        content: toBase64("\uFEFF" + data.csvData),
        content_type: "text/csv; charset=utf-8",
      }]
      : [];

    const senderFrom = "Property Budget Pro <noreply@eshel-f.com>";

    // Resend API has a strict rate limit (commonly 2 requests/second).
    // We send 2-3 separate emails (client/admin/partner). To avoid the partner
    // send failing with 429, we:
    // 1) throttle between sends
    // 2) retry on 429 with backoff
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    type ResendSendResult = {
      ok: boolean;
      status: number;
      json: any | null;
      text: string;
    };

    const sendResendEmail = async (
      payload: Record<string, unknown>,
      opts?: { label?: string; maxAttempts?: number; throttleMs?: number },
    ): Promise<ResendSendResult> => {
      const label = opts?.label ?? "email";
      const maxAttempts = opts?.maxAttempts ?? 3;
      const throttleMs = opts?.throttleMs ?? 650;

      // throttle before each attempt (including first)
      await sleep(throttleMs);

      let attempt = 1;
      let lastText = "";

      while (attempt <= maxAttempts) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify(payload),
        });

        // Always consume body to avoid resource leaks in Deno.
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          try {
            const j = await res.json();
            lastText = JSON.stringify(j);
          } catch {
            lastText = await res.text();
          }
        } else {
          lastText = await res.text();
        }

        if (res.ok) {
          let parsedJson: any | null = null;
          try {
            parsedJson = JSON.parse(lastText);
          } catch {
            // ignore
          }
          return { ok: true, status: res.status, json: parsedJson, text: lastText };
        }

        // Retry only on 429 (rate-limit)
        if (res.status === 429 && attempt < maxAttempts) {
          const backoffMs = 800 * attempt; // 800ms, 1600ms
          console.warn(`[${requestId}] ${label} send hit Resend 429; retrying in ${backoffMs}ms (attempt ${attempt}/${maxAttempts})`);
          await sleep(backoffMs);
          attempt += 1;
          continue;
        }

        return { ok: false, status: res.status, json: null, text: lastText };
      }

      return { ok: false, status: 429, json: null, text: lastText || "rate_limited" };
    };

    // =========================================================================
    // שליחת אימיילים - ללא לוגיקה נסתרת וללא תנאים מיותרים
    // =========================================================================

    // 1. שליחה ללקוח
    console.log(`[${requestId}] Sending to Client: ${data.recipientEmail} | Subject: ${clientSubject}`);
    const clientSend = await sendResendEmail(
      {
        from: senderFrom,
        to: [data.recipientEmail],
        subject: clientSubject,
        html: clientHtml,
        attachments,
      },
      { label: "client", throttleMs: 0 },
    );
    if (!clientSend.ok) throw new Error(`Failed to send client email: ${clientSend.text}`);


    // 2. שליחה לאדמין (עותק עם פרטי קשר ונושא מורחב)
    console.log(`[${requestId}] Sending to Admin: ${ADVISOR_EMAIL} | Subject: ${adminSubject}`);
    const adminSend = await sendResendEmail(
      {
        from: senderFrom,
        to: [ADVISOR_EMAIL],
        subject: adminSubject,
        html: adminHtml,
        attachments,
      },
      { label: "admin" },
    );


    // 3. שליחה לשותף (רק אם יש שותף ואימייל שונה מהלקוח)
    // CRITICAL: Skip partner email if it matches client email to prevent
    // client receiving the admin/partner copy with traffic light
    let partnerSent = false;
    const clientEmailLower = data.recipientEmail.toLowerCase().trim();
    const partnerEmailLower = partnerEmail?.toLowerCase().trim() || '';
    
    if (partnerEmail && partnerEmailLower !== clientEmailLower) {
      console.log(`[${requestId}] Sending to Partner: ${partnerEmail} | Subject: ${adminSubject}`);
      const partnerSend = await sendResendEmail(
        {
          from: senderFrom,
          to: [partnerEmail],
          subject: adminSubject,
          html: adminHtml,
          attachments,
        },
        { label: "partner", maxAttempts: 4 },
      );

      if (partnerSend.ok) partnerSent = true;
      else console.warn(`[${requestId}] Partner email failed:`, partnerSend.text);
    } else if (partnerEmail && partnerEmailLower === clientEmailLower) {
      console.log(`[${requestId}] Skipping partner email - matches client email: ${partnerEmail}`);
      partnerSent = true; // Mark as "sent" since client already gets the client copy
    }

    return new Response(
      JSON.stringify({
        version: {
          functionVersion: FUNCTION_VERSION,
          deployedAt: DEPLOYED_AT,
          clientBuildSha: clientBuildSha,
          mismatch: versionMismatch,
        },
        requestId,
        deliveredToClient: true,
        deliveredToAdmin: adminSend.ok,
        deliveredToPartner: partnerSent,
        resendClient: clientSend.json ?? clientSend.text,
        resendAdmin: adminSend.json ?? adminSend.text,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );

  } catch (error: any) {
    const errorId = crypto.randomUUID().substring(0, 8);
    console.error(`[${errorId}] Error in send-report-email function:`, error.message);
    return new Response(
      JSON.stringify({ 
        error: "An error occurred.", 
        errorId,
        version: {
          functionVersion: FUNCTION_VERSION,
          deployedAt: DEPLOYED_AT,
          clientBuildSha: null,
          mismatch: false,
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};
serve(handler);
