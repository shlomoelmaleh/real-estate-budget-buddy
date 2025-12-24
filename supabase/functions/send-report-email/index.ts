import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportEmailRequest {
  recipientEmail: string;
  recipientName: string;
  recipientPhone: string;
  language: 'he' | 'en' | 'fr';
  inputs: {
    equity: string;
    ltv: string;
    netIncome: string;
    ratio: string;
    age: string;
    maxAge: string;
    interest: string;
    isRented: boolean;
    rentalYield: string;
    rentRecognition: string;
    budgetCap: string;
    purchaseTaxMode: 'percent' | 'fixed';
    purchaseTaxPercent: string;
    purchaseTaxFixed: string;
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
  };
  amortizationSummary: {
    totalMonths: number;
    firstPayment: { principal: number; interest: number };
    lastPayment: { principal: number; interest: number };
  };
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function getEmailContent(data: ReportEmailRequest): { subject: string; html: string } {
  const { language, recipientName, recipientPhone, recipientEmail, inputs, results, amortizationSummary } = data;
  
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
      purchaseTax: 'מס רכישה',
      lawyer: 'עו"ד',
      broker: 'תיווך',
      vat: 'מע"מ',
      advisor: 'יועץ משכנתא',
      other: 'שונות',
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
      // Amortization
      amortizationInfo: 'סיכום לוח סילוקין',
      totalMonths: 'סה"כ חודשים',
      firstPayment: 'תשלום ראשון',
      lastPayment: 'תשלום אחרון',
      principal: 'קרן',
      interestLabel: 'ריבית',
      footer: 'Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן',
      note: 'הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.',
      advisorName: 'שלמה אלמליח',
      advisorPhone: '054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com'
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
      purchaseTax: 'Purchase Tax',
      lawyer: 'Lawyer',
      broker: 'Broker',
      vat: 'VAT',
      advisor: 'Mortgage Advisor',
      other: 'Other Costs',
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
      amortizationInfo: 'Amortization Summary',
      totalMonths: 'Total Months',
      firstPayment: 'First Payment',
      lastPayment: 'Last Payment',
      principal: 'Principal',
      interestLabel: 'Interest',
      footer: 'Property Budget Pro - Professional Real Estate Planning Tool',
      note: 'This simulation is for illustrative purposes only and does not constitute a binding offer. Final rates and terms are subject to lender approval.',
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com'
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
      purchaseTax: "Taxe d'acquisition",
      lawyer: 'Avocat',
      broker: "Frais d'agence",
      vat: 'TVA',
      advisor: 'Courtier',
      other: 'Divers',
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
      amortizationInfo: "Résumé du Tableau d'Amortissement",
      totalMonths: 'Total Mois',
      firstPayment: 'Premier Paiement',
      lastPayment: 'Dernier Paiement',
      principal: 'Capital',
      interestLabel: 'Intérêts',
      footer: 'Property Budget Pro - Outil Professionnel de Planification Immobilière',
      note: "Cette simulation est fournie à titre indicatif uniquement et ne constitue pas une offre contractuelle. Les taux et conditions définitifs dépendent de l'organisme prêteur.",
      advisorName: 'Shlomo Elmaleh',
      advisorPhone: '+972-054-9997711',
      advisorEmail: 'shlomo.elmaleh@gmail.com'
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
      </style>
    </head>
    <body style="direction: ${dir}; text-align: ${alignStart};">
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.2); ${isRTL ? 'flex-direction: row-reverse;' : ''}">
          <div style="text-align: ${alignStart}; ${isRTL ? 'direction: rtl;' : ''}">
            <p style="font-weight: 700; font-size: 18px; margin: 0 0 5px 0;">${t.advisorName}</p>
            <p style="font-size: 14px; opacity: 0.9; margin: 3px 0;">📞 ${t.advisorPhone}</p>
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
        ${inputs.isRented ? `
        <div class="row">
          <span class="label">${t.rentalYield}</span>
          <span class="value">${inputs.rentalYield} %</span>
        </div>
        <div class="row">
          <span class="label">${t.rentRecognition}</span>
          <span class="value">${inputs.rentRecognition} %</span>
        </div>
        ` : ''}
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
          <span class="value">${inputs.purchaseTaxMode === 'percent' ? inputs.purchaseTaxPercent + ' %' : '₪ ' + inputs.purchaseTaxFixed}</span>
        </div>
        <div class="row">
          <span class="label">${t.lawyer}</span>
          <span class="value">${inputs.lawyerPct} %</span>
        </div>
        <div class="row">
          <span class="label">${t.broker}</span>
          <span class="value">${inputs.brokerPct} %</span>
        </div>
        <div class="row">
          <span class="label">${t.vat}</span>
          <span class="value">${inputs.vatPct} %</span>
        </div>
        <div class="row">
          <span class="label">${t.advisor}</span>
          <span class="value">₪ ${inputs.advisorFee}</span>
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
        
        <div class="highlight">
          <div class="row">
            <span class="label" style="font-size: 16px; font-weight: 600;">${t.shekelRatio}</span>
            <span class="value">${results.shekelRatio.toFixed(2)}</span>
          </div>
        </div>
      </div>

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

  return { subject: t.subject, html };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-report-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ReportEmailRequest = await req.json();
    console.log("Received request for email to:", data.recipientEmail);

    const { subject, html } = getEmailContent(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Property Budget Pro <onboarding@resend.dev>",
        to: [data.recipientEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
