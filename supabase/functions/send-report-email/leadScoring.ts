/**
 * LEAD SCORING MODULE
 * ===================
 * Extracted from send-report-email/index.ts for maintainability.
 * Contains: calculateLeadScore, calculateBonusPower, getLimitingFactorDescription
 */

export interface LeadInputs {
    netIncome: string;
    equity: string;
    age: string;
    [key: string]: unknown;
}

export interface LeadResults {
    maxPropertyValue: number;
    monthlyPayment: number;
    equityRemaining: number;
    [key: string]: unknown;
}

export interface LeadScoreResult {
    score: number;
    priorityLabel: string;
    priorityColor: string;
    actionSla: string;
    predictedTimeline: string;
    breakdown: {
        budget: number;
        health: number;
        readiness: number;
        age: number;
        liquidity: number;
    };
}

// Elite 5-Tier Scoring System
export function calculateLeadScore(
    inputs: LeadInputs,
    results: LeadResults,
    lang: 'he' | 'en' | 'fr' = 'en'
): LeadScoreResult {
    let budgetScore = 0;
    let healthScore = 0;
    let readinessScore = 0;
    let ageScore = 0;
    let liquidityScore = 0;

    const maxBudget = results.maxPropertyValue;
    const netIncome = parseFloat(inputs.netIncome.replace(/,/g, '')) || 0;
    const monthlyPayment = results.monthlyPayment;
    const equityRemaining = results.equityRemaining;
    const equityInitial = parseFloat(inputs.equity.replace(/,/g, '')) || 0;
    const age = parseFloat(inputs.age) || 40;

    // 1. Budget Size (Max 35 pts)
    if (maxBudget > 5000000) budgetScore = 35;
    else if (maxBudget > 3000000) budgetScore = 25;
    else if (maxBudget > 1500000) budgetScore = 15;

    // 2. Financial Health (Max 25 pts) - DTI = (monthlyPayment / netIncome) * 100
    const dti = netIncome > 0 ? (monthlyPayment / netIncome) * 100 : 100;
    if (dti < 30) healthScore = 25;
    else if (dti <= 35) healthScore = 15;

    // 3. Readiness (Max 25 pts)
    if (equityInitial >= 400000) readinessScore = 25;
    else if (equityInitial >= 200000) readinessScore = 15;

    // 4. Age Factor (Max 10 pts)
    if (age < 35) ageScore = 10;

    // 5. Liquidity Bonus (Max 15 pts)
    if (equityRemaining > 200000) liquidityScore = 15;

    // Total Score
    const score = Math.min(100, budgetScore + healthScore + readinessScore + ageScore + liquidityScore);

    // Determine Tier & Action
    let priorityLabel = lang === 'he' ? '❄️ קר' : lang === 'fr' ? '❄️ FROID' : '❄️ COLD';
    let priorityColor = '#94a3b8'; // Slate
    let actionSla = lang === 'he' ? 'הוספה לניוזלטר ארוך טווח.' : lang === 'fr' ? 'Ajouter à la newsletter.' : "Add to long-term newsletter.";
    let predictedTimeline = lang === 'he' ? '3-6 חודשים (שלב תכנון)' : lang === 'fr' ? '3-6 mois (Planification)' : '3-6 months (Planning phase)';

    if (score >= 85) {
        priorityLabel = lang === 'he' ? '💎 פלטינום' : lang === 'fr' ? '💎 PLATINE' : '💎 PLATINUM';
        priorityColor = '#7c3aed'; // Violet/Purple
        actionSla = lang === 'he' ? 'להתקשר תוך שעה אחת.' : lang === 'fr' ? 'Appeler d\'ici 1 heure.' : "Call within 1 hour.";
        predictedTimeline = lang === 'he' ? '1-2 שבועות (מוכנים לתנועה)' : lang === 'fr' ? '1-2 semaines (Prêt)' : '1-2 weeks (Ready to move)';
    } else if (score >= 70) {
        priorityLabel = lang === 'he' ? '🔥 חם' : lang === 'fr' ? '🔥 CHAUD' : '🔥 HOT';
        priorityColor = '#ef4444'; // Red
        actionSla = lang === 'he' ? 'להתקשר תוך 4 שעות.' : lang === 'fr' ? 'Appeler d\'ici 4 heures.' : "Call within 4 hours.";
        predictedTimeline = lang === 'he' ? '1-2 חודשים (חיפוש פעיל)' : lang === 'fr' ? '1-2 mois (Recherche active)' : '1-2 months (Active search)';
    } else if (score >= 50) {
        priorityLabel = lang === 'he' ? '☀️ חמים' : lang === 'fr' ? '☀️ CHALEUREUX' : '☀️ WARM';
        priorityColor = '#f59e0b'; // Amber
        actionSla = lang === 'he' ? 'להתקשר תוך 24 שעות.' : lang === 'fr' ? 'Appeler d\'ici 24 heures.' : "Call within 24 hours.";
        predictedTimeline = lang === 'he' ? '1-2 חודשים (חיפוש פעיל)' : lang === 'fr' ? '1-2 mois (Recherche active)' : '1-2 months (Active search)';
    } else if (score >= 30) {
        priorityLabel = lang === 'he' ? '🌤️ קריר' : lang === 'fr' ? '🌤️ FRAIS' : '🌤️ COOL';
        priorityColor = '#3b82f6'; // Blue
        actionSla = lang === 'he' ? 'מעקב במייל.' : lang === 'fr' ? 'Suivi par e-mail.' : "Email follow-up.";
        predictedTimeline = lang === 'he' ? '3-6 חודשים (שלב תכנון)' : lang === 'fr' ? '3-6 mois (Planification)' : '3-6 months (Planning phase)';
    }

    return {
        score,
        priorityLabel,
        priorityColor,
        actionSla,
        predictedTimeline,
        breakdown: {
            budget: budgetScore,
            health: healthScore,
            readiness: readinessScore,
            age: ageScore,
            liquidity: liquidityScore
        }
    };
}

