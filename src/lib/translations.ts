export type Language = 'he' | 'en' | 'fr';

export interface Translations {
  dir: 'rtl' | 'ltr';
  mainTitle: string;
  subtitle: string;
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
  lawyerLabel: string;
  brokerLabel: string;
  other: string;
  ttc: string;
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
  res_shekelRatio: string;
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
  downloadCSV: string;
  // Charts
  chartBalanceTitle: string;
  chartBalanceDesc: string;
  chartPaymentTitle: string;
  chartPaymentDesc: string;
  chartYear: string;
  chartYears: string;
  chartBalance: string;
  chartPrincipal: string;
  chartInterest: string;
  // Report actions
  downloadPDF: string;
  printReport: string;
  sendEmail: string;
  pdfSuccess: string;
  pdfError: string;
  emailSuccess: string;
  emailError: string;
  emailRequired: string;
  disclaimer: string;
  // Advisor contact
  advisorName: string;
  advisorPhone: string;
  advisorEmail: string;
  advisorTitle: string;
  companyName: string;
  // Client version
  confirmationTitle: string;
  confirmationMessage: string;
  requiredField: string;
  rateLimitError: string;
  isFirstProperty: string;
  isIsraeliCitizen: string;
  isIsraeliTaxResident: string;
  yes: string;
  no: string;
  titlePersonal: string;
  titlePropertyStatus: string;
  titleFinancial: string;
  // NEW: Tax disclaimer & labels
  taxDisclaimer: string;
  purchaseTaxCalculated: string;
  taxProfileSingleHome: string;
  taxProfileInvestor: string;
  // Equity usage
  equityUsed: string;
  equityRemaining: string;
  // Helper texts (UI refactor)
  helperRentEstimate: string;
  helperBudgetCap: string;
  helperNetIncome: string;
  netIncomeLabel: string;
  expectedRent: string;
  expectedRentPlaceholder: string;
  helperSimulation: string;
}

