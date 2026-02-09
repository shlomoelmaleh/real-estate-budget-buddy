import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Loader2, Mail, Phone, FileText, CheckCircle2 } from 'lucide-react';
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

    useEffect(() => {
        if (!results || isLoading) return;

        // Counting Engine with milestone tracking
        const target = results.maxPropertyValue;
        const duration = 6000; // Increased to 6.0 seconds for maximum impact and clarity
        const fps = 60;
        const steps = duration / (1000 / fps);
        const increment = target / steps;

        let current = 0;
        const timer = setInterval(() => {
            current += increment;

            // Determine highest milestone reached (only update if higher)
            if (current >= MILESTONES.premium) {
                setCurrentMilestone(prev => Math.max(prev, 3));
            } else if (current >= MILESTONES.significant) {
                setCurrentMilestone(prev => Math.max(prev, 2));
            } else if (current >= MILESTONES.entry) {
                setCurrentMilestone(prev => Math.max(prev, 1));
            }

            if (current >= target) {
                setDisplayValue(target);
                setHasCounted(true);
                clearInterval(timer);
                // Trigger confetti when counting completes
                setTimeout(() => celebrate(), 200);
            } else {
                setDisplayValue(current);
            }
        }, 1000 / fps);

        return () => clearInterval(timer);
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


                    <div className="py-2">
                        <span className={cn(
                            "text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 drop-shadow-md block leading-tight"
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

            {/* Strategic Lock (Lead Capture) */}
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 space-y-8 mt-8 shadow-sm">
                <div className="space-y-2 text-center">
                    <h3 className="font-semibold text-lg flex items-center justify-center gap-2 text-primary">
                        <FileText className="w-5 h-5" />
                        {t.leadCaptureBtn}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {t.leadCaptureTitle}
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
                            "w-full py-7 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
                            "bg-gradient-to-r from-primary to-primary-dark hover:scale-[1.01]",
                            hasCounted && "animate-pulse shadow-primary/30"
                        )}
                    >
                        {isSending ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <FileText className="w-6 h-6 mr-2" />
                        )}
                        {t.leadCaptureBtn}
                    </Button>
                </div>
            </div>
        </div>
    );
}