export function calculateBonusPower(
    monthlyPayment: number,
    interestRate: number,
    years: number
): number {
    if (interestRate <= 0 || years <= 0) return 0;
    const additional = 500;
    const r = interestRate / 100 / 12;
    const n = years * 12;
    // PV of annuity: PV = Pmt * (1 - (1+r)^-n) / r
    const addedLoan = additional * (1 - Math.pow(1 + r, -n)) / r;
    return Math.round(addedLoan);
}

export function getLimitingFactorDescription(factor: string | undefined, lang: 'he' | 'en' | 'fr' = 'en'): string {
    const isHE = lang === 'he';
    const isFR = lang === 'fr';

    const prefix = isHE ? 'ניתוח: ' : isFR ? 'Analyse : ' : 'Analysis: ';

    switch (factor) {
        case 'INCOME_LIMIT':
            return prefix + (isHE
                ? "לקוח זה הגיע ליכולת ההחזר המקסימלית שלו ביחס להכנסה. הם יכלו להרשות לעצמם בית יקר יותר אם היה להם לווה נוסף או הכנסה גבוהה יותר, שכן עדיין יש להם מזומנים פנויים."
                : isFR
                    ? "Ce client a atteint sa capacité de remboursement maximale par rapport à ses revenus. Il pourrait se permettre un bien plus cher avec un co-emprunteur ou des revenus plus élevés, car il dispose encore de liquidités."
                    : "This client has reached their maximum repayment capacity based on their income. They could afford a more expensive home if they had a co-signer or higher income, as they still have excess cash available.");
        case 'EQUITY_LIMIT':
            return prefix + (isHE
                ? "הלקוח מוגבל על ידי המזומנים הזמינים למקדמה ועלויות סגירה. ההכנסה שלהם יכלה לתמוך בהלוואה גבוהה יותר, אך חסר להם ההון הראשוני."
                : isFR
                    ? "Le client est limité par son apport personnel pour l'acompte et les frais de clôture. Ses revenus permettraient un prêt plus élevé, mais il manque de capital initial."
                    : "The client is limited by their available cash for down payment and closing costs. Their income could support a higher loan, but they lack the upfront capital.");
        case 'LTV_LIMIT':
            return prefix + (isHE
                ? "הלקוח הגיע למגבלת ה-LTV הרגולטורית (75% או 50%). יש להם הכנסה ומזומנים מספקים למחיר גבוה יותר, אך תקנות הבנק מגבילות את גודל ההלוואה ביחס לשווי הנכס."
                : isFR
                    ? "Le client a atteint la limite réglementaire de quotité de financement (LTV de 75% ou 50%). Il a des revenus et un apport suffisants pour un prix plus élevé, mais les réglementations bancaires plafonnent le prêt par rapport à la valeur du bien."
                    : "The client has hit the regulatory Loan-to-Value limit (75% or 50%). They have sufficient income and cash for a higher price, but bank regulations cap the loan size relative to the property value.");
        case 'AGE_LIMIT':
            return prefix + (isHE
                ? "תקופת ההלוואה מוגבלת בשל גיל הלווה, מה שמאלץ החזרים חודשיים גבוהים יותר המגבילים את סכום ההלוואה. לווה נוסף צעיר יותר יכול להאריך את התקופה ולהגדיל את התקציב."
                : isFR
                    ? "La durée du prêt est limitée par l'âge de l'emprunteur, ce qui impose des mensualités plus élevées et limite le montant du prêt. Un co-emprunteur plus jeune permettrait d'allonger la durée et d'augmenter le budget."
                    : "The loan term is restricted by the borrower's age, forcing higher monthly payments which limits the loan amount. A younger co-signer could extend the term and increase the budget.");
        case 'INSUFFICIENT_DATA':
            return prefix + (isHE ? "אין מספיק נתונים כדי לקבוע את הגורם המגביל הספציפי." : isFR ? "Données insuffisantes pour déterminer le facteur limitant." : "Insufficient data to determine the specific limiting factor.");
        default:
            return prefix + (isHE ? "לא ניתן היה לקבוע את הגורם המגביל באופן אוטומטי." : isFR ? "Le facteur limitant n'a pas pu être déterminé automatiquement." : "The limiting factor could not be automatically determined.");
    }
}
