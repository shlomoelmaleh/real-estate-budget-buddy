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
 * Calculate closing costs for a given price
 */
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

/**
 * Unified Binary Search solver to find max affordable property price
 * Takes into account Equity, LTV, Income DTI, Rental Income, and Budget Cap
 */
function solveMaximumBudget(
  inputs: CalculatorInputs,
  taxProfile: TaxProfile,
  amortizationFactor: number,
  maxLoanTermMonths: number
): CalculatorResults | null {
  const {
    equity,
    ltv,
    netIncome,
    ratio,
    rentalYield,
    rentRecognition,
    budgetCap,
    isRented,
    lawyerPct,
    brokerPct,
    vatPct,
    advisorFee,
    otherFee,
    interest
  } = inputs;

  let low = 0;
  let high = equity * 20; // Sufficiently high upper bound
  let iterations = 0;

  // Best valid result found so far
  let bestResult: CalculatorResults | null = null;

  while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
    iterations++;
    const price = (low + high) / 2;

    // 1. Calculate Costs
    const purchaseTax = computePurchaseTax(price, taxProfile);
    const closingCosts = calculateClosingCosts(
      price, purchaseTax, lawyerPct, brokerPct, vatPct, advisorFee, otherFee
    );

    // 2. Calculate Max Loan Allowed
    // a. Income Constraint (DTI)
    // Rent calculation: price * yield * recognition
    const estimatedRent = isRented ? (price * (rentalYield / 100)) / 12 : 0;
    const recognizedRent = estimatedRent * (rentRecognition / 100);
    const maxMonthlyPaymentByIncome = (netIncome + recognizedRent) * (ratio / 100);

    // b. Budget Cap (User Defined Max Payment)
    const maxPayment = (budgetCap && budgetCap > 0)
      ? Math.min(maxMonthlyPaymentByIncome, budgetCap)
      : maxMonthlyPaymentByIncome;

    const maxLoanByPayment = maxPayment / amortizationFactor;

    // c. LTV Constraint
    const maxLoanByLTV = price * (ltv / 100);

    // Final Max Loan for this price
    const maxLoan = Math.min(maxLoanByPayment, maxLoanByLTV);

    // 3. Check Equity Requirement
    // Price + Costs = Equity + Loan
    // RequiredEquity = Price + Costs - Loan
    const requiredEquity = price + closingCosts - maxLoan;

    if (requiredEquity <= equity + TOLERANCE) { // Allow small float margin
      // This price is feasible, try higher
      low = price;

      // Store details for this valid price
      const loan = maxLoan;
      const payment = loan * amortizationFactor;

      const lawyerFeeTTC = price * (lawyerPct / 100) * (1 + vatPct / 100);
      const brokerFeeTTC = price * (brokerPct / 100) * (1 + vatPct / 100);

      bestResult = {
        maxPropertyValue: price,
        loanAmount: loan,
        actualLTV: (loan / price) * 100,
        monthlyPayment: payment,
        rentIncome: estimatedRent,
        netPayment: payment - estimatedRent,
        closingCosts: closingCosts,
        totalInterest: (payment * maxLoanTermMonths) - loan,
        totalCost: payment * maxLoanTermMonths,
        loanTermYears: maxLoanTermMonths / 12,
        purchaseTax,
        taxProfile,
        equityUsed: price + closingCosts - loan, // Actual used equity
        equityRemaining: equity - (price + closingCosts - loan),
        lawyerFeeTTC,
        brokerFeeTTC
      };
    } else {
      // Too expensive, try lower
      high = price;
    }
  }

  return bestResult;
}

// ============= MAIN CALCULATION FUNCTION =============

export function calculate(inputs: CalculatorInputs): CalculatorResults | null {
  const {
    age,
    maxAge,
    interest,
    isFirstProperty,
    isIsraeliTaxResident,
  } = inputs;

  const years = Math.min(30, maxAge - age);
  if (years <= 0) return null;

  const n = years * 12;
  const rate = interest / 100;
  const mRate = rate / 12;
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

  // Determine tax profile
  const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);

  // Solve
  return solveMaximumBudget(inputs, taxProfile, A, n);
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
