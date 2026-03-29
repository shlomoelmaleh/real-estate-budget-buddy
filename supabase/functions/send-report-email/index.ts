import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// DEPLOYMENT VERSION
const FUNCTION_VERSION = "1.1.0";

// Captured at module load time (deployment time), NOT per-request
const DEPLOYED_AT = new Date().toISOString();

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADVISOR_EMAIL = "shlomo.elmaleh@gmail.com";

// Whitelist of emails exempt from rate limiting (for testing)
const WHITELISTED_EMAILS = ["office@eshel-f.com", "shlomo.elmaleh@gmail.com"];

// CORS headers - allow all origins for this public calculator
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGINS") || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-build-sha",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { calculateLeadScore, getLimitingFactorDescription } from "./leadScoring.ts";
import { generateEmailHtml, toBase64, type ReportEmailRequest } from "./emailTemplate.ts";
import { calculateMaxBudget, type CalculatorInputs } from "../_shared/calculatorEngine.ts";
import { loadPartnerConfig, loadSystemTaxBrackets } from "../_shared/configLoader.ts";
import { toILS, fromILS, SupportedCurrency, ExchangeRates } from "../_shared/currencyUtils.ts";

type PartnerContactOverride = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
};

// ─── Google Sheets Integration ────────────────────────────────────────────────
const ALLOJ_PARTNER_ID = "fabb0c33-5a46-4ae3-98d9-c15fa4f9d7dc";
const ALLOJ_SHEET_ID = "1ChGR6kN6mbVsm8IuaK_0eJbfnKDwB1HTI1L7ZP7mtHY";
const ALLOJ_SHEET_RANGE = "Feuille 1!A:F";

