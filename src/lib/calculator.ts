// ============= TAX PROFILE TYPES & BRACKETS (2024/2025) =============

export type TaxProfile = 'SINGLE_HOME' | 'INVESTOR';

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export const TAX_BRACKETS: Record<TaxProfile, TaxBracket[]> = {
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

// Binary search parameters
const TOLERANCE = 100; // ₪100 precision
const MAX_ITERATIONS = 50; // Safety break

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
  // New: for automatic tax calculation
  isFirstProperty: boolean;
  isIsraeliTaxResident: boolean;
  // Keep legacy fields for other costs
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
  // New: computed tax data
  purchaseTax: number;
  taxProfile: TaxProfile;
  // Equity usage
  equityUsed: number;
  equityRemaining: number;
  // Detailed closing costs
  lawyerFeeTTC: number;
  brokerFeeTTC: number;
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

// ============= TAX CALCULATION FUNCTIONS =============

/**
 * Determine tax profile based on user inputs
 */
export function determineTaxProfile(isFirstProperty: boolean, isIsraeliTaxResident: boolean): TaxProfile {
  if (isFirstProperty && isIsraeliTaxResident) {
    return 'SINGLE_HOME';
  }
  return 'INVESTOR';
}

/**
 * Compute progressive purchase tax (Mas Rechisha) based on price and profile
 */
export function computePurchaseTax(price: number, profile: TaxProfile): number {
  const brackets = TAX_BRACKETS[profile];
  let tax = 0;

  for (const bracket of brackets) {
    if (price <= bracket.min) break;
    const taxableAmount = Math.min(price, bracket.max) - bracket.min;
    tax += taxableAmount * bracket.rate;
  }

  return tax;
}

/**
 * Calculate total equity required for a given price
 */
function calculateTotalEquityRequired(
  price: number,
  purchaseTax: number,
  ltv: number,
  lawyerPct: number,
  brokerPct: number,
  vatPct: number,
  advisorFee: number,
  otherFee: number
): number {
  const ltvDecimal = ltv / 100;
  const downPayment = price * (1 - ltvDecimal);
  
  const lawyerFee = price * (lawyerPct / 100) * (1 + vatPct / 100);
  const brokerFee = price * (brokerPct / 100) * (1 + vatPct / 100);
  const otherCosts = advisorFee + otherFee;
  
  return downPayment + purchaseTax + lawyerFee + brokerFee + otherCosts;
}

/**
 * Binary Search solver to find max affordable property price
 */
function solveMaxPrice(inputs: CalculatorInputs, taxProfile: TaxProfile): number | null {
  const { equity, ltv, lawyerPct, brokerPct, vatPct, advisorFee, otherFee } = inputs;
  
  let low = 0;
  let high = equity * 15; // Upper bound estimate
  let iterations = 0;
  
  while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
    iterations++;
    const mid = (low + high) / 2;
    const tax = computePurchaseTax(mid, taxProfile);
    const totalRequired = calculateTotalEquityRequired(
      mid, tax, ltv, lawyerPct, brokerPct, vatPct, advisorFee, otherFee
    );
    
    if (totalRequired <= equity) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  // Safety check
  if (iterations >= MAX_ITERATIONS) {
    console.warn('[DEV] Binary search hit max iterations');
  }
  
  return low > 0 ? low : null;
}

// ============= MAIN CALCULATION FUNCTION =============

export function calculate(inputs: CalculatorInputs): CalculatorResults | null {
  const {
    equity,
    ltv,
    netIncome,
    ratio,
    age,
    maxAge,
    interest,
    isRented,
    rentalYield,
    rentRecognition,
    budgetCap,
    isFirstProperty,
    isIsraeliTaxResident,
    lawyerPct,
    brokerPct,
    vatPct,
    advisorFee,
    otherFee,
  } = inputs;

  const years = Math.min(30, maxAge - age);
  if (years <= 0) return null;

  // Determine tax profile
  const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);
  
  // Use binary search to find max property value considering progressive tax
  const maxPriceFromEquity = solveMaxPrice(inputs, taxProfile);
  if (!maxPriceFromEquity) return null;

  const l = ltv / 100;
  const r = ratio / 100;
  const rate = interest / 100;
  const mRate = rate / 12;
  const n = years * 12;

  // Amortization factor
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

  const yld = isRented ? rentalYield / 100 : 0;
  const recg = isRented ? rentRecognition / 100 : 0;

  // Calculate max price from income constraint
  const loanFromEquityPrice = maxPriceFromEquity * l;
  const maxPaymentFromIncome = netIncome * r;
  const rentBoost = recg * yld * maxPriceFromEquity / 12;
  const effectiveMaxPayment = maxPaymentFromIncome + rentBoost;
  const maxLoanFromIncome = effectiveMaxPayment / A;
  const maxPriceFromIncome = maxLoanFromIncome / l;

  // Apply budget cap if set
  let P_max = Math.min(maxPriceFromEquity, maxPriceFromIncome);
  
  if (budgetCap && budgetCap > 0) {
    const maxLoanFromBudget = budgetCap / A;
    const maxPriceFromBudget = maxLoanFromBudget / l;
    P_max = Math.min(P_max, maxPriceFromBudget);
  }

  if (P_max <= 0 || !isFinite(P_max)) return null;

  // Calculate final values
  const purchaseTax = computePurchaseTax(P_max, taxProfile);
  const loan = P_max * l;
  const pay = A * loan;
  const rent = (yld * P_max) / 12;
  const totalPay = pay * n;

  // Closing costs (without purchase tax, we'll add it separately for display)
  const law = lawyerPct / 100;
  const bro = brokerPct / 100;
  const vat = vatPct / 100;
  const lawyerFeeTTC = P_max * law * (1 + vat);
  const brokerFeeTTC = P_max * bro * (1 + vat);
  const otherClosingCosts = lawyerFeeTTC + brokerFeeTTC + advisorFee + otherFee;
  const totalClosingCosts = purchaseTax + otherClosingCosts;

  // Calculate equity usage
  const downPayment = P_max * (1 - l);
  const equityUsed = downPayment + totalClosingCosts;
  const equityRemaining = equity - equityUsed;

  return {
    maxPropertyValue: P_max,
    loanAmount: loan,
    actualLTV: (loan / P_max) * 100,
    monthlyPayment: pay,
    rentIncome: rent,
    netPayment: pay - rent,
    closingCosts: totalClosingCosts,
    totalInterest: totalPay - loan,
    totalCost: totalPay,
    loanTermYears: years,
    purchaseTax,
    taxProfile,
    equityUsed,
    equityRemaining,
    lawyerFeeTTC,
    brokerFeeTTC,
  };
}

// ============= AMORTIZATION TABLE =============

export function generateAmortizationTable(
  loanAmount: number,
  annualInterest: number,
  years: number
): AmortizationRow[] {
  const mRate = annualInterest / 100 / 12;
  const n = years * 12;
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));
  const monthlyPayment = A * loanAmount;

  const rows: AmortizationRow[] = [];
  let balance = loanAmount;

  for (let i = 1; i <= Math.min(n, 360) && balance > 0.1; i++) {
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
