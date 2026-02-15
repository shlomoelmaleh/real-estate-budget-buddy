import {
    CalculatorInputs,
    CalculatorResults,
    TaxProfile,
    TaxBracket,
    AmortizationRow
} from './calculator';
import { PartnerConfig } from '@/types/partnerConfig';

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

function computePurchaseTax(price: number, profile: TaxProfile): number {
    const brackets = TAX_BRACKETS[profile];
    let tax = 0;

    for (const bracket of brackets) {
        if (price <= bracket.min) break;
        const taxableAmount = Math.min(price, bracket.max) - bracket.min;
        tax += taxableAmount * bracket.rate;
    }

    return tax;
}

function calculateClosingCosts(
    price: number,
    purchaseTax: number,
    config: PartnerConfig
): number {
    const lawyerFee = price * (config.lawyer_fee_percent / 100) * (1 + config.vat_percent / 100);
    const brokerFee = price * (config.broker_fee_percent / 100) * (1 + config.vat_percent / 100);
    return purchaseTax + lawyerFee + brokerFee + config.advisor_fee_fixed + config.other_fee_fixed;
}

// ============= CORE ENGINE =============

export function solveMaximumBudget(
    inputs: CalculatorInputs,
    taxProfile: TaxProfile,
    amortizationFactor: number,
    maxLoanTermMonths: number,
    config: PartnerConfig
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
        expectedRent
    } = inputs;

    let low = 0;
    let high = equity * 20;
    let iterations = 0;
    let bestResult: CalculatorResults | null = null;

    while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
        iterations++;
        const price = (low + high) / 2;

        const purchaseTax = computePurchaseTax(price, taxProfile);
        const closingCosts = calculateClosingCosts(price, purchaseTax, config);

        const actualRent = expectedRent !== null && expectedRent > 0
            ? expectedRent
            : (isRented ? (price * (rentalYield / 100)) / 12 : 0);

        const rentRecognitionRate = isFirstProperty
            ? config.rent_recognition_first_property
            : config.rent_recognition_investment;

        const bankRecognizedIncome = netIncome + (actualRent * rentRecognitionRate);
        const bankMaxPayment = bankRecognizedIncome * (ratio / 100);
        const userEffectiveLimit = (budgetCap && budgetCap > 0) ? budgetCap + actualRent : Infinity;

        const maxPayment = Math.min(bankMaxPayment, userEffectiveLimit);
        const maxLoanByPayment = maxPayment / amortizationFactor;
        const maxLoanByLTV = price * (ltv / 100);
        const maxLoan = Math.min(maxLoanByPayment, maxLoanByLTV);
        const requiredEquity = price + closingCosts - maxLoan;

        if (requiredEquity <= equity + TOLERANCE) {
            low = price;
            const loan = maxLoan;
            const payment = loan * amortizationFactor;

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
                closingCosts: closingCosts,
                totalInterest: (payment * maxLoanTermMonths) - loan,
                totalCost: payment * maxLoanTermMonths,
                loanTermYears: maxLoanTermMonths / 12,
                purchaseTax,
                taxProfile,
                equityUsed: price + closingCosts - loan,
                equityRemaining: equity - (price + closingCosts - loan),
                lawyerFeeTTC: price * (config.lawyer_fee_percent / 100) * (1 + config.vat_percent / 100),
                brokerFeeTTC: price * (config.broker_fee_percent / 100) * (1 + config.vat_percent / 100),
                limitingFactor: 'EQUITY_LIMIT', // Logic simplified for preview
                estimatedMarketRent,
                rentWarning
            };
        } else {
            high = price;
        }
    }

    return bestResult;
}

export function calculateMaxBudget(inputs: CalculatorInputs, config: PartnerConfig): CalculatorResults | null {
    const { age, maxAge, interest, isFirstProperty, isIsraeliTaxResident } = inputs;

    const effectiveMaxAge = Math.min(config.max_age, maxAge || config.max_age);
    const years = Math.min(config.max_loan_term_years, effectiveMaxAge - age);

    if (years <= 0) return null;

    const n = years * 12;
    const rate = interest / 100;
    const mRate = rate / 12;
    const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

    const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);
    const results = solveMaximumBudget(inputs, taxProfile, A, n, config);

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
