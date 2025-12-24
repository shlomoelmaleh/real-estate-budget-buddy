export type Language = 'he' | 'en' | 'fr';

export interface Translations {
  dir: 'rtl' | 'ltr';
  mainTitle: string;
  titleBase: string;
  fullName: string;
  phone: string;
  email: string;
  equity: string;
  ltv: string;
  netIncome: string;
  ratio: string;
  age: string;
  maxAge: string;
  interest: string;
  titleRent: string;
  isRented: string;
  yield: string;
  rentRecog: string;
  budgetCap: string;
  titleExpenses: string;
  purchaseTax: string;
  lawyer: string;
  broker: string;
  vat: string;
  advisor: string;
  other: string;
  calcBtn: string;
  titleResults: string;
  res_group1: string;
  res_pMax: string;
  res_loan: string;
  res_ltv: string;
  res_group2: string;
  res_pay: string;
  res_rent: string;
  res_netOut: string;
  res_group3: string;
  res_acq: string;
  res_totalInt: string;
  res_totalCost: string;
  toggleShow: string;
  toggleHide: string;
  titleAmort: string;
  th_month: string;
  th_open: string;
  th_pay: string;
  th_int: string;
  th_princ: string;
  th_close: string;
  currency: string;
  percent: string;
  fixed: string;
}

export const translations: Record<Language, Translations> = {
  he: {
    dir: 'rtl',
    mainTitle: "מחשבון תקציב רכישת נכס",
    titleBase: "נתוני בסיס",
    fullName: "שם מלא",
    phone: "טלפון",
    email: "אימייל",
    equity: "הון עצמי",
    ltv: "מימון מקסימלי",
    netIncome: "הכנסה פנויה",
    ratio: "יחס החזר",
    age: "גיל לווה",
    maxAge: "פריסה מקסימלית (גיל)",
    interest: "ריבית שנתית",
    titleRent: "שכירות והשקעה",
    isRented: "נכס להשקעה",
    yield: "תשואת שכירות",
    rentRecog: "הכרה בבנק",
    budgetCap: "תקרת החזר חודשי",
    titleExpenses: "הוצאות נלוות",
    purchaseTax: "מס רכישה",
    lawyer: "עו\"ד",
    broker: "תיווך",
    vat: "מע\"מ",
    advisor: "יועץ משכנתא",
    other: "שונות",
    calcBtn: "חשב עכשיו",
    titleResults: "תוצאות",
    res_group1: "שווי ומימון",
    res_pMax: "שווי נכס מקסימלי",
    res_loan: "סכום משכנתא",
    res_ltv: "אחוז מימון בפועל",
    res_group2: "תזרים חודשי",
    res_pay: "החזר חודשי משוער",
    res_rent: "הכנסה משכירות",
    res_netOut: "תשלום בקיזוז שכירות",
    res_group3: "עלויות כוללות",
    res_acq: "סך הוצאות נלוות",
    res_totalInt: "סך תשלומי ריבית",
    res_totalCost: "עלות כוללת",
    toggleShow: "הצג לוח סילוקין",
    toggleHide: "הסתר לוח סילוקין",
    titleAmort: "לוח סילוקין",
    th_month: "חודש",
    th_open: "פתיחה",
    th_pay: "תשלום",
    th_int: "ריבית",
    th_princ: "קרן",
    th_close: "סגירה",
    currency: "₪",
    percent: "%",
    fixed: "₪"
  },
  en: {
    dir: 'ltr',
    mainTitle: "Property Budget Calculator",
    titleBase: "Basic Information",
    fullName: "Full Name",
    phone: "Phone",
    email: "Email",
    equity: "Equity",
    ltv: "Max LTV",
    netIncome: "Net Income",
    ratio: "Repayment Ratio",
    age: "Borrower Age",
    maxAge: "Max Age (End of loan)",
    interest: "Annual Interest",
    titleRent: "Rent & Investment",
    isRented: "Investment Property",
    yield: "Rental Yield",
    rentRecog: "Bank Recognition",
    budgetCap: "Monthly Payment Cap",
    titleExpenses: "Closing Costs",
    purchaseTax: "Purchase Tax",
    lawyer: "Lawyer",
    broker: "Broker",
    vat: "VAT",
    advisor: "Mortgage Advisor",
    other: "Other Costs",
    calcBtn: "Calculate Now",
    titleResults: "Calculation Results",
    res_group1: "Value & Financing",
    res_pMax: "Max Property Value",
    res_loan: "Loan Amount",
    res_ltv: "Actual LTV",
    res_group2: "Monthly Cashflow",
    res_pay: "Est. Monthly Payment",
    res_rent: "Monthly Rent",
    res_netOut: "Net Out-of-pocket",
    res_group3: "Total Costs",
    res_acq: "Total Closing Costs",
    res_totalInt: "Total Interest Paid",
    res_totalCost: "Total Cost (Principal+Int)",
    toggleShow: "Show Amortization",
    toggleHide: "Hide Amortization",
    titleAmort: "Amortization Table",
    th_month: "Month",
    th_open: "Opening",
    th_pay: "Payment",
    th_int: "Interest",
    th_princ: "Principal",
    th_close: "Closing",
    currency: "₪",
    percent: "%",
    fixed: "₪"
  },
  fr: {
    dir: 'ltr',
    mainTitle: "Simulateur Budget Immobilier",
    titleBase: "Informations de Base",
    fullName: "Nom Complet",
    phone: "Téléphone",
    email: "Email",
    equity: "Apport Personnel",
    ltv: "Financement Max",
    netIncome: "Revenu Net",
    ratio: "Taux d'endettement",
    age: "Âge de l'emprunteur",
    maxAge: "Âge max fin de prêt",
    interest: "Taux d'intérêt annuel",
    titleRent: "Investissement Locatif",
    isRented: "Bien destiné à la location",
    yield: "Rendement Locatif",
    rentRecog: "Reconnaissance Banque",
    budgetCap: "Plafond Mensualité",
    titleExpenses: "Frais Annexes",
    purchaseTax: "Taxe d'acquisition",
    lawyer: "Avocat",
    broker: "Frais d'agence",
    vat: "TVA",
    advisor: "Courtier",
    other: "Divers",
    calcBtn: "Calculer le budget",
    titleResults: "Résultats",
    res_group1: "Valeur & Financement",
    res_pMax: "Valeur Max du Bien",
    res_loan: "Montant du Prêt",
    res_ltv: "LTV Actuel",
    res_group2: "Flux Mensuel",
    res_pay: "Mensualité Estimée",
    res_rent: "Loyer Mensuel",
    res_netOut: "Mensualité Nette",
    res_group3: "Coûts Totaux",
    res_acq: "Total Frais Annexes",
    res_totalInt: "Total Intérêts",
    res_totalCost: "Coût Total (Prêt+Intérêts)",
    toggleShow: "Afficher l'amortissement",
    toggleHide: "Masquer l'amortissement",
    titleAmort: "Tableau d'amortissement",
    th_month: "Mois",
    th_open: "Début",
    th_pay: "Vers.",
    th_int: "Intérêts",
    th_princ: "Principal",
    th_close: "Fin",
    currency: "₪",
    percent: "%",
    fixed: "₪"
  }
};