export const translations: Record<Language, Translations> = {
  he: {
    dir: 'rtl',
    mainTitle: "מחשבון תקציב רכישת נכס",
    subtitle: "כלי מקצועי לתכנון רכישת נדל״ן",
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
    lawyerLabel: "עו\"ד (1% + מע\"מ)",
    brokerLabel: "תיווך (2% + מע\"מ)",
    other: "שונות",
    ttc: "כולל מע\"מ",
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
    res_shekelRatio: "יחס שקל לשקל",
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
    fixed: "₪",
    downloadCSV: "הורד CSV",
    chartBalanceTitle: "יתרת קרן לאורך זמן",
    chartBalanceDesc: "גרף המראה כיצד החוב יורד עם כל תשלום חודשי",
    chartPaymentTitle: "פירוט תשלומים שנתי",
    chartPaymentDesc: "כמה מכל תשלום הולך לריבית וכמה לקרן",
    chartYear: "שנה",
    chartYears: "שנים",
    chartBalance: "יתרת חוב",
    chartPrincipal: "קרן",
    chartInterest: "ריבית",
    downloadPDF: "הורד PDF",
    printReport: "הדפס",
    sendEmail: "שלח לאימייל",
    pdfSuccess: "הדוח הורד בהצלחה",
    pdfError: "שגיאה בהורדת הדוח",
    emailSuccess: "הדוח נשלח בהצלחה",
    emailError: "שגיאה בשליחת הדוח",
    emailRequired: "נא להזין כתובת אימייל",
    disclaimer: "הנתונים המוצגים מהווים סימולציה בלבד ואינם מהווים הצעה מחייבת או ייעוץ. הריבית והנתונים הסופיים ייקבעו על ידי הגוף המלווה בלבד.",
    advisorName: "שלמה אלמליח",
    advisorPhone: "054-9997711",
    advisorEmail: "shlomo.elmaleh@gmail.com",
    advisorTitle: "יעוץ משכנתא | כלכלת המשפחה",
    companyName: "אשל פיננסים",
    confirmationTitle: "תודה רבה!",
    confirmationMessage: "הדוח נשלח לכתובת האימייל שלך. נציג יצור איתך קשר בהקדם.",
    requiredField: "שדה חובה",
    rateLimitError: "בקשות רבות מדי. אנא נסה שוב בעוד דקה.",
    isFirstProperty: "נכס ראשון בישראל?",
    isIsraeliCitizen: "בעל אזרחות ישראלית?",
    isIsraeliTaxResident: "האם תושב מס בישראל?",
    yes: "כן",
    no: "לא",
    titlePersonal: "פרטים אישיים",
    titlePropertyStatus: "מצב נכס",
    titleFinancial: "נתונים פיננסיים",
    // Tax disclaimer & labels
    taxDisclaimer: "לתשומת לבך: חישוב מס הרכישה בסימולטור זה מבוסס על מדרגות המס הסטנדרטיות (דירה יחידה או דירה נוספת). החישוב אינו לוקח בחשבון הטבות ספציפיות כגון: עולה חדש, נכות, או תושב חוזר. גובה המס הסופי ייקבע רק על ידי עו\"ד מקרקעין.",
    purchaseTaxCalculated: "מס רכישה מחושב",
    taxProfileSingleHome: "דירה יחידה",
    taxProfileInvestor: "דירה נוספת",
    // Equity usage
    equityUsed: "הון עצמי בשימוש",
    equityRemaining: "יתרת הון עצמי",
    // Helper texts (UI refactor)
    helperRentEstimate: "אם כן: תילקח בחשבון הערכת שכירות סטנדרטית (עם מקדם זהירות).",
    helperBudgetCap: "אופציונלי: לחישוב לפי נוחות החזר חודשית.",
    helperNetIncome: "סכום שכבר מנוכה מהחזרי הלוואות קיימות (אם יש).",
    netIncomeLabel: "הכנסה נטו פנויה",
    expectedRent: "שכירות חודשית צפויה",
    expectedRentPlaceholder: "השאר ריק לחישוב אוטומטי (3% תשואה שנתית)",
    helperSimulation: "סימולציה ראשונית לצורך סדר גודל. בהמשך נחדד לפי הנתונים המדויקים."
  },
  en: {
    dir: 'ltr',
    mainTitle: "Property Budget Calculator",
    subtitle: "Professional real estate acquisition planning tool",
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
    lawyerLabel: "Lawyer (1% + VAT)",
    brokerLabel: "Agency (2% + VAT)",
    other: "Other Costs",
    ttc: "incl. VAT",
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
    res_shekelRatio: "Shekel-to-Shekel Ratio",
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
    fixed: "₪",
    downloadCSV: "Download CSV",
    chartBalanceTitle: "Loan Balance Over Time",
    chartBalanceDesc: "See how your debt decreases with each monthly payment",
    chartPaymentTitle: "Annual Payment Breakdown",
    chartPaymentDesc: "How much of each payment goes to interest vs principal",
    chartYear: "Year",
    chartYears: "Years",
    chartBalance: "Remaining Balance",
    chartPrincipal: "Principal",
    chartInterest: "Interest",
    downloadPDF: "Download PDF",
    printReport: "Print",
    sendEmail: "Send Email",
    pdfSuccess: "Report downloaded successfully",
    pdfError: "Error downloading report",
    emailSuccess: "Report sent successfully",
    emailError: "Error sending report",
    emailRequired: "Please enter an email address",
    disclaimer: "This simulation is for illustrative purposes only and does not constitute a binding offer. Final rates and terms are subject to lender approval.",
    advisorName: "Shlomo Elmaleh",
    advisorPhone: "+972-054-9997711",
    advisorEmail: "shlomo.elmaleh@gmail.com",
    advisorTitle: "Mortgage Consulting | Family Finance",
    companyName: "Eshel Finances",
    confirmationTitle: "Thank You!",
    confirmationMessage: "The report has been sent to your email. A representative will contact you shortly.",
    requiredField: "Required field",
    rateLimitError: "Too many requests. Please try again in a moment.",
    isFirstProperty: "First property in Israel?",
    isIsraeliCitizen: "Israeli citizenship?",
    isIsraeliTaxResident: "Israeli tax resident?",
    yes: "Yes",
    no: "No",
    titlePersonal: "Personal Information",
    titlePropertyStatus: "Property Status",
    titleFinancial: "Financial Information",
    // Tax disclaimer & labels
    taxDisclaimer: "Note: The purchase tax calculation is based on standard brackets (single or additional home). It does not account for specific benefits like New Immigrant (Oleh Hadash), disability, or returning resident. The final tax amount will be determined solely by a real estate lawyer.",
    purchaseTaxCalculated: "Calculated Purchase Tax",
    taxProfileSingleHome: "Single Home",
    taxProfileInvestor: "Additional Property",
    // Equity usage
    equityUsed: "Equity Used",
    equityRemaining: "Remaining Equity",
    // Helper texts (UI refactor)
    helperRentEstimate: "If yes: a standard rent estimate is included (with a prudence margin).",
    helperBudgetCap: "Optional: to calculate based on your comfort limit.",
    helperNetIncome: "Net income already reduced by existing loan payments (if any).",
    netIncomeLabel: "Available net income",
    expectedRent: "Expected Monthly Rent",
    expectedRentPlaceholder: "Leave empty for auto-calc (3% annual yield)",
    helperSimulation: "Indicative estimate to frame your budget; we'll refine it with your details."
  },
  fr: {
    dir: 'ltr',
    mainTitle: "Simulateur Budget Immobilier",
    subtitle: "Outil professionnel de planification d'acquisition immobilière",
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
    lawyerLabel: "Avocat (1% H.T)",
    brokerLabel: "Frais d'agence (2% H.T)",
    other: "Divers",
    ttc: "T.T.C",
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
    res_shekelRatio: "Ratio Shekel pour Shekel",
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
    fixed: "₪",
    downloadCSV: "Télécharger CSV",
    chartBalanceTitle: "Solde du Prêt dans le Temps",
    chartBalanceDesc: "Voyez comment votre dette diminue avec chaque mensualité",
    chartPaymentTitle: "Répartition Annuelle des Paiements",
    chartPaymentDesc: "Quelle part de chaque paiement va aux intérêts vs au capital",
    chartYear: "Année",
    chartYears: "Années",
    chartBalance: "Solde Restant",
    chartPrincipal: "Capital",
    chartInterest: "Intérêts",
    downloadPDF: "Télécharger PDF",
    printReport: "Imprimer",
    sendEmail: "Envoyer par Email",
    pdfSuccess: "Rapport téléchargé avec succès",
    pdfError: "Erreur lors du téléchargement",
    emailSuccess: "Rapport envoyé avec succès",
    emailError: "Erreur lors de l'envoi",
    emailRequired: "Veuillez entrer une adresse email",
    disclaimer: "Cette simulation est fournie à titre indicatif uniquement et ne constitue pas une offre contractuelle. Les taux et conditions définitifs dépendent de l'organisme prêteur.",
    advisorName: "Shlomo Elmaleh",
    advisorPhone: "+972-054-9997711",
    advisorEmail: "shlomo.elmaleh@gmail.com",
    advisorTitle: "Conseil Hypothécaire | Finances Familiales",
    companyName: "Eshel Finances",
    confirmationTitle: "Merci !",
    confirmationMessage: "Le rapport a été envoyé à votre adresse email. Un conseiller vous contactera prochainement.",
    requiredField: "Champ obligatoire",
    rateLimitError: "Trop de requêtes. Veuillez réessayer dans un moment.",
    isFirstProperty: "Votre premier bien en Israël ?",
    isIsraeliCitizen: "Avez-vous la nationalité israélienne ?",
    isIsraeliTaxResident: "Êtes-vous résident fiscal israélien ?",
    yes: "Oui",
    no: "Non",
    titlePersonal: "Informations Personnelles",
    titlePropertyStatus: "Situation Immobilière",
    titleFinancial: "Données Financières",
    // Tax disclaimer & labels
    taxDisclaimer: "Attention : Le calcul des droits de mutation est basé sur les barèmes standards. Il ne prend pas en compte les exonérations spécifiques (Oleh Hadash, handicap, etc.). Le montant définitif de la taxe doit être vérifié par un avocat spécialisé.",
    purchaseTaxCalculated: "Taxe d'acquisition calculée",
    taxProfileSingleHome: "Résidence principale",
    taxProfileInvestor: "Bien d'investissement",
    // Equity usage
    equityUsed: "Apport utilisé",
    equityRemaining: "Apport restant",
    // Helper texts (UI refactor)
    helperRentEstimate: "Si oui : une estimation standard du loyer est intégrée (avec marge de prudence).",
    helperBudgetCap: "Optionnel : pour calculer selon votre confort mensuel.",
    helperNetIncome: "Montant déjà déduit de vos crédits existants (si vous en avez).",
    netIncomeLabel: "Revenu net disponible",
    expectedRent: "Loyer mensuel attendu",
    expectedRentPlaceholder: "Laissez vide pour calcul auto (3% rendement annuel)",
    helperSimulation: "Simulation indicative pour cadrer votre budget. Nous affinerons ensuite selon votre situation."
  }
};
