import { Controller } from 'react-hook-form';
import { Home, Flag, Banknote, Check, X, Building2, CircleDollarSign } from 'lucide-react';
import { StepProps } from '../types';
import { Label } from '@/components/ui/label';
import { FormInput } from '@/components/FormInput';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function Step3({ control, errors, t, watch }: StepProps) {
    const isRented = watch ? watch('isRented') : false;

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

            {/* Israeli Citizen & Tax Resident Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                </div>

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
                </div>
            </div>

            {/* Investment Property Toggle */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <Controller
                    name="isRented"
                    control={control}
                    render={({ field }) => (
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">{t.isRented}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {field.value ? t.isRentedYes : t.isRentedNo}
                                </p>
                            </div>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </div>
                    )}
                />

                {/* Conditional Rent Input */}
                <div className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isRented ? "grid-rows-[1fr] mt-4 opacity-100" : "grid-rows-[0fr] opacity-0"
                )}>
                    <div className="overflow-hidden">
                        <Controller
                            name="expectedRent"
                            control={control}
                            render={({ field }) => (
                                <FormInput
                                    label={`${t.expectedRent} (₪)`}
                                    currencySymbol={t.currencySymbol}
                                    icon={<Building2 className="w-4 h-4" />}
                                    {...field}
                                    formatNumber={true}
                                    hasError={!!errors.expectedRent}
                                    className="bg-white"
                                />
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Budget Cap */}
            <Controller
                name="budgetCap"
                control={control}
                render={({ field }) => (
                    <FormInput
                        label={`${t.budgetCap} (₪)`}
                        suffix={t.optional}
                        currencySymbol={t.currencySymbol}
                        icon={<CircleDollarSign className="w-4 h-4" />}
                        {...field}
                        formatNumber={true}
                        className="bg-white/50"
                    />
                )}
            />

            <p className="text-[10px] text-muted-foreground mt-4 italic">
                {t.convertNotice}
            </p>
        </div>
    );
}
