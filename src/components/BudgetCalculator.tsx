import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartner } from '@/contexts/PartnerContext';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import logoEshel from '@/assets/logo-eshel.png';
import { AdminFloatingButton } from '@/components/AdminFloatingButton';

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
import { motion, AnimatePresence } from 'framer-motion';
import { DevInspector } from './DevTools/DevInspector';
import { useBudgetWizard } from '@/hooks/useBudgetWizard';

// ... (imports remain the same)

export function BudgetCalculator() {
  const { t, language } = useLanguage();
  const { partner } = usePartner();
  const navigate = useNavigate();
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Form management
  const {
    control,
    trigger,
    formState: { errors },
    getValues,
    watch,
    setValue,
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

  // Business logic from custom hook
  const {
    step,
    isExiting0,
    results,
    isLoading,
    isSending,
    showConfirmation,
    calcData,
    handleNext,
    handleBack,
    handleCalculate,
    handleSendReport,
    setShowConfirmation,
  } = useBudgetWizard({
    partner,
    language,
    trigger,
    getValues,
    setValue,
    t,
  });

  // --- PARTNER DISPLAY INFO ---
  const displayName = partner?.name || t.advisorName;
  const displayPhone = partner?.phone || t.advisorPhone;
  const displayEmail = partner?.email || t.advisorEmail;
  const displayTitle = partner?.name ? partner?.name || t.advisorTitle : t.advisorTitle;
  const displayLogo = partner?.logo_url || logoEshel;

  // WhatsApp link logic
  const normalizeToWaMeDigits = (raw: string) => {
    const digitsOnly = (raw || '').replace(/[^0-9]/g, '');
    if (!digitsOnly) return '';
    let d = digitsOnly.startsWith('00') ? digitsOnly.slice(2) : digitsOnly;
    if (d.startsWith('9720')) d = `972${d.slice(4)}`;
    else if (d.startsWith('0')) d = `972${d.slice(1)}`;
    else if (d.length === 9 && d.startsWith('5')) d = `972${d}`;
    return d;
  };

  const buildWhatsAppHref = () => {
    const rawWhatsApp = partner?.whatsapp || '';
    if (rawWhatsApp) {
      if (rawWhatsApp.startsWith('http://') || rawWhatsApp.startsWith('https://')) return rawWhatsApp;
      const digits = normalizeToWaMeDigits(rawWhatsApp);
      if (digits) return `https://wa.me/${digits}`;
    }
    const digitsFromPhone = normalizeToWaMeDigits(partner?.phone || '');
    if (digitsFromPhone) return `https://wa.me/${digitsFromPhone}`;
    return 'https://wa.me/972549997711';
  };

  const isRTL = language === 'he';

  // --- RENDER HELPERS ---

  const getStepContent = () => {
    switch (step) {
      case 0:
        return <Step0 onNext={handleNext} />;
      case 1:
        return <Step1 control={control} errors={errors} t={t} />;
      case 2:
        return <Step2 control={control} errors={errors} t={t} />;
      case 3:
        return <Step3 control={control} errors={errors} t={t} />;
      case 4:
        return <Step4 control={control} errors={errors} t={t} watch={watch} setValue={setValue} />;
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
            onBack={handleBack}
            calcData={calcData}
            language={language as 'he' | 'en' | 'fr'}
          />
        );
      default: return null;
    }
  };

  const getStepHeader = () => {
    switch (step) {
      case 1: return { title: t.roadmap1Title, desc: t.roadmap1Desc, emotional: t.wizardWelcome };
      case 2: return { title: t.roadmap2Title, desc: t.roadmap2Desc, emotional: t.wizardFoundation };
      case 3: return { title: t.roadmap3Title, desc: t.roadmap3Desc, emotional: t.wizardBlueprint };
      case 4: return { title: t.roadmap4Title, desc: t.roadmap4Desc, emotional: t.wizardPeace };
      default: return { title: "", desc: "", emotional: "" };
    }
  };

  const header = getStepHeader();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Step 0: Welcome Screen (Split Dashboard) */}
      {step === 0 && (
        <div className={cn(
          "flex items-center justify-center min-h-screen transition-all duration-700 ease-in-out",
          isExiting0 && "opacity-0 scale-95 translate-y-[-20px]"
        )}>
          {getStepContent()}
        </div>
      )}

      {step > 0 && (
        <div className="animate-in fade-in duration-700">
          <main className="px-4 pb-8 pt-2"> {/* Lifted to top for zero-scroll */}

            {/* Progress Bar (Station Path) */}
            {step < 5 && <ProgressBar currentStep={step} totalSteps={4} />}

            {!showConfirmation ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: language === 'he' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: language === 'he' ? 20 : -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full max-w-2xl mx-auto"
                >
                  <StepCard
                    className="mt-0 pt-2 shadow-2xl border border-white/20 rounded-2xl" // Refined rounded card
                    title={header.title}
                    description={header.desc}
                    emotionalMessage={header.emotional}
                  >
                    {getStepContent()}

                    {/* Navigation Buttons */}
                    {step > 0 && step < 5 && (
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6"> {/* Swapped specific order & removed reverse */}
                        {(() => {
                          const currentValues = watch();
                          let isStepValid = false;

                          if (step === 1) {
                            isStepValid = !!currentValues.fullName && !!currentValues.age && !errors.fullName && !errors.age && !errors.targetPropertyPrice;
                          } else if (step === 2) {
                            isStepValid = !!currentValues.equity && !!currentValues.netIncome && !errors.equity && !errors.netIncome;
                          } else if (step === 3) {
                            isStepValid =
                              currentValues.isFirstProperty !== undefined &&
                              currentValues.isIsraeliCitizen !== undefined &&
                              currentValues.isIsraeliTaxResident !== undefined;
                          } else if (step === 4) {
                            isStepValid = !errors.budgetCap && !errors.expectedRent;
                          }

                          return step < 4 ? (
                            <Button
                              onClick={() => {
                                if ('vibrate' in navigator && typeof navigator.vibrate === 'function') navigator.vibrate(10);
                                handleNext();
                              }}
                              className={cn(
                                "w-full sm:flex-1 py-6 text-base font-bold bg-primary hover:bg-primary-dark text-white transition-all hover:scale-[1.02]",
                                "shadow-lg shadow-primary/20",
                                isStepValid && "shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse ring-1 ring-primary/50"
                              )}
                            >
                              {/* Next Button Content */}
                              {isRTL ? <ChevronLeft className="w-4 h-4 ml-2" /> : null}
                              {t.nextBtn}
                              {!isRTL ? <ChevronRight className="w-4 h-4 ml-2" /> : null}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => {
                                if ('vibrate' in navigator && typeof navigator.vibrate === 'function') navigator.vibrate(10);
                                handleCalculate();
                              }}
                              className={cn(
                                "w-full sm:flex-1 py-6 text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]",
                                isStepValid && "shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"
                              )}
                            >
                              {t.revealBtn}
                            </Button>
                          );
                        })()}

                        {step > 1 && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              if ('vibrate' in navigator && typeof navigator.vibrate === 'function') navigator.vibrate(10);
                              handleBack();
                            }}
                            className="w-full sm:flex-1 py-6 text-base"
                          >
                            {isRTL ? <ChevronRight className="w-4 h-4 mr-2" /> : <ChevronLeft className="w-4 h-4 mr-2" />}
                            {t.backBtn}
                          </Button>
                        )}
                      </div>
                    )}
                  </StepCard>
                </motion.div>
              </AnimatePresence>
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

                {/* DEV MODE: Back to Editor */}
                {import.meta.env.DEV && (
                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowConfirmation(false)}
                      className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-300"
                    >
                      ↩️ Architect: Back to Editor
                    </Button>
                  </div>
                )}
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
        </div >
      )
      }

      {/* Dev Tools HUD (Only visible in DEV) */}
      <DevInspector
        formData={watch()}
        results={results}
        language={language}
      />

      {/* Admin Floating Button (Only visible on Steps 1-5, NOT Welcome Step 0) */}
      {step > 0 && (
        <AdminFloatingButton
          onClick={() => {
            // Persist current step so we can resume after returning from admin
            sessionStorage.setItem('wizard_return_step', step.toString());
            // Navigate to admin
            // define navigate outside render or import usage
            navigate('/admin/settings'); // OR use useNavigate hook if available in this context
            // Since we are in a component inside Router, better to use hook.
          }}
        />
      )}
    </div >
  );
}
