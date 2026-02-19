/**
 * CALCULATOR TEST SCENARIOS
 * -------------------------
 * Each scenario targets one or more specific decision branches in calculatorLogic.ts.
 * These are INPUT-ONLY definitions. Expected results are NOT defined here.
 * Run `npm run test:snapshot` to generate outputs, verify them manually,
 * then approve them as the golden reference.
 */

import type { CalculatorInputs } from '../calculator';
import type { PartnerConfig } from '@/types/partnerConfig';

// ─── Default partner config used as baseline ─────────────────────────────────
export const DEFAULT_CONFIG: PartnerConfig = {
    max_dti_ratio: 0.33,
    max_age: 80,
    max_loan_term_years: 30,
    rent_recognition_first_property: 0.0,
    rent_recognition_investment: 0.8,
    default_interest_rate: 5.0,
    lawyer_fee_percent: 1.0,
    broker_fee_percent: 2.0,
    vat_percent: 18.0,
    advisor_fee_fixed: 9000,
    other_fee_fixed: 3000,
    rental_yield_default: 3.0,
    rent_warning_high_multiplier: 1.5,
    rent_warning_low_multiplier: 0.7,
    enable_rent_validation: true,
    enable_what_if_calculator: true,
    show_amortization_table: false,     // off by default to keep output lean
    max_amortization_months: 360,
};

