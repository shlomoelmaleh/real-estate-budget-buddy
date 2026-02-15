// ============= TYPE DEFINITIONS ONLY =============
// All calculation logic has been moved to secure server-side edge function
// This file only contains types and utility functions

// ============= TAX PROFILE TYPES =============

export type TaxProfile = 'SINGLE_HOME' | 'INVESTOR';

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// ============= CALCULATOR INTERFACES =============

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
  limitingFactor?: 'EQUITY_LIMIT' | 'INCOME_LIMIT' | 'LTV_LIMIT' | 'AGE_LIMIT' | 'INSUFFICIENT_DATA';
  rentWarning?: 'high' | 'low' | null;
  estimatedMarketRent?: number;
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

// ============= UTILITY FUNCTIONS =============

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, '')) || 0;
}
