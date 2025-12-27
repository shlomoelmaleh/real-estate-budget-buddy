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

function getEmailContent(data: ReportEmailRequest): { subject: string; html: string } {
  const { language, recipientName, recipientPhone, recipientEmail, inputs, results, amortizationSummary, yearlyBalanceData, paymentBreakdownData } = data;
  
  const texts = {
    he: {
      subject: 'דוח מחשבון תקציב רכישת נכס',
      greeting: `שלום ${recipientName},`,
      intro: 'להלן סיכום מלא של החישוב שביצעת:',
      // Input sections
      basicInfo: 'נתוני בסיס',
      clientName: 'שם הלקוח',
      clientPhone: 'טלפון',
      clientEmail: 'אימייל',
      equity: 'הון עצמי',
      ltv: 'מימון מקסימלי',
      netIncome: 'הכנסה פנויה',
      ratio: 'יחס החזר',
      age: 'גיל לווה',
      maxAge: 'פריסה מקסימלית (גיל)',
      interest: 'ריבית שנתית',
      // Rental
      rentalInfo: 'שכירות והשקעה',
      isRented: 'נכס להשקעה',
      rentalYield: 'תשואת שכירות',
      rentRecognition: 'הכרה בבנק',
      budgetCap: 'תקרת החזר חודשי',
      yes: 'כן',
      no: 'לא',
      // Expenses
      expensesInfo: 'הוצאות נלוות',
      purchaseTax: 'מס רכישה מחושב',
      taxProfileLabel: 'סוג נכס',
      taxProfileSingleHome: 'דירה יחידה',
      taxProfileInvestor: 'דירה נוספת',
      lawyerLabel: 'עו"ד (1% + מע"מ)',
      brokerLabel: 'תיווך (2% + מע"מ)',
      other: 'שונות',
      ttc: 'כולל מע"מ',
      // Results
      resultsTitle: 'תוצאות החישוב',
      maxProperty: 'שווי נכס מקסימלי',
      loanAmount: 'סכום משכנתא',
      actualLTV: 'אחוז מימון בפועל',
      monthlyPayment: 'החזר חודשי',
      rentIncome: 'הכנסה משכירות',
      netPayment: 'תשלום נטו',
      closingCosts: 'הוצאות נלוות',
      totalInterest: 'סך תשלומי ריבית',
      totalCost: 'עלות כוללת',
      shekelRatio: 'יחס שקל לשקל',
      loanTerm: 'תקופת המשכנתא',
      years: 'שנים',
      equityUsed: 'הון עצמי בשימוש',
      equityRemaining: 'יתרת הון עצמי',
      // Amortization
      amortizationInfo: 'סיכום לוח סילוקין',
      totalMonths: 'סה"כ חודשים',
      firstPayment: 'תשלום ראשון',
      lastPayment: 'תשלום אחרון',
      principal: 'קרן',
      interestLabel: 'ריבית',
      chartBalanceTitle: 'יתרת הלוואה לאורך זמן',
      chartPaymentTitle: 'פירוט תשלומים שנתי',
      chartYear: 'שנה',
      footer: 'Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן',
      note: 'הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.',
      taxDisclaimer: 'לתשומת לבך: חישוב מס הרכישה בסימולטור זה מבוסס על מדרגות המס הסטנדרטיות (דירה יחידה או דירה נוספת). החישוב אינו לוקח בחשבון הטבות ספציפיות כגון: עולה חדש, נכות, או תושב חוזר. גובה המס הסופי ייקבע רק על ידי עו"ד מקרקעין.',
      advisorName: 'שלמה אלמליח',
      advisorPhone: '054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
      // CTAs
      ctaTitle: 'יש לך שאלות? אני כאן לעזור!',
      ctaWhatsApp: '📞 לקביעת פגישה',
      ctaEmail: '✉️ לשאלות נוספות'
    },
    en: {
      subject: 'Property Budget Calculator - Complete Report',
      greeting: `Hello ${recipientName},`,
      intro: 'Here is the complete summary of your calculation:',
      basicInfo: 'Basic Information',
      clientName: 'Client Name',
      clientPhone: 'Phone',
      clientEmail: 'Email',
      equity: 'Equity',
      ltv: 'Max LTV',
      netIncome: 'Net Income',
      ratio: 'Repayment Ratio',
      age: 'Borrower Age',
      maxAge: 'Max Age (End of loan)',
      interest: 'Annual Interest',
      rentalInfo: 'Rent & Investment',
      isRented: 'Investment Property',
      rentalYield: 'Rental Yield',
      rentRecognition: 'Bank Recognition',
      budgetCap: 'Monthly Payment Cap',
      yes: 'Yes',
      no: 'No',
      expensesInfo: 'Closing Costs',
      purchaseTax: 'Calculated Purchase Tax',
      taxProfileLabel: 'Property Type',
      taxProfileSingleHome: 'Single Home',
      taxProfileInvestor: 'Additional Property',
      lawyerLabel: 'Lawyer (1% + VAT)',
      brokerLabel: 'Broker (2% + VAT)',
      other: 'Other Costs',
      ttc: 'incl. VAT',
      resultsTitle: 'Calculation Results',
      maxProperty: 'Max Property Value',
      loanAmount: 'Loan Amount',
      actualLTV: 'Actual LTV',
      monthlyPayment: 'Monthly Payment',
      rentIncome: 'Rental Income',
      netPayment: 'Net Payment',
      closingCosts: 'Closing Costs',
      totalInterest: 'Total Interest',
      totalCost: 'Total Cost',
      shekelRatio: 'Shekel-to-Shekel Ratio',
      loanTerm: 'Loan Term',
      years: 'years',
      equityUsed: 'Equity Used',
      equityRemaining: 'Remaining Equity',
      amortizationInfo: 'Amortization Summary',
      totalMonths: 'Total Months',
      firstPayment: 'First Payment',
      lastPayment: 'Last Payment',
      principal: 'Principal',
      interestLabel: 'Interest',
      chartBalanceTitle: 'Loan Balance Over Time',
      chartPaymentTitle: 'Annual Payment Breakdown',
      chartYear: 'Year',
      footer: 'Property Budget Pro - Professional Real Estate Planning Tool',
      note: 'This simulation is for illustrative purposes only and does not constitute a binding offer. Final rates and terms are subject to lender approval.',
      taxDisclaimer: 'Note: The purchase tax calculation is based on standard brackets (single or additional home). It does not account for specific benefits like New Immigrant (Oleh Hadash), disability, or returning resident. The final tax amount will be determined solely by a real estate lawyer.',
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
      ctaTitle: 'Have questions? I am here to help!',
      ctaWhatsApp: '📞 Book an Appointment',
      ctaEmail: '✉️ Ask a Question'
    },
    fr: {
      subject: 'Simulateur Budget Immobilier - Rapport Complet',
      greeting: `Bonjour ${recipientName},`,
      intro: 'Voici le résumé complet de votre calcul:',
      basicInfo: 'Informations de Base',
      clientName: 'Nom du Client',
      clientPhone: 'Téléphone',
      clientEmail: 'Email',
      equity: 'Apport Personnel',
      ltv: 'Financement Max',
      netIncome: 'Revenu Net',
      ratio: "Taux d'endettement",
      age: "Âge de l'emprunteur",
      maxAge: 'Âge max fin de prêt',
      interest: "Taux d'intérêt annuel",
      rentalInfo: 'Investissement Locatif',
      isRented: 'Bien destiné à la location',
      rentalYield: 'Rendement Locatif',
      rentRecognition: 'Reconnaissance Banque',
      budgetCap: 'Plafond Mensualité',
      yes: 'Oui',
      no: 'Non',
      expensesInfo: 'Frais Annexes',
      purchaseTax: "Taxe d'acquisition calculée",
      taxProfileLabel: 'Type de bien',
      taxProfileSingleHome: 'Résidence principale',
      taxProfileInvestor: "Bien d'investissement",
      lawyerLabel: 'Avocat (1% H.T)',
      brokerLabel: "Frais d'agence (2% H.T)",
      other: 'Divers',
      ttc: 'T.T.C',
      resultsTitle: 'Résultats du Calcul',
      maxProperty: 'Valeur Max du Bien',
      loanAmount: 'Montant du Prêt',
      actualLTV: 'LTV Actuel',
      monthlyPayment: 'Mensualité',
      rentIncome: 'Revenu Locatif',
      netPayment: 'Paiement Net',
      closingCosts: 'Frais Annexes',
      totalInterest: 'Total Intérêts',
      totalCost: 'Coût Total',
      shekelRatio: 'Ratio Shekel pour Shekel',
      loanTerm: 'Durée du Prêt',
      years: 'ans',
      equityUsed: 'Apport utilisé',
      equityRemaining: 'Apport restant',
      amortizationInfo: "Résumé du Tableau d'Amortissement",
      totalMonths: 'Total Mois',
      firstPayment: 'Premier Paiement',
      lastPayment: 'Dernier Paiement',
      principal: 'Capital',
      interestLabel: 'Intérêts',
      chartBalanceTitle: 'Solde du Prêt dans le Temps',
      chartPaymentTitle: 'Répartition Annuelle des Paiements',
      chartYear: 'Année',
      footer: 'Property Budget Pro - Outil Professionnel de Planification Immobilière',
      note: "Cette simulation est fournie à titre indicatif uniquement et ne constitue pas une offre contractuelle. Les taux et conditions définitifs dépendent de l'organisme prêteur.",
      taxDisclaimer: "Attention : Le calcul des droits de mutation est basé sur les barèmes standards. Il ne prend pas en compte les exonérations spécifiques (Oleh Hadash, handicap, etc.). Le montant définitif de la taxe doit être vérifié par un avocat spécialisé.",
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com',
      ctaTitle: 'Vous avez des questions ? Je suis là pour vous aider !',
      ctaWhatsApp: '📞 Prendre RDV',
      ctaEmail: '✉️ Poser une question'
    }
  };

  const t = texts[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';

  // Force RTL inline styles for Hebrew
  const isRTL = language === 'he';
  const alignStart = isRTL ? 'right' : 'left';
  const alignEnd = isRTL ? 'left' : 'right';

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
        * {
          direction: ${dir} !important;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          line-height: 1.7;
          color: #1e293b;
          max-width: 700px;
          margin: 0 auto;
          padding: 25px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%);
          direction: ${dir} !important;
          text-align: ${alignStart} !important;
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #0891b2 50%, #059669 100%);
          color: white;
          padding: 35px 25px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 25px;
          box-shadow: 0 10px 40px rgba(30, 64, 175, 0.3);
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 8px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .intro-section {
          background: white;
          padding: 20px 25px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
        }
        .intro-section p {
          margin: 8px 0;
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
        }
        .section {
          background: white;
          padding: 22px;
          border-radius: 14px;
          margin-bottom: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-${alignStart}: 5px solid #3b82f6;
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
        }
        .section-title {
          font-size: 17px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
          display: flex;
          align-items: center;
          gap: 10px;
          ${isRTL ? 'flex-direction: row-reverse; justify-content: flex-end;' : ''}
        }
        .row {
          display: table;
          width: 100%;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
          direction: ${dir} !important;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          display: table-cell;
          width: 55%;
          color: #64748b;
          font-size: 14px;
          text-align: ${alignStart} !important;
          padding-${alignEnd}: 20px;
          vertical-align: middle;
          direction: ${dir} !important;
        }
        .value {
          display: table-cell;
          width: 45%;
          font-weight: 600;
          color: #0f172a;
          font-size: 15px;
          text-align: ${alignEnd} !important;
          vertical-align: middle;
          direction: ${dir} !important;
        }
        .section-rental {
          border-${alignStart}-color: #10b981;
        }
        .section-rental .section-title {
          color: #047857;
        }
        .section-expenses {
          border-${alignStart}-color: #f59e0b;
        }
        .section-expenses .section-title {
          color: #b45309;
        }
        .results-section {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #34d399;
          border-${alignStart}: 6px solid #10b981;
        }
        .results-section .section-title {
          color: #047857;
        }
        .highlight {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 18px;
          border-radius: 10px;
          margin-top: 18px;
          border: 2px solid #f59e0b;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
        }
        .highlight .row {
          border: none;
          padding: 8px 0;
        }
        .highlight .label {
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
        }
        .highlight .value {
          font-size: 24px;
          font-weight: 700;
          color: #d97706;
        }
        .cta-section {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 30px;
          border-radius: 16px;
          margin: 25px 0;
          text-align: center;
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
        }
        .cta-section h3 {
          color: white;
          font-size: 20px;
          margin: 0 0 20px 0;
        }
        .cta-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cta-button {
          display: inline-block;
          padding: 14px 28px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          transition: transform 0.2s;
        }
        .cta-whatsapp {
          background: #25D366;
          color: white;
        }
        .cta-email {
          background: white;
          color: #1e40af;
        }
        .amortization-summary {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
          padding: 18px;
          border-radius: 10px;
          margin-top: 12px;
        }
        .amortization-grid {
          display: table;
          width: 100%;
        }
        .amortization-row {
          display: table-row;
        }
        .amortization-item {
          display: table-cell;
          text-align: center;
          padding: 12px 8px;
          background: white;
          border-radius: 8px;
          margin: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          width: 25%;
        }
        .amortization-item .title {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .amortization-item .amount {
          font-weight: 700;
          color: #0f172a;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding: 20px;
          color: #64748b;
          font-size: 13px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }
        .footer p {
          margin: 5px 0;
        }
        .note {
          background: linear-gradient(135deg, #fff7ed, #ffedd5);
          border: 2px solid #fb923c;
          padding: 15px 18px;
          border-radius: 10px;
          margin-top: 20px;
          font-size: 13px;
          color: #9a3412;
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
          display: flex;
          align-items: center;
          gap: 10px;
          ${isRTL ? 'flex-direction: row-reverse;' : ''}
        }
        .chart-section {
          background: white;
          padding: 22px;
          border-radius: 14px;
          margin-bottom: 18px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-${alignStart}: 5px solid #3b82f6;
        }
        .chart-title {
          font-size: 17px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
          ${isRTL ? 'flex-direction: row-reverse; justify-content: flex-end;' : ''}
        }

        /* Email-safe vertical charts: use TABLE layout (works in Gmail/Outlook). */
        .vchart {
          width: 100%;
          height: 190px;
          table-layout: fixed;
          border-collapse: collapse;
          border-bottom: 2px solid #e2e8f0;
          direction: ltr !important; /* prevents RTL reversing years order */
          unicode-bidi: bidi-override;
          margin-bottom: 8px;
        }
        .vchart td {
          vertical-align: bottom;
          text-align: center;
          padding: 0 3px;
        }
        .vbar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          display: block;
          margin: 0 auto;
        }
        .vbar-balance {
          background: linear-gradient(180deg, #3b82f6, #60a5fa);
        }
        .vstack {
          width: 100%;
          display: block;
          border-radius: 4px 4px 0 0;
          overflow: hidden;
        }
        .vbar-principal {
          background: linear-gradient(180deg, #10b981, #34d399);
          display: block;
        }
        .vbar-interest {
          background: linear-gradient(180deg, #f59e0b, #fbbf24);
          display: block;
        }
        .vlabel {
          font-size: 10px;
          color: #64748b;
          margin-top: 6px;
          line-height: 1;
          direction: ltr !important;
          unicode-bidi: bidi-override;
        }

        .chart-legend {
          display: flex;
          gap: 20px;
          margin-top: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .chart-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }
        .chart-legend-color {
          width: 14px;
          height: 14px;
          border-radius: 3px;
        }
      </style>
    </head>
    <body style="direction: ${dir}; text-align: ${alignStart};">
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); ${isRTL ? 'flex-direction: row-reverse;' : ''}">
          <div style="text-align: ${alignStart}; ${isRTL ? 'direction: rtl;' : ''}">
            <p style="font-weight: 700; font-size: 18px; margin: 0 0 5px 0;">${t.advisorName}</p>
            <p style="font-size: 14px; opacity: 0.9; margin: 3px 0;">📞 <a href="https://wa.me/972549997711" target="_blank" style="color: white; text-decoration: underline;">${t.advisorPhone}</a></p>
            <p style="font-size: 14px; opacity: 0.9; margin: 3px 0;">✉️ <a href="mailto:${t.advisorEmail}" style="color: white; text-decoration: underline;">${t.advisorEmail}</a></p>
          </div>
          <p style="opacity: 0.9; font-size: 14px; margin: 0;">📅 ${new Date().toLocaleDateString()}</p>
        </div>
        <h1>🏠 Property Budget Pro</h1>
      </div>

      <div class="intro-section">
        <p style="font-size: 16px; font-weight: 500;">${t.greeting}</p>
        <p style="color: #64748b;">${t.intro}</p>
      </div>

      <!-- CTA Section - Prominent placement at the top -->
      <div class="cta-section">
        <h3>${t.ctaTitle}</h3>
        <div class="cta-buttons">
          <a href="https://wa.me/972549997711?text=${encodeURIComponent(`Bonjour ${t.advisorName}, je viens d'utiliser votre simulateur et j'aimerais en discuter.`)}" class="cta-button cta-whatsapp" target="_blank">${t.ctaWhatsApp}</a>
          <a href="mailto:${t.advisorEmail}?subject=${encodeURIComponent(`Question suite à ma simulation`)}" class="cta-button cta-email">${t.ctaEmail}</a>
        </div>
      </div>

      <!-- Basic Information -->
      <div class="section">
        <div class="section-title">📋 ${t.basicInfo}</div>
        ${recipientName ? `
        <div class="row">
          <span class="label">${t.clientName}</span>
          <span class="value">${recipientName}</span>
        </div>
        ` : ''}
        ${recipientPhone ? `
        <div class="row">
          <span class="label">${t.clientPhone}</span>
          <span class="value">${recipientPhone}</span>
        </div>
        ` : ''}
        ${recipientEmail ? `
        <div class="row">
          <span class="label">${t.clientEmail}</span>
          <span class="value">${recipientEmail}</span>
        </div>
        ` : ''}
        <div class="row">
          <span class="label">${t.equity}</span>
          <span class="value">₪ ${inputs.equity}</span>
        </div>
        <div class="row">
          <span class="label">${t.ltv}</span>
          <span class="value">${inputs.ltv} %</span>
        </div>
        <div class="row">
          <span class="label">${t.netIncome}</span>
          <span class="value">₪ ${inputs.netIncome}</span>
        </div>
        <div class="row">
          <span class="label">${t.ratio}</span>
          <span class="value">${inputs.ratio} %</span>
        </div>
        <div class="row">
          <span class="label">${t.age}</span>
          <span class="value">${inputs.age}</span>
        </div>
        <div class="row">
          <span class="label">${t.maxAge}</span>
          <span class="value">${inputs.maxAge}</span>
        </div>
        <div class="row">
          <span class="label">${t.interest}</span>
          <span class="value">${inputs.interest} %</span>
        </div>
      </div>

      <!-- Rental Information -->
      <div class="section section-rental">
        <div class="section-title">🏠 ${t.rentalInfo}</div>
        <div class="row">
          <span class="label">${t.isRented}</span>
          <span class="value">${inputs.isRented ? t.yes : t.no}</span>
        </div>
        ${inputs.budgetCap ? `
        <div class="row">
          <span class="label">${t.budgetCap}</span>
          <span class="value">₪ ${inputs.budgetCap}</span>
        </div>
        ` : ''}
      </div>

      <!-- Expenses -->
      <div class="section section-expenses">
        <div class="section-title">💰 ${t.expensesInfo}</div>
        <div class="row">
          <span class="label">${t.purchaseTax}</span>
          <span class="value">₪ ${formatNumber(results.purchaseTax)}</span>
        </div>
        <div class="row">
          <span class="label">${t.taxProfileLabel}</span>
          <span class="value">${results.taxProfile === 'SINGLE_HOME' ? t.taxProfileSingleHome : t.taxProfileInvestor}</span>
        </div>
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
          <span class="value">₪ ${inputs.otherFee}</span>
        </div>
      </div>

      <!-- Results -->
      <div class="section results-section">
        <div class="section-title">📊 ${t.resultsTitle}</div>
        <div class="row">
          <span class="label">${t.maxProperty}</span>
          <span class="value">₪ ${formatNumber(results.maxPropertyValue)}</span>
        </div>
        <div class="row">
          <span class="label">${t.loanAmount}</span>
          <span class="value">₪ ${formatNumber(results.loanAmount)}</span>
        </div>
        <div class="row">
          <span class="label">${t.actualLTV}</span>
          <span class="value">${results.actualLTV.toFixed(1)} %</span>
        </div>
        <div class="row">
          <span class="label">${t.loanTerm}</span>
          <span class="value">${results.loanTermYears} ${t.years}</span>
        </div>
        <div class="row">
          <span class="label">${t.monthlyPayment}</span>
          <span class="value">₪ ${formatNumber(results.monthlyPayment)}</span>
        </div>
        <div class="row">
          <span class="label">${t.rentIncome}</span>
          <span class="value">₪ ${formatNumber(results.rentIncome)}</span>
        </div>
        <div class="row">
          <span class="label">${t.netPayment}</span>
          <span class="value">₪ ${formatNumber(results.netPayment)}</span>
        </div>
        <div class="row">
          <span class="label">${t.closingCosts}</span>
          <span class="value">₪ ${formatNumber(results.closingCosts)}</span>
        </div>
        <div class="row">
          <span class="label">${t.totalInterest}</span>
          <span class="value">₪ ${formatNumber(results.totalInterest)}</span>
        </div>
        <div class="row">
          <span class="label">${t.totalCost}</span>
          <span class="value">₪ ${formatNumber(results.totalCost)}</span>
        </div>
        <div class="row">
          <span class="label">${t.equityUsed}</span>
          <span class="value">₪ ${formatNumber(results.equityUsed)}</span>
        </div>
        ${results.equityRemaining > 0 ? `
        <div class="row" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 12px; border-radius: 8px; margin-top: 8px;">
          <span class="label" style="color: #047857; font-weight: 600;">${t.equityRemaining}</span>
          <span class="value" style="color: #059669; font-weight: 700;">₪ ${formatNumber(results.equityRemaining)}</span>
        </div>
        ` : ''}
        
        <div class="highlight">
          <div class="row">
            <span class="label" style="font-size: 16px; font-weight: 600;">${t.shekelRatio}</span>
            <span class="value">${results.shekelRatio.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Chart: Loan Balance Over Time (Vertical / email-safe table) -->
      ${yearlyBalanceData && yearlyBalanceData.length > 0 ? `
      <div class="chart-section">
        <div class="chart-title">📉 ${t.chartBalanceTitle}</div>
        ${(() => {
          const CHART_H = 160;
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

      <!-- Chart: Payment Breakdown by Year (Vertical stacked / email-safe table) -->
      ${paymentBreakdownData && paymentBreakdownData.length > 0 ? `
      <div class="chart-section">
        <div class="chart-title">📊 ${t.chartPaymentTitle}</div>
        ${(() => {
          const CHART_H = 160;
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

                    // Interest should be on TOP, principal at the bottom (more intuitive)
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

      <!-- Amortization Summary -->
      <div class="section">
        <div class="section-title">📅 ${t.amortizationInfo}</div>
        <div class="row">
          <span class="label">${t.totalMonths}</span>
          <span class="value">${amortizationSummary.totalMonths}</span>
        </div>
        <div class="amortization-summary">
          <div class="amortization-grid">
            <div class="amortization-item">
              <div class="title">${t.firstPayment} - ${t.principal}</div>
              <div class="amount">₪ ${formatNumber(amortizationSummary.firstPayment.principal)}</div>
            </div>
            <div class="amortization-item">
              <div class="title">${t.firstPayment} - ${t.interestLabel}</div>
              <div class="amount">₪ ${formatNumber(amortizationSummary.firstPayment.interest)}</div>
            </div>
            <div class="amortization-item">
              <div class="title">${t.lastPayment} - ${t.principal}</div>
              <div class="amount">₪ ${formatNumber(amortizationSummary.lastPayment.principal)}</div>
            </div>
            <div class="amortization-item">
              <div class="title">${t.lastPayment} - ${t.interestLabel}</div>
              <div class="amount">₪ ${formatNumber(amortizationSummary.lastPayment.interest)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section - Bottom reminder -->
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

      <div class="note" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-color: #f59e0b; margin-top: 12px;">
        ⚠️ ${t.taxDisclaimer}
      </div>

      <div class="footer">
        <p>${t.footer}</p>
        <p>© ${new Date().getFullYear()}</p>
      </div>
    </body>
    </html>
  `;

  return { subject: t.subject, html };
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
    console.log("Received validated request for email to:", data.recipientEmail);
    console.log("Chart data received - yearlyBalanceData:", data.yearlyBalanceData?.length || 0, "items");
    console.log("Chart data received - paymentBreakdownData:", data.paymentBreakdownData?.length || 0, "items");

    const { subject, html } = getEmailContent(data);

    // Try to send to client from verified domain
    // If the domain isn't verified yet, fallback to advisor-only so the app doesn't break.
    const primaryRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Property Budget Pro <noreply@eshel-f.com>",
        to: [data.recipientEmail],
        bcc: [ADVISOR_EMAIL],
        subject,
        html,
      }),
    });

    if (!primaryRes.ok) {
      const errorText = await primaryRes.text();
      console.error("Primary email send failed:", primaryRes.status, errorText);

      const isDomainNotVerified =
        primaryRes.status === 403 &&
        errorText.toLowerCase().includes("domain is not verified");

      if (!isDomainNotVerified) {
        throw new Error(errorText);
      }

      // Fallback: send to advisor only using Resend test sender
      const fallbackRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Property Budget Pro <onboarding@resend.dev>",
          to: [ADVISOR_EMAIL],
          subject: `🔔 Nouvelle simulation - ${data.recipientName} (${data.recipientEmail})`,
          html,
        }),
      });

      if (!fallbackRes.ok) {
        const fallbackError = await fallbackRes.text();
        console.error(
          "Fallback advisor-only email send failed:",
          fallbackRes.status,
          fallbackError
        );
        throw new Error(fallbackError);
      }

      const fallbackResponse = await fallbackRes.json();
      console.log(
        "Fallback email sent to advisor (domain not verified):",
        fallbackResponse
      );

      return new Response(
        JSON.stringify({
          deliveredToClient: false,
          deliveredToAdvisor: true,
          reason: "domain_not_verified",
          resend: fallbackResponse,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await primaryRes.json();
    console.log("Email sent successfully to client:", data.recipientEmail, emailResponse);

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
    console.error("Error in send-report-email function:", error);
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
