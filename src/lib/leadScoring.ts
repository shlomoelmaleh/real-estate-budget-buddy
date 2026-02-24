// ─── LEAD SCORING — Single Source of Truth ───────────────────────────────────
// Used by: src/lib/devMirror.ts (frontend preview)
//          supabase/functions/send-report-email (actual email)
// DO NOT duplicate this logic elsewhere.

export const LEAD_SCORE_CONFIG = {
    budget: { platinum: 5_000_000, high: 3_000_000, mid: 1_500_000 },
    dti: { good: 30, ok: 35 },       // percentages: good < 30%, ok ≤ 35%
    equity: { ready: 400_000, min: 200_000 },
    age: { young: 35, mature: 45 },  // < 35 → 10pts, 35–44 → 5pts
    liquidity: { comfortable: 200_000, minimal: 50_000 }, // > 200K → 5pts, > 50K → 5pts
} as const;

export interface LeadScoreInputs {
    age: string | number;
    netIncome: string | number;
    equity?: string | number;
    [key: string]: unknown;
}

export interface LeadScoreResults {
    maxPropertyValue: number;
    monthlyPayment: number;
    equityUsed?: number;
    equityRemaining: number;
    loanAmount?: number;
    [key: string]: unknown;
}

export interface LeadScoreOutput {
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

export function calculateLeadScore(
    inputs: LeadScoreInputs,
    results: LeadScoreResults,
    lang: 'he' | 'en' | 'fr' = 'en'
): LeadScoreOutput {
    const cfg = LEAD_SCORE_CONFIG;
    const maxBudget = results.maxPropertyValue;
    const monthlyPayment = results.monthlyPayment;

    // Parse netIncome — handle both string ("40,000") and number (40000) formats
    const netIncome = typeof inputs.netIncome === 'string'
        ? parseFloat(inputs.netIncome.replace(/,/g, '')) || 1
        : inputs.netIncome || 1;

    // Parse equity — handle both string and number formats
    const equityInitial = typeof inputs.equity === 'string'
        ? parseFloat(inputs.equity.replace(/,/g, '')) || 0
        : (inputs.equity as number) || 0;

    const equityRemaining = results.equityRemaining;
    const age = parseFloat(String(inputs.age)) || 40;

    // 1. Budget Size (max 35 pts)
    let budgetScore = 0;
    if (maxBudget > cfg.budget.platinum) budgetScore = 35;
    else if (maxBudget > cfg.budget.high) budgetScore = 25;
    else if (maxBudget > cfg.budget.mid) budgetScore = 15;

    // 2. Financial Health / DTI (max 25 pts)
    const dti = netIncome > 0 ? (monthlyPayment / netIncome) * 100 : 100;
    let healthScore = 0;
    if (dti < cfg.dti.good) healthScore = 25;
    else if (dti <= cfg.dti.ok) healthScore = 15;

    // 3. Readiness / Equity (max 25 pts)
    let readinessScore = 0;
    if (equityInitial >= cfg.equity.ready) readinessScore = 25;
    else if (equityInitial >= cfg.equity.min) readinessScore = 15;

    // 4. Age Factor (max 10 pts)
    let ageScore = 0;
    if (age < cfg.age.young) ageScore = 10;
    else if (age < cfg.age.mature) ageScore = 5;

    // 5. Liquidity Bonus (max 5 pts)
    let liquidityScore = 0;
    if (equityRemaining > cfg.liquidity.comfortable) liquidityScore = 5;
    else if (equityRemaining > cfg.liquidity.minimal) liquidityScore = 5;

    // Total: 35+25+25+10+5 = 100 max
    const score = Math.min(100, budgetScore + healthScore + readinessScore + ageScore + liquidityScore);

    // Tier assignment — all 5 timelines are DISTINCT
    let priorityLabel = lang === 'he' ? '❄️ קר' : lang === 'fr' ? '❄️ FROID' : '❄️ COLD';
    let priorityColor = '#94a3b8';
    let actionSla = lang === 'he' ? 'הוספה לניוזלטר ארוך טווח.' : lang === 'fr' ? 'Ajouter à la newsletter.' : 'Add to long-term newsletter.';
    let predictedTimeline =
        lang === 'he' ? '12+ חודשים (ניוזלטר)' :
            lang === 'fr' ? '12+ mois (Newsletter)' :
                '12+ months (Newsletter)';

    if (score >= 85) {
        priorityLabel = lang === 'he' ? '💎 פלטינום' : lang === 'fr' ? '💎 PLATINE' : '💎 PLATINUM';
        priorityColor = '#7c3aed';
        actionSla = lang === 'he' ? 'להתקשר תוך שעה אחת.' : lang === 'fr' ? 'Appeler d\'ici 1 heure.' : 'Call within 1 hour.';
        predictedTimeline =
            lang === 'he' ? '1-3 שבועות (מוכנים לרכישה)' :
                lang === 'fr' ? '1-3 semaines (Prêt à acheter)' :
                    '1-3 weeks (Ready to buy)';
    } else if (score >= 70) {
        priorityLabel = lang === 'he' ? '🔥 חם' : lang === 'fr' ? '🔥 CHAUD' : '🔥 HOT';
        priorityColor = '#ef4444';
        actionSla = lang === 'he' ? 'להתקשר תוך 4 שעות.' : lang === 'fr' ? 'Appeler d\'ici 4 heures.' : 'Call within 4 hours.';
        predictedTimeline =
            lang === 'he' ? '1-3 חודשים (חיפוש פעיל)' :
                lang === 'fr' ? '1-3 mois (Recherche active)' :
                    '1-3 months (Active search)';
    } else if (score >= 50) {
        priorityLabel = lang === 'he' ? '☀️ חמים' : lang === 'fr' ? '☀️ CHALEUREUX' : '☀️ WARM';
        priorityColor = '#f59e0b';
        actionSla = lang === 'he' ? 'להתקשר תוך 24 שעות.' : lang === 'fr' ? 'Appeler d\'ici 24 heures.' : 'Call within 24 hours.';
        predictedTimeline =
            lang === 'he' ? '3-6 חודשים (שלב תכנון)' :
                lang === 'fr' ? '3-6 mois (Planification)' :
                    '3-6 months (Planning)';
    } else if (score >= 30) {
        priorityLabel = lang === 'he' ? '🌤️ קריר' : lang === 'fr' ? '🌤️ FRAIS' : '🌤️ COOL';
        priorityColor = '#3b82f6';
        actionSla = lang === 'he' ? 'מעקב במייל.' : lang === 'fr' ? 'Suivi par e-mail.' : 'Email follow-up.';
        predictedTimeline =
            lang === 'he' ? '6-12 חודשים (שלב מוקדם)' :
                lang === 'fr' ? '6-12 mois (Stade précoce)' :
                    '6-12 months (Early stage)';
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
            liquidity: liquidityScore,
        },
    };
}
