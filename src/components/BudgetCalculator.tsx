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

        {/* Results */}
        {results && (
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
        )}

        {/* Charts */}
        {results && amortization.length > 0 && (
          <LoanCharts amortization={amortization} loanAmount={results.loanAmount} />
        )}

        {/* Amortization Table */}
        {results && <AmortizationTable rows={amortization} />}

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
