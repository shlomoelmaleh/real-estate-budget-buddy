/**
 * CANONICAL CALCULATOR ENGINE
 * ===========================
 * Single source of truth for all financial calculations.
 * Used by both the Supabase Edge Function (Deno) and the frontend (Vite).
 *
 * DO NOT DUPLICATE THIS LOGIC. Import from here.
 */

// ============= TYPE DEFINITIONS =============

export type TaxProfile = 'SINGLE_HOME' | 'INVESTOR';

export interface TaxBracket {
    min: number;
    max: number | null;
    rate: number;
}

export interface PartnerConfig {
    max_dti_ratio: number;
    max_age: number;
    max_loan_term_years: number;
    rent_recognition_first_property: number;
    rent_recognition_investment: number;
    default_interest_rate: number;
    lawyer_fee_percent: number;
    broker_fee_percent: number;
    vat_percent: number;
    advisor_fee_fixed: number;
    other_fee_fixed: number;
    rental_yield_default: number;
    rent_warning_high_multiplier: number;
    rent_warning_low_multiplier: number;
    enable_rent_validation: boolean;
    enable_what_if_calculator: boolean;
    show_amortization_table: boolean;
    max_amortization_months: number;
}

export interface CalculatorInputs {
    equity: number;
    ltv: number;
    netIncome: number;
    ratio: number;
    age: number;
    maxAge: number;
    interest: number;
    isRented: boolean;
    rentalYield: number;
    rentRecognition: number;
    budgetCap: number | null;
    maxLoanTerm?: number | null;
    isFirstProperty: boolean;
    isIsraeliTaxResident: boolean;
    expectedRent: number | null;
    lawyerPct: number;
    brokerPct: number;
    vatPct: number;
    advisorFee: number;
    otherFee: number;
}

export interface CalculatorResults {
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
    purchaseTax: number;
    taxProfile: TaxProfile;
    equityUsed: number;
    equityRemaining: number;
    lawyerFeeTTC: number;
    brokerFeeTTC: number;
    limitingFactor: 'EQUITY_LIMIT' | 'INCOME_LIMIT' | 'LTV_LIMIT' | 'AGE_LIMIT' | 'INSUFFICIENT_DATA';
    estimatedMarketRent: number;
    rentWarning: 'high' | 'low' | null;
    amortizationTable?: AmortizationRow[];
}

export interface AmortizationRow {
    month: number;
    opening: number;
    payment: number;
    interest: number;
    principal: number;
    closing: number;
}

// ============= PROTECTED CONSTANTS =============

const TOLERANCE = 100;
const MAX_ITERATIONS = 50;

const TAX_BRACKETS: Record<TaxProfile, TaxBracket[]> = {
    SINGLE_HOME: [
        { min: 0, max: 1_978_745, rate: 0 },
        { min: 1_978_745, max: 2_347_040, rate: 0.035 },
        { min: 2_347_040, max: 6_055_070, rate: 0.05 },
        { min: 6_055_070, max: 20_183_565, rate: 0.08 },
        { min: 20_183_565, max: Infinity, rate: 0.10 },
    ],
    INVESTOR: [
        { min: 0, max: 6_055_070, rate: 0.08 },
        { min: 6_055_070, max: Infinity, rate: 0.10 },
    ],
};

// ============= INTERNAL HELPERS =============

function determineTaxProfile(isFirstProperty: boolean, isIsraeliTaxResident: boolean): TaxProfile {
    if (isFirstProperty && isIsraeliTaxResident) {
        return 'SINGLE_HOME';
    }
    return 'INVESTOR';
}

export function computePurchaseTax(price: number, profile: TaxProfile, customBrackets?: Record<TaxProfile, TaxBracket[]>): number {
    const brackets = (customBrackets || TAX_BRACKETS)[profile];
    let tax = 0;
    for (const bracket of brackets) {
        if (price <= bracket.min) break;
        const maxLimit = bracket.max === null || bracket.max === Infinity ? Infinity : bracket.max;
        const taxableAmount = Math.min(price, maxLimit) - bracket.min;
        tax += taxableAmount * bracket.rate;
    }
    return tax;
}

function calculateClosingCosts(
    price: number,
    purchaseTax: number,
    lawyerPct: number,
    brokerPct: number,
    vatPct: number,
    advisorFee: number,
    otherFee: number
): number {
    const lawyerFee = price * (lawyerPct / 100) * (1 + vatPct / 100);
    const brokerFee = price * (brokerPct / 100) * (1 + vatPct / 100);
    return purchaseTax + lawyerFee + brokerFee + advisorFee + otherFee;
}

// ============= CORE ENGINE =============

