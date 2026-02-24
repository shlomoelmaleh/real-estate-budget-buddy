/**
 * LEAD SCORING MODULE
 * ===================
 * Re-exports calculateLeadScore from the shared module and provides
 * additional helpers used only by the email template.
 *
 * calculateLeadScore logic lives in: ../_shared/leadScoring.ts
 * DO NOT create a local copy — import from the shared module.
 */

// Re-export the canonical lead scoring function
export { calculateLeadScore } from "../_shared/leadScoring.ts";
export type { LeadScoreInputs, LeadScoreResults, LeadScoreOutput } from "../_shared/leadScoring.ts";

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
