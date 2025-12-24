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
      note: 'הערה: דוח זה מהווה הערכה בלבד ואינו מחייב'
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
      note: 'Note: This report is an estimate only and is not binding'
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
      note: "Note: Ce rapport est une estimation et n'est pas contractuel"
    }
  };

  const t = texts[language];
  const dir = language === 'he' ? 'rtl' : 'ltr';

  const html = `
    <!DOCTYPE html>
    <html dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background: #f8fafc;
        }
        .header {
          background: linear-gradient(135deg, #1e40af, #0ea5e9);
          color: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 25px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0 0;
          opacity: 0.9;
        }
        .section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 15px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          gap: 20px;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          color: #64748b;
          font-size: 14px;
          flex-shrink: 0;
        }
        .value {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
          text-align: ${language === 'he' ? 'left' : 'right'};
          margin-${language === 'he' ? 'right' : 'left'}: 20px;
        }
        .results-section {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid #86efac;
        }
        .highlight {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .highlight .row {
          border: none;
        }
        .highlight .value {
          font-size: 20px;
          color: #d97706;
        }
        .amortization-summary {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .amortization-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .amortization-item {
          text-align: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
        }
        .amortization-item .title {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 5px;
        }
        .amortization-item .amount {
          font-weight: 600;
          color: #0f172a;
        }
        .footer {
          text-align: center;
          margin-top: 25px;
          color: #94a3b8;
          font-size: 12px;
        }
        .note {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
          font-size: 12px;
          color: #9a3412;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Property Budget Pro</h1>
        <p>${new Date().toLocaleDateString()}</p>
      </div>

      <div class="section">
        <p>${t.greeting}</p>
        <p>${t.intro}</p>
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
      <div class="section">
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
      <div class="section">
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
