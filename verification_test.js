
// Mock TAX_BRACKETS
const TAX_BRACKETS = {
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

const TOLERANCE = 100;
const MAX_ITERATIONS = 50;

function determineTaxProfile(isFirstProperty, isIsraeliTaxResident) {
    if (isFirstProperty && isIsraeliTaxResident) {
        return 'SINGLE_HOME';
    }
    return 'INVESTOR';
}

function computePurchaseTax(price, profile) {
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
    price,
    purchaseTax,
    lawyerPct,
    brokerPct,
    vatPct,
    advisorFee,
    otherFee
) {
    const lawyerFee = price * (lawyerPct / 100) * (1 + vatPct / 100);
    const brokerFee = price * (brokerPct / 100) * (1 + vatPct / 100);
    return purchaseTax + lawyerFee + brokerFee + advisorFee + otherFee;
}

function solveMaximumBudget(
    inputs,
    taxProfile,
    amortizationFactor,
    maxLoanTermMonths
) {
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
    let high = equity * 20;
    let iterations = 0;

    let bestResult = null;

    while (high - low > TOLERANCE && iterations < MAX_ITERATIONS) {
        iterations++;
        const price = (low + high) / 2;

        // 1. Calculate Costs
        const purchaseTax = computePurchaseTax(price, taxProfile);
        const closingCosts = calculateClosingCosts(
            price, purchaseTax, lawyerPct, brokerPct, vatPct, advisorFee, otherFee
        );

        // 2. Calculate Max Loan Allowed
        // a. Income Constraint
        const estimatedRent = isRented ? (price * (rentalYield / 100)) / 12 : 0;
        const recognizedRent = estimatedRent * (rentRecognition / 100);
        const maxMonthlyPaymentByIncome = (netIncome + recognizedRent) * (ratio / 100);

        // b. Budget Cap
        const maxPayment = (budgetCap && budgetCap > 0)
            ? Math.min(maxMonthlyPaymentByIncome, budgetCap)
            : maxMonthlyPaymentByIncome;

        const maxLoanByPayment = maxPayment / amortizationFactor;

        // c. LTV Constraint
        const maxLoanByLTV = price * (ltv / 100);

        // Final Max Loan
        const maxLoan = Math.min(maxLoanByPayment, maxLoanByLTV);

        // 3. Check Equity Requirement
        // RequiredEquity = Price + Costs - Loan
        const requiredEquity = price + closingCosts - maxLoan;

        if (requiredEquity <= equity + TOLERANCE) {
            low = price;

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
                equityUsed: price + closingCosts - loan,
                equityRemaining: equity - (price + closingCosts - loan),
                lawyerFeeTTC,
                brokerFeeTTC
            };
        } else {
            high = price;
        }
    }

    return bestResult;
}

function calculate(inputs) {
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

    const taxProfile = determineTaxProfile(isFirstProperty, isIsraeliTaxResident);

    return solveMaximumBudget(inputs, taxProfile, A, n);
}

// TEST CASE
const testInputs = {
    equity: 3000000,
    ltv: 75,
    netIncome: 40000,
    ratio: 33,
    age: 30,
    maxAge: 80,
    interest: 5.0,
    isRented: false,
    rentalYield: 3.0,
    rentRecognition: 80,
    budgetCap: null,
    isFirstProperty: true,
    isIsraeliTaxResident: true,
    lawyerPct: 1.0,
    brokerPct: 2.0,
    vatPct: 18,
    advisorFee: 15000,
    otherFee: 3000,
};

console.log("Running calculation with test inputs:", testInputs);
const result = calculate(testInputs);

if (result) {
    console.log("------------------------------------------------");
    console.log("Max Property Value:", result.maxPropertyValue.toLocaleString());
    console.log("Loan Amount:", result.loanAmount.toLocaleString());
    console.log("Actual LTV:", result.actualLTV.toFixed(2) + "%");
    console.log("Monthly Payment:", result.monthlyPayment.toLocaleString());
    console.log("Closing Costs:", result.closingCosts.toLocaleString());
    console.log("Equity Used:", result.equityUsed.toLocaleString());
    console.log("Equity Remaining:", result.equityRemaining.toLocaleString());
    console.log("------------------------------------------------");

    // Verification Logic
    const price = result.maxPropertyValue;
    // Check if price > 2.8M (Old buggy result ~2.8M)
    if (price > 4000000) {
        console.log("SUCCESS: Budget is properly maximized beyond the constrained LTV model.");
    } else {
        console.log("FAILURE: Budget seems low.");
    }
} else {
    console.log("Calculation returned null");
}
