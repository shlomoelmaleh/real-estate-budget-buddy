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
          <div className="flex flex-col items-center pt-4 gap-4">
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
            
            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center max-w-xl leading-relaxed">
              {t.disclaimer}
            </p>
          </div>
        </form>

        {/* Full Report Content - includes all sections for PDF/Print/Email */}
        {results && (
          <div id="report-content" className="space-y-6">
            {/* Input Summary for Report - ONLY visible in print/PDF, hidden online */}
            <div className="hidden print:block space-y-5 pdf-section">
              {/* Professional PDF Header */}
              <div className="bg-gradient-to-r from-primary via-primary-dark to-primary rounded-2xl p-8 text-white shadow-lg">
                {/* Advisor Contact Box */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <UserCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{t.advisorName}</p>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" /> {t.advisorPhone}
                        </span>
                        <a href={`mailto:${t.advisorEmail}`} className="flex items-center gap-1 hover:text-white transition-colors">
                          <Mail className="w-4 h-4" /> {t.advisorEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm">{new Date().toLocaleDateString()}</p>
                </div>
                
                {/* Title */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Building className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{t.mainTitle}</h1>
                  </div>
                  {fullName && (
                    <div className="mt-4 inline-block bg-white/10 px-6 py-2 rounded-full">
                      <p className="font-semibold text-lg">{fullName}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Basic Information Summary - Print/PDF only */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-primary rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-primary mb-5 flex items-center gap-3 pb-3 border-b border-primary/20">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  {t.titleBase}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fullName && (
                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <span className="text-xs text-muted-foreground block mb-1">{t.fullName}</span>
                      <span className="font-semibold text-foreground">{fullName}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <span className="text-xs text-muted-foreground block mb-1">{t.phone}</span>
                      <span className="font-semibold text-foreground">{phone}</span>
                    </div>
                  )}
                  {email && (
                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <span className="text-xs text-muted-foreground block mb-1">{t.email}</span>
                      <span className="font-semibold text-foreground">{email}</span>
                    </div>
                  )}
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.equity}</span>
                    <span className="font-semibold text-foreground">{equity} ₪</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.ltv}</span>
                    <span className="font-semibold text-foreground">{ltv}%</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.netIncome}</span>
                    <span className="font-semibold text-foreground">{netIncome} ₪</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.ratio}</span>
                    <span className="font-semibold text-foreground">{ratio}%</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.age}</span>
                    <span className="font-semibold text-foreground">{age}</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.maxAge}</span>
                    <span className="font-semibold text-foreground">{maxAge}</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.interest}</span>
                    <span className="font-semibold text-foreground">{interest}%</span>
                  </div>
                </div>
              </div>

              {/* Rental Investment Summary - Print/PDF only */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-secondary rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-secondary mb-5 flex items-center gap-3 pb-3 border-b border-secondary/20">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-secondary" />
                  </div>
                  {t.titleRent}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.isRented}</span>
                    <span className={cn("font-semibold", isRented ? "text-secondary" : "text-muted-foreground")}>{isRented ? '✓ ' + t.isRented : '✗'}</span>
                  </div>
                  {isRented && (
                    <>
                      <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                        <span className="text-xs text-muted-foreground block mb-1">{t.yield}</span>
                        <span className="font-semibold text-foreground">{rentalYield}%</span>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                        <span className="text-xs text-muted-foreground block mb-1">{t.rentRecog}</span>
                        <span className="font-semibold text-foreground">{rentRecognition}%</span>
                      </div>
                    </>
                  )}
                  {budgetCap && (
                    <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                      <span className="text-xs text-muted-foreground block mb-1">{t.budgetCap}</span>
                      <span className="font-semibold text-foreground">{budgetCap} ₪</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses Summary - Print/PDF only */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-accent rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-accent mb-5 flex items-center gap-3 pb-3 border-b border-accent/20">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Coins className="w-5 h-5 text-accent" />
                  </div>
                  {t.titleExpenses}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.purchaseTax}</span>
                    <span className="font-semibold text-foreground">{purchaseTaxMode === 'percent' ? `${purchaseTaxPercent}%` : `${purchaseTaxFixed} ₪`}</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.lawyer}</span>
                    <span className="font-semibold text-foreground">{lawyerPct}%</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.broker}</span>
                    <span className="font-semibold text-foreground">{brokerPct}%</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.vat}</span>
                    <span className="font-semibold text-foreground">{vatPct}%</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.advisor}</span>
                    <span className="font-semibold text-foreground">{advisorFee} ₪</span>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 shadow-sm">
                    <span className="text-xs text-muted-foreground block mb-1">{t.other}</span>
                    <span className="font-semibold text-foreground">{otherFee} ₪</span>
                  </div>
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

            {/* Disclaimer for PDF/Print */}
            <div className="hidden print:block mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 text-center">
                ⚠️ {t.disclaimer}
              </p>
            </div>

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
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-8 bg-border" />
            <span className="text-xs uppercase tracking-wider">Property Budget Pro</span>
            <div className="h-px w-8 bg-border" />
          </div>
          
          {/* Advisor Contact - Elegant footer */}
          <div className="flex flex-col items-center gap-2 mb-4 text-muted-foreground">
            <p className="font-medium text-foreground/80">{t.advisorName}</p>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {t.advisorPhone}
              </span>
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