export function solveMaximumBudget(
    inputs: CalculatorInputs,
    taxProfile: TaxProfile,
    amortizationFactor: number,
    maxLoanTermMonths: number,
    config: PartnerConfig,
    taxBrackets?: Record<TaxProfile, TaxBracket[]>
): CalculatorResults | null {
    const {
        equity,
        ltv,
        netIncome,
        ratio,
        rentalYield,
        budgetCap,
        isRented,
        isFirstProperty,
        expectedRent,
        lawyerPct,
        brokerPct,
        vatPct,
        advisorFee,
        otherFee,
        age,
    } = inputs;

    let low = 0;
    let high = equity * 20;
    let iterations = 0;
    let bestResult: CalculatorResults | null = null;

    while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
        iterations++;
        const price = (low + high) / 2;

        const purchaseTax = computePurchaseTax(price, taxProfile, taxBrackets);
        const closingCosts = calculateClosingCosts(price, purchaseTax, lawyerPct, brokerPct, vatPct, advisorFee, otherFee);

        // Actual rent: user input overrides yield formula
        const hasUserRent = expectedRent !== null && expectedRent > 0;
        const actualRent = hasUserRent
            ? expectedRent
            : (isRented ? (price * (rentalYield / 100)) / 12 : 0);

        // Bank recognized income
        const rentRecognitionRate = isFirstProperty
            ? config.rent_recognition_first_property
            : (inputs.rentRecognition !== undefined && inputs.rentRecognition !== null
                ? inputs.rentRecognition / 100
                : config.rent_recognition_investment);
        const bankRecognizedIncome = netIncome + (actualRent * rentRecognitionRate);
        const bankMaxPayment = bankRecognizedIncome * (ratio / 100);

        // User cash flow limit
        const userEffectiveLimit = (budgetCap && budgetCap > 0) ? budgetCap + actualRent : Infinity;

        // Final constraints
        const maxPayment = Math.min(bankMaxPayment, userEffectiveLimit);
        const maxLoanByPayment = maxPayment / amortizationFactor;
        const maxLoanByLTV = price * (ltv / 100);
        const maxLoan = Math.min(maxLoanByPayment, maxLoanByLTV);
        const requiredEquity = price + closingCosts - maxLoan;

        if (requiredEquity <= equity + TOLERANCE) {
            low = price;
            const loan = maxLoan;
            const payment = loan * amortizationFactor;
            const lawyerFeeTTC = price * (lawyerPct / 100) * (1 + vatPct / 100);
            const brokerFeeTTC = price * (brokerPct / 100) * (1 + vatPct / 100);

            // Dynamic limiting factor
            const equityUsed = price + closingCosts - loan;
            let limitingFactor: CalculatorResults['limitingFactor'];
            if (maxLoanByPayment < maxLoanByLTV) {
                // Income limits the loan size — check if age is the root cause
                if (maxLoanTermMonths < 360 && age > 45) {
                    limitingFactor = 'AGE_LIMIT';
                } else {
                    limitingFactor = 'INCOME_LIMIT';
                }
            } else {
                // LTV regulation limits the loan size
                limitingFactor = 'LTV_LIMIT';
            }
            // Note: EQUITY_LIMIT is not used for max-budget calculation.
            // The binary search always exhausts equity by design.

            // Rent validation
            const estimatedMarketRent = (price * (rentalYield / 100)) / 12;
            let rentWarning: 'high' | 'low' | null = null;
            if (config.enable_rent_validation) {
                if (actualRent > estimatedMarketRent * config.rent_warning_high_multiplier) {
                    rentWarning = 'high';
                } else if (actualRent > 0 && actualRent < estimatedMarketRent * config.rent_warning_low_multiplier) {
                    rentWarning = 'low';
                }
            }

            bestResult = {
                maxPropertyValue: price,
                loanAmount: loan,
                actualLTV: (loan / price) * 100,
                monthlyPayment: payment,
                rentIncome: actualRent,
                netPayment: payment - actualRent,
                closingCosts,
                totalInterest: (payment * maxLoanTermMonths) - loan,
                totalCost: payment * maxLoanTermMonths,
                loanTermYears: maxLoanTermMonths / 12,
                purchaseTax,
                taxProfile,
                equityUsed,
                equityRemaining: equity - equityUsed,
                lawyerFeeTTC,
                brokerFeeTTC,
                limitingFactor,
                estimatedMarketRent,
                rentWarning,
            };
        } else {
            high = price;
        }
    }

    return bestResult;
}

/**
 * Main calculation entry point — used by both Edge Function and frontend preview.
 */
export function calculateMaxBudget(
    inputs: CalculatorInputs,
    config: PartnerConfig,
    taxBrackets?: Record<TaxProfile, TaxBracket[]>
): CalculatorResults | null {
    const { age, maxAge, interest, isFirstProperty, isIsraeliTaxResident } = inputs;

    const effectiveMaxAge = Math.min(config.max_age, maxAge || config.max_age);
    const effectiveMaxTerm = inputs.maxLoanTerm
        ? Math.min(inputs.maxLoanTerm, config.max_loan_term_years)
        : config.max_loan_term_years;
    const years = Math.min(effectiveMaxTerm, effectiveMaxAge - age);
    if (years <= 0) return null;

    const n = years * 12;
    const rate = interest / 100;
    const mRate = rate / 12;
    const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

    const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);
    const results = solveMaximumBudget(inputs, taxProfile, A, n, config, taxBrackets);

    if (results && config.show_amortization_table) {
        results.amortizationTable = generateAmortizationTable(
            results.loanAmount,
            interest,
            years,
            config.max_amortization_months
        );
    }

    return results;
}

/**
 * Generate monthly amortization schedule.
 */
export function generateAmortizationTable(
    loanAmount: number,
    annualInterest: number,
    years: number,
    maxMonths: number = 360
): AmortizationRow[] {
    const mRate = annualInterest / 100 / 12;
    const n = years * 12;
    const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));
    const monthlyPayment = A * loanAmount;

    const rows: AmortizationRow[] = [];
    let balance = loanAmount;

    for (let i = 1; i <= Math.min(n, maxMonths) && balance > 0.1; i++) {
        const interest = balance * mRate;
        const principal = monthlyPayment - interest;
        const closing = Math.max(0, balance - principal);

        rows.push({
            month: i,
            opening: balance,
            payment: monthlyPayment,
            interest,
            principal,
            closing,
        });

        balance = closing;
    }

    return rows;
}
