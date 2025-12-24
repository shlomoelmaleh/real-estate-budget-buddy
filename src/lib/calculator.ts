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
  purchaseTaxPercent: number;
  purchaseTaxFixed: number;
  isPurchaseTaxPercent: boolean;
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
}

export interface AmortizationRow {
  month: number;
  opening: number;
  payment: number;
  interest: number;
  principal: number;
  closing: number;
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function parseFormattedNumber(value: string): number {
  return Number(value.replace(/,/g, '')) || 0;
}

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
    purchaseTaxPercent,
    purchaseTaxFixed,
    isPurchaseTaxPercent,
    lawyerPct,
    brokerPct,
    vatPct,
    advisorFee,
    otherFee,
  } = inputs;

  const years = Math.min(30, maxAge - age);
  if (years <= 0) return null;

  const l = ltv / 100;
  const r = ratio / 100;
  const rate = interest / 100;
  const mRate = rate / 12;
  const n = years * 12;

  // Amortization factor
  const A = mRate === 0 ? 1 / n : mRate / (1 - Math.pow(1 + mRate, -n));

  const yld = isRented ? rentalYield / 100 : 0;
  const recg = isRented ? rentRecognition / 100 : 0;

  const law = lawyerPct / 100;
  const bro = brokerPct / 100;
  const vat = vatPct / 100;

  const pTaxF = isPurchaseTaxPercent ? purchaseTaxPercent / 100 : 0;
  const fix = advisorFee + otherFee + (isPurchaseTaxPercent ? 0 : purchaseTaxFixed);

  const f = pTaxF + (law + bro) * (1 + vat);
  const P_eq = (equity - fix) / (1 + f - l);
  const denom = A * (1 + f) - (r * recg * yld) / 12;
  const P_inc = denom > 0 ? (r * netIncome + A * (equity - fix)) / denom : Infinity;

  let P_max = Math.min(P_eq, P_inc);

  if (budgetCap && budgetCap > 0) {
    const dBud = A * (1 + f) - yld / 12;
    const P_bud = dBud > 0 ? (budgetCap + A * (equity - fix)) / dBud : Infinity;
    P_max = Math.min(P_max, P_bud);
  }

  if (P_max <= 0 || !isFinite(P_max)) return null;

  const loan = P_max * (1 + f) - equity + fix;
  const pay = A * loan;
  const rent = (yld * P_max) / 12;
  const totalPay = pay * n;

  return {
    maxPropertyValue: P_max,
    loanAmount: loan,
    actualLTV: (loan / P_max) * 100,
    monthlyPayment: pay,
    rentIncome: rent,
    netPayment: pay - rent,
    closingCosts: P_max * f + fix,
    totalInterest: totalPay - loan,
    totalCost: totalPay,
    loanTermYears: years,
  };
}

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
