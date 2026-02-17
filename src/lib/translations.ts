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
  labelEstimatedRent: string;
  labelUserRent: string;
  helperSimulation: string;
  targetPropertyPrice: string;
  targetPropertyPriceHelper: string;
  isRentedYes: string;
  isRentedNo: string;
  optional: string;
  floatingContact: string;
  // WhatsApp messages
  whatsappMessageWithPartner: (partnerName: string) => string;
  whatsappMessageDefault: string;
  // Wizard
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  step4Title: string;
  step4Desc: string;
  nextBtn: string;
  backBtn: string;
  revealBtn: string;
  loadingText: string;
  successTitle: string;
  successSubtitle: string;
  leadCaptureTitle: string;
  leadCaptureBtn: string;
  wizardWelcome: string;
  wizardFoundation: string;
  wizardBlueprint: string;
  wizardPeace: string;
  revealSuccessHeader: string;
  startBtn: string;
  partnerLogin: string;
  managePartnerSettings: string;
  welcomeTitle: string;
  welcomeSub: string;
  welcomeBtn: string;
  videoCaption: string;
  trustTime: string;
  trustSecurity: string;
  roadmap1Title: string;
  roadmap1Desc: string;
  roadmap2Title: string;
  roadmap2Desc: string;
  roadmap3Title: string;
  roadmap3Desc: string;
  roadmap4Title: string;
  roadmap4Desc: string;
  currencySymbol: string;
  convertNotice: string;
  // Financial Strength Celebration
  milestone1: string;
  milestone2: string;
  milestone3: string;
  revealComplete: string;
  // Dossier Strategy
  dossierTeaser: string;
  unlockDossierBtn: string;
  hookIncome: string;
  hookEquity: string;
  hookLTV: string;
  hookAge: string;
  hookDefault: string;
  dossierSubject: string;
  // Strategic Moat (Phase 5)
  overviewTitle: string;
  noteIncome: string;
  noteEquity: string;
  noteLTV: string;
  noteAge: string;
  whatIfText: string;
  expertCommitment: string;
  // Partner Config Tabs
  tabBranding: string;
  tabCredit: string;
  tabFees: string;
  tabCalculator: string;
  // Branding Fields
  brandColor: string;
  slogan: string;
  sloganSize: string;
  sloganStyle: string;
  logo: string;
  uploadLogo: string;
  uploading: string;
  preview: string;
  // Read Only
  readOnlyTitle: string;
  partnerLink: string;
  copyLink: string;
  linkCopied: string;
  status: string;
  active: string;
  inactive: string;
  companyNameLabel: string;
  partnerConfigTitle: string;
  partnerConfigDesc: string;
  backToApp: string;
  logout: string;
  reset: string;
  saveChanges: string;
  saving: string;
  brandingTabDesc: string;
  logoUploadDesc: string;
  brandColorDesc: string;
  sloganPlaceholder: string;
  sloganSizeXs: string;
  sloganSizeSm: string;
  sloganSizeBase: string;
  sloganSizeLg: string;
  sloganSizeXl: string;
  sloganStyleNormal: string;
  sloganStyleItalic: string;
  sloganStyleBold: string;
  sloganStyleBoldItalic: string;
  phonePlaceholder: string;
  whatsappPlaceholder: string;
  creditTabDesc: string;
  maxDtiLabel: string;
  maxDtiTooltip: string;
  maxAgeLabel: string;
  maxAgeUnit: string;
  maxLoanTermLabel: string;
  maxLoanTermUnit: string;
  rentRecogFirstLabel: string;
  rentRecogInvLabel: string;
  enableRentValidationLabel: string;
  feesTabDesc: string;
  defaultInterestLabel: string;
  vatLabel: string;
  lawyerFeeLabel: string;
  brokerFeeLabel: string;
  advisorFeeLabel: string;
  otherFeeLabel: string;
  calcTabDesc: string;
  defaultRentalYieldLabel: string;
  maxAmortMonthsLabel: string;
  rentWarnHighLabel: string;
  rentWarnLowLabel: string;
  enableWhatIfLabel: string;
  showAmortTableLabel: string;
  changesReverted: string;
  configSaved: string;
  configLoadError: string;
  configSaveError: string;
  logoUploadSuccess: string;
  logoUploadError: string;
  imageFileError: string;
  fileSizeError: string;
  impactPreviewTitle: string;
  impactPreviewDesc: string;
  impactMaxProperty: string;
  impactMonthlyPayment: string;
  impactLoanTerm: string;
  impactInterest: string;
  impactSampleNotice: (age: number, income: number, equity: number) => string;
  impactUnavailable: string;
  sentToRecipient: string;
  contactRep: string;
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
    equity: "הזרע שזרעתם לטובת הגשמת החלום",
    ltv: "מימון מקסימלי",
    netIncome: "העוצמה הכלכלית החודשית שלכם",
    ratio: "יחס החזר",
    age: "גיל לווה",
    maxAge: "פריסה מקסימלית (גיל)",
    interest: "ריבית שנתית",
    titleRent: "שכירות והשקעה",
    isRented: "נכס להשקעה",
    yield: "תשואת שכירות",
    rentRecog: "הכרה בבנק",
    budgetCap: "תקרת החזר חודשי (כדי שתוכלו לישון בשקט)",
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
    confirmationMessage: "הדוח נשלח בהצלחה.",
    sentToRecipient: "הדוח נשלח לכתובת האימייל שלך:",
    contactRep: "נציג המקצועי שלנו יצור איתך קשר בהקדם:",
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
    taxDisclaimer: "לתשומת לבך: חישוב מס הרכישה בסימולטור זה מבוסס על מדרגות המס הסטנדרטיות (דירה יחידה או דירה נוספת). החישוב אינו לוקח בחשבון הטבות ספציפיות כגון: עולה חדש, נכות, או תושב חוזר. גובה המס הסופי ייקבע רק על ידי עו\"ד מקרקעין.",
    purchaseTaxCalculated: "מס רכישה מחושב",
    taxProfileSingleHome: "דירה יחידה",
    taxProfileInvestor: "דירה נוספת",
    equityUsed: "הון עצמי בשימוש",
    equityRemaining: "יתרת הון עצמי",
    helperRentEstimate: "אם כן: תילקח בחשבון הערכת שכירות סטנדרטית (עם מקדם זהירות).",
    helperBudgetCap: "אופציונלי: לחישוב לפי נוחות החזר חודשית.",
    helperNetIncome: "סכום שכבר מנוכה מהחזרי הלוואות קיימות (אם יש).",
    netIncomeLabel: "הכנסה נטו פנויה",
    expectedRent: "שכירות חודשית צפויה",
    expectedRentPlaceholder: "השאר ריק לחישוב אוטומטי (3% תשואה שנתית)",
    labelEstimatedRent: "הכנסה משכירות משוערת (3% שנתי)",
    labelUserRent: "הכנסה משכירות צפויה (לפי קלט משתמש)",
    helperSimulation: "סימולציה ראשונית לצורך סדר גודל. בהמשך נחדד לפי הנתונים המדויקים.",
    targetPropertyPrice: "מחיר הנכס המבוקש (היעד שלכם)",
    targetPropertyPriceHelper: "אופציונלי: לצורך השוואה מול התקציב המחושב בלבד.",
    isRentedYes: "נכס להשקעה",
    isRentedNo: "דירה למגורים",
    optional: "אופציונלי",
    floatingContact: "יש לך שאלה? אני כאן בשבילך",
    whatsappMessageWithPartner: (partnerName: string) => `שלום ${partnerName}, אני משתמש בסימולטור שלך ויש לי שאלה...`,
    whatsappMessageDefault: "שלום, אני משתמש בסימולטור אשל פיננסים ויש לי שאלה...",
    step1Title: "החזון",
    step1Desc: "אתם והמטרה שלכם",
    step2Title: "העוצמה",
    step2Desc: "הון עצמי והכנסות",
    step3Title: "מעמד ותנאים",
    step3Desc: "סטטוס בנקאי ומיסוי",
    step4Title: "יעדים ומגבלות",
    step4Desc: "יעדים ואזור נוחות",
    nextBtn: "המשך לשלב הבא",
    backBtn: "חזור",
    revealBtn: "חשוף את הפוטנציאל שלי ✨",
    loadingText: "מנתח נתונים...",
    successTitle: "הנה פוטנציאל הרכישה המקסימלי שלכם:",
    successSubtitle: "כולל מסגרת משכנתא ועלויות נלוות משוערות",

    wizardWelcome: "ברוכים הבאים! כל חלום גדול מתחיל בתוכנית. בואו נמפה את שלכם.",
    wizardFoundation: "מצוין! העבודה הקשה שלכם בנתה יסודות.",
    wizardBlueprint: "כמעט שם. פרטים אלו עוזרים לנו למצוא את ההטבות.",
    wizardPeace: "לסיום, בוא נגדיר את היעדים שלך ושקט נפשי בתזרים.",
    revealSuccessHeader: "[Name], פוטנציאל הרכישה המקסימלי שלכם ברור!",
    startBtn: "בואו נתחיל",
    partnerLogin: "כניסת שותפים",
    managePartnerSettings: "ניהול הגדרות שותף",
    welcomeTitle: "המסע אל הבית שלכם מתחיל כאן",
    welcomeSub: "גלו את הפוטנציאל האמיתי שלכם וקבלו מפת דרכים אישית להגשמת החלום",
    welcomeBtn: "בואו נצא לדרך",
    videoCaption: "צפו: כך נמפה יחד את הדרך לבית שלכם",
    trustTime: "לוקח 2 דקות",
    trustSecurity: "ללא עלות וללא התחייבות",
    roadmap1Title: "החזון",
    roadmap1Desc: "אתם והמטרה שלכם",
    roadmap2Title: "העוצמה",
    roadmap2Desc: "הון עצמי והכנסות",
    roadmap3Title: "המעמד והתנאים",
    roadmap3Desc: "סטטוס בנקאי ומיסוי",
    roadmap4Title: "יעדים ומגבלות",
    roadmap4Desc: "יעדים ואזור נוחות",
    currencySymbol: "₪",
    convertNotice: "*הסכומים בשקלים (נא להמיר מט\"ח לפי השער היציג)",
    // Financial Strength Celebration
    milestone1: "כניסה לטווח רכישה בסיסי ✅",
    milestone2: "עוצמה פיננסית משמעותית! 💪",
    milestone3: "דירוג כוח קנייה פרימיום! 🏆",
    revealComplete: "ניתוח המימון הושלם",
    // Dossier Strategy
    dossierTeaser: "תיק האסטרטגיה הפיננסית שלך מוכן",
    unlockDossierBtn: "שלחו לי את התיק המלא (PDF)",
    hookIncome: "הכנו עבורך אסטרטגיית 'ייעול החזר' שתעזור לך למקסם את אישור הבנק למרות מגבלות ההכנסה.",
    hookEquity: "הכנו עבורך מפת עלויות מדויקת שתעזור לך לתכנן את תזרים המזומנים מול הוצאות המיסוי והסגירה.",
    hookLTV: "הכנו עבורך ניתוח רגולטורי שיסביר את מגבלות המימון של בנק ישראל עבור הפרופיל שלך.",
    hookAge: "הכנו עבורך תוכנית אופטימיזציה לפריסת המשכנתא בהתאם למגבלות הגיל.",
    hookDefault: "הכנו עבורך ניתוח בנקאי מקיף שיעזור לך להבין את פוטנציאל הרכישה האמיתי שלך.",
    dossierSubject: "תיק האסטרטגיה הפיננסית שלך - [Name]",
    leadCaptureTitle: "הכנו עבורכם מפת דרכים אסטרטגית (PDF) הכוללת ניתוח בנקאי מלא. לאן לשלוח לכם אותה?",
    leadCaptureBtn: "שלחו לי את התיק המלא",
    // Strategic Moat (Phase 5)
    overviewTitle: "ניתוח העוצמה הפיננסית שלכם",
    noteIncome: "החסכונות שלכם מצוינים. הדרך להגדיל את התקציב היא להראות לבנק יכולת החזר חודשית גבוהה יותר.",
    noteEquity: "ההכנסה החודשית שלכם מצוינת. מה שמגביל את התקציב כרגע הוא גובה המזומנים הראשוני הנדרש למיסים והוצאות.",
    noteLTV: "אתם מנצלים כרגע את המקסימום המותר לפי נהלי הבנק. השלב הבא הוא להבטיח שהפרופיל שלכם מוצג בצורה מושלמת כדי להשיג את הריביות הנמוכות ביותר.",
    noteAge: "תקופת ההלוואה מוגבלת בשל גיל, מה שמעלה את ההחזר החודשי. מומלץ לבחון מבנה הלוואה הממזער את ההשפעה.",
    whatIfText: "הידעתם? הגדלה של ההחזר החודשי ב-₪500 בלבד יכולה להגדיל את כוח הקנייה שלכם בכ-₪100,000.",
    expertCommitment: "התיק ייבדק בידי מומחה כדי לוודא תאימות לכללי בנק ישראל 2025.",
    tabBranding: "מיתוג",
    tabCredit: "אשראי",
    tabFees: "עמלות",
    tabCalculator: "מחשבון",
    brandColor: "צבע מותג",
    slogan: "סלוגן",
    sloganSize: "גודל סלוגן",
    sloganStyle: "סגנון סלוגן",
    logo: "לוגו",
    uploadLogo: "העלאת לוגו",
    uploading: "מעלה...",
    preview: "תצוגה מקדימה",
    readOnlyTitle: "פרטים קבועים",
    partnerLink: "קישור שותף",
    copyLink: "העתק קישור",
    linkCopied: "הקישור הועתק!",
    status: "סטטוס",
    active: "פעיל",
    inactive: "לא פעיל",
    companyNameLabel: "שם החברה",
    partnerConfigTitle: "הגדרות שותף",
    partnerConfigDesc: "התאמה אישית של מיתוג, מדיניות ופרמטרים של הסימולציה.",
    backToApp: "חזרה לאפליקציה",
    logout: "התנתק",
    reset: "איפוס",
    saveChanges: "שמור שינויים",
    saving: "שומר...",
    brandingTabDesc: "זהות המותג ופרטי הקשר שלכם שיוצגו ללקוחות",
    logoUploadDesc: "מומלץ: PNG או SVG עם רקע שקוף. מקסימום 2MB.",
    brandColorDesc: "צבע ראשי שיופיע בכפתורים ובאלמנטים עיצוביים",
    sloganPlaceholder: "השותף המהימן שלך למשכנתאות",
    sloganSizeXs: "קטן מאוד",
    sloganSizeSm: "קטן",
    sloganSizeBase: "בינוני",
    sloganSizeLg: "גדול",
    sloganSizeXl: "גדול מאוד",
    sloganStyleNormal: "רגיל",
    sloganStyleItalic: "נטוי",
    sloganStyleBold: "מודגש",
    sloganStyleBoldItalic: "מודגש ונטוי",
    phonePlaceholder: "למשל: 050-1234567",
    whatsappPlaceholder: "למשל: 050-1234567",
    creditTabDesc: "מדיניות אשראי ומגבלות סיכון",
    maxDtiLabel: "יחס החזר מקסימלי (DTI %)",
    maxDtiTooltip: "אחוז מקסימלי מההכנסה הפנויה המיועד להחזר משכנתא. מגבלת בנק ישראל היא 40%.",
    maxAgeLabel: "גיל מקסימלי של הלווה",
    maxAgeUnit: "שנים",
    maxLoanTermLabel: "תקופת הלוואה מקסימלית",
    maxLoanTermUnit: "שנים",
    rentRecogFirstLabel: "הכרה בשכירות (דירה יחידה) %",
    rentRecogInvLabel: "הכרה בשכירות (דירה להשקעה) %",
    enableRentValidationLabel: "הפעל לוגיקת אימות שכירות",
    feesTabDesc: "הגדרות פיננסיות ועמלות",
    defaultInterestLabel: "ריבית ברירת מחדל (%)",
    vatLabel: "מע״מ (%)",
    lawyerFeeLabel: "שכר טרחת עו״ד (%)",
    brokerFeeLabel: "עמלת תיווך (%)",
    advisorFeeLabel: "עמלת יועץ (קבוע ₪)",
    otherFeeLabel: "הוצאות אחרות (קבוע ₪)",
    calcTabDesc: "הגדרות מחשבון מתקדמות",
    defaultRentalYieldLabel: "תשואת שכירות ברירת מחדל (%)",
    maxAmortMonthsLabel: "מספר חודשי לוח סילוקין (תצוגה)",
    rentWarnHighLabel: "מקדם אזהרת שכירות גבוהה",
    rentWarnLowLabel: "מקדם אזהרת שכירות נמוכה",
    enableWhatIfLabel: "הפעל מודול 'מה אם'",
    showAmortTableLabel: "הצג לוח סילוקין",
    changesReverted: "השינויים בוטלו",
    configSaved: "ההגדרות נשמרו בהצלחה",
    configLoadError: "טעינת ההגדרות נכשלה",
    configSaveError: "שמירת ההגדרות נכשלה",
    logoUploadSuccess: "הלוגו הועלה בהצלחה",
    logoUploadError: "העלאת הלוגו נכשלה",
    imageFileError: "נא להעלות קובץ תמונה",
    fileSizeError: "גודל הקובץ חייב להיות פחות מ-2MB",
    impactPreviewTitle: "תצוגת השפעה",
    impactPreviewDesc: "השפעה מיידית של ההגדרות שלכם על מקרה לדוגמה של 500 אלף ש״ח הון עצמי.",
    impactMaxProperty: "שווי נכס מקסימלי משוער",
    impactMonthlyPayment: "החזר חודשי",
    impactLoanTerm: "תקופת הלוואה",
    impactInterest: "ריבית",
    impactSampleNotice: (age, income, equity) => `* דוגמה: גיל לווה ${age}, הכנסה נטו ${income} ₪, הון עצמי ${equity} ₪.`,
    impactUnavailable: "החישוב אינו זמין עבור ההגדרות הנוכחיות.",
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
    confirmationMessage: "Report sent successfully.",
    sentToRecipient: "Sent to your email:",
    contactRep: "Our expert will contact you shortly:",
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
    taxDisclaimer: "Note: The purchase tax calculation is based on standard brackets (single or additional home). It does not account for specific benefits like New Immigrant (Oleh Hadash), disability, or returning resident. The final tax amount will be determined solely by a real estate lawyer.",
    purchaseTaxCalculated: "Calculated Purchase Tax",
    taxProfileSingleHome: "Single Home",
    taxProfileInvestor: "Additional Property",
    equityUsed: "Equity Used",
    equityRemaining: "Remaining Equity",
    helperRentEstimate: "If yes: a standard rent estimate is included (with a prudence margin).",
    helperBudgetCap: "Optional: to calculate based on your comfort limit.",
    helperNetIncome: "Net income already reduced by existing loan payments (if any).",
    netIncomeLabel: "Available net income",
    expectedRent: "Expected Monthly Rent",
    expectedRentPlaceholder: "Leave empty for auto-calc (3% annual yield)",
    labelEstimatedRent: "Estimated rental income (3% annual)",
    labelUserRent: "Expected monthly rent (User Input)",
    helperSimulation: "Indicative estimate to frame your budget; we'll refine it with your details.",
    targetPropertyPrice: "Target Property Price (Your Goal)",
    targetPropertyPriceHelper: "Optional: Only for comparing against your calculated budget.",
    isRentedYes: "Investment Property",
    isRentedNo: "Primary Residence",
    optional: "Optional",
    floatingContact: "Got a question? I'm here to help",
    whatsappMessageWithPartner: (partnerName: string) => `Hello ${partnerName}, I'm using your simulator and I have a question...`,
    whatsappMessageDefault: "Hello, I'm using the Eshel Finances simulator and I have a question...",
    step1Title: "The Vision",
    step1Desc: "You and your goal",
    step2Title: "Financial Power",
    step2Desc: "Equity and income",
    step3Title: "Rules & Status",
    step3Desc: "Banking and tax profile",
    step4Title: "Goals & Limits",
    step4Desc: "Targets and comfort zone",
    nextBtn: "Next Step",
    backBtn: "Back",
    revealBtn: "Reveal My Potential ✨",
    loadingText: "Analyzing regulations...",
    successTitle: "Your property acquisition potential is:",
    successSubtitle: "This potential includes your mortgage capacity and estimated closing costs.",

    wizardWelcome: "Welcome! Every great dream starts with a plan. Let's map yours.",
    wizardFoundation: "Great! Your hard work has built a foundation.",
    wizardBlueprint: "Almost there. These details help us find the specific benefits.",
    wizardPeace: "Finally, let's set your targets and cash-flow comfort.",
    revealSuccessHeader: "[Name], your potential is clear!",
    startBtn: "Start My Journey",
    partnerLogin: "Partner Login",
    managePartnerSettings: "Manage Partner Settings",
    welcomeTitle: "The Journey to Your Home Starts Here",
    welcomeSub: "Discover your true potential and receive a personalized roadmap to your dream home",
    welcomeBtn: "Start My Journey",
    videoCaption: "Watch: How we map your path to a new home together (1:10)",
    trustTime: "Takes 2 minutes",
    trustSecurity: "No commitment",
    roadmap1Title: "The Vision",
    roadmap1Desc: "Identity & Destination",
    roadmap2Title: "Financial Power",
    roadmap2Desc: "Equity & Income",
    roadmap3Title: "Rules & Status",
    roadmap3Desc: "Banking & Tax Profile",
    roadmap4Title: "Goals & Limits",
    roadmap4Desc: "Constraints & Comfort Zone",
    currencySymbol: "₪",
    convertNotice: "*Values in Shekels (Please convert foreign currency before entering)",
    // Financial Strength Celebration
    milestone1: "Entry-Level Capacity Unlocked ✅",
    milestone2: "Significant Financial Power! 💪",
    milestone3: "Premium Purchasing Tier reached! 🏆",
    revealComplete: "Financial Analysis Complete",
    // Dossier Strategy
    dossierTeaser: "Your Strategic Financial Dossier is Ready",
    unlockDossierBtn: "Send My Full Dossier (PDF)",
    hookIncome: "We've prepared a 'Repayment Optimization' strategy to help you maximize bank approval despite income ceilings.",
    hookEquity: "We've prepared a detailed cash-flow roadmap to help you navigate acquisition costs and taxes.",
    hookLTV: "We've included a Regulatory Ceiling Analysis explaining the Bank of Israel's financing limits for your profile.",
    hookAge: "We've prepared a loan-term optimization plan to address age-based repayment restrictions.",
    hookDefault: "We've prepared a comprehensive banking analysis to help you understand your true purchasing power.",
    dossierSubject: "Your Strategic Financial Dossier - [Name]",
    leadCaptureTitle: "We've prepared your personalized Strategic Roadmap (PDF) including full bank analysis. Where should we send your strategy?",
    leadCaptureBtn: "Send My Full Dossier",
    // Strategic Moat (Phase 5)
    overviewTitle: "Your Financial Strength Analysis",
    noteIncome: "Your savings are excellent. To increase your budget, we should look at ways to support a higher monthly payment with the bank.",
    noteEquity: "Your monthly income is very strong. The budget is currently limited by the initial cash needed for taxes and fees.",
    noteLTV: "You are currently making the most of the bank's standard rules for financing. Our next step should be ensuring your profile is perfectly presented to get you the lowest possible interest rates.",
    noteAge: "The loan term is limited by age, increasing the monthly payment. We should structure the loan to minimize this impact.",
    whatIfText: "Did you know? Increasing your monthly payment by just ₪500 could grow your total budget by approximately ₪100,000.",
    expertCommitment: "✓ Validated against 2025 Israeli Bank Regulations | Expert review within 24h",
    tabBranding: "Branding",
    tabCredit: "Credit",
    tabFees: "Fees",
    tabCalculator: "Calculator",
    brandColor: "Brand Color",
    slogan: "Slogan",
    sloganSize: "Slogan Size",
    sloganStyle: "Slogan Style",
    logo: "Logo",
    uploadLogo: "Upload Logo",
    uploading: "Uploading...",
    preview: "Preview",
    readOnlyTitle: "Read-Only Details",
    partnerLink: "Partner Link",
    copyLink: "Copy Link",
    linkCopied: "Link copied!",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    companyNameLabel: "Company Name",
    partnerConfigTitle: "Partner Configuration",
    partnerConfigDesc: "Customize your branding, policies, and simulation parameters.",
    backToApp: "Back to App",
    logout: "Logout",
    reset: "Reset",
    saveChanges: "Save Changes",
    saving: "Saving...",
    brandingTabDesc: "Your brand identity and contact details shown to clients",
    logoUploadDesc: "Recommended: PNG or SVG with transparent background. Max 2MB.",
    brandColorDesc: "Primary color for buttons and design elements",
    sloganPlaceholder: "Your trusted mortgage partner",
    sloganSizeXs: "Extra Small",
    sloganSizeSm: "Small",
    sloganSizeBase: "Medium",
    sloganSizeLg: "Large",
    sloganSizeXl: "Extra Large",
    sloganStyleNormal: "Normal",
    sloganStyleItalic: "Italic",
    sloganStyleBold: "Bold",
    sloganStyleBoldItalic: "Bold Italic",
    phonePlaceholder: "+972-50-123-4567",
    whatsappPlaceholder: "+972-50-123-4567",
    creditTabDesc: "Credit Policy & Risk Limits",
    maxDtiLabel: "Max DTI Ratio (%)",
    maxDtiTooltip: "Maximum percentage of net income for mortgage payments. Bank of Israel limit is 40%.",
    maxAgeLabel: "Max Applicant Age",
    maxAgeUnit: "years",
    maxLoanTermLabel: "Max Loan Term",
    maxLoanTermUnit: "years",
    rentRecogFirstLabel: "Rent Recognition (1st Property) %",
    rentRecogInvLabel: "Rent Recognition (Investment) %",
    enableRentValidationLabel: "Enable Rent Validation Logic",
    feesTabDesc: "Financials & Fees Configuration",
    defaultInterestLabel: "Default Interest Rate (%)",
    vatLabel: "VAT %",
    lawyerFeeLabel: "Lawyer Fee (%)",
    brokerFeeLabel: "Broker Fee (%)",
    advisorFeeLabel: "Advisor Fee (Fixed ₪)",
    otherFeeLabel: "Other Fee (Fixed ₪)",
    calcTabDesc: "Advanced Calculator Settings",
    defaultRentalYieldLabel: "Default Rental Yield (%)",
    maxAmortMonthsLabel: "Max Amortization Months (Display)",
    rentWarnHighLabel: "Rent High Warning Multiplier",
    rentWarnLowLabel: "Rent Low Warning Multiplier",
    enableWhatIfLabel: "Enable 'What If' Module",
    showAmortTableLabel: "Show Amortization Table",
    changesReverted: "Changes reverted",
    configSaved: "Configuration saved successfully",
    configLoadError: "Failed to load configuration",
    configSaveError: "Failed to save configuration",
    logoUploadSuccess: "Logo uploaded successfully",
    logoUploadError: "Failed to upload logo",
    imageFileError: "Please upload an image file",
    fileSizeError: "File size must be less than 2MB",
    impactPreviewTitle: "Impact Preview",
    impactPreviewDesc: "Instant impact of your settings on a sample ₪500k equity case.",
    impactMaxProperty: "Estimated Max Property",
    impactMonthlyPayment: "Monthly Payment",
    impactLoanTerm: "Loan Term",
    impactInterest: "Interest",
    impactSampleNotice: (age, income, equity) => `* Sample: Borrower Age ${age}, Net Income ₪${income / 1000}k, Equity ₪${equity / 1000}k.`,
    impactUnavailable: "Calculation unavailable for current settings.",
  },
  fr: {
    dir: 'ltr',
    mainTitle: "Simulateur Budget Immobilier",
    subtitle: "Outil professionnel de planification d'acquisition immobilière",
    titleBase: "Informations de Base",
    fullName: "Nom Complet",
    phone: "Téléphone",
    email: "Email",
    equity: "L'apport que vous avez semé pour votre rêve",
    ltv: "Financement Max",
    netIncome: "Votre force financière mensuelle",
    ratio: "Taux d'endettement",
    age: "Âge de l'emprunteur",
    maxAge: "Âge max fin de prêt",
    interest: "Taux d'intérêt annuel",
    titleRent: "Investissement Locatif",
    isRented: "Bien destiné à la location",
    yield: "Rendement Locatif",
    rentRecog: "Reconnaissance Banque",
    budgetCap: "Plafond mensuel (pour votre tranquillité d'esprit)",
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
    confirmationMessage: "Rapport envoyé avec succès.",
    sentToRecipient: "Envoyé à votre adresse e-mail :",
    contactRep: "Notre expert vous contactera sous peu :",
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
    taxDisclaimer: "Attention : Le calcul des droits de mutation est basé sur les barèmes standards. Il ne prend pas en compte les exonérations spécifiques (Oleh Hadash, handicap, etc.). Le montant définitif de la taxe doit être vérifié par un avocat spécialisé.",
    purchaseTaxCalculated: "Taxe d'acquisition calculée",
    taxProfileSingleHome: "Résidence principale",
    taxProfileInvestor: "Bien d'investissement",
    equityUsed: "Apport utilisé",
    equityRemaining: "Apport restant",
    helperRentEstimate: "Si oui : une estimation standard du loyer est intégrée (avec marge de prudence).",
    helperBudgetCap: "Optionnel : pour calculer selon votre confort mensuel.",
    helperNetIncome: "Montant déjà déduit de vos crédits existants (si vous en avez).",
    netIncomeLabel: "Revenu net disponible",
    expectedRent: "Loyer mensuel attendu",
    expectedRentPlaceholder: "Laissez vide pour calcul auto (3% rendement annuel)",
    labelEstimatedRent: "Revenu locatif estimé (3% annuel)",
    labelUserRent: "Loyer mensuel attendu (Saisi par l'utilisateur)",
    helperSimulation: "Simulation indicative pour cadrer votre budget. Nous affinerons ensuite selon votre situation.",
    targetPropertyPrice: "Prix visé (votre objectif)",
    targetPropertyPriceHelper: "Optionnel : pour comparer avec votre budget estimé.",
    isRentedYes: "Investissement Locatif",
    isRentedNo: "Résidence Principale",
    optional: "Optionnel",
    floatingContact: "Une question ? Je suis là pour vous",
    whatsappMessageWithPartner: (partnerName: string) => `Bonjour ${partnerName}, j'utilise votre simulateur et j'ai une question...`,
    whatsappMessageDefault: "Bonjour, j'utilise le simulateur Eshel Finances et j'ai une question...",
    step1Title: "La Vision",
    step1Desc: "Vous et votre projet",
    step2Title: "Puissance",
    step2Desc: "Apport et revenus",
    step3Title: "Profil & Règles",
    step3Desc: "Statut bancaire et fiscal",
    step4Title: "Objectifs & Limites",
    step4Desc: "Objectifs et confort",
    nextBtn: "Étape Suivante",
    backBtn: "Retour",
    revealBtn: "Révéler Mon Potentiel ✨",
    loadingText: "Analyse en cours...",
    successTitle: "Voici votre potentiel d'acquisition :",
    successSubtitle: "Ce potentiel inclut votre capacité d'emprunt et les frais annexes estimés.",

    wizardWelcome: "Bienvenue ! Tout grand rêve commence par un plan. Dessinons le vôtre.",
    wizardFoundation: "Super ! Vos fondations sont solides.",
    wizardBlueprint: "Presque fini. Régulations bancaires.",
    wizardPeace: "Enfin, définissons vos objectifs.",
    revealSuccessHeader: "[Name], votre potentiel d'acquisition est confirmé !",
    startBtn: "Commencer mon voyage",
    partnerLogin: "Connexion Partenaire",
    managePartnerSettings: "Gérer le Partenaire",
    welcomeTitle: "Le voyage vers votre foyer commence ici",
    welcomeSub: "Découvrez votre vrai potentiel et recevez votre feuille de route personnelle",
    welcomeBtn: "Démarrer l'expérience",
    videoCaption: "Vidéo : Comment nous traçons votre route vers l'acquisition (1:10)",
    trustTime: "2 minutes chrono",
    trustSecurity: "Gratuit & Sans engagement",
    roadmap1Title: "La Vision",
    roadmap1Desc: "Identité & Objectif",
    roadmap2Title: "La Puissance",
    roadmap2Desc: "Apport & Revenus",
    roadmap3Title: "Profil & Règles",
    roadmap3Desc: "Statut Bancaire & Fiscal",
    roadmap4Title: "Objectifs & Limites",
    roadmap4Desc: "Cibles & Zone de Confort",
    currencySymbol: "₪",
    convertNotice: "*Montants en Shekels (Veuillez convertir vos devises avant la saisie)",
    // Financial Strength Celebration
    milestone1: "Capacité d'achat de base débloquée ✅",
    milestone2: "Puissance financière significative ! 💪",
    milestone3: "Niveau d'achat Premium atteint ! 🏆",
    revealComplete: "Analyse de financement terminée",
    // Dossier Strategy
    dossierTeaser: "Votre Dossier Stratégique Financier est Prêt",
    unlockDossierBtn: "Envoyer Mon Dossier Complet (PDF)",
    hookIncome: "Nous avons préparé une stratégie d'optimisation du remboursement pour maximiser l'accord bancaire.",
    hookEquity: "Nous avons préparé une feuille de route détaillée des flux de trésorerie pour gérer les coûts d'acquisition.",
    hookLTV: "Nous avons inclus une analyse des plafonds réglementaires expliquant les limites de financement de la Banque d'Israël.",
    hookAge: "Nous avons préparé un plan d'optimisation de la durée du prêt adapté aux restrictions liées à l'âge.",
    hookDefault: "Nous avons préparé une analyse bancaire complète pour vous aider à comprendre votre véritable pouvoir d'achat.",
    dossierSubject: "Votre Dossier Stratégique Financier - [Name]",
    leadCaptureTitle: "Nous avons préparé votre Feuille de Route Stratégique (PDF) incluant une analyse bancaire complète. Où souhaitez-vous la recevoir ?",
    leadCaptureBtn: "Envoyer Mon Dossier Complet",
    // Strategic Moat (Phase 5)
    overviewTitle: "Analyse de votre force financière",
    noteIncome: "Votre apport est excellent. Pour augmenter votre budget, il faudrait montrer à la banque une capacité de remboursement mensuel plus élevée.",
    noteEquity: "Votre revenu mensuel est très solide. Le budget est actuellement limité par l'argent disponible pour payer les taxes et les frais de clôture.",
    noteLTV: "Vous utilisez actuellement le maximum autorisé par les règles bancaires. La prochaine étape est de présenter votre profil de manière optimale pour obtenir les meilleurs taux d'intérêt.",
    noteAge: "La durée du prêt est limitée par l'âge, ce qui augmente la mensualité. Il faut structurer le prêt pour minimiser cet impact.",
    whatIfText: "Le saviez-vous ? Augmenter votre mensualité de seulement 500 ₪ peut augmenter votre budget total d'environ 100 000 ₪.",
    expertCommitment: "Ce dossier sera revu par un expert pour assurer sa conformité aux règles bancaires 2025.",
    tabBranding: "Image de marque",
    tabCredit: "Crédit",
    tabFees: "Frais",
    tabCalculator: "Calculateur",
    brandColor: "Couleur de marque",
    slogan: "Slogan",
    sloganSize: "Taille du slogan",
    sloganStyle: "Style du slogan",
    logo: "Logo",
    uploadLogo: "Télécharger le logo",
    uploading: "Téléchargement...",
    preview: "Aperçu",
    readOnlyTitle: "Détails en lecture seule",
    partnerLink: "Lien partenaire",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié !",
    status: "Statut",
    active: "Actif",
    inactive: "Inactif",
    companyNameLabel: "Nom de la société",
    partnerConfigTitle: "Configuration partenaire",
    partnerConfigDesc: "Personnalisez votre image de marque, vos politiques et vos paramètres de simulation.",
    backToApp: "Retour à l'application",
    logout: "Déconnexion",
    reset: "Réinitialiser",
    saveChanges: "Enregistrer",
    saving: "Enregistrement...",
    brandingTabDesc: "Votre identité de marque et vos coordonnées affichées aux clients",
    logoUploadDesc: "Recommandé : PNG ou SVG avec fond transparent. Max 2 Mo.",
    brandColorDesc: "Couleur principale pour les boutons et les éléments de design",
    sloganPlaceholder: "Votre partenaire hypothécaire de confiance",
    sloganSizeXs: "Très petit",
    sloganSizeSm: "Petit",
    sloganSizeBase: "Moyen",
    sloganSizeLg: "Grand",
    sloganSizeXl: "Très grand",
    sloganStyleNormal: "Normal",
    sloganStyleItalic: "Italique",
    sloganStyleBold: "Gras",
    sloganStyleBoldItalic: "Gras italique",
    phonePlaceholder: "+972-50-123-4567",
    whatsappPlaceholder: "+972-50-123-4567",
    creditTabDesc: "Politique de crédit et limites de risque",
    maxDtiLabel: "Taux d'endettement max (%)",
    maxDtiTooltip: "Pourcentage maximum du revenu net pour les paiements hypothécaires. La limite de la Banque d'Israël est de 40%.",
    maxAgeLabel: "Âge maximum du demandeur",
    maxAgeUnit: "ans",
    maxLoanTermLabel: "Durée maximale du prêt",
    maxLoanTermUnit: "ans",
    rentRecogFirstLabel: "Reconnaissance du loyer (1ère propriété) %",
    rentRecogInvLabel: "Reconnaissance du loyer (Investissement) %",
    enableRentValidationLabel: "Activer la logique de validation du loyer",
    feesTabDesc: "Configuration des finances et des frais",
    defaultInterestLabel: "Taux d'intérêt par défaut (%)",
    vatLabel: "TVA %",
    lawyerFeeLabel: "Frais d'avocat (%)",
    brokerFeeLabel: "Frais de courtage (%)",
    advisorFeeLabel: "Frais de conseil (Fixe ₪)",
    otherFeeLabel: "Autres frais (Fixe ₪)",
    calcTabDesc: "Paramètres avancés du calculateur",
    defaultRentalYieldLabel: "Rendement locatif par défaut (%)",
    maxAmortMonthsLabel: "Mois d'amortissement max (Affichage)",
    rentWarnHighLabel: "Multiplicateur d'avertissement de loyer élevé",
    rentWarnLowLabel: "Multiplicateur d'avertissement de loyer bas",
    enableWhatIfLabel: "Activer le module 'Et si'",
    showAmortTableLabel: "Afficher le tableau d'amortissement",
    changesReverted: "Changements annulés",
    configSaved: "Configuration enregistrée avec succès",
    configLoadError: "Échec du chargement de la configuration",
    configSaveError: "Échec de l'enregistrement de la configuration",
    logoUploadSuccess: "Logo téléchargé avec succès",
    logoUploadError: "Échec du téléchargement du logo",
    imageFileError: "Veuillez télécharger un fichier image",
    fileSizeError: "La taille du fichier doit être inférieure à 2 Mo",
    impactPreviewTitle: "Aperçu de l'impact",
    impactPreviewDesc: "Impact immédiat de vos paramètres sur un cas type de 500k ₪ d'apport.",
    impactMaxProperty: "Valeur max estimée du bien",
    impactMonthlyPayment: "Mensualité",
    impactLoanTerm: "Durée du prêt",
    impactInterest: "Intérêt",
    impactSampleNotice: (age, income, equity) => `* Exemple : Âge de l'emprunteur ${age}, Revenu net ${income} ₪, Apport ${equity} ₪.`,
    impactUnavailable: "Calcul indisponible pour les paramètres actuels.",
  }
};
