import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Loader2, Mail, Phone, FileText, CheckCircle2, FolderOpen } from 'lucide-react';
// canvas-confetti is dynamically imported in celebrate() to reduce initial bundle
import { motion, AnimatePresence } from 'framer-motion';
import { StepRevealProps } from '../types';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/FormInput';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/calculator';
import { DevEmailPreview } from '@/components/DevTools/DevEmailPreview';
import type { ReportEmailRequest } from '@/lib/devMirror';
import { usePartner } from '@/contexts/PartnerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AmortizationTable } from '@/components/AmortizationTable';
import { Badge } from '@/components/ui/badge';

export function Step5({
    control,
    errors,
    t,
    results,
    isLoading,
    onSendReport,
    isSending,
    watch,
    onBack,
    calcData,
    language = 'he',
}: StepRevealProps) {
    const { config, partner } = usePartner();
    const { display, symbol } = useCurrency();

    const [displayValue, setDisplayValue] = useState(0);
    const [hasCounted, setHasCounted] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<number>(0); // 0 = none, 1-3 = tier
    const fullName = watch ? watch('fullName') : '';
    const firstName = fullName?.split(' ')[0] || '';
    const [showDossier, setShowDossier] = useState(false);

    // Feasibility Logic
    const targetPriceRaw = watch ? watch('targetPropertyPrice') : '';
    const targetPropertyPrice = typeof targetPriceRaw === 'string'
        ? parseFloat(targetPriceRaw.replace(/,/g, '')) || 0
        : (typeof targetPriceRaw === 'number' ? targetPriceRaw : 0);
    const hasTargetPrice = !!targetPropertyPrice && targetPropertyPrice > 0;
    const maxBudget = results?.maxPropertyValue || 0;

    const getFeasibility = () => {
        if (!hasTargetPrice) return null;
        const ratio = maxBudget / targetPropertyPrice;
        if (ratio >= 1.0) return 'green';
        if (ratio >= 0.90) return 'orange';
        return 'red';
    };
    const feasibility = getFeasibility();

    // Dynamic Diagnosis Hook
    const getDiagnosisHook = () => {
        if (!results) return t.hookDefault;
        switch (results.limitingFactor) {
            case 'INCOME_LIMIT': return t.hookIncome;
            case 'EQUITY_LIMIT': return t.hookEquity;
            case 'LTV_LIMIT': return t.hookLTV;
            case 'AGE_LIMIT': return t.hookAge;
            default: return t.hookDefault;
        }
    };

    // Milestone thresholds
    const MILESTONES = {
        entry: 1200000,    // ₪1.2M
        significant: 2800000, // ₪2.8M
        premium: 4500000      // ₪4.5M
    };

    // Trigger confetti celebration
    const celebrate = async () => {
        const { default: confetti } = await import('canvas-confetti');
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ['#1e40af', '#3b82f6', '#60a5fa', '#FFD700', '#FDB931', '#D4AF37'];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    // 5-Stage Heartbeat Reveal Logic
    useEffect(() => {
        // VALIDATION GUARD: Ensure results are valid
        if (!results || isLoading || results.maxPropertyValue <= 0) return;

        // ACCESSIBILITY: Detect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let intervalId: ReturnType<typeof setInterval>;
        let confettiTimeoutId: ReturnType<typeof setTimeout>;
        let dossierTimeoutId: ReturnType<typeof setTimeout>;

        // Configuration
        const target = results.maxPropertyValue;
        const stages = 5;
        const intervalTime = 600; // ms
        const increment = Math.ceil(target / stages);
        const perfStart = performance.now(); // Performance tracking

        let currentStage = 0;

        // Tracker to prevent redundant state updates
        let lastMilestone = 0;

        if (prefersReducedMotion) {
            // Immediate jump for reduced motion
            setDisplayValue(target);
            setHasCounted(true);
            setCurrentMilestone(3); // Max milestone
            setShowDossier(true);

            // Audio feedback even with reduced motion
            try {
                if (window.AudioContext || (window as any).webkitAudioContext) {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const ctx = new AudioContextClass();
                    const now = ctx.currentTime;
                    const gainNode = ctx.createGain();
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
                    gainNode.gain.linearRampToValueAtTime(0, now + 0.7);
                    gainNode.connect(ctx.destination);
                    const osc1 = ctx.createOscillator();
                    osc1.type = 'sine';
                    osc1.frequency.value = 523.25;
                    osc1.connect(gainNode);
                    osc1.start(now);
                    osc1.stop(now + 0.8);
                    const osc2 = ctx.createOscillator();
                    osc2.type = 'sine';
                    osc2.frequency.value = 659.25;
                    osc2.connect(gainNode);
                    osc2.start(now);
                    osc2.stop(now + 0.8);
                    setTimeout(() => ctx.close(), 1000);
                }
            } catch { }

            return;
        }

        const pulse = () => {
            currentStage++;

            // Calculate current value based on stage (20%, 40%, 60%, 80%, 100%)
            let currentValue = currentStage * increment;
            if (currentStage >= stages) {
                currentValue = target;
            }

            // Update value for the "Fade In"
            setDisplayValue(currentValue);

            // Milestone Synchronization (Check on the "Fade In")
            let newMilestone = lastMilestone;
            if (currentValue >= MILESTONES.premium) newMilestone = 3;
            else if (currentValue >= MILESTONES.significant) newMilestone = 2;
            else if (currentValue >= MILESTONES.entry) newMilestone = 1;

            if (newMilestone !== lastMilestone) {
                lastMilestone = newMilestone;
                setCurrentMilestone(newMilestone);
            }

            // Completion
            if (currentStage >= stages) {
                clearInterval(intervalId);
                setHasCounted(true);

                // Animation drift monitoring
                const totalDuration = performance.now() - perfStart;
                const expectedDuration = stages * intervalTime;
                const drift = totalDuration - expectedDuration;

                if (drift > 200) {
                    // Log drift to backend
                    try {
                        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                        if (supabaseUrl) {
                            fetch(`${supabaseUrl}/functions/v1/log-error`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    error_type: 'animation_drift',
                                    message: `Step5 counter drift: ${drift.toFixed(0)}ms`,
                                    stack: `Expected: ${expectedDuration}ms, Actual: ${totalDuration.toFixed(0)}ms`,
                                    url: window.location.href,
                                    user_agent: navigator.userAgent,
                                    timestamp: new Date().toISOString(),
                                }),
                            }).catch(() => { });
                        }
                    } catch { }
                }

                // Audio feedback - "Golden Chime" (Major-7th Chord: C5, E5, G5, B5)
                // Symbolizes "Sophistication" and "Premium Resolution"
                try {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (AudioContextClass) {
                        const ctx = new AudioContextClass();
                        const now = ctx.currentTime;

                        // Master Gain for Envelope
                        const masterGain = ctx.createGain();
                        masterGain.gain.setValueAtTime(0, now);
                        masterGain.gain.linearRampToValueAtTime(0.15, now + 0.05); // Attack: 0.05s to 15% volume
                        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // Decay: 1.2s fade out
                        masterGain.connect(ctx.destination);

                        // Frequencies for C Major 7th (Just Intonation approximations or standard equal temp)
                        const frequencies = [523.25, 659.25, 783.99, 987.77];

                        frequencies.forEach(freq => {
                            const osc = ctx.createOscillator();
                            osc.type = 'triangle'; // Warmer, more instrumental tone
                            osc.frequency.value = freq;
                            osc.connect(masterGain);
                            osc.start(now);
                            osc.stop(now + 1.5); // Stop after envelope finishes
                        });

                        // Cleanup
                        setTimeout(() => ctx.close(), 1600);
                    }
                } catch { }

                // Trigger celebration exactly on the final "Fade In"
                confettiTimeoutId = setTimeout(() => celebrate(), 0);

                // Reveal Dossier 800ms after final value appears
                dossierTimeoutId = setTimeout(() => setShowDossier(true), 800);
            }
        };

        // Initial Start
        intervalId = setInterval(pulse, intervalTime);

        // Robust Cleanup
        return () => {
            if (intervalId) clearInterval(intervalId);
            clearTimeout(confettiTimeoutId);
            clearTimeout(dossierTimeoutId);
        };
    }, [results, isLoading]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-medium text-primary/80 max-w-xs mx-auto leading-relaxed">
                    {t.loadingText}
                </h3>
            </div>
        );
    }

    if (!results) return null;

    const getMilestoneText = (milestone: number) => {
        if (milestone === 1) return t.milestone1;
        if (milestone === 2) return t.milestone2;
        if (milestone === 3) return t.milestone3;
        return '';
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">

            {/* Success Card */}
            <div className="text-center space-y-6 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2 shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                        {t.revealSuccessHeader.replace('[Name]', firstName || '')}
                    </h2>


                    {/* Fixed-Height Milestone Container - Single Active Badge */}
                    <div className="h-8 flex items-center justify-center">
                        {currentMilestone > 0 && (
                            <div
                                key={currentMilestone}
                                className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-amber-50 border border-amber-200/50 shadow-md animate-in fade-in zoom-in duration-300"
                            >
                                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600">
                                    {getMilestoneText(currentMilestone)}
                                </span>
                            </div>
                        )}
                    </div>


                    {/* Fixed Height Container for Heartbeat Animation */}
                    <div className="h-20 sm:h-24 md:h-28 flex items-center justify-center overflow-visible">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={displayValue}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-md block leading-tight break-all",
                                    // Responsive scaling: smaller on mobile for large numbers
                                    display(displayValue).length > 8
                                        ? "text-3xl sm:text-5xl md:text-6xl" // Long numbers (e.g. ₪ 10,000,000)
                                        : "text-4xl sm:text-5xl md:text-6xl" // Standard numbers
                                )}
                            >
                                {display(displayValue)}
                            </motion.span>
                        </AnimatePresence>
                    </div>

                    {hasCounted && (
                        <p className="text-sm font-semibold text-green-600 animate-in fade-in duration-500">
                            {t.revealComplete}
                        </p>
                    )}

                    <p className="text-muted-foreground font-medium">
                        {t.successSubtitle}
                    </p>

                    {hasCounted && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button
                                variant="default"
                                onClick={() => {
                                    setShowDossier(true);
                                    setTimeout(() => {
                                        document.getElementById('lead-capture-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                }}
                                className="mt-8 w-full max-w-sm bg-gradient-to-r from-primary via-primary-dark to-primary hover:bg-pos-100 bg-pos-0 bg-[length:200%_auto] text-white rounded-[2rem] px-8 md:px-12 py-10 md:py-12 text-base md:text-xl font-black shadow-[0_20px_60px_rgba(30,64,175,0.4)] hover:shadow-[0_20px_80px_rgba(30,64,175,0.6)] hover:scale-[1.05] active:scale-[0.98] transition-all duration-500 group relative overflow-hidden mx-auto h-auto min-h-[5rem]"
                            >
                                {/* Animated Shine Effect */}
                                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-25deg] -translate-x-full group-hover:animate-shine pointer-events-none" />

                                <span className="relative z-10 flex flex-wrap items-center justify-center leading-tight whitespace-normal break-words">
                                    <span className="text-center">{t.jumpToDossier}</span>
                                    <motion.span
                                        animate={{ y: [0, 6, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        className="ms-2 md:ms-4 text-xl md:text-2xl shrink-0"
                                    >
                                        ↓
                                    </motion.span>
                                </span>
                            </Button>
                        </motion.div>
                    )}

                    {/* Deal Feasibility Summary */}
                    {hasTargetPrice && hasCounted && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto mt-6 p-5 rounded-2xl border border-slate-200/60 bg-white/40 backdrop-blur-sm shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t.dealFeasibility}
                                </span>
                                <Badge className={cn(
                                    "font-bold px-3 py-0.5 rounded-full border-none",
                                    feasibility === 'green' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                        feasibility === 'orange' ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                                            "bg-red-100 text-red-700 hover:bg-red-100"
                                )}>
                                    {feasibility === 'green' ? t.statusGreen :
                                        feasibility === 'orange' ? t.statusOrange :
                                            t.statusRed}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{t.targetPropertyPriceLabel}</p>
                                    <p className="text-sm font-bold text-slate-700">{display(targetPropertyPrice)}</p>
                                </div>
                                <div className="space-y-1 text-end">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{t.differenceLabel}</p>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        maxBudget - targetPropertyPrice >= 0 ? "text-green-600" : "text-red-500"
                                    )}>
                                        {maxBudget - targetPropertyPrice >= 0 ? "+" : ""}
                                        {display(maxBudget - targetPropertyPrice)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Optional Amortization Table */}
            {config.show_amortization_table && results.amortizationTable && (
                <div className={cn(
                    "transition-all duration-1000 ease-out transform delay-300",
                    showDossier ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                    <AmortizationTable
                        rows={results.amortizationTable}
                        maxDisplayMonths={config.max_amortization_months}
                    />
                </div>
            )}

            {config.enable_what_if_calculator && showDossier && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <p className="text-amber-800 text-sm font-medium">
                        💡 {language === 'he' ? `הידעת? הגדלה של ההחזר החודשי ב-${symbol}500 בלבד יכולה להגדיל את כוח הקנייה שלך בכ-${symbol}100,000!` :
                            `Did you know? Increasing your monthly payment by just ${symbol}500 could grow your budget by approximately ${symbol}100,000!`}
                    </p>
                </div>
            )}

            {/* Dossier Teaser - Animated Entry */}
            <div
                id="lead-capture-section"
                className={cn(
                    "transition-all duration-1000 ease-out transform",
                    showDossier ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}>
                <div className="bg-white rounded-[2rem] p-8 sm:p-12 md:p-16 border-2 border-primary/10 space-y-12 md:space-y-16 mt-12 shadow-[0_30px_70px_rgba(30,64,175,0.1)] relative overflow-hidden w-full mx-auto">

                    {/* Premium Header */}
                    <div className="space-y-6 text-center relative z-10">
                        <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-primary/10 mb-2 ring-1 ring-primary/20 shadow-inner">
                            {/* Premium Icon composed of Folder + Text */}
                            <div className="relative">
                                <FolderOpen className="w-12 h-12 text-primary" strokeWidth={1.5} />
                                <FileText className="w-6 h-6 text-accent absolute -right-2 -bottom-2 bg-white rounded-lg p-1 shadow-md border border-primary/10" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-black text-xl sm:text-2xl md:text-4xl text-primary tracking-tight whitespace-normal break-words">
                                {t.dossierTeaser}
                            </h3>

                            <div className="space-y-4 max-w-2xl mx-auto">
                                <p className="text-base sm:text-lg md:text-xl text-slate-800 leading-relaxed font-bold px-2 md:px-4 whitespace-normal break-words">
                                    {getDiagnosisHook()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields & Button Container - Vertical Stack (Strict Gap 8) */}
                    <div className="flex flex-col gap-8 w-full max-w-md mx-auto">
                        {/* 1. Email Field */}
                        <div className="w-full">
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <FormInput
                                        label={t.email}
                                        icon={<Mail className="w-4 h-4" />}
                                        type="email"
                                        {...field}
                                        hasError={!!errors.email}
                                        required={true}
                                        className="bg-white w-full"
                                        placeholder="example@email.com"
                                    />
                                )}
                            />
                        </div>

                        {/* 2. Phone Field */}
                        <div className="w-full">
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <FormInput
                                        label={t.phone}
                                        icon={<Phone className="w-4 h-4" />}
                                        type="tel"
                                        {...field}
                                        hasError={!!errors.phone}
                                        required={true}
                                        className="bg-white w-full"
                                        placeholder="050-0000000"
                                    />
                                )}
                            />
                        </div>

                        {/* 3. Send Button */}
                        <Button
                            type="button"
                            onClick={onSendReport}
                            disabled={isSending}
                            className={cn(
                                "w-full min-h-[4rem] py-4 h-auto text-sm sm:text-base md:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center px-4 whitespace-normal",
                                "bg-gradient-to-r from-primary to-primary-dark hover:scale-[1.01]",
                                // hasCounted && "animate-pulse shadow-primary/30" // Removed blinking animation
                            )}
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2 shrink-0" />
                            ) : (
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0" />
                            )}
                            <span className="whitespace-normal break-words leading-tight">
                                {t.leadCaptureBtn}
                            </span>
                        </Button>
                    </div>

                    {/* Expert Commitment - Trust Signal */}
                    <p className="text-xs text-center text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                        <CheckCircle2 className="w-3 h-3 inline-block mr-1 opacity-70" />
                        {language === 'he'
                            ? `✓ התיק ייבדק בידי מומחה מבית ${partner?.name || 'אשל פיננסים'} כדי לוודא תאימות לכללי בנק ישראל 2026.`
                            : language === 'fr'
                            ? `✓ Votre dossier sera examiné par un expert de ${partner?.name || 'Eshel Finances'} pour vérifier sa conformité aux réglementations bancaires israéliennes 2026.`
                            : `✓ Your file will be reviewed by a ${partner?.name || 'Eshel Finances'} expert to ensure compliance with 2026 Israeli banking regulations.`}
                    </p>

                    {/* DEV MODE: Validation Hook */}
                    {import.meta.env.DEV && (
                        <div className="mt-6 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('dev-mirror-preview'))}
                                className="mx-auto block text-[10px] uppercase tracking-wider font-bold text-slate-400 border border-dashed border-slate-300 px-4 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-all"
                            >
                                🔍 Architect: Validate Dossier Layout
                            </button>

                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="mx-auto block text-[10px] uppercase tracking-wider font-bold text-blue-400 border border-dashed border-blue-200 px-4 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all"
                                >
                                    ↩️ Architect: Back to Editing
                                </button>
                            )}
                        </div>
                    )}

                    {/* Dev Email Preview Dialog */}
                    <DevEmailPreview
                        inputs={calcData?.inputs as ReportEmailRequest['inputs'] | null}
                        results={calcData?.results as ReportEmailRequest['results'] | null}
                        language={language}
                    />
                </div>
            </div>
        </div>

    );
}
