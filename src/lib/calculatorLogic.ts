/**
 * CALCULATOR LOGIC - Frontend Re-export
 * ======================================
 * This file re-exports the canonical engine from _shared/calculatorEngine.ts.
 * There is physically ONE source of truth for all math in the repository.
 *
 * DO NOT add calculation logic here. Edit _shared/calculatorEngine.ts instead.
 */

export {
    solveMaximumBudget,
    calculateMaxBudget,
    generateAmortizationTable,
    computePurchaseTax,
} from '../../supabase/functions/_shared/calculatorEngine';

export type {
    CalculatorInputs,
    CalculatorResults,
    CalculatorResults as Results,
    TaxProfile,
    TaxBracket,
    AmortizationRow,
    PartnerConfig as EnginePartnerConfig,
} from '../../supabase/functions/_shared/calculatorEngine';
