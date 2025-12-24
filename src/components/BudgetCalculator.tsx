import { useState, useMemo } from 'react';
import { User, Home, Coins, Calculator, Tag, Calendar as CalendarIcon, Percent, DollarSign, Building2, TrendingUp, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FormSection } from './FormSection';
import { FormInput } from './FormInput';
import { ResultsGroup, ResultRow } from './ResultsCard';
import { AmortizationTable } from './AmortizationTable';
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-6">
          <LanguageSwitcher />
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4 animate-float">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground">
              {t.mainTitle}
            </h1>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Basic Information */}
          <FormSection icon={<User className="w-6 h-6 text-primary" />} title={t.titleBase} variant="primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput
                label={t.fullName}
                icon="👤"
                value={fullName}
                onChange={setFullName}
                type="text"
              />
              <FormInput
                label={t.phone}
                icon="📱"
                value={phone}
                onChange={setPhone}
                type="tel"
              />
              <FormInput
                label={t.email}
                icon="✉️"
                value={email}
                onChange={setEmail}
                type="email"
                className="md:col-span-2"
              />
              <FormInput
                label={t.equity}
                icon="💰"
                suffix="₪"
                value={equity}
                onChange={setEquity}
                formatNumber
              />
              <FormInput
                label={t.ltv}
                icon="🏦"
                suffix="%"
                value={ltv}
                onChange={setLtv}
                formatNumber
              />
              <FormInput
                label={t.netIncome}
                icon="📈"
                suffix="₪"
                value={netIncome}
                onChange={setNetIncome}
                formatNumber
              />
              <FormInput
                label={t.ratio}
                icon="📊"
                suffix="%"
                value={ratio}
                onChange={setRatio}
                formatNumber
              />
              <FormInput
                label={t.age}
                icon="🎂"
                value={age}
                onChange={setAge}
                formatNumber
              />
              <FormInput
                label={t.maxAge}
                icon="⏳"
                value={maxAge}
                onChange={setMaxAge}
                formatNumber
              />
              <FormInput
                label={t.interest}
                icon="📉"
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
          <FormSection icon={<Home className="w-6 h-6 text-secondary" />} title={t.titleRent} variant="secondary">
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
                    icon="🎁"
                    suffix="%"
                    value={rentalYield}
                    onChange={setRentalYield}
                    allowDecimals
                    formatNumber
                  />
                  <FormInput
                    label={t.rentRecog}
                    icon="✔️"
                    suffix="%"
                    value={rentRecognition}
                    onChange={setRentRecognition}
                    formatNumber
                  />
                </div>
              )}

              <FormInput
                label={t.budgetCap}
                icon="🔒"
                suffix="₪"
                value={budgetCap}
                onChange={setBudgetCap}
                formatNumber
              />
            </div>
          </FormSection>

          {/* Expenses */}
          <FormSection icon={<Coins className="w-6 h-6 text-accent" />} title={t.titleExpenses} variant="accent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 md:col-span-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="text-lg">📜</span>
                  {t.purchaseTax}
                </Label>
                <RadioGroup
                  value={purchaseTaxMode}
                  onValueChange={(value) => setPurchaseTaxMode(value as 'percent' | 'fixed')}
                  className="flex gap-4"
                  dir="ltr"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percent" id="taxPercent" />
                    <Label htmlFor="taxPercent" className="cursor-pointer">%</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fixed" id="taxFixed" />
                    <Label htmlFor="taxFixed" className="cursor-pointer">₪</Label>
                  </div>
                </RadioGroup>
                {purchaseTaxMode === 'percent' ? (
                  <FormInput
                    label=""
                    suffix="%"
                    value={purchaseTaxPercent}
                    onChange={setPurchaseTaxPercent}
                    allowDecimals
                    formatNumber
                  />
                ) : (
                  <FormInput
                    label=""
                    suffix="₪"
                    value={purchaseTaxFixed}
                    onChange={setPurchaseTaxFixed}
                    formatNumber
                  />
                )}
              </div>

              <FormInput
                label={t.lawyer}
                icon="⚖️"
                suffix="%"
                value={lawyerPct}
                onChange={setLawyerPct}
                allowDecimals
                formatNumber
              />
              <FormInput
                label={t.broker}
                icon="🤝"
                suffix="%"
                value={brokerPct}
                onChange={setBrokerPct}
                allowDecimals
                formatNumber
              />
              <FormInput
                label={t.vat}
                icon="🏛️"
                suffix="%"
                value={vatPct}
                onChange={setVatPct}
                formatNumber
              />
              <FormInput
                label={t.advisor}
                icon="📋"
                suffix="₪"
                value={advisorFee}
                onChange={setAdvisorFee}
                formatNumber
              />
              <FormInput
                label={t.other}
                icon="🛠️"
                suffix="₪"
                value={otherFee}
                onChange={setOtherFee}
                formatNumber
              />
            </div>
          </FormSection>

          {/* Calculate Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleCalculate}
              size="lg"
              className={cn(
                "px-12 py-6 text-lg font-bold rounded-full",
                "bg-gradient-to-r from-primary to-primary-dark",
                "hover:shadow-glow hover:scale-105",
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
          <FormSection icon={<TrendingUp className="w-6 h-6 text-secondary" />} title={t.titleResults} variant="secondary">
            <div className="space-y-5">
              <ResultsGroup icon={<Tag className="text-primary" />} title={t.res_group1} variant="primary">
                <ResultRow label={t.res_pMax} value={formatNumber(results.maxPropertyValue)} />
                <ResultRow label={t.res_loan} value={formatNumber(results.loanAmount)} />
                <ResultRow label={t.res_ltv} value={results.actualLTV.toFixed(1)} suffix="%" />
              </ResultsGroup>

              <ResultsGroup icon={<CalendarIcon className="text-secondary" />} title={t.res_group2} variant="secondary">
                <ResultRow label={t.res_pay} value={formatNumber(results.monthlyPayment)} />
                <ResultRow label={t.res_rent} value={formatNumber(results.rentIncome)} />
                <ResultRow label={t.res_netOut} value={formatNumber(results.netPayment)} />
              </ResultsGroup>

              <ResultsGroup icon={<Wallet className="text-accent" />} title={t.res_group3} variant="accent">
                <ResultRow label={t.res_acq} value={formatNumber(results.closingCosts)} />
                <ResultRow label={t.res_totalInt} value={formatNumber(results.totalInterest)} />
                <ResultRow label={t.res_totalCost} value={formatNumber(results.totalCost)} />
              </ResultsGroup>
            </div>
          </FormSection>
        )}

        {/* Amortization Table */}
        {results && <AmortizationTable rows={amortization} />}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pb-8">
          <p>© {new Date().getFullYear()} Property Budget Calculator</p>
        </footer>
      </div>
    </div>
  );
}
