
import { CalculatorResults } from './calculator';

// Types adapted from the Edge Function
interface EmailPreviewData {
    language: 'he' | 'en' | 'fr';
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
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
    results: CalculatorResults;
    amortizationSummary: {
        totalMonths: number;
        firstPayment: { principal: number; interest: number };
        lastPayment: { principal: number; interest: number };
    };
}

// Format helper
const formatNumber = (num: number): string => {
    return Math.round(num).toLocaleString('en-US');
};

export function generateEmailHtml(data: EmailPreviewData): string {
    const {
        language,
        recipientName,
        recipientPhone,
        recipientEmail,
        inputs,
        results,
        amortizationSummary,
    } = data;

    // Parse income for DTI calculation
    const parseNumber = (str: string): number => {
        if (!str) return 0;
        return parseFloat(str.replace(/,/g, '')) || 0;
    };

    const incomeNet = parseNumber(inputs.netIncome);
    const monthlyPayment = results.monthlyPayment;
    const equityInitial = parseNumber(inputs.equity);
    const equityRemaining = results.equityRemaining;

    // Normalize DTI max allowed
    let dtiMaxAllowedRaw = parseFloat(inputs.ratio) || 0;
    const dtiMaxAllowed = dtiMaxAllowedRaw > 1 ? dtiMaxAllowedRaw / 100 : dtiMaxAllowedRaw;

    // Calculate estimated DTI
    const dtiEstimated = incomeNet > 0 ? monthlyPayment / incomeNet : null;
    const thresholdDelta = 0.01;

    const texts = {
        he: {
            direction: 'rtl',
            subject: "דוח מחשבון תקציב רכישת נכס",
            heroTitle: 'סיכום פרויקט הנדל"ן שלך',
            clientInfoTitle: "פרטי הלקוח",
            clientName: "שם",
            clientPhone: "טלפון",
            clientEmail: "אימייל",
            maxPropertyLabel: "שווי נכס מקסימלי",
            limitingFactorLabel: "גורם מגביל לתקציב",
            limitingCash: "מוגבל לפי ההון העצמי (Cash)",
            limitingIncome: "מוגבל לפי הכנסה (יחס החזר)",
            limitingComfortable: "פרופיל נוח (מרווח זמין)",
            limitingInsufficient: "נתונים חסרים (לאימות)",
            fundingTitle: "פירוט מימון",
            loanAmount: "סכום משכנתא",
            equityOnProperty: "הון עצמי על הנכס",
            fundingNote: "הלוואה + הון עצמי = מחיר הנכס",
            transactionTitle: "פירוט עלויות רכישה",
            purchaseTax: "מס רכישה",
            lawyerLabel: 'עו"ד (1% + מע"מ)',
            brokerLabel: 'תיווך (2% + מע"מ)',
            other: "שונות",
            transactionTotal: "סך עלויות רכישה",
            taxDisclaimer: 'מס רכישה מחושב לפי מדרגות סטנדרטיות בלבד; הטבות מיוחדות לא נכללות. יש לאמת עם עו"ד.',
            ttc: 'כולל מע"מ',
            cashTitle: "סיכום הון עצמי",
            capitalAllocated: "הון עצמי בשימוש",
            liquidBuffer: "יתרת הון עצמי (Cash)",
            cashNote: "הערכת יתרת המזומנים לאחר רכישה + עלויות.",
            feasibilityTitle: "ניתוח היתכנות",
            ltvRatio: "יחס מימון (LTV)",
            dtiMaxLabel: "יחס החזר מקסימלי",
            dtiEstimatedLabel: "יחס החזר משוער",
            notAvailable: "לא זמין",
            amortizationSummaryTitle: "סיכום לוח סילוקין",
            loanTermLabel: "משך ההלוואה",
            monthlyPaymentLabel: "תשלום חודשי משוער",
            totalInterestLabel: 'סה"כ ריבית',
            totalRepaidLabel: 'סה"כ להחזר',
            firstPaymentLabel: "תשלום ראשון",
            lastPaymentLabel: "תשלום אחרון",
            amortizationNote: "טיפ: הסכום הסופי תלוי במידה רבה בריבית ובמשך ההלוואה – ייעול המימון יכול להפחית אותו.",
            assumptionsTitle: "פרמטרים לסימולציה",
            age: "גיל לווה",
            citizenship: "אזרחות ישראלית",
            taxResident: "תושב מס",
            firstProperty: "נכס ראשון",
            netIncome: "הכנסה פנויה",
            interestRate: "ריבית שנתית",
            loanTerm: "משך ההלוואה",
            years: "שנים",
            yes: "כן",
            no: "לא",
            ctaTitle: "יש לך שאלות? אני כאן לעזור!",
            ctaWhatsApp: "📞 לקביעת פגישה",
            ctaEmail: "✉️ לשאלות נוספות",
            footer: "Property Budget Pro - כלי מקצועי לתכנון רכישת נדל״ן",
            note: "הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.",
            advisorName: "שלמה אלמליח",
            advisorPhone: "054-9997711",
            advisorEmail: "shlomo.elmaleh@gmail.com",
        },
        en: {
            direction: 'ltr',
            subject: "Property Budget Calculator - Complete Report",
            heroTitle: "Your Property Project Summary",
            clientInfoTitle: "Client Information",
            clientName: "Name",
            clientPhone: "Phone",
            clientEmail: "Email",
            maxPropertyLabel: "Max Property Value",
            limitingFactorLabel: "Budget Limiting Factor",
            limitingCash: "Limited by Equity (Cash)",
            limitingIncome: "Limited by Income (DTI)",
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
            other: "Other",
            transactionTotal: "Total Transaction Costs",
            taxDisclaimer: "Tax calculated using standard brackets only; special exemptions not included. Verify with attorney.",
            ttc: "incl. VAT",
            cashTitle: "Equity Summary",
            capitalAllocated: "Total Capital Allocated",
            liquidBuffer: "Liquid Safety Buffer",
            cashNote: "Estimated cash remaining after purchase + costs.",
            feasibilityTitle: "Feasibility Analysis",
            ltvRatio: "LTV Ratio",
            dtiMaxLabel: "Max DTI Allowed",
            dtiEstimatedLabel: "Estimated DTI",
            notAvailable: "N/A",
            amortizationSummaryTitle: "Amortization Summary",
            loanTermLabel: "Loan Term",
            monthlyPaymentLabel: "Estimated Monthly Payment",
            totalInterestLabel: "Total Interest",
            totalRepaidLabel: "Total Repaid",
            firstPaymentLabel: "First Payment",
            lastPaymentLabel: "Last Payment",
            amortizationNote: "Quick read: this total depends heavily on the rate and term — optimizing the structure can reduce it.",
            assumptionsTitle: "Simulation Assumptions",
            age: "Borrower Age",
            citizenship: "Israeli Citizenship",
            taxResident: "Tax Resident",
            firstProperty: "First Property",
            netIncome: "Net Income",
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
            advisorName: "Shlomo Elmaleh",
            advisorPhone: "+972-054-9997711",
            advisorEmail: "shlomo.elmaleh@gmail.com",
        },
        fr: {
            direction: 'ltr',
            subject: "Simulateur Budget Immobilier - Rapport Complet",
            heroTitle: "Synthèse de votre projet immobilier",
            clientInfoTitle: "Coordonnées du client",
            clientName: "Nom",
            clientPhone: "Téléphone",
            clientEmail: "Email",
            maxPropertyLabel: "Valeur Max du Bien",
            limitingFactorLabel: "Facteur déterminant du budget",
            limitingCash: "Limité par l'apport (Cash)",
            limitingIncome: "Limité par la mensualité (Revenus)",
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
            other: "Divers",
            transactionTotal: "Total des frais de transaction",
            taxDisclaimer: "Barèmes standards uniquement ; exonérations non incluses. Vérifiez auprès d'un avocat.",
            ttc: "T.T.C",
            cashTitle: "Bilan des fonds propres",
            capitalAllocated: "Capital total mobilisé",
            liquidBuffer: "Réserve de sécurité (cash)",
            cashNote: "Estimation du cash restant sur votre compte après achat + frais.",
            feasibilityTitle: "Analyse de faisabilité",
            ltvRatio: "Ratio LTV",
            dtiMaxLabel: "DTI Max autorisé",
            dtiEstimatedLabel: "DTI Estimé",
            notAvailable: "N/A",
            amortizationSummaryTitle: "Résumé du tableau d'amortissement",
            loanTermLabel: "Durée du prêt",
            monthlyPaymentLabel: "Mensualité estimée",
            totalInterestLabel: "Total des intérêts",
            totalRepaidLabel: "Montant total remboursé",
            firstPaymentLabel: "Première mensualité",
            lastPaymentLabel: "Dernière mensualité",
            amortizationNote: "Lecture rapide : ce total dépend fortement du taux et de la durée — l'optimisation du montage peut le réduire.",
            assumptionsTitle: "Hypothèses de la simulation",
            age: "Âge de l'emprunteur",
            citizenship: "Nationalité israélienne",
            taxResident: "Résident fiscal",
            firstProperty: "Premier bien",
            netIncome: "Revenu Net",
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
            advisorName: "Shlomo Elmaleh",
            advisorPhone: "+972-054-9997711",
            advisorEmail: "shlomo.elmaleh@gmail.com",
        },
    };

    const t = texts[language];
    const dir = t.direction;
    const isRTL = dir === 'rtl';
    const alignStart = isRTL ? 'right' : 'left';
    const alignEnd = isRTL ? 'left' : 'right';

    // Compute limiting factor
    let limitingFactor: string;
    const hasCriticalData = equityInitial > 0 && incomeNet > 0 && monthlyPayment > 0;

    if (!hasCriticalData) {
        limitingFactor = t.limitingInsufficient;
    } else if (equityRemaining <= 0.01 * equityInitial) {
        limitingFactor = t.limitingCash;
    } else if (dtiMaxAllowed > 0 && dtiEstimated !== null && dtiEstimated >= dtiMaxAllowed - thresholdDelta) {
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
      <style>
        * { direction: ${dir} !important; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          line-height: 1.6;
          color: #1e293b;
          max-width: 100%;
          margin: 0;
          padding: 16px;
          background: #ffffff;
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
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.15);
        }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
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
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 14px;
          border: 1px solid #e2e8f0;
          text-align: ${alignStart} !important;
          direction: ${dir} !important;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
          ${isRTL ? "flex-direction: row-reverse; justify-content: flex-end;" : ""}
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          direction: ${dir} !important;
          ${isRTL ? "flex-direction: row-reverse;" : ""}
        }
        .row:last-child { border-bottom: none; }
        .label {
          color: #64748b;
          font-size: 13px;
          text-align: ${alignStart};
        }
        .value {
          font-weight: 600;
          color: #0f172a;
          font-size: 14px;
          text-align: ${alignEnd};
        }
        
        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #34d399;
          border-${alignStart}: 6px solid #10b981;
          text-align: center;
          padding: 20px;
        }
        .hero-section .section-title {
          justify-content: center;
          color: #047857;
          border-bottom: none;
        }
        .hero-value {
          font-size: 28px;
          font-weight: 800;
          color: #059669;
          margin: 8px 0;
        }
        .hero-factor {
          background: rgba(255,255,255,0.6);
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 10px;
          font-size: 12px;
          color: #92400e;
          display: inline-block;
        }
        
        /* Funding Section */
        .funding-section { border-${alignStart}: 4px solid #3b82f6; }
        .funding-note {
          background: #f0f9ff;
          border-radius: 6px;
          padding: 8px;
          margin-top: 8px;
          font-size: 11px;
          color: #1e40af;
          text-align: center;
        }
        
        /* Transaction Section */
        .transaction-section { border-${alignStart}: 4px solid #f59e0b; }
        .tax-disclaimer {
          font-size: 10px;
          font-style: italic;
          color: #9a3412;
          margin-top: 4px;
        }
        .total-row {
          background: #fffbeb;
          border-radius: 6px;
          margin-top: 8px;
          padding: 10px !important;
        }
        .total-row .label { color: #92400e; font-weight: 600; }
        .total-row .value { color: #d97706; font-weight: 700; }
        
        /* Cash Section */
        .cash-section { border-${alignStart}: 4px solid #10b981; }
        .buffer-row {
          background: #ecfdf5;
          border-radius: 6px;
          padding: 10px !important;
          margin-top: 6px;
        }
        .buffer-row .label { color: #047857; font-weight: 600; }
        .buffer-row .value { color: #059669; font-weight: 700; }
        
        /* Feasibility Section */
        .feasibility-section { border-${alignStart}: 4px solid #8b5cf6; }
        
        /* Footer */
        .footer {
          text-align: center;
          margin-top: 20px;
          padding: 16px;
          color: #64748b;
          font-size: 11px;
          background: #f8fafc;
          border-radius: 10px;
        }
        .advisor-link {
          display: inline-block;
          margin-top: 8px;
          color: #1e40af;
          text-decoration: none;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${t.heroTitle}</h1>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">Property Budget Pro</div>
      </div>
      
      <div class="header-info">
        <div>
          <p><strong>${t.clientInfoTitle}</strong></p>
          <p>${recipientName} | ${recipientPhone}</p>
          <p>${recipientEmail}</p>
        </div>
        <div style="text-align: ${alignEnd};">
          <p>${new Date().toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}</p>
          <p><strong>${t.advisorName}</strong></p>
        </div>
      </div>
      
      <!-- HERO -->
      <div class="section hero-section">
        <div class="section-title">${t.maxPropertyLabel}</div>
        <div class="hero-value">${formatNumber(results.maxPropertyValue)} ₪</div>
        <div class="hero-factor">
          <span style="font-weight: 600;">${t.limitingFactorLabel}:</span><br>
          ${limitingFactor}
        </div>
      </div>
      
      <!-- FUNDING -->
      <div class="section funding-section">
        <div class="section-title">${t.fundingTitle}</div>
        <div class="row">
          <span class="label">${t.loanAmount}</span>
          <span class="value">${formatNumber(results.loanAmount)} ₪</span>
        </div>
        <div class="row">
          <span class="label">${t.equityOnProperty}</span>
          <span class="value">${formatNumber(equityOnProperty)} ₪</span>
        </div>
        <div class="funding-note">${t.fundingNote}</div>
      </div>
      
      <!-- TRANSACTION -->
      <div class="section transaction-section">
        <div class="section-title">${t.transactionTitle}</div>
        <div class="row">
          <span class="label">${t.purchaseTax}</span>
          <span class="value">${formatNumber(results.purchaseTax)} ₪</span>
        </div>
        <div class="tax-disclaimer">${t.taxDisclaimer}</div>
        <div class="row">
          <span class="label">${t.lawyerLabel}</span>
          <span class="value">${formatNumber(results.lawyerFeeTTC)} ₪</span>
        </div>
        <div class="row">
          <span class="label">${t.brokerLabel}</span>
          <span class="value">${formatNumber(results.brokerFeeTTC)} ₪</span>
        </div>
        <div class="row total-row">
          <span class="label">${t.transactionTotal}</span>
          <span class="value">${formatNumber(results.closingCosts)} ₪</span>
        </div>
      </div>
      
      <!-- CASH -->
      <div class="section cash-section">
        <div class="section-title">${t.cashTitle}</div>
        <div class="row">
          <span class="label">${t.capitalAllocated}</span>
          <span class="value">${formatNumber(results.equityUsed)} ₪</span>
        </div>
        <div class="row buffer-row">
          <span class="label">${t.liquidBuffer}</span>
          <span class="value">${formatNumber(results.equityRemaining)} ₪</span>
        </div>
        <div class="funding-note" style="background:none; text-align:${alignStart}; margin:5px 0 0 0; padding:0; color:#64748b;">${t.cashNote}</div>
      </div>
      
      <!-- FEASIBILITY -->
      <div class="section feasibility-section">
        <div class="section-title">${t.feasibilityTitle}</div>
        <div class="row">
          <span class="label">${t.ltvRatio}</span>
          <span class="value">${results.actualLTV.toFixed(1)}%</span>
        </div>
        <div class="row">
          <span class="label">${t.dtiMaxLabel}</span>
          <span class="value">${(dtiMaxAllowed * 100).toFixed(1)}%</span>
        </div>
        <div class="row">
          <span class="label">${t.dtiEstimatedLabel}</span>
          <span class="value">${dtiEstimatedDisplay}</span>
        </div>
      </div>
      
      <!-- AMORTIZATION -->
      <div class="section">
        <div class="section-title">${t.amortizationSummaryTitle}</div>
        <div class="row">
          <span class="label">${t.loanTermLabel}</span>
          <span class="value">${results.loanTermYears} ${t.years}</span>
        </div>
        <div class="row">
          <span class="label">${t.monthlyPaymentLabel}</span>
          <span class="value">${formatNumber(results.monthlyPayment)} ₪</span>
        </div>
        <div class="row">
          <span class="label">${t.totalInterestLabel}</span>
          <span class="value">${formatNumber(results.totalInterest)} ₪</span>
        </div>
      </div>
      
      <div class="footer">
        <p>${t.footer}</p>
        <p style="font-size: 10px; opacity: 0.8; margin-top: 6px;">${t.note}</p>
        <p style="margin-top: 14px;">
          <a href="mailto:${t.advisorEmail}" class="advisor-link">${t.ctaEmail}</a>
          &nbsp; • &nbsp; 
          <a href="https://wa.me/972549997711" class="advisor-link">${t.ctaWhatsApp}</a>
        </p>
      </div>
    </body>
    </html>
  `;

    return html;
}
