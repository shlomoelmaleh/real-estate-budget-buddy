import { useState, useMemo } from 'react';
import { 
  User, Home, Coins, Calculator, Tag, Calendar as CalendarIcon, 
  Wallet, UserCircle, Phone, Mail, Banknote, Building, 
  TrendingUp, Percent, Clock, Receipt, Scale, Users, 
  FileText, Briefcase, Settings, Lock, Gift, CheckCircle2, BarChart3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { HeroHeader } from './HeroHeader';
import { FormSection } from './FormSection';
import { FormInput } from './FormInput';
import { ResultsGroup, ResultRow } from './ResultsCard';
import { AmortizationTable } from './AmortizationTable';
import { LoanCharts } from './LoanCharts';
import { ReportActions } from './ReportActions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  calculate, 
  generateAmortizationTable, 
  formatNumber, 
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
  const [ltv, setLtv] = useState('75');
  const [netIncome, setNetIncome] = useState('');
  const [ratio, setRatio] = useState('33');
  const [age, setAge] = useState('');
  const [maxAge, setMaxAge] = useState('85');
  const [interest, setInterest] = useState('5.0');

  // Rent & Investment
  const [isRented, setIsRented] = useState(false);
  const [rentalYield, setRentalYield] = useState('3.0');
  const [rentRecognition, setRentRecognition] = useState('80');
  const [budgetCap, setBudgetCap] = useState('');

  // Expenses
  const [purchaseTaxMode, setPurchaseTaxMode] = useState<'percent' | 'fixed'>('percent');
  const [purchaseTaxPercent, setPurchaseTaxPercent] = useState('8.0');
  const [purchaseTaxFixed, setPurchaseTaxFixed] = useState('');
  const [lawyerPct, setLawyerPct] = useState('1.0');
  const [brokerPct, setBrokerPct] = useState('2.0');
  const [vatPct, setVatPct] = useState('18');
  const [advisorFee, setAdvisorFee] = useState('15,000');
  const [otherFee, setOtherFee] = useState('3,000');

  // Results
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [amortization, setAmortization] = useState<AmortizationRow[]>([]);

  const handleCalculate = () => {
    const inputs = {
      equity: parseFormattedNumber(equity),
      ltv: parseFormattedNumber(ltv),
      netIncome: parseFormattedNumber(netIncome),
      ratio: parseFormattedNumber(ratio),
      age: parseFormattedNumber(age),
      maxAge: parseFormattedNumber(maxAge),
      interest: parseFloat(interest) || 0,
      isRented,
      rentalYield: parseFloat(rentalYield) || 0,
      rentRecognition: parseFormattedNumber(rentRecognition),
      budgetCap: budgetCap ? parseFormattedNumber(budgetCap) : null,
      purchaseTaxPercent: parseFloat(purchaseTaxPercent) || 0,
      purchaseTaxFixed: parseFormattedNumber(purchaseTaxFixed),
      isPurchaseTaxPercent: purchaseTaxMode === 'percent',
      lawyerPct: parseFloat(lawyerPct) || 0,
      brokerPct: parseFloat(brokerPct) || 0,
      vatPct: parseFormattedNumber(vatPct),
      advisorFee: parseFormattedNumber(advisorFee),
      otherFee: parseFormattedNumber(otherFee),
    };

    const calcResults = calculate(inputs);
    
    if (calcResults) {
      setResults(calcResults);
      const amortRows = generateAmortizationTable(
        calcResults.loanAmount,
        inputs.interest,
        calcResults.loanTermYears
      );
      setAmortization(amortRows);
      toast.success(t.titleResults);
    } else {
      toast.error('Please check your input values');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <HeroHeader />
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Basic Information */}
          <FormSection icon={<User className="w-5 h-5 text-primary" />} title={t.titleBase} variant="primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label={t.fullName}
                icon={<UserCircle className="w-4 h-4" />}
                value={fullName}
                onChange={setFullName}
                type="text"
              />
              <FormInput
                label={t.phone}
                icon={<Phone className="w-4 h-4" />}
                value={phone}
                onChange={setPhone}
                type="tel"
              />
              <FormInput
                label={t.email}
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={setEmail}
                type="email"
                className="md:col-span-2"
              />
              <FormInput
                label={t.equity}
                icon={<Banknote className="w-4 h-4" />}
                suffix="₪"
                value={equity}
                onChange={setEquity}
                formatNumber
              />
              <FormInput
                label={t.ltv}
                icon={<Building className="w-4 h-4" />}
                suffix="%"
                value={ltv}
                onChange={setLtv}
                formatNumber
              />
              <FormInput
                label={t.netIncome}
                icon={<TrendingUp className="w-4 h-4" />}
                suffix="₪"
                value={netIncome}
                onChange={setNetIncome}
                formatNumber
              />
              <FormInput
                label={t.ratio}
                icon={<Percent className="w-4 h-4" />}
                suffix="%"
                value={ratio}
                onChange={setRatio}
                formatNumber
              />
              <FormInput
                label={t.age}
                icon={<User className="w-4 h-4" />}
                value={age}
                onChange={setAge}
                formatNumber
              />
              <FormInput
                label={t.maxAge}
                icon={<Clock className="w-4 h-4" />}
                value={maxAge}
                onChange={setMaxAge}
                formatNumber
              />
              <FormInput
                label={t.interest}
                icon={<Percent className="w-4 h-4" />}
                suffix="%"
                value={interest}
                onChange={setInterest}
                allowDecimals
                formatNumber
                className="md:col-span-2"
              />
            </div>
          </FormSection>

          {/* Rent & Investment */}
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

              {isRented && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-in">
                  <FormInput
                    label={t.yield}
                    icon={<Gift className="w-4 h-4" />}
                    suffix="%"
                    value={rentalYield}
                    onChange={setRentalYield}
                    allowDecimals
                    formatNumber
                  />
                  <FormInput
                    label={t.rentRecog}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    suffix="%"
                    value={rentRecognition}
                    onChange={setRentRecognition}
                    formatNumber
                  />
                </div>
              )}

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

          {/* Expenses */}
          <FormSection icon={<Coins className="w-5 h-5 text-accent" />} title={t.titleExpenses} variant="accent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Receipt className="w-4 h-4 text-primary/70" />
                    {t.purchaseTax}
                  </Label>
                  <div className={cn("flex", t.dir === 'rtl' ? "justify-start" : "justify-start")}>
                    <RadioGroup
                      value={purchaseTaxMode}
                      onValueChange={(value) => setPurchaseTaxMode(value as 'percent' | 'fixed')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="percent" id="taxPercent" />
                        <Label htmlFor="taxPercent" className="cursor-pointer font-medium">{t.percent}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="fixed" id="taxFixed" />
                        <Label htmlFor="taxFixed" className="cursor-pointer font-medium">{t.fixed}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                {purchaseTaxMode === 'percent' ? (
                  <FormInput
                    label=""
                    value={purchaseTaxPercent}
                    onChange={setPurchaseTaxPercent}
                    allowDecimals
                    formatNumber
                  />
                ) : (
                  <FormInput
                    label=""
                    value={purchaseTaxFixed}
                    onChange={setPurchaseTaxFixed}
                    formatNumber
                  />
                )}
              </div>

              <FormInput
                label={t.lawyer}
                icon={<Scale className="w-4 h-4" />}
                suffix="%"
                value={lawyerPct}
                onChange={setLawyerPct}
                allowDecimals
                formatNumber
              />
              <FormInput
                label={t.broker}
                icon={<Users className="w-4 h-4" />}
                suffix="%"
                value={brokerPct}
                onChange={setBrokerPct}
                allowDecimals
                formatNumber
              />
              <FormInput
                label={t.vat}
                icon={<FileText className="w-4 h-4" />}
                suffix="%"
                value={vatPct}
                onChange={setVatPct}
                formatNumber
              />
              <FormInput
                label={t.advisor}
                icon={<Briefcase className="w-4 h-4" />}
                suffix="₪"
                value={advisorFee}
                onChange={setAdvisorFee}
                formatNumber
              />
              <FormInput
                label={t.other}
                icon={<Settings className="w-4 h-4" />}
                suffix="₪"
                value={otherFee}
                onChange={setOtherFee}
                formatNumber
              />
            </div>
          </FormSection>

          {/* Calculate Button */}
          <div className="flex justify-center pt-4">
            <Button
              type="button"
              onClick={handleCalculate}
              size="lg"
              className={cn(
                "px-12 py-6 text-lg font-semibold rounded-xl",
                "bg-gradient-to-r from-primary to-primary-dark",
                "hover:shadow-elevated hover:scale-[1.02]",
                "transition-all duration-300",
                "gap-3"
              )}
            >
              <Calculator className="w-5 h-5" />
              {t.calcBtn}
            </Button>
          </div>
        </form>

        {/* Full Report Content - includes all sections for PDF/Print/Email */}
        {results && (
          <div id="report-content" className="space-y-6">
            {/* Input Summary for Report - ONLY visible in print/PDF, hidden online */}
            <div className="hidden print:block space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-primary">{t.mainTitle}</h1>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
                {fullName && <p className="font-medium mt-2">{fullName}</p>}
              </div>
              
              {/* Basic Information Summary - Print/PDF only */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" /> {t.titleBase}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {fullName && <div><span className="text-muted-foreground">{t.fullName}:</span> <span className="font-medium ml-2">{fullName}</span></div>}
                  {phone && <div><span className="text-muted-foreground">{t.phone}:</span> <span className="font-medium ml-2">{phone}</span></div>}
                  {email && <div><span className="text-muted-foreground">{t.email}:</span> <span className="font-medium ml-2">{email}</span></div>}
                  <div><span className="text-muted-foreground">{t.equity}:</span> <span className="font-medium ml-2">{equity} ₪</span></div>
                  <div><span className="text-muted-foreground">{t.ltv}:</span> <span className="font-medium ml-2">{ltv}%</span></div>
                  <div><span className="text-muted-foreground">{t.netIncome}:</span> <span className="font-medium ml-2">{netIncome} ₪</span></div>
                  <div><span className="text-muted-foreground">{t.ratio}:</span> <span className="font-medium ml-2">{ratio}%</span></div>
                  <div><span className="text-muted-foreground">{t.age}:</span> <span className="font-medium ml-2">{age}</span></div>
                  <div><span className="text-muted-foreground">{t.maxAge}:</span> <span className="font-medium ml-2">{maxAge}</span></div>
                  <div><span className="text-muted-foreground">{t.interest}:</span> <span className="font-medium ml-2">{interest}%</span></div>
                </div>
              </div>

              {/* Rental Investment Summary - Print/PDF only */}
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5" /> {t.titleRent}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">{t.isRented}:</span> <span className="font-medium ml-2">{isRented ? '✓' : '✗'}</span></div>
                  {isRented && (
                    <>
                      <div><span className="text-muted-foreground">{t.yield}:</span> <span className="font-medium ml-2">{rentalYield}%</span></div>
                      <div><span className="text-muted-foreground">{t.rentRecog}:</span> <span className="font-medium ml-2">{rentRecognition}%</span></div>
                    </>
                  )}
                  {budgetCap && <div><span className="text-muted-foreground">{t.budgetCap}:</span> <span className="font-medium ml-2">{budgetCap} ₪</span></div>}
                </div>
              </div>

              {/* Expenses Summary - Print/PDF only */}
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5" /> {t.titleExpenses}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-muted-foreground">{t.purchaseTax}:</span> <span className="font-medium ml-2">{purchaseTaxMode === 'percent' ? `${purchaseTaxPercent}%` : `${purchaseTaxFixed} ₪`}</span></div>
                  <div><span className="text-muted-foreground">{t.lawyer}:</span> <span className="font-medium ml-2">{lawyerPct}%</span></div>
                  <div><span className="text-muted-foreground">{t.broker}:</span> <span className="font-medium ml-2">{brokerPct}%</span></div>
                  <div><span className="text-muted-foreground">{t.vat}:</span> <span className="font-medium ml-2">{vatPct}%</span></div>
                  <div><span className="text-muted-foreground">{t.advisor}:</span> <span className="font-medium ml-2">{advisorFee} ₪</span></div>
                  <div><span className="text-muted-foreground">{t.other}:</span> <span className="font-medium ml-2">{otherFee} ₪</span></div>
                </div>
              </div>
            </div>

            {/* Results */}
            <FormSection icon={<TrendingUp className="w-5 h-5 text-secondary" />} title={t.titleResults} variant="secondary">
              <div className="space-y-5">
                <ResultsGroup icon={<Tag className="w-5 h-5 text-primary" />} title={t.res_group1} variant="primary">
                  <ResultRow label={t.res_pMax} value={formatNumber(results.maxPropertyValue)} />
                  <ResultRow label={t.res_loan} value={formatNumber(results.loanAmount)} />
                  <ResultRow label={t.res_ltv} value={results.actualLTV.toFixed(1)} suffix="%" />
                </ResultsGroup>

                <ResultsGroup icon={<CalendarIcon className="w-5 h-5 text-secondary" />} title={t.res_group2} variant="secondary">
                  <ResultRow label={t.res_pay} value={formatNumber(results.monthlyPayment)} />
                  <ResultRow label={t.res_rent} value={formatNumber(results.rentIncome)} />
                  <ResultRow label={t.res_netOut} value={formatNumber(results.netPayment)} />
                </ResultsGroup>

                <ResultsGroup icon={<Wallet className="w-5 h-5 text-accent" />} title={t.res_group3} variant="accent">
                  <ResultRow label={t.res_acq} value={formatNumber(results.closingCosts)} />
                  <ResultRow label={t.res_totalInt} value={formatNumber(results.totalInterest)} />
                  <ResultRow label={t.res_totalCost} value={formatNumber(results.totalCost)} />
                  <ResultRow 
                    label={t.res_shekelRatio} 
                    value={(results.totalCost / results.loanAmount).toFixed(2)} 
                    highlight 
                  />
                </ResultsGroup>
              </div>
            </FormSection>

            {/* Charts */}
            {amortization.length > 0 && (
              <LoanCharts amortization={amortization} loanAmount={results.loanAmount} />
            )}

            {/* Amortization Table */}
            <AmortizationTable rows={amortization} />

            {/* Report Actions */}
            <div className="mt-6">
              <ReportActions 
                results={results} 
                amortization={amortization}
                clientName={fullName}
                clientPhone={phone}
                clientEmail={email}
                inputs={{
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
                  purchaseTaxMode,
                  purchaseTaxPercent,
                  purchaseTaxFixed,
                  lawyerPct,
                  brokerPct,
                  vatPct,
                  advisorFee,
                  otherFee,
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-8 pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-8 bg-border" />
            <span className="text-xs uppercase tracking-wider">Property Budget Pro</span>
            <div className="h-px w-8 bg-border" />
          </div>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </footer>
      </main>
    </div>
  );
}
