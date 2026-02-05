import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calculator,
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
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

// Wizard Components
import { StepCard } from './Wizard/StepCard';
import { ProgressBar } from './Wizard/ProgressBar';
import { Step1 } from './Wizard/Steps/Step1';
import { Step2 } from './Wizard/Steps/Step2';
import { Step3 } from './Wizard/Steps/Step3';
import { Step4 } from './Wizard/Steps/Step4';
import { Step5 } from './Wizard/Steps/Step5_Reveal';
import { Step0 } from './Wizard/Steps/Step0_Welcome';
import { calculatorSchema, CalculatorFormValues } from './budget/types';

export function BudgetCalculator() {
  const { t, language } = useLanguage();
  const { partner } = usePartner();
  const confirmationRef = useRef<HTMLDivElement>(null);

  // State - Step 0 is Welcome Screen
  const [step, setStep] = useState(0); // Initial state changed to 0
  const [isExiting0, setIsExiting0] = useState(false); // For transition out of Step 0
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For calculation
  const [isSending, setIsSending] = useState(false); // For email
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Store calculation data for the email step
  const [calcData, setCalcData] = useState<any>(null);

  const {
    control,
    trigger, // Used for manual validation per step
    formState: { errors },
    getValues,
    watch,
  } = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    mode: 'onChange',
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

  // Partner Display Info
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

  // Logic Constants
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

  // --- WIZARD NAVIGATION ---

  const [animClass, setAnimClass] = useState("animate-in slide-in-from-right fade-in duration-500");

  const handleNext = async () => {
    if (step === 0) {
      setIsExiting0(true);
      setTimeout(() => {
        setStep(1);
        setIsExiting0(false);
        window.scrollTo({ top: 0 });
      }, 500); // Duration of the exit animation
      return;
    }

    let fields: (keyof CalculatorFormValues)[] = [];

    switch (step) {
      case 1: fields = ['fullName', 'age']; break;
      case 2: fields = ['equity', 'netIncome']; break;
      case 3: fields = ['isFirstProperty', 'isIsraeliCitizen', 'isIsraeliTaxResident']; break;
      default: break;
    }

    const isValid = await trigger(fields);
    if (isValid) {
      setAnimClass("animate-in slide-in-from-right fade-in duration-500");
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setAnimClass("animate-in slide-in-from-left fade-in duration-500");
    setStep(s => Math.max(0, s - 1)); // Allowing back to 0 (Welcome)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- CALCULATION PHASE ---

  const handleCalculate = async () => {
    // Validate Step 4
    const isValid = await trigger(['isRented', 'expectedRent', 'targetPropertyPrice', 'budgetCap']);
    if (!isValid) return;

    setIsLoading(true);
    setAnimClass("animate-in fade-in duration-700"); // Gentle fade for Reveal
    setStep(5); // Move to Reveal step immediately to show loader
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const data = getValues();

    // Prepare Inputs
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

      if (!response.ok) throw new Error('Calculation failed');

      const { results: calcResults, amortization: amortRows } = await response.json();

      if (calcResults) {
        // ... processing logic same as before ...

        // Prepare additional data for email later
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

        const amortizationSummary = {
          totalMonths: amortRows.length,
          firstPayment: amortRows.length > 0 ? { principal: amortRows[0].principal, interest: amortRows[0].interest } : { principal: 0, interest: 0 },
          lastPayment: amortRows.length > 0 ? { principal: amortRows[amortRows.length - 1].principal, interest: amortRows[amortRows.length - 1].interest } : { principal: 0, interest: 0 },
        };

        const simulationInputs = {
          ...data,
          ltv: calculatedLTV.toString(),
          maxAge, interest, rentalYield, rentRecognition, lawyerPct, brokerPct, vatPct, advisorFee, otherFee, ratio,
          targetPropertyPrice: data.targetPropertyPrice || '',
        };

        const simulationResults = {
          ...calcResults,
          shekelRatio: calcResults.totalCost / calcResults.loanAmount,
        };

        setCalcData({
          inputs: simulationInputs,
          results: simulationResults,
          amortizationSummary,
          yearlyBalanceData,
          paymentBreakdownData,
          csvData
        });

        // Artificial loading delay for 2 seconds
        setTimeout(() => {
          setResults(calcResults);
          setIsLoading(false);
        }, 2000);

      } else {
        toast.error('Calculation failed');
        setStep(4);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.emailError || 'An error occurred.');
      setStep(4);
      setIsLoading(false);
    }
  };

  // --- SEND REPORT PHASE ---

  const handleSendReport = async () => {
    // Validate Lead Capture fields
    const isValid = await trigger(['email', 'phone']);
    if (!isValid) return;

    setIsSending(true);
    const data = getValues();
    const partnerId = partner?.id || null;

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { error: emailError } = await supabase.functions.invoke('send-report-email', {
        body: {
          recipientEmail: data.email,
          recipientName: data.fullName || 'Client',
          recipientPhone: data.phone,
          language: language,
          inputs: calcData.inputs,
          results: calcData.results,
          amortizationSummary: calcData.amortizationSummary,
          yearlyBalanceData: calcData.yearlyBalanceData,
          paymentBreakdownData: calcData.paymentBreakdownData,
          csvData: calcData.csvData,
          partnerId,
        },
      });

      if (emailError) throw emailError;

      setShowConfirmation(true);
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error(error);
      toast.error(t.emailError);
    }
    setIsSending(false);
  };

  // --- RENDER ---

  const getStepContent = () => {
    switch (step) {
      case 0:
        return <Step0 t={t} onNext={handleNext} />;
      case 1:
        return <Step1 control={control} errors={errors} t={t} />;
      case 2:
        return <Step2 control={control} errors={errors} t={t} />;
      case 3:
        return <Step3 control={control} errors={errors} t={t} />;
      case 4:
        return <Step4 control={control} errors={errors} t={t} watch={watch} />;
      case 5:
        return (
          <Step5
            control={control}
            errors={errors}
            t={t}
            results={results}
            isLoading={isLoading}
            onSendReport={handleSendReport}
            isSending={isSending}
            watch={watch}
          />
        );
      default: return null;
    }
  };

  const getStepHeader = () => {
    switch (step) {
      case 1: return { title: t.step1Title, desc: t.step1Desc };
      case 2: return { title: t.step2Title, desc: t.step2Desc };
      case 3: return { title: t.step3Title, desc: t.step3Desc };
      case 4: return { title: t.step4Title, desc: t.step4Desc };
      default: return { title: "", desc: "" };
    }
  };

  const header = getStepHeader();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Step 0: Welcome Screen */}
      {step === 0 && (
        <div className={cn(
          "flex flex-col items-center pt-8 md:pt-16 px-4 transition-all duration-700 ease-in-out",
          isExiting0 && "-translate-y-full opacity-0 scale-95"
        )}>
          <HeroHeader />
          <div className="text-center mt-8 w-full">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-800 mb-4 max-w-3xl mx-auto leading-tight">
              {t.welcomeTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              {t.welcomeSub}
            </p>
            {getStepContent()}
          </div>
        </div>
      )}

      {step > 0 && (
        <>
          {/* Action Mode: Tiny Logo Header */}
          <header className="px-6 py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
            <div className="flex items-center gap-2">
              <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain" />
              {partner?.name && <span className="text-xs font-semibold text-muted-foreground">{partner.name}</span>}
            </div>
          </header>

          <main className="px-4 pb-8 pt-2"> {/* Minimal top padding for zero-scroll */}

            {/* Progress Bar (Station Path) */}
            {step < 5 && <ProgressBar currentStep={step} totalSteps={4} />}

            {!showConfirmation ? (
              <StepCard
                key={step} // Force re-render for clean exit/enter animation
                className={cn(animClass, "mt-0 pt-6 shadow-2xl")} // Lifted to top
                title={header.title}
                emotionalMessage={header.desc}
              >
                {getStepContent()}

                {/* Navigation Buttons */}
                {step < 5 && (
                  <div className="flex gap-4 pt-6">
                    {step > 1 && (
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1 py-6 text-base"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        {t.backBtn}
                      </Button>
                    )}

                    {(() => {
                      const currentValues = watch();
                      let isStepValid = false;

                      if (step === 1) {
                        isStepValid = !!currentValues.fullName && !!currentValues.age && !errors.fullName && !errors.age;
                      } else if (step === 2) {
                        isStepValid = !!currentValues.equity && !!currentValues.netIncome && !errors.equity && !errors.netIncome;
                      } else if (step === 3) {
                        isStepValid =
                          currentValues.isFirstProperty !== undefined &&
                          currentValues.isIsraeliCitizen !== undefined &&
                          currentValues.isIsraeliTaxResident !== undefined;
                      } else if (step === 4) {
                        isStepValid = !errors.budgetCap && !errors.targetPropertyPrice;
                      }

                      return step < 4 ? (
                        <Button
                          onClick={handleNext}
                          className={cn(
                            "flex-1 py-6 text-base font-bold bg-primary hover:bg-primary-dark text-white transition-all hover:scale-[1.02]",
                            "shadow-lg shadow-primary/20",
                            isStepValid && "shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse ring-1 ring-primary/50"
                          )}
                        >
                          {t.nextBtn}
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCalculate}
                          className={cn(
                            "flex-1 py-6 text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]",
                            isStepValid && "shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                          )}
                        >
                          {t.revealBtn}
                        </Button>
                      );
                    })()}
                  </div>
                )}
              </StepCard>
            ) : (
              /* Confirmation State */
              <div ref={confirmationRef} className="max-w-xl mx-auto space-y-4 animate-fade-in mt-8">
                <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-lg text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 mb-3">{t.confirmationTitle}</h3>
                  <p className="text-green-700 text-lg">{t.confirmationMessage}</p>
                  <p className="mt-4 text-sm text-green-600 font-medium bg-white/50 py-1 px-3 rounded-full inline-block">
                    {getValues('email')}
                  </p>
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

            {/* Footer */}
            <footer className="text-center text-sm text-muted-foreground pt-12 pb-6">
              <div className="flex flex-col items-center gap-4">
                <img
                  src={displayLogo}
                  alt={partner?.name ? `${partner.name} logo` : "Eshel Finances"}
                  className="h-12 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
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
                    className="flex items-center gap-2 text-muted-foreground hover:text-green-600 transition-colors"
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
        </>
      )}
    </div>
  );
}
