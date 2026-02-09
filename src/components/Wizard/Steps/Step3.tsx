import { Controller } from 'react-hook-form';
import { Home, Flag, Banknote, Check, X } from 'lucide-react';
import { StepProps } from '../types';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function Step3({ control, errors, t }: StepProps) {

    const ToggleButton = ({
        active,
        onClick,
        children,
        variant
    }: {
        active: boolean;
        onClick: () => void;
        children: React.ReactNode;
        variant: 'yes' | 'no';
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex-1 py-4 px-6 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2",
                active
                    ? (variant === 'yes'
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]"
                        : "bg-slate-700 text-white border-slate-700 shadow-lg scale-[1.02]")
                    : "bg-white/50 border-border hover:bg-white/80 hover:border-primary/50 text-muted-foreground"
            )}
        >
            {variant === 'yes' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="font-semibold">{children}</span>
        </button>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-500">
            {/* First Property */}
            <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    {t.isFirstProperty}
                </Label>
                <Controller
                    name="isFirstProperty"
                    control={control}
                    render={({ field }) => (
                        <div className="flex gap-4">
                            <ToggleButton
                                active={field.value === true}
                                onClick={() => field.onChange(true)}
                                variant="yes"
                            >
                                {t.yes}
                            </ToggleButton>
                            <ToggleButton
                                active={field.value === false}
                                onClick={() => field.onChange(false)}
                                variant="no"
                            >
                                {t.no}
                            </ToggleButton>
                        </div>
                    )}
                />
                {errors.isFirstProperty && (
                    <p className="text-sm text-destructive">{t.requiredField}</p>
                )}
            </div>

            {/* Israeli Citizen */}
            <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Flag className="w-5 h-5 text-primary" />
                    {t.isIsraeliCitizen}
                </Label>
                <Controller
                    name="isIsraeliCitizen"
                    control={control}
                    render={({ field }) => (
                        <div className="flex gap-4">
                            <ToggleButton
                                active={field.value === true}
                                onClick={() => field.onChange(true)}
                                variant="yes"
                            >
                                {t.yes}
                            </ToggleButton>
                            <ToggleButton
                                active={field.value === false}
                                onClick={() => field.onChange(false)}
                                variant="no"
                            >
                                {t.no}
                            </ToggleButton>
                        </div>
                    )}
                />
                {errors.isIsraeliCitizen && (
                    <p className="text-sm text-destructive">{t.requiredField}</p>
                )}
            </div>

            {/* Tax Resident */}
            <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-primary" />
                    {t.isIsraeliTaxResident}
                </Label>
                <Controller
                    name="isIsraeliTaxResident"
                    control={control}
                    render={({ field }) => (
                        <div className="flex gap-4">
                            <ToggleButton
                                active={field.value === true}
                                onClick={() => field.onChange(true)}
                                variant="yes"
                            >
                                {t.yes}
                            </ToggleButton>
                            <ToggleButton
                                active={field.value === false}
                                onClick={() => field.onChange(false)}
                                variant="no"
                            >
                                {t.no}
                            </ToggleButton>
                        </div>
                    )}
                />
                {errors.isIsraeliTaxResident && (
                    <p className="text-sm text-destructive">{t.requiredField}</p>
                )}
            </div>
        </div>
    );
}
