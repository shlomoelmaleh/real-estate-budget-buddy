import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Loader2, Mail, Phone, FileText, CheckCircle2, FolderOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StepRevealProps } from '../types';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/FormInput';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/calculator';

export function Step5({
    control,
    errors,
    t,
    results,
    isLoading,
    onSendReport,
    isSending,
    watch
}: StepRevealProps) {

    const [displayValue, setDisplayValue] = useState(0);
    const [hasCounted, setHasCounted] = useState(false);
    const [currentMilestone, setCurrentMilestone] = useState<number>(0); // 0 = none, 1-3 = tier
    const fullName = watch ? watch('fullName') : '';
    const firstName = fullName?.split(' ')[0] || '';
    const [showDossier, setShowDossier] = useState(false);

    // Dynamic Diagnosis Hook
    const getDiagnosisHook = () => {
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
    const celebrate = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ['#1e40af', '#3b82f6', '#60a5fa', '#FFD700', '#FDB931', '#D4AF37']; // Blue and Gold

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

    // Ease-out cubic function for smooth deceleration
    const easeOutCubic = (x: number): number => {
        return 1 - Math.pow(1 - x, 3);
    };

    useEffect(() => {
        // VALIDATION GUARD: Ensure results are valid
        if (!results || isLoading || results.maxPropertyValue <= 0) return;

        // ACCESSIBILITY: Detect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let intervalId: NodeJS.Timeout;
        let confettiTimeoutId: NodeJS.Timeout;
        let dossierTimeoutId: NodeJS.Timeout;

        // Heartbeat Engine Configuration
        const target = results.maxPropertyValue;
        const totalBeats = 10;
        const beatInterval = 250; // ms
        let currentBeat = 0;

        // Tracker to prevent redundant state updates
        let lastMilestone = 0;

        if (prefersReducedMotion) {
            // Immediate jump for reduced motion
            setDisplayValue(target);
            setHasCounted(true);
            setCurrentMilestone(3); // Max milestone
            setShowDossier(true);
            return;
        }

        const beat = () => {
            currentBeat++;

            // Linear increment with a "snap" feel
            const progress = currentBeat / totalBeats;
            const currentValue = Math.floor(progress * target);

            setDisplayValue(currentValue);

            // optimized Milestone Tracking (Heartbeat sync)
            let newMilestone = lastMilestone;
            if (currentValue >= MILESTONES.premium) newMilestone = 3;
            else if (currentValue >= MILESTONES.significant) newMilestone = 2;
            else if (currentValue >= MILESTONES.entry) newMilestone = 1;

            if (newMilestone !== lastMilestone) {
                lastMilestone = newMilestone;
                setCurrentMilestone(newMilestone);
            }

            if (currentBeat >= totalBeats) {
                clearInterval(intervalId);
                setDisplayValue(target); // Ensure exact final value
                setHasCounted(true);

                // Trigger celebration immediately after last beat (2.5s mark)
                confettiTimeoutId = setTimeout(() => celebrate(), 0);

                // Reveal Dossier 500ms after completion
                dossierTimeoutId = setTimeout(() => setShowDossier(true), 500);
            }
        };

        // Start the Heartbeat
        intervalId = setInterval(beat, beatInterval);

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


                    <div className="py-2 overflow-hidden px-2">
                        <span className={cn(
                            "font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-md block leading-tight break-all",
                            // Responsive scaling: smaller on mobile for large numbers
                            formatNumber(displayValue).length > 8
                                ? "text-3xl sm:text-5xl md:text-6xl" // Long numbers (e.g. ₪ 10,000,000)
                                : "text-4xl sm:text-5xl md:text-6xl" // Standard numbers
                        )}>
                            ₪ {formatNumber(displayValue)}
                        </span>
                    </div>

                    {hasCounted && (
                        <p className="text-sm font-semibold text-green-600 animate-in fade-in duration-500">
                            {t.revealComplete}
                        </p>
                    )}

                    <p className="text-muted-foreground font-medium">
                        {t.successSubtitle}
                    </p>
                </div>
            </div>

            {/* Dossier Teaser - Animated Entry */}
            <div className={cn(
                "transition-all duration-1000 ease-out transform",
                showDossier ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 space-y-8 mt-8 shadow-sm relative overflow-hidden">

                    {/* Premium Header */}
                    <div className="space-y-4 text-center relative z-10">
                        <div className="inline-flex items-center justify-center p-4 rounded-full bg-blue-950/5 mb-2 ring-1 ring-blue-900/10">
                            {/* Premium Icon composed of Folder + Text */}
                            <div className="relative">
                                <FolderOpen className="w-10 h-10 text-[#1e3a8a]" strokeWidth={1.5} />
                                <FileText className="w-5 h-5 text-[#d97706] absolute -right-1 -bottom-1 bg-white rounded-full p-0.5 shadow-sm" />
                            </div>
                        </div>

                        <h3 className="font-bold text-xl text-[#1e3a8a]">
                            {t.dossierTeaser}
                        </h3>

                        <p className="text-base text-slate-600 leading-relaxed max-w-lg mx-auto font-medium">
                            {getDiagnosisHook()}
                        </p>
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
                                        className="bg-white w-full"
                                        placeholder="050-0000000"
                                    />
                                )}
                            />
                        </div>

                        {/* 3. Send Button - Glowing pulse after confetti */}
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
                            <span className="text-balance leading-tight">
                                {t.leadCaptureBtn}
                            </span>
                        </Button>
                    </div>

                    {/* Expert Commitment - Trust Signal */}
                    <p className="text-xs text-center text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
                        <CheckCircle2 className="w-3 h-3 inline-block mr-1 opacity-70" />
                        {t.expertCommitment}
                    </p>
                </div>
            </div>
        </div>

    );
}
