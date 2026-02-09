import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Loader2, Mail, Phone, FileText, CheckCircle2 } from 'lucide-react';
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
    const fullName = watch ? watch('fullName') : '';
    const firstName = fullName?.split(' ')[0] || '';

    useEffect(() => {
        if (!results || isLoading) return;

        // Counting Engine
        const target = results.maxPropertyValue;
        const duration = 2000; // 2.0 seconds as requested
        const fps = 60;
        const steps = duration / (1000 / fps);
        const increment = target / steps;

        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                setDisplayValue(target);
                setHasCounted(true);
                clearInterval(timer);
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

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">

            {/* Success Card */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2 shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                        {t.revealSuccessHeader.replace('[Name]', firstName || '')}
                    </h2>
                    <div className="py-2">
                        <span className={cn(
                            "text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] drop-shadow-md block leading-tight", // Premium Gold Gradient
                            hasCounted && "animate-pulse" // Subtle pulse after counting
                        )}>
                            ₪ {formatNumber(displayValue)}
                        </span>
                    </div>
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

                    {/* 3. Send Button */}
                    <Button
                        type="button"
                        onClick={onSendReport}
                        disabled={isSending}
                        className={cn(
                            "w-full py-7 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
                            "bg-gradient-to-r from-primary to-primary-dark hover:scale-[1.01]"
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
