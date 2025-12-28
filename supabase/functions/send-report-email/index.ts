import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADVISOR_EMAIL = "shlomo.elmaleh@gmail.com";

// CORS headers - allow all origins for this public calculator
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Input validation schema
const EmailRequestSchema = z.object({
  recipientEmail: z.string().email().max(254),
  recipientName: z.string().min(1).max(100),
  recipientPhone: z.string().max(30),
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
    equityRemaining: z.number().nonnegative().max(1e12),
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
  yearlyBalanceData: z.array(z.object({
    year: z.number().int().positive().max(50),
    balance: z.number().nonnegative(),
  })).max(50).optional(),
  paymentBreakdownData: z.array(z.object({
    year: z.number().int().positive().max(50),
    interest: z.number().nonnegative(),
    principal: z.number().nonnegative(),
  })).max(50).optional(),
});

// Rate limiting helper
async function checkRateLimit(
  supabaseAdmin: any,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  const { data, error } = await supabaseAdmin
    .from("rate_limits")
    .select("request_count, window_start")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .single();

  const now = new Date();

  if (!data || error) {
    // First request - create record
    await supabaseAdmin.from("rate_limits").insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: now.toISOString(),
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const windowStart = new Date((data as any).window_start);
  const minutesElapsed = (now.getTime() - windowStart.getTime()) / 60000;

  if (minutesElapsed >= windowMinutes) {
    // Reset window
    await supabaseAdmin
      .from("rate_limits")
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const currentCount = (data as any).request_count;
  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  await supabaseAdmin
    .from("rate_limits")
    .update({ request_count: currentCount + 1 })
    .eq("identifier", identifier)
    .eq("endpoint", endpoint);

  return { allowed: true, remaining: maxRequests - currentCount - 1 };
}

interface ReportEmailRequest {
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  language: 'he' | 'en' | 'fr';
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
    taxProfile: 'SINGLE_HOME' | 'INVESTOR';
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
}

function formatNumber(num: number): string {
  return Math.round(num).toLocaleString('en-US');
}

function getEmailContent(data: ReportEmailRequest, isAdvisorCopy: boolean = false): { subject: string; html: string } {
  const { language, recipientName, recipientPhone, recipientEmail, inputs, results, amortizationSummary, yearlyBalanceData, paymentBreakdownData } = data;
  
  // Parse income for DTI calculation
  const parseNumber = (str: string): number => {
    if (!str) return 0;
    return parseFloat(str.replace(/,/g, '')) || 0;
  };
  
  const incomeNet = parseNumber(inputs.netIncome);
  const monthlyPayment = results.monthlyPayment;
  const equityInitial = parseNumber(inputs.equity);
  const equityRemaining = results.equityRemaining;
  
  // Normalize DTI max allowed (could be 33 or 0.33)
  let dtiMaxAllowedRaw = parseFloat(inputs.ratio) || 0;
  const dtiMaxAllowed = dtiMaxAllowedRaw > 1 ? dtiMaxAllowedRaw / 100 : dtiMaxAllowedRaw;
  
  // Calculate estimated DTI
  const dtiEstimated = incomeNet > 0 ? monthlyPayment / incomeNet : null;
  const thresholdDelta = 0.01;
  
  const texts = {
    he: {
      subject: 'דוח מחשבון תקציב רכישת נכס',
      subjectWithName: 'דוח תיק של',
      // Section 1 - Hero
      heroTitle: 'סיכום פרויקט הנדל"ן שלך',
      heroTitleWithName: 'דוח תיק של',
      // Client info for advisor copy
      clientInfoTitle: 'פרטי הלקוח',
      clientName: 'שם',
      clientPhone: 'טלפון',
      clientEmail: 'אימייל',
      maxPropertyLabel: 'שווי נכס מקסימלי',
      limitingFactorLabel: 'גורם מגביל לתקציב',
      limitingCash: 'מוגבל לפי ההון העצמי (Cash)',
      limitingIncome: 'מוגבל לפי הכנסה (יחס החזר)',
      limitingComfortable: 'פרופיל נוח (מרווח זמין)',
      limitingInsufficient: 'נתונים חסרים (לאימות)',
      // Section 2 - Funding
      fundingTitle: 'פירוט מימון',
      loanAmount: 'סכום משכנתא',
      equityOnProperty: 'הון עצמי על הנכס',
      fundingNote: 'הלוואה + הון עצמי = מחיר הנכס',
      // Section 3 - Transaction
      transactionTitle: 'פירוט עלויות רכישה',
      purchaseTax: 'מס רכישה',
      lawyerLabel: 'עו"ד',
      brokerLabel: 'תיווך',
      other: 'שונות',
      transactionTotal: 'סך עלויות רכישה',
      taxDisclaimer: 'מס רכישה מחושב לפי מדרגות סטנדרטיות בלבד; הטבות מיוחדות לא נכללות. יש לאמת עם עו"ד.',
      ttc: 'כולל מע"מ',
      // Section 4 - Cash Summary
      cashTitle: 'סיכום הון עצמי',
      capitalAllocated: 'הון עצמי בשימוש',
      liquidBuffer: 'יתרת הון עצמי (Cash)',
      cashNote: 'הערכת יתרת המזומנים לאחר רכישה + עלויות.',
      // Section 5 - Feasibility
      feasibilityTitle: 'ניתוח היתכנות',
      ltvRatio: 'יחס מימון (LTV)',
      dtiMaxLabel: 'יחס החזר מקסימלי',
      dtiEstimatedLabel: 'יחס החזר משוער',
      notAvailable: 'לא זמין',
      chartBalanceTitle: 'יתרת הלוואה לאורך זמן',
      chartPaymentTitle: 'פירוט תשלומים שנתי',
      principal: 'קרן',
      interestLabel: 'ריבית',
      // Section 6 - Assumptions
      assumptionsTitle: 'פרמטרים לסימולציה',
      age: 'גיל לווה',
      citizenship: 'אזרחות ישראלית',
      taxResident: 'תושב מס',
      firstProperty: 'נכס ראשון',
      netIncome: 'הכנסה פנויה',
      interestRate: 'ריבית שנתית',
      loanTerm: 'משך ההלוואה',
      years: 'שנים',
      yes: 'כן',
      no: 'לא',
      // CTA
      ctaTitle: 'יש לך שאלות? אני כאן לעזור!',
      ctaWhatsApp: '📞 לקביעת פגישה',
      ctaEmail: '✉️ לשאלות נוספות',
      // Footer
      footer: 'Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן',
      note: 'הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.',
      advisorName: 'שלמה אלמליח',
      advisorPhone: '054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
    },
    en: {
      subject: 'Property Budget Calculator - Complete Report',
      subjectWithName: 'Report for',
      heroTitle: 'Your Property Project Summary',
      heroTitleWithName: 'Report for',
      clientInfoTitle: 'Client Information',
      clientName: 'Name',
      clientPhone: 'Phone',
      clientEmail: 'Email',
      maxPropertyLabel: 'Max Property Value',
      limitingFactorLabel: 'Budget Limiting Factor',
      limitingCash: 'Limited by Equity (Cash)',
      limitingIncome: 'Limited by Income (DTI)',
      limitingComfortable: 'Comfortable Profile (Margin Available)',
      limitingInsufficient: 'Insufficient Data (To Confirm)',
      fundingTitle: 'Funding Breakdown',
      loanAmount: 'Loan Amount',
      equityOnProperty: 'Equity on Property',
      fundingNote: 'Loan + Equity = Property Price',
      transactionTitle: 'Transaction Costs Details',
      purchaseTax: 'Purchase Tax',
      lawyerLabel: 'Lawyer',
      brokerLabel: 'Broker/Agency',
      other: 'Other',
      transactionTotal: 'Total Transaction Costs',
      taxDisclaimer: 'Tax calculated using standard brackets only; special exemptions not included. Verify with attorney.',
      ttc: 'incl. VAT',
      cashTitle: 'Equity Summary',
      capitalAllocated: 'Total Capital Allocated',
      liquidBuffer: 'Liquid Safety Buffer',
      cashNote: 'Estimated cash remaining after purchase + costs.',
      feasibilityTitle: 'Feasibility Analysis',
      ltvRatio: 'LTV Ratio',
      dtiMaxLabel: 'Max DTI Allowed',
      dtiEstimatedLabel: 'Estimated DTI',
      notAvailable: 'N/A',
      chartBalanceTitle: 'Loan Balance Over Time',
      chartPaymentTitle: 'Annual Payment Breakdown',
      principal: 'Principal',
      interestLabel: 'Interest',
      assumptionsTitle: 'Simulation Assumptions',
      age: 'Borrower Age',
      citizenship: 'Israeli Citizenship',
      taxResident: 'Tax Resident',
      firstProperty: 'First Property',
      netIncome: 'Net Income',
      interestRate: 'Annual Interest',
      loanTerm: 'Loan Term',
      years: 'years',
      yes: 'Yes',
      no: 'No',
      ctaTitle: 'Have questions? I am here to help!',
      ctaWhatsApp: '📞 Book an Appointment',
      ctaEmail: '✉️ Ask a Question',
      footer: 'Property Budget Pro - Professional Real Estate Planning Tool',
      note: 'This simulation is for illustrative purposes only and does not constitute a binding offer. Final rates and terms are subject to lender approval.',
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
    },
    fr: {
      subject: 'Simulateur Budget Immobilier - Rapport Complet',
      subjectWithName: 'Rapport du dossier de',
      heroTitle: 'Synthèse de votre projet immobilier',
      heroTitleWithName: 'Rapport du dossier de',
      clientInfoTitle: 'Coordonnées du client',
      clientName: 'Nom',
      clientPhone: 'Téléphone',
      clientEmail: 'Email',
      maxPropertyLabel: 'Valeur Max du Bien',
      limitingFactorLabel: 'Facteur déterminant du budget',
      limitingCash: "Limité par l'apport (Cash)",
      limitingIncome: 'Limité par la mensualité (Revenus)',
      limitingComfortable: 'Profil confortable (marge disponible)',
      limitingInsufficient: 'Données insuffisantes (à confirmer)',
      fundingTitle: 'Le montage financier',
      loanAmount: 'Montant du Prêt',
      equityOnProperty: 'Apport net sur le prix du bien',
      fundingNote: 'Prêt + Apport = Prix du bien',
      transactionTitle: 'Détail des frais de transaction',
      purchaseTax: "Taxe d'acquisition",
      lawyerLabel: 'Avocat',
      brokerLabel: "Frais d'agence",
      other: 'Divers',
      transactionTotal: 'Total des frais de transaction',
      taxDisclaimer: 'Barèmes standards uniquement ; exonérations non incluses. Vérifiez auprès d\'un avocat.',
      ttc: 'T.T.C',
      cashTitle: 'Bilan des fonds propres',
      capitalAllocated: 'Capital total mobilisé',
      liquidBuffer: 'Réserve de sécurité (cash)',
      cashNote: 'Estimation du cash restant sur votre compte après achat + frais.',
      feasibilityTitle: 'Analyse de faisabilité',
      ltvRatio: 'Ratio LTV',
      dtiMaxLabel: 'DTI Max autorisé',
      dtiEstimatedLabel: 'DTI Estimé',
      notAvailable: 'N/A',
      chartBalanceTitle: 'Solde du Prêt dans le Temps',
      chartPaymentTitle: 'Répartition Annuelle des Paiements',
      principal: 'Capital',
      interestLabel: 'Intérêts',
      assumptionsTitle: 'Hypothèses de la simulation',
      age: "Âge de l'emprunteur",
      citizenship: 'Nationalité israélienne',
      taxResident: 'Résident fiscal',
      firstProperty: 'Premier bien',
      netIncome: 'Revenu Net',
      interestRate: "Taux d'intérêt annuel",
      loanTerm: 'Durée du Prêt',
      years: 'ans',
      yes: 'Oui',
      no: 'Non',
      ctaTitle: 'Vous avez des questions ? Je suis là pour vous aider !',
      ctaWhatsApp: '📞 Prendre RDV',
      ctaEmail: '✉️ Poser une question',
      footer: 'Property Budget Pro - Outil Professionnel de Planification Immobilière',
      note: "Cette simulation est fournie à titre indicatif uniquement et ne constitue pas une offre contractuelle. Les taux et conditions définitifs dépendent de l'organisme prêteur.",
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
    }
  };

  const t = texts[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';
  const isRTL = language === 'he';
  const alignStart = isRTL ? 'right' : 'left';
  const alignEnd = isRTL ? 'left' : 'right';

  // Compute limiting factor
  let limitingFactor: string;
  const hasCriticalData = equityInitial > 0 && incomeNet > 0 && monthlyPayment > 0;
  
  if (!hasCriticalData) {
    limitingFactor = t.limitingInsufficient;
  } else if (equityRemaining <= 0.01 * equityInitial) {
    limitingFactor = t.limitingCash;
  } else if (dtiMaxAllowed > 0 && dtiEstimated !== null && dtiEstimated >= (dtiMaxAllowed - thresholdDelta)) {
    limitingFactor = t.limitingIncome;
  } else {
    limitingFactor = t.limitingComfortable;
  }

  // Computed values
  const equityOnProperty = results.maxPropertyValue - results.loanAmount;
  const dtiEstimatedDisplay = dtiEstimated !== null ? `${(dtiEstimated * 100).toFixed(1)}%` : t.notAvailable;

  const html = `
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
          ${isRTL ? 'flex-direction: row-reverse;' : ''}
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
          ${isRTL ? 'flex-direction: row-reverse; justify-content: flex-end;' : ''}
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
        .total-row {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 8px;
          margin-top: 10px;
          padding: 12px !important;
        }
        .total-row .label { font-weight: 600; color: #92400e; }
        .total-row .value { font-weight: 700; color: #d97706; font-size: 16px; }
        
        /* Cash Section */
        .cash-section { border-${alignStart}: 5px solid #10b981; }
        .cash-section .section-title { color: #047857; }
        .buffer-row {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 8px;
          padding: 12px !important;
          margin-top: 8px;
        }
        .buffer-row .label { font-weight: 600; color: #047857; }
        .buffer-row .value { font-weight: 700; color: #059669; font-size: 16px; }
        .cash-note {
          font-size: 11px;
          color: #64748b;
          margin-top: 10px;
          font-style: italic;
        }
        
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
          ${isRTL ? 'flex-direction: row-reverse; justify-content: flex-end;' : ''}
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
          ${isRTL ? 'flex-direction: row-reverse;' : ''}
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
          <div style="text-align: ${alignStart}; ${isRTL ? 'direction: rtl;' : ''}">
            <p style="font-weight: 700; font-size: 16px; margin: 0 0 4px 0;">${t.advisorName}</p>
            <p>📞 <a href="https://wa.me/972549997711" target="_blank">${t.advisorPhone}</a></p>
            <p>✉️ <a href="mailto:${t.advisorEmail}">${t.advisorEmail}</a></p>
          </div>
          <p style="font-size: 12px; margin: 0;">📅 ${new Date().toLocaleDateString()}</p>
        </div>
        <h1>🏠 ${t.heroTitleWithName} ${recipientName}</h1>
      </div>

      ${isAdvisorCopy ? `
      <!-- CLIENT INFO SECTION (Advisor Only) -->
      <div class="section" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 5px solid #3b82f6; border-right: ${isRTL ? '5px solid #3b82f6' : 'none'}; border-left: ${isRTL ? 'none' : '5px solid #3b82f6'};">
        <div class="section-title" style="color: #1d4ed8;">👤 ${t.clientInfoTitle}</div>
        <div class="row">
          <span class="label">${t.clientName}</span>
          <span class="value" style="font-weight: 700;">${recipientName}</span>
        </div>
        <div class="row">
          <span class="label">${t.clientPhone}</span>
          <span class="value"><a href="tel:${recipientPhone}" style="color: #1d4ed8; text-decoration: none;">${recipientPhone}</a></span>
        </div>
        <div class="row">
          <span class="label">${t.clientEmail}</span>
          <span class="value"><a href="mailto:${recipientEmail}" style="color: #1d4ed8; text-decoration: none;">${recipientEmail}</a></span>
        </div>
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
          <span class="label">${t.other}</span>
          <span class="value">₪ ${inputs.otherFee || '0'}</span>
        </div>
        <div class="row total-row">
          <span class="label">${t.transactionTotal}</span>
          <span class="value">₪ ${formatNumber(results.closingCosts)}</span>
        </div>
      </div>

      <!-- SECTION 4: Cash Summary -->
      <div class="section cash-section">
        <div class="section-title">💰 ${t.cashTitle}</div>
        <div class="row">
          <span class="label">${t.capitalAllocated}</span>
          <span class="value">₪ ${formatNumber(results.equityUsed)}</span>
        </div>
        <div class="row buffer-row">
          <span class="label">${t.liquidBuffer}</span>
          <span class="value">₪ ${formatNumber(results.equityRemaining)}</span>
        </div>
        <div class="cash-note">${t.cashNote}</div>
      </div>

      <!-- SECTION 5: Feasibility & Analysis -->
      <div class="section feasibility-section">
        <div class="section-title">📊 ${t.feasibilityTitle}</div>
        <div class="row">
          <span class="label">${t.ltvRatio}</span>
          <span class="value">${results.actualLTV.toFixed(1)}%</span>
        </div>
        <div class="row">
          <span class="label">${t.dtiMaxLabel}</span>
          <span class="value">${dtiMaxAllowed > 0 ? `${(dtiMaxAllowed * 100).toFixed(0)}%` : t.notAvailable}</span>
        </div>
        <div class="row">
          <span class="label">${t.dtiEstimatedLabel}</span>
          <span class="value">${dtiEstimatedDisplay}</span>
        </div>
        
        <!-- Charts -->
        ${yearlyBalanceData && yearlyBalanceData.length > 0 ? `
        <div class="chart-container">
          <div class="chart-title-small">📉 ${t.chartBalanceTitle}</div>
          ${(() => {
            const CHART_H = 120;
            const maxBalance = Math.max(...yearlyBalanceData.map(d => d.balance));
            return `
              <table class="vchart" role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  ${yearlyBalanceData
                    .slice()
                    .sort((a, b) => a.year - b.year)
                    .map(d => {
                      const barH = Math.max(4, Math.round((d.balance / maxBalance) * CHART_H));
                      return `
                        <td>
                          <div class="vbar vbar-balance" style="height: ${barH}px;"></div>
                          <div class="vlabel" dir="ltr">${d.year}</div>
                        </td>
                      `;
                    })
                    .join('')}
                </tr>
              </table>
            `;
          })()}
        </div>
        ` : ''}
        
        ${paymentBreakdownData && paymentBreakdownData.length > 0 ? `
        <div class="chart-container">
          <div class="chart-title-small">📊 ${t.chartPaymentTitle}</div>
          ${(() => {
            const CHART_H = 120;
            const rows = paymentBreakdownData.slice().sort((a, b) => a.year - b.year);
            const maxTotal = Math.max(...rows.map(d => d.principal + d.interest));
            return `
              <table class="vchart" role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  ${rows
                    .map(d => {
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
                    .join('')}
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
        ` : ''}
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
            <div class="a-label">${t.interestRate}</div>
            <div class="a-value">${inputs.interest}%</div>
          </div>
          <div class="assumption-item">
            <div class="a-label">${t.loanTerm}</div>
            <div class="a-value">${results.loanTermYears} ${t.years}</div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="cta-section">
        <h3>${t.ctaTitle}</h3>
        <div class="cta-buttons">
          <a href="https://wa.me/972549997711?text=${encodeURIComponent(`Bonjour ${t.advisorName}, je viens d'utiliser votre simulateur et j'aimerais en discuter.`)}" class="cta-button cta-whatsapp" target="_blank">${t.ctaWhatsApp}</a>
          <a href="mailto:${t.advisorEmail}?subject=${encodeURIComponent(`Question suite à ma simulation`)}" class="cta-button cta-email">${t.ctaEmail}</a>
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

  // For client: use personalized subject with their name
  // For advisor: use subject with client name for easy identification
  const personalizedSubject = isAdvisorCopy 
    ? `🔔 ${t.subjectWithName} ${recipientName}` 
    : `${t.subjectWithName} ${recipientName}`;
    
  return { subject: personalizedSubject, html };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase admin client for rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Rate limit by IP address - 10 emails per hour
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req.headers.get("x-real-ip") ||
                    "unknown";
    
    const rateCheck = await checkRateLimit(supabaseAdmin, clientIP, "send-report-email", 10, 60);
    
    if (!rateCheck.allowed) {
      console.warn("Rate limit exceeded for IP:", clientIP);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Maximum 10 emails per hour.",
          retryAfter: 3600,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders },
        }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = EmailRequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.format());
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: parseResult.error.issues.map(i => i.message).join(", "),
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data = parseResult.data as ReportEmailRequest;
    const requestId = crypto.randomUUID().substring(0, 8);
    console.log(`[${requestId}] Email request received`);
    console.log(`[${requestId}] Chart data - yearlyBalance: ${data.yearlyBalanceData?.length || 0}, paymentBreakdown: ${data.paymentBreakdownData?.length || 0}`);

    // Generate two versions: one for client, one for advisor (with client info section)
    const { subject: clientSubject, html: clientHtml } = getEmailContent(data, false);
    const { subject: advisorSubject, html: advisorHtml } = getEmailContent(data, true);

    // Send to client using verified domain eshel-f.com
    const primaryRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Property Budget Pro <noreply@eshel-f.com>",
        to: [data.recipientEmail],
        subject: clientSubject,
        html: clientHtml,
      }),
    });

    // Always try to send advisor copy separately (with client info section)
    const advisorRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Property Budget Pro <noreply@eshel-f.com>",
        to: [ADVISOR_EMAIL],
        subject: `🔔 ${advisorSubject}`,
        html: advisorHtml,
      }),
    });

    if (!advisorRes.ok) {
      const advisorError = await advisorRes.text();
      console.warn(`[${requestId}] Advisor copy failed to send:`, advisorError);
    } else {
      console.log(`[${requestId}] Advisor email sent successfully`);
    }

    if (!primaryRes.ok) {
      const errorText = await primaryRes.text();
      console.error("Client email send failed:", primaryRes.status, errorText);
      throw new Error(`Failed to send client email: ${errorText}`);
    }

    const emailResponse = await primaryRes.json();
    console.log(`[${requestId}] Client email sent successfully`);

    return new Response(
      JSON.stringify({
        deliveredToClient: true,
        deliveredToAdvisor: true,
        resend: emailResponse,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-report-email function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