async function appendToAllojSheet(
  clientName: string,
  phone: string,
  email: string,
  maxBudgetILS: number,
  equityILS: number,
): Promise<void> {
  try {
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("[Sheets] GOOGLE_SERVICE_ACCOUNT_JSON secret not found");
      return;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // Build JWT for Google Auth
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const signingInput = `${encode(header)}.${encode(payload)}`;

    // Import private key and sign
    const pemBody = serviceAccount.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");
    const keyBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      keyBytes,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signingInput));

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${signingInput}.${signatureB64}`;

    // Exchange JWT for Access Token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("[Sheets] Failed to get access token:", tokenData);
      return;
    }

    // Format date (Paris timezone — French community)
    const dateStr = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });

    // Format numbers (French locale: spaces as thousands separator)
    const formatILS = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

    // Append row: תאריך | שם | טלפון | אימייל | תקציב מרבי ₪ | הון עצמי ₪
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${ALLOJ_SHEET_ID}/values/${ALLOJ_SHEET_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[dateStr, clientName, phone, email, formatILS(maxBudgetILS), formatILS(equityILS)]],
        }),
      },
    );

    if (appendRes.ok) {
      console.log("[Sheets] Row appended successfully for:", clientName);
    } else {
      const err = await appendRes.text();
      console.error("[Sheets] Append failed:", err);
    }
  } catch (err) {
    console.error("[Sheets] Exception:", err);
  }
}
// ─── End Google Sheets Integration ───────────────────────────────────────────

// Input validation schema with strict character set restrictions
const EmailRequestSchema = z.object({
  recipientEmail: z.string().email().max(254),
  recipientName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[\p{L}\p{N}\s\-'.,]+$/u, "Name contains invalid characters"),
  recipientPhone: z.string().max(50),
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
    maxLoanTerm: z.string().max(5).optional(),
    lawyerPct: z.string().max(10),
    brokerPct: z.string().max(10),
    vatPct: z.string().max(10),
    advisorFee: z.string().max(30),
    otherFee: z.string().max(30),
    expectedRent: z.string().max(30).optional(),
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
    limitingFactor: z
      .enum(["EQUITY_LIMIT", "INCOME_LIMIT", "LTV_LIMIT", "AGE_LIMIT", "INSUFFICIENT_DATA", "UNKNOWN"])
      .optional(),
    rentWarning: z.enum(["high", "low"]).nullable().optional(),
    estimatedMarketRent: z.number().nonnegative().optional(),
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
  partnerEmail: z.string().email().nullable().optional(),
  partnerName: z.string().max(100).nullable().optional(),
  buildSha: z.string().max(40).nullable().optional(),
  currency: z.string().optional(),
  exchangeRate: z.number().positive().optional(),
  ratesDate: z.string().nullable().optional(),
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
    return { allowed: true, remaining: 0 };
  }

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
  if (WHITELISTED_EMAILS.includes(recipientEmail.toLowerCase())) {
    console.log(`Whitelisted email bypassing rate limit: ${recipientEmail}`);
    return { allowed: true };
  }

  const ipCheck = await checkRateLimitAtomic(supabaseAdmin, `ip:${clientIP}`, "send-report-email", 10, 60);
  if (!ipCheck.allowed) {
    return { allowed: false, reason: "ip_limit" };
  }

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

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[send-report-email] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();
    const rawAdvisorFee = rawBody?.inputs?.advisorFee;
    const parseResult = EmailRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.format());
      const headerBuildSha = req.headers.get("x-build-sha") || null;
      return new Response(
        JSON.stringify({
          error: "Invalid request data. Please check your input and try again.",
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

    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";

    const rateCheck = await checkMultiLayerRateLimit(supabaseAdmin, clientIP, data.recipientEmail);

    if (!rateCheck.allowed) {
      const errorMsg =
        rateCheck.reason === "email_limit"
          ? "Rate limit exceeded. Maximum 5 emails per hour to this address."
          : "Rate limit exceeded. Maximum 10 emails per hour.";

      const clientBuildSha = req.headers.get("x-build-sha") || data.buildSha || null;
      return new Response(
        JSON.stringify({
          error: errorMsg,
          retryAfter: 3600,
          version: {
            functionVersion: FUNCTION_VERSION,
            deployedAt: DEPLOYED_AT,
            clientBuildSha: clientBuildSha,
            mismatch: false,
          },
        }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders } },
      );
    }

    const clientBuildSha = req.headers.get("x-build-sha") || data.buildSha || null;
    const versionMismatch = !!(
      clientBuildSha &&
      FUNCTION_VERSION &&
      !FUNCTION_VERSION.startsWith("build-") &&
      clientBuildSha !== FUNCTION_VERSION
    );

    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] Email request received. Version: ${FUNCTION_VERSION}`);

    const effectivePartnerId = data.partnerId || data.partner_id || null;

    // === ZERO-TRUST SECURITY: Backend Recalculation ===
    console.log(`[${requestId}] Performing zero-trust calculation...`);
    const [partnerConfig, systemBrackets] = await Promise.all([
      loadPartnerConfig(supabaseAdmin, effectivePartnerId),
      loadSystemTaxBrackets(supabaseAdmin),
    ]);

    const parsedInputs: CalculatorInputs = {
      equity: parseFloat(data.inputs.equity || "0"),
      ltv: parseFloat(data.inputs.ltv || "0"),
      netIncome: parseFloat(data.inputs.netIncome || "0"),
      ratio: parseFloat(data.inputs.ratio || "0"),
      age: parseInt(data.inputs.age || "0", 10),
      maxAge: parseInt(data.inputs.maxAge || "0", 10),
      interest: parseFloat(data.inputs.interest || "0"),
      isRented: data.inputs.isRented,
      rentalYield: parseFloat(data.inputs.rentalYield || "0"),
      rentRecognition: parseFloat(data.inputs.rentRecognition || "0"),
      budgetCap: data.inputs.budgetCap ? parseFloat(data.inputs.budgetCap) : null,
      maxLoanTerm: data.inputs.maxLoanTerm ? parseInt(data.inputs.maxLoanTerm) : null,
      isFirstProperty: data.inputs.isFirstProperty,
      isIsraeliTaxResident: data.inputs.isIsraeliTaxResident,
      expectedRent: data.inputs.expectedRent ? parseFloat(data.inputs.expectedRent) : null,
      lawyerPct: parseFloat(data.inputs.lawyerPct || "0"),
      brokerPct: parseFloat(data.inputs.brokerPct || "0"),
      vatPct: parseFloat(data.inputs.vatPct || "0"),
      advisorFee: parseFloat(data.inputs.advisorFee || "0"),
      otherFee: parseFloat(data.inputs.otherFee || "0"),
    };

    const inputCurrency = (data.currency as SupportedCurrency) || "ILS";

    let engineInputs = { ...parsedInputs };
    if (inputCurrency !== "ILS" && data.exchangeRate) {
      const pseudoRates = {
        rates: { [inputCurrency]: data.exchangeRate },
        fetchedAt: data.ratesDate || "",
        source: "cache",
        nextRefreshAfter: "",
      } as ExchangeRates;
      engineInputs.equity = toILS(parsedInputs.equity, inputCurrency, pseudoRates);
      engineInputs.netIncome = toILS(parsedInputs.netIncome, inputCurrency, pseudoRates);
      if (parsedInputs.budgetCap !== null)
        engineInputs.budgetCap = toILS(parsedInputs.budgetCap, inputCurrency, pseudoRates);
      if (parsedInputs.expectedRent !== null)
        engineInputs.expectedRent = toILS(parsedInputs.expectedRent, inputCurrency, pseudoRates);
    }

    const secureResultsILS = calculateMaxBudget(engineInputs, partnerConfig, systemBrackets);

    if (secureResultsILS) {
      const secureResults = { ...secureResultsILS };
      if (inputCurrency !== "ILS" && data.exchangeRate) {
        const pseudoRates = {
          rates: { [inputCurrency]: data.exchangeRate },
          fetchedAt: data.ratesDate || "",
          source: "cache",
          nextRefreshAfter: "",
        } as ExchangeRates;
        secureResults.maxPropertyValue = fromILS(secureResultsILS.maxPropertyValue, inputCurrency, pseudoRates);
        secureResults.loanAmount = fromILS(secureResultsILS.loanAmount, inputCurrency, pseudoRates);
        secureResults.monthlyPayment = fromILS(secureResultsILS.monthlyPayment, inputCurrency, pseudoRates);
        secureResults.rentIncome = fromILS(secureResultsILS.rentIncome, inputCurrency, pseudoRates);
        secureResults.netPayment = fromILS(secureResultsILS.netPayment, inputCurrency, pseudoRates);
        secureResults.closingCosts = fromILS(secureResultsILS.closingCosts, inputCurrency, pseudoRates);
        secureResults.totalInterest = fromILS(secureResultsILS.totalInterest, inputCurrency, pseudoRates);
        secureResults.totalCost = fromILS(secureResultsILS.totalCost, inputCurrency, pseudoRates);
        secureResults.purchaseTax = fromILS(secureResultsILS.purchaseTax, inputCurrency, pseudoRates);
        secureResults.equityUsed = fromILS(secureResultsILS.equityUsed, inputCurrency, pseudoRates);
        secureResults.equityRemaining = fromILS(secureResultsILS.equityRemaining, inputCurrency, pseudoRates);
        secureResults.lawyerFeeTTC = fromILS(secureResultsILS.lawyerFeeTTC, inputCurrency, pseudoRates);
        secureResults.brokerFeeTTC = fromILS(secureResultsILS.brokerFeeTTC, inputCurrency, pseudoRates);
        if (secureResults.estimatedMarketRent)
          secureResults.estimatedMarketRent = fromILS(secureResults.estimatedMarketRent, inputCurrency, pseudoRates);
      }

      const incomeNet = parsedInputs.netIncome;
      const safeShekelRatio =
        parsedInputs.netIncome > 0 ? (secureResults.netPayment / incomeNet) * 100 : data.results.shekelRatio;

      data.results = {
        ...data.results,
        maxPropertyValue: secureResults.maxPropertyValue,
        loanAmount: secureResults.loanAmount,
        actualLTV: secureResults.actualLTV,
        monthlyPayment: secureResults.monthlyPayment,
        rentIncome: secureResults.rentIncome,
        netPayment: secureResults.netPayment,
        closingCosts: secureResults.closingCosts,
        totalInterest: secureResults.totalInterest,
        totalCost: secureResults.totalCost,
        loanTermYears: secureResults.loanTermYears,
        purchaseTax: secureResults.purchaseTax,
        taxProfile: secureResults.taxProfile,
        equityUsed: secureResults.equityUsed,
        equityRemaining: secureResults.equityRemaining,
        lawyerFeeTTC: secureResults.lawyerFeeTTC,
        brokerFeeTTC: secureResults.brokerFeeTTC,
        limitingFactor: secureResults.limitingFactor,
        estimatedMarketRent: secureResults.estimatedMarketRent,
        rentWarning: secureResults.rentWarning,
        shekelRatio: safeShekelRatio,
      };

      console.log(`[${requestId}] Zero-trust override applied successfully.`);
    } else {
      console.warn(`[${requestId}] Zero-trust failed to calculate results. Falling back to client or rejecting.`);
    }
    // === END ZERO-TRUST SECURITY ===

    const leadScoringInputs = secureResultsILS ? engineInputs : data.inputs;
    const leadScoringResults = secureResultsILS ?? data.results;
    const leadAnalysis = calculateLeadScore(leadScoringInputs as any, leadScoringResults as any, data.language);
    const limitingFactorDesc = getLimitingFactorDescription(data.results.limitingFactor, data.language);

    const enrichedResults = {
      ...data.results,
      lead_score: leadAnalysis.score,
      priority_label: leadAnalysis.priorityLabel,
      limiting_factor: data.results.limitingFactor,
      limiting_factor_description: limitingFactorDesc,
    };

    // Save simulation to database
    const { error: insertError } = await supabaseAdmin.from("simulations").insert({
      client_name: data.recipientName,
      email: data.recipientEmail,
      phone: data.recipientPhone,
      language: data.language,
      inputs: data.inputs,
      results: enrichedResults,
      partner_id: effectivePartnerId,
    });

    // ─── Google Sheets: append lead for alloj ────
    if (effectivePartnerId === ALLOJ_PARTNER_ID) {
      const budgetForSheet = secureResultsILS?.maxPropertyValue ?? data.results.maxPropertyValue;
      const equityForSheet = engineInputs.equity || parseFloat(data.inputs.equity || "0");
      await appendToAllojSheet(
        data.recipientName,
        data.recipientPhone,
        data.recipientEmail,
        budgetForSheet,
        equityForSheet,
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Load Partner Information
    let partnerContact: PartnerContactOverride | undefined = data.partnerEmail
      ? {
          name: data.partnerName || null,
          email: data.partnerEmail,
          phone: null,
          whatsapp: null,
        }
      : undefined;

    let recipientTo = data.partnerEmail || ADVISOR_EMAIL;
    let bccTo: string | undefined = data.partnerEmail ? ADVISOR_EMAIL : undefined;

    if (effectivePartnerId) {
      const { data: partnerData, error: partnerError } = await supabaseAdmin
        .from("partners")
        .select("name, email, phone, whatsapp")
        .eq("id", effectivePartnerId)
        .single();

      if (!partnerError && partnerData) {
        partnerContact = {
          name: partnerData.name,
          email: partnerData.email,
          phone: partnerData.phone,
          whatsapp: partnerData.whatsapp,
        };
        if (partnerData.email) {
          recipientTo = partnerData.email;
          bccTo = ADVISOR_EMAIL;
          console.log(`[${requestId}] Routing email to Partner: ${recipientTo}, BCC to Admin`);
        }
      } else {
        console.error(`[${requestId}] Error fetching partner:`, partnerError);
      }
    }

    const emailHtmlClient = generateEmailHtml(data, false, partnerContact);
    const emailHtmlAdvisor = generateEmailHtml(data, true, partnerContact);

    const t = (
      {
        he: { subjectWithName: "תיק האסטרטגיה הפיננסית של", fromPartner: "מאת" },
        en: { subjectWithName: "Strategic Dossier for", fromPartner: "from" },
        fr: { subjectWithName: "Dossier Stratégique pour", fromPartner: "de la part de" },
      } as Record<string, Record<string, string>>
    )[data.language] || { subjectWithName: "Report for", fromPartner: "from" };

    const clientSubject = `${t.subjectWithName} ${data.recipientName}`;
    let adminSubject = clientSubject;
    if (partnerContact?.name) {
      adminSubject = `${clientSubject} ${t.fromPartner} ${partnerContact.name}`;
    }

    const csvFilenames: Record<string, string> = {
      he: "loach-silkukin.csv",
      en: "amortization-table.csv",
      fr: "tableau-amortissement.csv",
    };

    const attachments = data.csvData
      ? [
          {
            filename: csvFilenames[data.language] || "report.csv",
            content: toBase64("\uFEFF" + data.csvData),
            content_type: "text/csv; charset=utf-8",
          },
        ]
      : [];

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const sendResendEmail = async (
      payload: Record<string, any>,
      opts?: { label?: string; maxAttempts?: number; throttleMs?: number },
    ): Promise<{ ok: boolean; text: string }> => {
      const label = opts?.label ?? "email";
      const maxAttempts = opts?.maxAttempts ?? 3;
      await sleep(opts?.throttleMs ?? 650);

      let attempt = 1;
      while (attempt <= maxAttempts) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        if (res.ok) return { ok: true, text };

        if (res.status === 429 && attempt < maxAttempts) {
          const backoff = 800 * attempt;
          console.warn(`[${requestId}] ${label} 429; retrying in ${backoff}ms`);
          await sleep(backoff);
          attempt++;
          continue;
        }
        return { ok: false, text };
      }
      return { ok: false, text: "Max attempts reached" };
    };

    // 1. Send to Client
    const clientSend = await sendResendEmail(
      {
        from: "Property Budget Pro <noreply@eshel-f.com>",
        to: [data.recipientEmail],
        reply_to: partnerContact?.email || ADVISOR_EMAIL,
        subject: clientSubject,
        html: emailHtmlClient,
        attachments,
      },
      { label: "client", throttleMs: 0 },
    );

    if (!clientSend.ok) throw new Error(`Client send failed: ${clientSend.text}`);

    const newLeadLabel =
      (
        {
          he: "ליד חדש",
          en: "New Lead",
          fr: "Nouveau prospect",
        } as Record<string, string>
      )[data.language] || "New Lead";

    // 2. Send to Partner
    let partnerSendOk = true;
    if (effectivePartnerId && partnerContact?.email) {
      const partnerSubject = `${newLeadLabel}: ${data.recipientName}`;
      const partnerSend = await sendResendEmail(
        {
          from: "Property Budget Pro <noreply@eshel-f.com>",
          to: [partnerContact.email],
          subject: partnerSubject,
          html: emailHtmlAdvisor,
          attachments,
        },
        { label: "partner" },
      );
      partnerSendOk = partnerSend.ok;
      console.log(
        `[${requestId}] Partner email sent to ${partnerContact.email}. Status: ${partnerSendOk ? "Success" : "Failed"}`,
      );
    }

    // 3. Send to Admin
    const adminLeadSubject =
      `${newLeadLabel} - Real Estate Simulator` +
      (partnerContact?.name ? ` [Partner: ${partnerContact.name}]` : "") +
      `: ${data.recipientName}`;

    const adminSend = await sendResendEmail(
      {
        from: "Property Budget Pro <noreply@eshel-f.com>",
        to: [ADVISOR_EMAIL],
        subject: adminLeadSubject,
        html: emailHtmlAdvisor,
        attachments,
      },
      { label: "admin" },
    );

    return new Response(
      JSON.stringify({
        requestId,
        deliveredToClient: true,
        deliveredToPartner: partnerSendOk,
        deliveredToAdmin: adminSend.ok,
        version: { functionVersion: FUNCTION_VERSION, clientBuildSha, mismatch: versionMismatch },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error(`[send-report-email] Error:`, error.message);
    return new Response(JSON.stringify({ error: "An error occurred while sending the report. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
