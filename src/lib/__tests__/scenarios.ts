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
    show_marketing_consent: false,
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
        description: 'Interest rate = 1 (minimum allowed) → standard amortization branch',
        branches: [
            'rate = 1.0 (lowest partner config setting)',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 1.0,   // minimum allowed interest
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

    // ── S17: Luxury Single Home (8% bracket) ──────────────────────────────────
    {
        id: 'S17_LUXURY_8_PCT',
        description: 'Luxury home price > 6,055,070 → lands in the 8% SINGLE_HOME bracket',
        branches: [
            'SINGLE_HOME bracket: 8% partial (price > 6.05M)',
        ],
        inputs: {
            equity: 6_000_000,
            ltv: 75,
            netIncome: 80_000,
            ratio: 33,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 0,
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

    // ── S18: Ultra-Luxury Single Home (10% bracket) ───────────────────────────
    {
        id: 'S18_ULTRA_LUXURY_10_PCT',
        description: 'Ultra-luxury home price > 20,183,565 → lands in the 10% SINGLE_HOME bracket',
        branches: [
            'SINGLE_HOME bracket: 10% partial (price > 20.1M)',
        ],
        inputs: {
            equity: 25_000_000,
            ltv: 75,
            netIncome: 300_000,
            ratio: 40,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 0,
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
        config: { ...DEFAULT_CONFIG, max_dti_ratio: 0.40 },
    },

    // ── S19: Luxury Investor (10% bracket) ────────────────────────────────────
    {
        id: 'S19_LUXURY_INVESTOR',
        description: 'Investor purchase > 6,055,070 → lands in the 10% INVESTOR bracket',
        branches: [
            'INVESTOR bracket: 10% partial (price > 6.05M)',
        ],
        inputs: {
            equity: 8_000_000,
            ltv: 50,
            netIncome: 100_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 0,
            rentRecognition: 0,
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

    // ── S20: First Property with Rental Income ────────────────────────────────
    {
        id: 'S20_FIRST_HOME_WITH_RENTAL',
        description: 'First property purchase where user will rent it out → uses rent_recognition_first_property',
        branches: [
            'isFirstProperty=true, isRented=true → rentRecognition_firstProperty_pct used',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 75,
            netIncome: 20_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 0, // Real-world setting: 0% recognition for first property
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
        config: { ...DEFAULT_CONFIG, rent_recognition_first_property: 0.0 },
    },

    // ── S21: Zero Broker/Lawyer Fees ──────────────────────────────────────────
    {
        id: 'S21_ZERO_FEES',
        description: 'Partner config has 0% for variable fees and 0 NIS for fixed fees',
        branches: [
            'closingCosts logic with zeroed config values',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 75,
            netIncome: 30_000,
            ratio: 33,
            age: 35,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,
            expectedRent: null,
            lawyerPct: 0,
            brokerPct: 0,
            vatPct: 18,
            advisorFee: 0,
            otherFee: 0,
        },
        config: {
            ...DEFAULT_CONFIG,
            lawyer_fee_percent: 0,
            broker_fee_percent: 0,
            advisor_fee_fixed: 0,
            other_fee_fixed: 0
        },
    },

    // ── S22: Age Term Reduction ───────────────────────────────────────────────
    {
        id: 'S22_TERM_REDUCTION',
        description: 'Effective years reduced because age is close to maxAge',
        branches: [
            'years = effectiveMaxAge - age < max_loan_term_years',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 65,  // closer to 80
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 0,
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
        config: { ...DEFAULT_CONFIG, max_loan_term_years: 30 }, // Term will likely be 15 years (80-65)
    },

    // ── S23: USD Emulation (odd post-conversion numbers) ──────────────────────
    {
        id: 'S23_USD_BASIC',
        description: 'Simulates $1,000,000 equity and $10,000 income converted to ILS',
        branches: [
            'post-conversion ILS inputs testing float/rounding stability',
        ],
        inputs: {
            equity: 3_680_000,   // ~ $1M
            ltv: 75,
            netIncome: 36_800,   // ~ $10k
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

    // ── S24: EUR Emulation ───────────────────────────────────────────────────
    {
        id: 'S24_EUR_BASIC',
        description: 'Simulates €500,000 equity and €5,000 income converted to ILS',
        branches: [
            'post-conversion ILS inputs testing float/rounding stability',
        ],
        inputs: {
            equity: 1_950_000,   // ~ €500k
            ltv: 75,
            netIncome: 19_500,   // ~ €5k
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

    // ── S25: GBP Emulation ───────────────────────────────────────────────────
    {
        id: 'S25_GBP_BASIC',
        description: 'Simulates £800,000 equity and £8,000 income converted to ILS',
        branches: [
            'post-conversion ILS inputs testing float/rounding stability',
        ],
        inputs: {
            equity: 3_720_000,   // ~ £800k
            ltv: 75,
            netIncome: 37_200,   // ~ £8k
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

    // ── S26: Rounded edge case ────────────────────────────────────────────────
    {
        id: 'S26_ROUNDED',
        description: 'Testing odd/rounded numbers causing exact overlaps in logic',
        branches: [
            'LTV vs Payment exactly overlapping or decimal rounding edge cases',
        ],
        inputs: {
            equity: 1_234_567,
            ltv: 75,
            netIncome: 12_345,
            ratio: 33.33,
            age: 33,
            maxAge: 80,
            interest: 5.5,
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

    // ── S27: CASE 2 — Israeli citizen living abroad (non-tax-resident) ────────
    {
        id: 'S27_CASE2_CITIZEN_NONRESIDENT',
        description: 'Israeli citizen living abroad: non-tax-resident (INVESTOR tax profile) but citizen (LTV=75% per BOI 329)',
        branches: [
            'isIsraeliTaxResident=false → INVESTOR tax profile (8% from first shekel)',
            'isIsraeliCitizen=true → ltv=75% (BOI directive 329: citizen ≠ foreign resident)',
            'UNIQUE combination: INVESTOR taxProfile with ltv=75 (all other INVESTOR scenarios use ltv=50)',
        ],
        inputs: {
            equity: 2_500_000,
            ltv: 75,                        // citizen → 75% per BOI 329
            netIncome: 45_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: false,    // not a tax resident → INVESTOR tax
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S28: CASE 3 — Non-citizen Israeli tax resident ────────────────────────
    {
        id: 'S28_CASE3_RESIDENT_NONCITIZEN',
        description: 'Non-citizen Israeli tax resident: SINGLE_HOME tax brackets (tax resident) but LTV=50% (non-citizen per BOI 329)',
        branches: [
            'isFirstProperty=true AND isIsraeliTaxResident=true → SINGLE_HOME tax profile',
            'isIsraeliCitizen=false → ltv=50% (BOI 329: non-citizen = foreign resident)',
            'UNIQUE combination: SINGLE_HOME taxProfile with ltv=50 (all other SINGLE_HOME scenarios use ltv=75)',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 50,                        // non-citizen → 50% per BOI 329
            netIncome: 30_000,
            ratio: 33,
            age: 40,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: true,
            isIsraeliTaxResident: true,     // IS a tax resident → SINGLE_HOME tax brackets!
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S29: AGE_LIMIT parameter threshold (above) ────────────────────────────
    {
        id: 'S29_AGE_LIMIT_BOUNDARY_ABOVE',
        description: 'age=46 just above the age>45 threshold, maxAge=75 → term=29y=348months < 360 → AGE_LIMIT',
        branches: [
            'maxLoanTermMonths = (75-46)*12 = 348 < 360',
            'age=46 > 45 → both conditions met → AGE_LIMIT',
            'Validates the age>45 threshold is respected at the boundary',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 75,
            netIncome: 30_000,
            ratio: 33,
            age: 46,                        // ממש מעל threshold
            maxAge: 75,                     // 75-46=29 שנים = 348 חודשים < 360
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
        config: { ...DEFAULT_CONFIG, max_age: 75 },
    },

    // ── S30: INCOME_LIMIT parameter threshold (below age boundary) ────────────
    {
        id: 'S30_AGE_BELOW_THRESHOLD',
        description: 'age=44 just below the age>45 threshold, maxAge=70 → term=26y=312months < 360 BUT age<=45 → INCOME_LIMIT not AGE_LIMIT',
        branches: [
            'maxLoanTermMonths = (70-44)*12 = 312 < 360',
            'age=44 <= 45 → age condition NOT met → INCOME_LIMIT (not AGE_LIMIT)',
            'Validates age threshold boundary from below: same short term but different limitingFactor',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 75,
            netIncome: 20_000,
            ratio: 33,
            age: 44,                        // ממש מתחת threshold
            maxAge: 70,                     // 70-44=26 שנים = 312 חודשים < 360
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
        config: { ...DEFAULT_CONFIG, max_age: 70 },
    },

    // ── S31: Budget cap not binding ───────────────────────────────────────────
    {
        id: 'S31_BUDGET_CAP_NOT_BINDING',
        description: 'budgetCap set far above bank DTI limit — cap has no effect, result equals S01_BASELINE',
        branches: [
            'budgetCap=20,000 > bankMaxPayment=13,200 (40K * 33%) → userEffectiveLimit > bankMaxPayment',
            'Math.min(bankMaxPayment, userEffectiveLimit) = bankMaxPayment → cap not binding',
            'Result should match S01_BASELINE (same inputs, cap just ignored)',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,                      // bankMaxPayment = 40,000 * 0.33 = 13,200
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: 20_000,              // 20K > bank max 13.2K → cap NOT binding
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

    // ── S32: Zero interest rate ───────────────────────────────────────────────
    {
        id: 'S32_ZERO_INTEREST_RATE',
        description: 'interest=0% triggers the mRate===0 branch: amortization factor A=1/n (pure principal repayment)',
        branches: [
            'mRate = 0% / 12 = 0 → A = 1/n (special case, not standard formula)',
            'monthlyPayment = loanAmount / n (all principal, zero interest)',
            'totalInterest should equal 0',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 0,                    // בדיוק אפס — מפעיל ענף mRate===0
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

    // ── S33: First home partial rent recognition ──────────────────────────────
    {
        id: 'S33_FIRST_HOME_PARTIAL_RENT_RECOGNITION',
        description: 'First property with 50% rent recognition — non-standard partner config, rent partially recognized',
        branches: [
            'isFirstProperty=true, isRented=true',
            'rent_recognition_first_property=0.5 (50%) — non-zero, non-standard',
            'bankRecognizedIncome = netIncome + (actualRent * 0.5)',
            'Budget should be higher than S20 (0% recognition) and lower than a full 80% investment recognition',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 75,
            netIncome: 20_000,
            ratio: 33,
            age: 30,
            maxAge: 80,
            interest: 5.0,
            isRented: true,
            rentalYield: 3.0,
            rentRecognition: 50,            // מועבר לפונקציה אבל לא בשימוש — isFirstProperty מנצח
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
        config: { ...DEFAULT_CONFIG, rent_recognition_first_property: 0.5 },
    },

    // ── S34: Double investor condition ────────────────────────────────────────
    {
        id: 'S34_DOUBLE_INVESTOR_BOTH_CONDITIONS',
        description: 'Both investor conditions simultaneously: isFirstProperty=false AND isIsraeliTaxResident=false',
        branches: [
            'isFirstProperty=false → INVESTOR (first condition)',
            'isIsraeliTaxResident=false → INVESTOR (second condition)',
            'Both true simultaneously: taxProfile should still be INVESTOR once (no double-tax)',
            'Compare to S04 (same except taxResident=true): results should be similar',
        ],
        inputs: {
            equity: 2_000_000,
            ltv: 50,
            netIncome: 35_000,
            ratio: 33,
            age: 45,
            maxAge: 80,
            interest: 5.0,
            isRented: false,
            rentalYield: 3.0,
            rentRecognition: 0,
            budgetCap: null,
            isFirstProperty: false,         // סיבה 1 ל-INVESTOR
            isIsraeliTaxResident: false,    // סיבה 2 ל-INVESTOR
            expectedRent: null,
            lawyerPct: 1.0,
            brokerPct: 2.0,
            vatPct: 18,
            advisorFee: 9000,
            otherFee: 3000,
        },
        config: DEFAULT_CONFIG,
    },

    // ── S35: Very low DTI (10%) ───────────────────────────────────────────────
    {
        id: 'S35_VERY_LOW_DTI_10PCT',
        description: 'Partner allows only 10% DTI — extremely conservative, bankMaxPayment=4,000/month → strong INCOME_LIMIT',
        branches: [
            'ratio=10% → bankMaxPayment = 40,000 * 0.10 = 4,000/month',
            'Very low payment cap → strong INCOME_LIMIT',
            'Budget should be significantly lower than S01 despite same equity and income',
        ],
        inputs: {
            equity: 3_000_000,
            ltv: 75,
            netIncome: 40_000,
            ratio: 10,                      // DTI=10% — שמרן מאוד
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
        config: { ...DEFAULT_CONFIG, max_dti_ratio: 0.10 },
    }
];
