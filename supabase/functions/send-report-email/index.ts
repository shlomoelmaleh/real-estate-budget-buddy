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
  language: 'he' | 'en' | 'fr';
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
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function getEmailContent(data: ReportEmailRequest): { subject: string; html: string } {
  const { language, recipientName, results } = data;
  
  const texts = {
    he: {
      subject: 'דוח מחשבון תקציב רכישת נכס',
      greeting: `שלום ${recipientName},`,
      intro: 'להלן סיכום החישוב שביצעת:',
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
      footer: 'Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן'
    },
    en: {
      subject: 'Property Budget Calculator Report',
      greeting: `Hello ${recipientName},`,
      intro: 'Here is a summary of your calculation:',
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
      footer: 'Property Budget Pro - Professional Real Estate Planning Tool'
    },
    fr: {
      subject: 'Rapport du Simulateur Budget Immobilier',
      greeting: `Bonjour ${recipientName},`,
      intro: 'Voici le résumé de votre calcul:',
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
      footer: 'Property Budget Pro - Outil Professionnel de Planification Immobilière'
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
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #0ea5e9, #2563eb);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin-bottom: 20px;
        }
        .content {
          background: #f8fafc;
          padding: 20px;
          border-radius: 10px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: 500;
          color: #64748b;
        }
        .value {
          font-weight: 600;
          color: #0f172a;
        }
        .highlight {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #94a3b8;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Property Budget Pro</h1>
      </div>
      <div class="content">
        <p>${t.greeting}</p>
        <p>${t.intro}</p>
        
        <div class="row">
          <span class="label">${t.maxProperty}</span>
          <span class="value">₪${formatNumber(results.maxPropertyValue)}</span>
        </div>
        <div class="row">
          <span class="label">${t.loanAmount}</span>
          <span class="value">₪${formatNumber(results.loanAmount)}</span>
        </div>
        <div class="row">
          <span class="label">${t.actualLTV}</span>
          <span class="value">${results.actualLTV.toFixed(1)}%</span>
        </div>
        <div class="row">
          <span class="label">${t.loanTerm}</span>
          <span class="value">${results.loanTermYears} ${t.years}</span>
        </div>
        <div class="row">
          <span class="label">${t.monthlyPayment}</span>
          <span class="value">₪${formatNumber(results.monthlyPayment)}</span>
        </div>
        <div class="row">
          <span class="label">${t.rentIncome}</span>
          <span class="value">₪${formatNumber(results.rentIncome)}</span>
        </div>
        <div class="row">
          <span class="label">${t.netPayment}</span>
          <span class="value">₪${formatNumber(results.netPayment)}</span>
        </div>
        <div class="row">
          <span class="label">${t.closingCosts}</span>
          <span class="value">₪${formatNumber(results.closingCosts)}</span>
        </div>
        <div class="row">
          <span class="label">${t.totalInterest}</span>
          <span class="value">₪${formatNumber(results.totalInterest)}</span>
        </div>
        <div class="row">
          <span class="label">${t.totalCost}</span>
          <span class="value">₪${formatNumber(results.totalCost)}</span>
        </div>
        
        <div class="highlight">
          <div class="row" style="border: none;">
            <span class="label" style="font-size: 16px;">${t.shekelRatio}</span>
            <span class="value" style="font-size: 18px; color: #d97706;">${results.shekelRatio.toFixed(2)}</span>
          </div>
        </div>
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
