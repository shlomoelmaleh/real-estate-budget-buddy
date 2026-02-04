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
    isSending
}: StepRevealProps) {

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

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                        {t.successTitle}
                    </h2>
                    <div className="py-4">
                        <span className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 drop-shadow-sm">
                            ₪ {formatNumber(results.maxPropertyValue)}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        {t.successSubtitle}
                    </p>
                </div>
            </div>

            {/* Strategic Lock (Lead Capture) */}
            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 space-y-6 mt-8 shadow-sm">
                <div className="space-y-2 text-center">
                    <h3 className="font-semibold text-lg flex items-center justify-center gap-2 text-primary">
                        <FileText className="w-5 h-5" />
                        {/* Split for emphasis if possible, otherwise just show */}
                        {t.leadCaptureTitle.split('?')[0]}?
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {t.leadCaptureTitle.split('?')[1] || t.leadCaptureTitle}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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
                                className="bg-white"
                            />
                        )}
                    />
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
                                className="bg-white"
                            />
                        )}
                    />
                </div>

                <Button
                    type="button" // Important: type button to avoid double submit if form tag exists
                    onClick={onSendReport}
                    disabled={isSending}
                    className={cn(
                        "w-full py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
                        "bg-gradient-to-r from-primary to-primary-dark hover:scale-[1.01]"
                    )}
                >
                    {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                        <FileText className="w-5 h-5 mr-2" />
                    )}
                    {t.leadCaptureBtn}
                </Button>
            </div>
        </div>
    );
}
