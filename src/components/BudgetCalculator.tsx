import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calculator,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartner } from '@/contexts/PartnerContext';
import { HeroHeader } from './HeroHeader';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import {
  parseFormattedNumber,
  CalculatorResults,
  AmortizationRow
} from '@/lib/calculator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import logoEshel from '@/assets/logo-eshel.png';

// Modular components
import { PropertyStatusSection } from './budget/PropertyStatusSection';
import { RentInvestmentSection } from './budget/RentInvestmentSection';
import { FinancialSection } from './budget/FinancialSection';
import { PersonalInfoSection } from './budget/PersonalInfoSection';
import { calculatorSchema, CalculatorFormValues } from './budget/types';

export function BudgetCalculator() {
  const { t, language } = useLanguage();
  const { partner } = usePartner();
  const confirmationRef = useRef<HTMLDivElement>(null);

  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      equity: '1,000,000',
      netIncome: '',
      age: '',
      isFirstProperty: undefined,
      isIsraeliCitizen: undefined,
      isIsraeliTaxResident: undefined,
      isRented: false,
      expectedRent: '',
      budgetCap: '',
      targetPropertyPrice: '',
    },
  });

  const displayName = partner?.name || t.advisorName;
  const displayPhone = partner?.phone || t.advisorPhone;
  const displayEmail = partner?.email || t.advisorEmail;
  const displayTitle = partner?.name ? (partner?.name || t.advisorTitle) : t.advisorTitle;
  const displayLogo = partner?.logo_url || logoEshel;

  const normalizeToWaMeDigits = (raw: string) => {
    const digitsOnly = (raw || "").replace(/[^0-9]/g, "");
    if (!digitsOnly) return "";
    let d = digitsOnly.startsWith("00") ? digitsOnly.slice(2) : digitsOnly;
    if (d.startsWith("9720")) d = `972${d.slice(4)}`;
    else if (d.startsWith("0")) d = `972${d.slice(1)}`;
    else if (d.length === 9 && d.startsWith("5")) d = `972${d}`;
    return d;
  };

  const buildWhatsAppHref = () => {
    const rawWhatsApp = partner?.whatsapp || "";
    if (rawWhatsApp) {
      if (rawWhatsApp.startsWith("http://") || rawWhatsApp.startsWith("https://")) return rawWhatsApp;
      const digits = normalizeToWaMeDigits(rawWhatsApp);
      if (digits) return `https://wa.me/${digits}`;
    }
    const digitsFromPhone = normalizeToWaMeDigits(partner?.phone || "");
    if (digitsFromPhone) return `https://wa.me/${digitsFromPhone}`;
    return "https://wa.me/972549997711";
  };

  // Hidden defaults
  const maxAge = '80';
  const interest = '5.0';
  const ratio = '33';
  const rentalYield = '3.0';
  const rentRecognition = '80';
  const lawyerPct = '1.0';
  const brokerPct = '2.0';
  const vatPct = '18';
  const advisorFee = '9,000';
  const otherFee = '3,000';

  const calculateLTV = (isFirstProperty: boolean, isIsraeliCitizen: boolean): number => {
    if (!isFirstProperty) return 50;
    if (isIsraeliCitizen) return 75;
    return 50;
  };

  const onSubmit = async (data: CalculatorFormValues) => {
    setIsSubmitting(true);

    const calculatedLTV = calculateLTV(data.isFirstProperty, data.isIsraeliCitizen);

    const inputs = {
      equity: parseFormattedNumber(data.equity),
      ltv: calculatedLTV,
      netIncome: parseFormattedNumber(data.netIncome),
      ratio: parseFormattedNumber(ratio),
      age: parseFormattedNumber(data.age),
      maxAge: parseFormattedNumber(maxAge),
      interest: parseFloat(interest) || 0,
      isRented: data.isRented,
      rentalYield: parseFloat(rentalYield) || 0,
      rentRecognition: parseFormattedNumber(rentRecognition),
      budgetCap: data.budgetCap ? parseFormattedNumber(data.budgetCap) : null,
      isFirstProperty: data.isFirstProperty,
      isIsraeliTaxResident: data.isIsraeliTaxResident,
      expectedRent: data.expectedRent ? parseFormattedNumber(data.expectedRent) : null,
      lawyerPct: parseFloat(lawyerPct) || 0,
      brokerPct: parseFloat(brokerPct) || 0,
      vatPct: parseFormattedNumber(vatPct),
      advisorFee: parseFormattedNumber(advisorFee),
      otherFee: parseFormattedNumber(otherFee),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-budget`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify(inputs),
        }
      );

      if (response.status === 429) {
        toast.error(t.rateLimitError || 'Too many requests. Please wait a moment.');
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Calculation failed');
      }

      const { results: calcResults, amortization: amortRows } = await response.json();

      if (calcResults) {
        setResults(calcResults);

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

        const yearlyBalanceData: { year: number; balance: number }[] = [];
        for (let i = 0; i < amortRows.length; i++) {
          if ((i + 1) % 12 === 0 || i === amortRows.length - 1) {
            yearlyBalanceData.push({
              year: Math.ceil((i + 1) / 12),
              balance: amortRows[i].closing,
            });
          }
        }

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

        const asciiHeaders = ['Month', 'Opening', 'Payment', 'Principal', 'Interest', 'Closing'];
        const isRTL = language === 'he';
        const headers = isRTL ? [...asciiHeaders].reverse() : asciiHeaders;
        const csvHeader = headers.join(",") + "\n";
        const csvRows = (amortRows || []).map((row: AmortizationRow) => {
          const values = isRTL
            ? [row.closing, row.interest, row.principal, row.payment, row.opening, row.month]
            : [row.month, row.opening, row.payment, row.principal, row.interest, row.closing];
          return values.map(v => typeof v === 'number' ? v.toFixed(2) : v).join(",");
        }).join("\n");
        const csvData = csvHeader + csvRows;

        const { supabase } = await import('@/integrations/supabase/client');

        const simulationInputs = {
          ...data,
          ltv: calculatedLTV.toString(),
          maxAge,
          interest,
          rentalYield,
          rentRecognition,
          lawyerPct,
          brokerPct,
          vatPct,
          advisorFee,
          otherFee,
          ratio,
          targetPropertyPrice: data.targetPropertyPrice || '',
        };

        const simulationResults = {
          ...calcResults,
          shekelRatio: calcResults.totalCost / calcResults.loanAmount,
        };

        const partnerId = partner?.id || null;
        console.log('Sending email with partner:', { partnerId, partnerName: partner?.name, partnerLoaded: !!partner });
        
        const { error: emailError } = await supabase.functions.invoke('send-report-email', {
          body: {
            recipientEmail: data.email,
            recipientName: data.fullName || 'Client',
            recipientPhone: data.phone,
            language: language,
            inputs: simulationInputs,
            results: simulationResults,
            amortizationSummary,
            yearlyBalanceData,
            paymentBreakdownData,
            csvData,
            partnerId,
          },
        });

        if (emailError) throw emailError;

        setShowConfirmation(true);
        setTimeout(() => {
          confirmationRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast.error('Please check your input values');
      }
    } catch (error) {
      console.error('Calculation or email error:', error);
      toast.error(t.emailError || 'An error occurred. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleFormError = () => {
    toast.error(t.requiredField);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroHeader />
      <main className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
        <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
          <PropertyStatusSection control={control} t={t} errors={errors} />
          <RentInvestmentSection control={control} t={t} />
          <FinancialSection control={control} t={t} errors={errors} />
          <PersonalInfoSection control={control} t={t} errors={errors} />

          <div className="flex flex-col items-center pt-4 gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className={cn(
                "px-8 py-6 text-lg font-semibold rounded-xl flex-1 sm:flex-initial min-w-[200px]",
                "bg-gradient-to-r from-primary to-primary-dark",
                "hover:shadow-elevated hover:scale-[1.02]",
                "transition-all duration-300",
                "gap-2",
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

            <p className="text-xs text-muted-foreground text-center max-w-xl leading-relaxed">
              {t.disclaimer}
            </p>
            <p className="text-xs text-muted-foreground/80 text-center max-w-xl leading-relaxed italic">
              {t.helperSimulation}
            </p>
          </div>
        </form>

        {showConfirmation && (
          <div ref={confirmationRef} className="mt-8 space-y-4 animate-fade-in">
            <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-3">{t.confirmationTitle}</h3>
              <p className="text-green-700 text-lg">{t.confirmationMessage}</p>
              <p className="mt-4 text-sm text-green-600">{getValues('email')}</p>
            </div>

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

        <footer className="text-center text-sm text-muted-foreground pt-8 pb-6 border-t border-border/50">
          <div className="flex flex-col items-center gap-4">
            <img 
              src={displayLogo} 
              alt={partner?.name ? `${partner.name} logo` : "Eshel Finances"} 
              className="h-16 md:h-[72px] w-auto object-contain opacity-90"
            />
            <div className="flex flex-col items-center gap-1">
              <p className="font-semibold text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayTitle}</p>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a 
                href={buildWhatsAppHref()} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <WhatsAppIcon size={16} className="text-green-600" />
                <span>{displayPhone}</span>
              </a>
              <a 
                href={`mailto:${displayEmail}`} 
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 text-primary" />
                <span>{displayEmail}</span>
              </a>
            </div>
            <p className="text-xs text-muted-foreground/70 pt-2">
              © {new Date().getFullYear()} {t.companyName}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
