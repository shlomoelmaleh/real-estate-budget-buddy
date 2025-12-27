import { useState } from 'react';
import { 
  User, Home, Calculator, 
  UserCircle, Phone, Mail, Banknote, Building, 
  TrendingUp, Percent, Clock, Lock, CheckCircle2, Flag, Wallet
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HeroHeader } from './HeroHeader';
import { FormSection } from './FormSection';
import { FormInput } from './FormInput';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  calculate, 
  generateAmortizationTable, 
  parseFormattedNumber,
  CalculatorResults,
  AmortizationRow 
} from '@/lib/calculator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function BudgetCalculator() {
  const { t } = useLanguage();

  // Basic info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [equity, setEquity] = useState('1,000,000');
  const [netIncome, setNetIncome] = useState('');
  // ratio is hidden - using default value
  const [age, setAge] = useState('');
  
  // New fields for LTV calculation
  const [isFirstProperty, setIsFirstProperty] = useState<boolean | null>(null);
  const [isIsraeliCitizen, setIsIsraeliCitizen] = useState<boolean | null>(null);
  const [isIsraeliTaxResident, setIsIsraeliTaxResident] = useState<boolean | null>(null);
  
  // Hidden defaults
  const maxAge = '80';
  const interest = '5.0';
  const ratio = '33';

  // Rent & Investment
  const [isRented, setIsRented] = useState(false);
  const [rentalYield, setRentalYield] = useState('3.0');
  const [rentRecognition, setRentRecognition] = useState('80');
  const [budgetCap, setBudgetCap] = useState('');

  // Expenses (purchase tax is now calculated automatically)
  const [lawyerPct, setLawyerPct] = useState('1.0');
  const [brokerPct, setBrokerPct] = useState('2.0');
  const [vatPct, setVatPct] = useState('18');
  const [advisorFee, setAdvisorFee] = useState('15,000');
  const [otherFee, setOtherFee] = useState('3,000');

  // Results
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [amortization, setAmortization] = useState<AmortizationRow[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const validateRequiredFields = (): boolean => {
    const errors: Record<string, boolean> = {};
    
    // Required fields (except isRented and budgetCap)
    if (!fullName.trim()) errors.fullName = true;
    if (!phone.trim()) errors.phone = true;
    if (!email.trim()) errors.email = true;
    if (!equity.trim() || equity === '0') errors.equity = true;
    if (!netIncome.trim() || netIncome === '0') errors.netIncome = true;
    // ratio is hidden - no validation needed
    if (!age.trim() || age === '0') errors.age = true;
    if (isFirstProperty === null) errors.isFirstProperty = true;
    if (isIsraeliCitizen === null) errors.isIsraeliCitizen = true;
    if (isIsraeliTaxResident === null) errors.isIsraeliTaxResident = true;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate LTV based on first property and citizenship
  const calculateLTV = (): number => {
    if (!isFirstProperty) return 50;
    if (isIsraeliCitizen) return 75;
    return 50;
  };

  const handleCalculate = async () => {
    if (!validateRequiredFields()) {
      toast.error(t.requiredField);
      return;
    }

    setIsSubmitting(true);

    const calculatedLTV = calculateLTV();

    const inputs = {
      equity: parseFormattedNumber(equity),
      ltv: calculatedLTV,
      netIncome: parseFormattedNumber(netIncome),
      ratio: parseFormattedNumber(ratio),
      age: parseFormattedNumber(age),
      maxAge: parseFormattedNumber(maxAge),
      interest: parseFloat(interest) || 0,
      isRented,
      rentalYield: parseFloat(rentalYield) || 0,
      rentRecognition: parseFormattedNumber(rentRecognition),
      budgetCap: budgetCap ? parseFormattedNumber(budgetCap) : null,
      // Pass property status for automatic tax calculation
      isFirstProperty: isFirstProperty ?? false,
      isIsraeliTaxResident: isIsraeliTaxResident ?? false,
      // Other costs
      lawyerPct: parseFloat(lawyerPct) || 0,
      brokerPct: parseFloat(brokerPct) || 0,
      vatPct: parseFormattedNumber(vatPct),
      advisorFee: parseFormattedNumber(advisorFee),
      otherFee: parseFormattedNumber(otherFee),
    };

    const calcResults = calculate(inputs);
    
    if (calcResults) {
      // DEV console.log for debugging
      console.log('[DEV] Budget Calculation:', {
        InputEquity: parseFormattedNumber(equity),
        Profile: calcResults.taxProfile,
        MaxPrice: calcResults.maxPropertyValue,
        Tax: calcResults.purchaseTax
      });
      
      setResults(calcResults);
      const amortRows = generateAmortizationTable(
        calcResults.loanAmount,
        inputs.interest,
        calcResults.loanTermYears
      );
      setAmortization(amortRows);
      
      // Send email automatically
      try {
        const amortizationSummary = {
          totalMonths: amortRows.length,
          firstPayment:
            amortRows.length > 0
              ? { principal: amortRows[0].principal, interest: amortRows[0].interest }
              : { principal: 0, interest: 0 },
          lastPayment:
            amortRows.length > 0
              ? {
                  principal: amortRows[amortRows.length - 1].principal,
                  interest: amortRows[amortRows.length - 1].interest,
                }
              : { principal: 0, interest: 0 },
        };

        // Chart data: Loan balance by year
        const yearlyBalanceData: { year: number; balance: number }[] = [];
        for (let i = 0; i < amortRows.length; i++) {
          if ((i + 1) % 12 === 0 || i === amortRows.length - 1) {
            yearlyBalanceData.push({
              year: Math.ceil((i + 1) / 12),
              balance: amortRows[i].closing,
            });
          }
        }

        // Chart data: Annual interest vs principal
        const paymentBreakdownData: { year: number; interest: number; principal: number }[] = [];
        for (let yearIndex = 0; yearIndex < Math.ceil(amortRows.length / 12); yearIndex++) {
          const startMonth = yearIndex * 12;
          const endMonth = Math.min(startMonth + 12, amortRows.length);

          let yearlyInterest = 0;
          let yearlyPrincipal = 0;
          for (let i = startMonth; i < endMonth; i++) {
            yearlyInterest += amortRows[i].interest;
            yearlyPrincipal += amortRows[i].principal;
          }

          paymentBreakdownData.push({
            year: yearIndex + 1,
            interest: yearlyInterest,
            principal: yearlyPrincipal,
          });
        }

        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase.functions.invoke('send-report-email', {
          body: {
            recipientEmail: email,
            recipientName: fullName || 'Client',
            recipientPhone: phone,
            language: t.dir === 'rtl' ? 'he' : 'fr',
            inputs: {
              equity,
              ltv: calculatedLTV.toString(),
              isFirstProperty,
              isIsraeliCitizen,
              isIsraeliTaxResident,
              netIncome,
              ratio,
              age,
              maxAge,
              interest,
              isRented,
              rentalYield,
              rentRecognition,
              budgetCap,
              lawyerPct,
              brokerPct,
              vatPct,
              advisorFee,
              otherFee,
            },
            results: {
              maxPropertyValue: calcResults.maxPropertyValue,
              loanAmount: calcResults.loanAmount,
              actualLTV: calcResults.actualLTV,
              monthlyPayment: calcResults.monthlyPayment,
              rentIncome: calcResults.rentIncome,
              netPayment: calcResults.netPayment,
              closingCosts: calcResults.closingCosts,
              totalInterest: calcResults.totalInterest,
              totalCost: calcResults.totalCost,
              loanTermYears: calcResults.loanTermYears,
              shekelRatio: calcResults.totalCost / calcResults.loanAmount,
              purchaseTax: calcResults.purchaseTax,
              taxProfile: calcResults.taxProfile,
            },
            amortizationSummary,
            yearlyBalanceData,
            paymentBreakdownData,
          },
        });

        if (error) throw error;
        setShowConfirmation(true);
      } catch (error) {
        console.error('Email sending error:', error);
        toast.error(t.emailError);
      }
    } else {
      toast.error('Please check your input values');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <HeroHeader />
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Personal Information */}
          <FormSection icon={<UserCircle className="w-5 h-5 text-primary" />} title={t.titlePersonal} variant="primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label={t.fullName}
                icon={<User className="w-4 h-4" />}
                value={fullName}
                onChange={setFullName}
                type="text"
                required
                hasError={validationErrors.fullName}
              />
              <FormInput
                label={t.phone}
                icon={<Phone className="w-4 h-4" />}
                value={phone}
                onChange={setPhone}
                type="tel"
                required
                hasError={validationErrors.phone}
              />
              <FormInput
                label={t.email}
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={setEmail}
                type="email"
                required
                hasError={validationErrors.email}
              />
              <FormInput
                label={t.age}
                icon={<Clock className="w-4 h-4" />}
                value={age}
                onChange={setAge}
                formatNumber
                required
                hasError={validationErrors.age}
              />
            </div>
          </FormSection>

          {/* Property Status */}
          <FormSection icon={<Home className="w-5 h-5 text-secondary" />} title={t.titlePropertyStatus} variant="secondary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* First Property Question */}
              <div className={cn("space-y-2", validationErrors.isFirstProperty && "ring-2 ring-destructive rounded-lg p-3")}>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  {t.isFirstProperty} <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsFirstProperty(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isFirstProperty === true
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFirstProperty(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isFirstProperty === false
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              {/* Israeli Citizenship Question */}
              <div className={cn("space-y-2", validationErrors.isIsraeliCitizen && "ring-2 ring-destructive rounded-lg p-3")}>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Flag className="w-4 h-4" />
                  {t.isIsraeliCitizen} <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsIsraeliCitizen(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isIsraeliCitizen === true
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIsraeliCitizen(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isIsraeliCitizen === false
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.no}
                  </button>
                </div>
              </div>

              {/* Israeli Tax Resident Question */}
              <div className={cn("space-y-2", validationErrors.isIsraeliTaxResident && "ring-2 ring-destructive rounded-lg p-3")}>
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Banknote className="w-4 h-4" />
                  {t.isIsraeliTaxResident} <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsIsraeliTaxResident(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isIsraeliTaxResident === true
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.yes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIsraeliTaxResident(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg border transition-all",
                      isIsraeliTaxResident === false
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary"
                    )}
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Financial Information */}
          <FormSection icon={<Wallet className="w-5 h-5 text-accent" />} title={t.titleFinancial} variant="accent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label={t.equity}
                icon={<Banknote className="w-4 h-4" />}
                suffix="₪"
                value={equity}
                onChange={setEquity}
                formatNumber
                required
                hasError={validationErrors.equity}
              />
              <FormInput
                label={t.netIncome}
                icon={<TrendingUp className="w-4 h-4" />}
                suffix="₪"
                value={netIncome}
                onChange={setNetIncome}
                formatNumber
                required
                hasError={validationErrors.netIncome}
              />
            </div>
          </FormSection>

          {/* Rent & Investment - Simplified for client version */}
          <FormSection icon={<Home className="w-5 h-5 text-secondary" />} title={t.titleRent} variant="secondary">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isRented"
                  checked={isRented}
                  onCheckedChange={(checked) => setIsRented(checked === true)}
                  className="w-5 h-5"
                />
                <Label htmlFor="isRented" className="cursor-pointer font-medium">
                  {t.isRented}
                </Label>
              </div>

              {/* Rental yield and bank recognition are hidden - using default values */}

              <FormInput
                label={t.budgetCap}
                icon={<Lock className="w-4 h-4" />}
                suffix="₪"
                value={budgetCap}
                onChange={setBudgetCap}
                formatNumber
              />
            </div>
          </FormSection>

          {/* Calculate Button */}
          <div className="flex flex-col items-center pt-4 gap-4">
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={isSubmitting}
              size="lg"
              className={cn(
                "px-12 py-6 text-lg font-semibold rounded-xl",
                "bg-gradient-to-r from-primary to-primary-dark",
                "hover:shadow-elevated hover:scale-[1.02]",
                "transition-all duration-300",
                "gap-3",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Calculator className="w-5 h-5" />
              )}
              {t.calcBtn}
            </Button>
            
            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center max-w-xl leading-relaxed">
              {t.disclaimer}
            </p>
          </div>
        </form>

        {/* Confirmation Message - Client version only shows confirmation, no results */}
        {showConfirmation && (
          <div className="mt-8 space-y-4 animate-fade-in">
            <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">{t.confirmationTitle}</h3>
              <p className="text-green-700 text-lg">{t.confirmationMessage}</p>
              <p className="mt-4 text-sm text-green-600">{email}</p>
            </div>
            
            {/* Tax Disclaimer */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-lg flex-shrink-0">⚠️</span>
                <p className="text-sm text-amber-800 leading-relaxed">
                  {t.taxDisclaimer}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-border" />
            <span className="text-xs uppercase tracking-wider">Property Budget Pro</span>
            <div className="h-px w-8 bg-border" />
          </div>
          
          {/* Advisor Contact - Elegant footer */}
          <div className="flex flex-col items-center gap-2 mb-4 text-muted-foreground">
            <p className="font-medium text-foreground/80">{t.advisorName}</p>
            <div className="flex items-center gap-4 text-xs">
              <a href="https://wa.me/972549997711" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <WhatsAppIcon size={12} /> {t.advisorPhone}
              </a>
              <a href={`mailto:${t.advisorEmail}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="w-3 h-3" /> {t.advisorEmail}
              </a>
            </div>
          </div>
          
          <p className="text-xs">© {new Date().getFullYear()} All rights reserved</p>
        </footer>
      </main>
    </div>
  );
}