// ─── Scenario type ────────────────────────────────────────────────────────────
export interface Scenario {
    id: string;
    description: string;
    /** Which code branches this scenario exercises */
    branches: string[];
    inputs: CalculatorInputs;
    config: PartnerConfig;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [

    // ── S01: Baseline ─────────────────────────────────────────────────────────
    {
        id: 'S01_BASELINE',
        description: 'Standard first-time Israeli buyer, no rental, typical inputs',
        branches: [
            'taxProfile → SINGLE_HOME',
            'SINGLE_HOME bracket: price in 5% zone (~2.3M–6M)',
            'loan limit: income (DTI 33%) is binding over LTV',
            'rent = 0 (isRented=false)',
            'budgetCap inactive',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S02: Small buyer (tax = 0%, SINGLE_HOME bracket) ─────────────────────
    {
        id: 'S02_TAX_ZERO',
        description: 'Budget for a low-equity buyer — final price likely below 1,978,745 → purchase tax = 0',
        branches: [
            'taxProfile → SINGLE_HOME',
            'SINGLE_HOME bracket: 0% (price ≤ 1,978,745)',
            'equity constraint is binding',
        ],
        inputs: {
            equity: 500_000,
            ltv: 75,
            netIncome: 18_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S03: Expensive buyer in 3.5% tax bracket ─────────────────────────────
    {
        id: 'S03_TAX_3_5_PCT',
        description: 'Buyer whose result price lands in the 3.5% SINGLE_HOME tax bracket (1.97M–2.35M)',
        branches: [
            'taxProfile → SINGLE_HOME',
            'SINGLE_HOME bracket: 3.5% partial',
        ],
        inputs: {
            equity: 600_000,
            ltv: 75,
            netIncome: 20_000,
            ratio: 33,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S04: Investor profile (non-first property) ────────────────────────────
    {
        id: 'S04_INVESTOR',
        description: 'Second property purchase → INVESTOR tax profile (flat 8% from 0)',
        branches: [
            'taxProfile → INVESTOR (isFirstProperty=false)',
            'INVESTOR bracket: 8% up to 6,055,070',
            'rent_recognition_investment rate used',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 50,
            netIncome: 35_000,
            ratio: 33,
            age: 45,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,          // matches DEFAULT_CONFIG.rental_yield_default
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S05: Non-Israeli resident → always INVESTOR ───────────────────────────
    {
        id: 'S05_NON_ISRAELI',
        description: 'First property but non-Israeli resident → INVESTOR profile (foreign buyer)',
        branches: [
            'taxProfile → INVESTOR (isIsraeliTaxResident=false)',
        ],
        inputs: {
            equity: 2_500_000,
            ltv: 50,
            netIncome: 50_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: false,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S06: LTV is the binding constraint ───────────────────────────────────
    {
        id: 'S06_LTV_BINDING',
        description: 'Very high income — LTV cap restricts the loan before income does',
        branches: [
            'maxLoanByLTV < maxLoanByPayment → LTV is binding',
            'actual LTV in result should be exactly at the LTV cap',
        ],
        inputs: {
            equity: 5_000_000,
            ltv: 75,
            netIncome: 200_000,  // extremely high income → not the bottleneck
            ratio: 33,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S07: Income (DTI) is the binding constraint ───────────────────────────
    {
        id: 'S07_INCOME_BINDING',
        description: 'High equity but low income — DTI ratio limits the loan amount',
        branches: [
            'maxLoanByPayment < maxLoanByLTV → income (DTI) is binding',
        ],
        inputs: {
            equity: 10_000_000,
            ltv: 75,
            netIncome: 8_000,   // very low income → binding
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S08: Budget cap active ────────────────────────────────────────────────
    {
        id: 'S08_BUDGET_CAP',
        description: 'User sets an explicit monthly payment ceiling via budgetCap',
        branches: [
            'budgetCap > 0 → userEffectiveLimit applied',
            'Math.min(bankMaxPayment, userEffectiveLimit) is the cap',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 60_000,
            ratio: 33,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: 8_000,   // user hard cap at 8K/month
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S09: Rental investment — yield-based rent recognition ─────────────────
    {
        id: 'S09_RENTAL_YIELD',
        description: 'Investment property with no explicit rent — rent estimated from yield',
        branches: [
            'isRented=true, expectedRent=null → rent = (price * rentalYield% / 12)',
            'isFirstProperty=false → rent_recognition_investment rate',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 50,
            netIncome: 25_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S10: Explicit expected rent (overrides yield) ─────────────────────────
    {
        id: 'S10_EXPLICIT_RENT',
        description: 'User provides a specific expected rent value — overrides yield calculation',
        branches: [
            'expectedRent != null && > 0 → uses explicit rent directly',
        ],
        inputs: {
            equity: 2_500_000,
            ltv: 50,
            netIncome: 20_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: 9_000,   // explicit value
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S11: Rent warning = 'high' ────────────────────────────────────────────
    {
        id: 'S11_RENT_WARNING_HIGH',
        description: 'Explicit rent far above market estimate → rentWarning = high',
        branches: [
            'enable_rent_validation=true',
            'actualRent > estimatedMarketRent * rent_warning_high_multiplier → "high"',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 50,
            netIncome: 20_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: 25_000,   // far above what yield would estimate
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: { ...DEFAULT_CONFIG, enable_rent_validation: true },
    },

    // ── S12: Rent warning = 'low' ─────────────────────────────────────────────
    {
        id: 'S12_RENT_WARNING_LOW',
        description: 'Explicit rent far below market estimate → rentWarning = low',
        branches: [
            'enable_rent_validation=true',
            'actualRent < estimatedMarketRent * rent_warning_low_multiplier → "low"',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 50,
            netIncome: 20_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: 1_000,   // suspiciously low
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: { ...DEFAULT_CONFIG, enable_rent_validation: true },
    },

    // ── S13: Rent validation disabled ────────────────────────────────────────
    {
        id: 'S13_RENT_VALIDATION_OFF',
        description: 'enable_rent_validation=false → rentWarning stays null even with extreme rent',
        branches: [
            'enable_rent_validation=false → skip warning logic entirely',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 50,
            netIncome: 20_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 80,
            budgetCap: null,
            isFirstProperty: false,
            isIsraeliTaxResident: true,
            expectedRent: 50_000,   // extreme, but validation is off
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: { ...DEFAULT_CONFIG, enable_rent_validation: false },
    },

    // ── S14: Age limit → should return null ──────────────────────────────────
    {
        id: 'S14_AGE_TOO_OLD',
        description: 'Borrower age equals or exceeds maxAge → calculateMaxBudget returns null',
        branches: [
            'years = min(max_loan_term_years, maxAge - age) ≤ 0 → return null',
        ],
        inputs: {
            equity: 5_000_000,
            ltv: 75,
            netIncome: 100_000,
            ratio: 33,
            age: 80,   // same as maxAge
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S15: Zero interest rate ───────────────────────────────────────────────
    {
        id: 'S15_ZERO_INTEREST',
        description: 'Interest rate = 0 → amortization formula takes the special A = 1/n branch',
        branches: [
            'mRate === 0 → A = 1/n (linear repayment)',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 0,   // zero interest
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S16: Amortization table generated ────────────────────────────────────
    {
        id: 'S16_AMORTIZATION_TABLE',
        description: 'show_amortization_table=true → amortizationTable is populated and mathematically consistent',
        branches: [
            'show_amortization_table=true → generateAmortizationTable() called',
            'each row: closing = opening - principal',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: { ...DEFAULT_CONFIG, show_amortization_table: true, max_amortization_months: 360 },
    },

];
