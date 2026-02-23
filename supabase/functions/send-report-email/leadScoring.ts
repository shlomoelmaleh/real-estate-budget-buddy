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
    let priorityLabel = '❄️ COLD';
    let priorityColor = '#94a3b8'; // Slate
    let actionSla = "Add to long-term newsletter.";
    let predictedTimeline = lang === 'he' ? '3-6 חודשים (שלב תכנון)' : lang === 'fr' ? '3-6 mois (Planification)' : '3-6 months (Planning phase)';

    if (score >= 85) {
        priorityLabel = '💎 PLATINUM';
        priorityColor = '#7c3aed'; // Violet/Purple
        actionSla = "Call within 1 hour.";
        predictedTimeline = lang === 'he' ? '1-2 שבועות (מוכנים לתנועה)' : lang === 'fr' ? '1-2 semaines (Prêt)' : '1-2 weeks (Ready to move)';
    } else if (score >= 70) {
        priorityLabel = '🔥 HOT';
        priorityColor = '#ef4444'; // Red
        actionSla = "Call within 4 hours.";
        predictedTimeline = lang === 'he' ? '1-2 חודשים (חיפוש פעיל)' : lang === 'fr' ? '1-2 mois (Recherche active)' : '1-2 months (Active search)';
    } else if (score >= 50) {
        priorityLabel = '☀️ WARM';
        priorityColor = '#f59e0b'; // Amber
        actionSla = "Call within 24 hours.";
        predictedTimeline = lang === 'he' ? '1-2 חודשים (חיפוש פעיל)' : lang === 'fr' ? '1-2 mois (Recherche active)' : '1-2 months (Active search)';
    } else if (score >= 30) {
        priorityLabel = '🌤️ COOL';
        priorityColor = '#3b82f6'; // Blue
        actionSla = "Email follow-up.";
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

export function getLimitingFactorDescription(factor: string | undefined): string {
    switch (factor) {
        case 'INCOME_LIMIT':
            return "Analysis: This client has reached their maximum repayment capacity based on their income. They could afford a more expensive home if they had a co-signer or higher income, as they still have excess cash available.";
        case 'EQUITY_LIMIT':
            return "Analysis: The client is limited by their available cash for down payment and closing costs. Their income could support a higher loan, but they lack the upfront capital.";
        case 'LTV_LIMIT':
            return "Analysis: The client has hit the regulatory Loan-to-Value limit (75% or 50%). They have sufficient income and cash for a higher price, but bank regulations cap the loan size relative to the property value.";
        case 'AGE_LIMIT':
            return "Analysis: The loan term is restricted by the borrower's age, forcing higher monthly payments which limits the loan amount. A younger co-signer could extend the term and increase the budget.";
        case 'INSUFFICIENT_DATA':
            return "Analysis: Insufficient data to determine the specific limiting factor.";
        default:
            return "Analysis: The limiting factor could not be automatically determined.";
    }
}
