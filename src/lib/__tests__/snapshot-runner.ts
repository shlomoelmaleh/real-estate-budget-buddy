/**
 * SNAPSHOT RUNNER
 * ---------------
 * Run with: npm run test:snapshot
 *
 * Generates snapshot-output.json with INPUTS split into 3 categories + OUTPUTS,
 * so you can verify each calculation externally before approving as golden reference.
 *
 * WORKFLOW:
 *  1. npm run test:snapshot   → generates snapshot-output.json
 *  2. Open the file, verify INPUTS vs OUTPUTS for each scenario manually
 *  3. npm run test:approve    → locks the file as golden-reference.json
 *  4. npm test                → asserts engine output against that reference forever
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { calculateMaxBudget } from '../calculatorLogic.js';
import { SCENARIOS } from './scenarios.js';
import type { CalculatorResults } from '../calculator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = path.join(__dirname, 'golden');
const OUTPUT_FILE = path.join(GOLDEN_DIR, 'snapshot-output.json');

// ─── Snapshot entry type ───────────────────────────────────────────────────────

type SnapshotEntry = {
    id: string;
    description: string;
    branches: string[];

    INPUTS: {

        /**
         * CATEGORY 1 — USER INPUTS
         * Fields the borrower fills in directly in the simulator wizard (Steps 1–4)
         */
        CATEGORY_1_USER: {
            // Step 1 — Personal Info
            age: number;
            targetPropertyPrice_NIS: number | null;       // Step 1 — optional, informational

            // Step 2 — Financial Capacity
            equity_NIS: number;
            netMonthlyIncome_NIS: number;

            // Step 3 — Legal / Tax profile  (Yes/No toggles)
            isFirstProperty: boolean;                     // "Only property in Israel?"
            isIsraeliCitizen: boolean;                    // "Israeli citizenship?"
            isIsraeliTaxResident: boolean;                // "Primary country of residence? (Tax resident)"

            // Step 4 — Rental & Budget
            isRented: boolean;                            // "Will you rent this property?"
            expectedRent_NIS_per_month: number | null;   // optional — defaults to yield if null
            budgetCap_NIS_per_month: number | null;      // optional — no ceiling if null
        };

        /**
         * CATEGORY 2 — PARTNER CONFIGURATION
         * Values set in the partner admin panel — not visible or editable by the end user
         */
        CATEGORY_2_PARTNER: {
            maxDTIRatio_pct: number;              // Max % of income allowed for loan repayment
            maxApplicantAge: number;              // Oldest age allowed at end of loan
            maxLoanTermYears: number;             // Maximum mortgage duration
            rentRecognition_investment_pct: number; // % of rent added to borrower income (investment)
            defaultInterestRate_pct: number;      // Interest rate pre-loaded in the simulator
            lawyerFee_pct: number;                // Lawyer fee as % of property price
            brokerFee_pct: number;                // Broker/agent fee as % of property price
            advisorFeeFixed_NIS: number;          // Mortgage advisor flat fee
            otherFeeFixed_NIS: number;            // Miscellaneous closing costs (flat)
            defaultRentalYield_pct: number;       // Used to estimate rent if user leaves expectedRent blank
        };

        /**
         * CATEGORY 3 — SYSTEM / REGULATORY
         * Regulatory constraints or internal system parameters —
         * neither the user nor the partner controls these
         */
        CATEGORY_3_SYSTEM: {
            maxLTV_pct: number;                          // Bank of Israel regulation (e.g. 75%)
            vat_pct: number;                             // Israeli VAT rate (18% by law)
            rentRecognition_firstProperty_pct: number;  // Regulatory: rent not recognized for primary home
            enableRentValidation: boolean;               // System feature flag
            rentWarningHighMultiplier: number;           // Alert threshold: rent too high vs market
            rentWarningLowMultiplier: number;            // Alert threshold: rent suspiciously low
        };
    };

    /**
     * OUTPUTS — Engine-computed results to be verified manually
     */
    OUTPUTS: CalculatorResults | null;

    error?: string;
};

// ─── Run all scenarios ─────────────────────────────────────────────────────────

const snapshots: SnapshotEntry[] = [];

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  CALCULATOR SNAPSHOT RUNNER');
console.log('═══════════════════════════════════════════════════════════\n');

