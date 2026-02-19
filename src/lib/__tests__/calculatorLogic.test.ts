/**
 * CALCULATOR LOGIC — VITEST TEST SUITE
 * ─────────────────────────────────────
 * Run with: npm test
 *
 * This file reads the approved golden-reference.json and asserts that the
 * current engine produces the same results (within tolerance).
 *
 * TOLERANCE: ±100 NIS for monetary values, ±0.01% for ratios.
 *
 * ⚠️  Do NOT edit golden-reference.json manually.
 *     Instead run: npm run test:snapshot → verify → npm run test:approve
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { calculateMaxBudget } from '../calculatorLogic';
import { SCENARIOS } from './scenarios';
import type { CalculatorResults } from '../calculator';

// ── Load golden reference ─────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REFERENCE_FILE = path.join(__dirname, 'golden', 'golden-reference.json');

interface GoldenEntry {
    id: string;
    description: string;
    INPUTS: Record<string, unknown>;
    OUTPUTS: CalculatorResults | null;
    error?: string;
}

interface GoldenReference {
    generatedAt: string;
    scenarios: GoldenEntry[];
}

let golden: GoldenReference;

beforeAll(() => {
    if (!fs.existsSync(REFERENCE_FILE)) {
        throw new Error(
            `\n\n❌ Golden reference not found at:\n   ${REFERENCE_FILE}\n\n` +
            `Please run the following steps first:\n` +
            `   1. npm run test:snapshot   (generate outputs)\n` +
            `   2. Verify snapshot-output.json manually\n` +
            `   3. npm run test:approve    (lock as golden reference)\n`
        );
    }
    golden = JSON.parse(fs.readFileSync(REFERENCE_FILE, 'utf-8'));
});

// ── Tolerance helpers ─────────────────────────────────────────────────────────

/** Monetary tolerance: ±100 NIS (due to binary search convergence) */
const MONEY_TOL = 100;
/** Ratio/percentage tolerance: ±0.05% */
const RATIO_TOL = 0.05;

function withinMoney(actual: number, expected: number, label: string) {
    expect(actual, label).toBeGreaterThanOrEqual(expected - MONEY_TOL);
    expect(actual, label).toBeLessThanOrEqual(expected + MONEY_TOL);
}

function withinRatio(actual: number, expected: number, label: string) {
    expect(actual, label).toBeCloseTo(expected, 2); // 2 decimal places = ±0.005
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('Calculator Engine — Golden Reference Tests', () => {

    for (const scenario of SCENARIOS) {
        it(`[${scenario.id}] ${scenario.description}`, () => {

            // Find matching golden entry
            const goldenEntry = golden.scenarios.find(g => g.id === scenario.id);

            expect(goldenEntry, `No golden entry for scenario ${scenario.id}. Re-run test:snapshot and test:approve.`).toBeDefined();

            // Run the engine with current code
            const actual = calculateMaxBudget(scenario.inputs, scenario.config);

            const expected = goldenEntry!.OUTPUTS;

            // ── Case: expected null (e.g. age edge case) ────────────────────────
            if (expected === null) {
                expect(actual, 'Expected calc to return null').toBeNull();
                return;
            }

            // ── Case: expected a valid result ───────────────────────────────────
            expect(actual, 'Expected calc to return a result, got null').not.toBeNull();
            const r = actual!;

            // Core financial outputs
            withinMoney(r.maxPropertyValue, expected.maxPropertyValue, 'maxPropertyValue');
            withinMoney(r.loanAmount, expected.loanAmount, 'loanAmount');
            withinMoney(r.monthlyPayment, expected.monthlyPayment, 'monthlyPayment');
            withinMoney(r.closingCosts, expected.closingCosts, 'closingCosts');
            withinMoney(r.purchaseTax, expected.purchaseTax, 'purchaseTax');
            withinMoney(r.equityUsed, expected.equityUsed, 'equityUsed');
            withinMoney(r.equityRemaining, expected.equityRemaining, 'equityRemaining');
            withinMoney(r.netPayment, expected.netPayment, 'netPayment');
            withinMoney(r.rentIncome, expected.rentIncome, 'rentIncome');
            withinMoney(r.lawyerFeeTTC, expected.lawyerFeeTTC, 'lawyerFeeTTC');
            withinMoney(r.brokerFeeTTC, expected.brokerFeeTTC, 'brokerFeeTTC');

            // Ratios and derived values
            withinRatio(r.actualLTV, expected.actualLTV, 'actualLTV');
            withinRatio(r.loanTermYears, expected.loanTermYears, 'loanTermYears');

            // Categorical / enum fields — must match exactly
            expect(r.taxProfile, 'taxProfile').toBe(expected.taxProfile);
            expect(r.rentWarning, 'rentWarning').toBe(expected.rentWarning ?? null);

            // Amortization table — structural checks only (not row-by-row comparison)
            if (expected.amortizationTable && expected.amortizationTable.length > 0) {
                expect(r.amortizationTable, 'amortizationTable should be populated').toBeDefined();
                expect(r.amortizationTable!.length, 'amortizationTable row count').toBe(expected.amortizationTable.length);

                // First row: payment should equal expected
                withinMoney(
                    r.amortizationTable![0].payment,
                    expected.amortizationTable[0].payment,
                    'amortizationTable[0].payment'
                );

                // Last row: closing balance should be near 0
                const lastRow = r.amortizationTable![r.amortizationTable!.length - 1];
                expect(lastRow.closing, 'final amortization balance should be near 0').toBeLessThan(MONEY_TOL);
            }
        });
    }
});