for (const scenario of SCENARIOS) {
    process.stdout.write(`  [${scenario.id}] ${scenario.description} ... `);

    let outputs: CalculatorResults | null = null;
    let error: string | undefined;

    try {
        outputs = calculateMaxBudget(scenario.inputs, scenario.config);
        console.log(outputs === null ? '⚠  returned null (expected for some edge cases)' : '✓');
    } catch (e: unknown) {
        error = e instanceof Error ? e.message : String(e);
        console.log(`✗  ERROR: ${error}`);
    }

    const si = scenario.inputs;
    const sc = scenario.config;

    snapshots.push({
        id: scenario.id,
        description: scenario.description,
        branches: scenario.branches,

        INPUTS: {

            CATEGORY_1_USER: {
                age: si.age,
                targetPropertyPrice_NIS: null,             // not stored in CalculatorInputs (wizard-only)
                equity_NIS: si.equity,
                netMonthlyIncome_NIS: si.netIncome,
                isFirstProperty: si.isFirstProperty,
                isIsraeliCitizen: si.ltv === 75 && si.isFirstProperty, // wizard field — mapped to tax residency in engine
                isIsraeliTaxResident: si.isIsraeliTaxResident,
                isRented: si.isRented,
                expectedRent_NIS_per_month: si.expectedRent,
                budgetCap_NIS_per_month: si.budgetCap,
            },

            CATEGORY_2_PARTNER: {
                maxDTIRatio_pct: si.ratio,
                maxApplicantAge: si.maxAge,
                maxLoanTermYears: sc.max_loan_term_years,
                rentRecognition_investment_pct: sc.rent_recognition_investment * 100,
                defaultInterestRate_pct: si.interest,
                lawyerFee_pct: sc.lawyer_fee_percent,
                brokerFee_pct: sc.broker_fee_percent,
                advisorFeeFixed_NIS: sc.advisor_fee_fixed,
                otherFeeFixed_NIS: sc.other_fee_fixed,
                defaultRentalYield_pct: sc.rental_yield_default,
            },

            CATEGORY_3_SYSTEM: {
                maxLTV_pct: si.ltv,
                vat_pct: sc.vat_percent,
                rentRecognition_firstProperty_pct: sc.rent_recognition_first_property * 100,
                enableRentValidation: sc.enable_rent_validation,
                rentWarningHighMultiplier: sc.rent_warning_high_multiplier,
                rentWarningLowMultiplier: sc.rent_warning_low_multiplier,
            },
        },

        OUTPUTS: outputs,
        ...(error ? { error } : {}),
    });
}

// ─── Write output ──────────────────────────────────────────────────────────────

if (!fs.existsSync(GOLDEN_DIR)) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
}

const output = {
    generatedAt: new Date().toISOString(),
    totalScenarios: snapshots.length,
    note: [
        'For each scenario, verify INPUTS (all 3 categories) against OUTPUTS using an external tool.',
        'When satisfied, run: npm run test:approve',
    ].join(' '),
    scenarios: snapshots,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

// ─── Print summary table ───────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`${'ID'.padEnd(28)} ${'Max Prop. Value'.padStart(18)} ${'Purch. Tax'.padStart(12)} ${'Monthly Pmt'.padStart(13)} ${'Tax Profile'.padStart(12)}`);
console.log('─'.repeat(88));

for (const s of snapshots) {
    const r = s.OUTPUTS;
    if (s.error) {
        console.log(`${s.id.padEnd(28)} ERROR: ${s.error}`);
    } else if (r === null) {
        console.log(`${s.id.padEnd(28)} ${'null (expected)'.padStart(18)}`);
    } else {
        const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
        console.log(
            `${s.id.padEnd(28)} ${fmt(r.maxPropertyValue).padStart(18)} ${fmt(r.purchaseTax).padStart(12)} ${fmt(r.monthlyPayment).padStart(13)} ${r.taxProfile.padStart(12)}`
        );
    }
}

console.log('─'.repeat(88));
console.log(`\n✅ Output written to:\n   ${OUTPUT_FILE}\n`);
console.log('👉 Next step: open snapshot-output.json, verify INPUTS vs OUTPUTS manually,');
console.log('   then run:  npm run test:approve\n');
