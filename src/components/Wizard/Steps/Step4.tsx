import { Controller, useWatch } from 'react-hook-form';
import { Building2, CircleDollarSign, Target, Clock } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fmt } from '@/lib/currencyUtils';

export function Step4({ control, errors, t, watch, setValue }: StepProps) {
    const { symbol, currency, parseInput } = useCurrency();
    const isRented = watch ? watch('isRented') : false;

    const expectedRentInput = useWatch({ control, name: 'expectedRent' });
    const rawRent = parseFloat(expectedRentInput?.toString().replace(/,/g, '') || '0');
    const ilsRent = rawRent > 0 && currency !== 'ILS' ? parseInput(rawRent) : null;

    const budgetCapInput = useWatch({ control, name: 'budgetCap' });
    const rawBudget = parseFloat(budgetCapInput?.toString().replace(/,/g, '') || '0');
    const ilsBudget = rawBudget > 0 && currency !== 'ILS' ? parseInput(rawBudget) : null;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">

            {/* Investment Property Toggle */}
            <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20">
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
                            {/* Force LTR for Switch to fix RTL physics */}
                            <span dir="ltr" className="flex items-center">
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={(val) => {
                                        field.onChange(val);
                                        if (!val && setValue) {
                                            setValue('expectedRent', '');
                                        }
                                    }}
                                />
                            </span>
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
                                    label={`${t.expectedRent} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                                    currencySymbol={symbol}
                                    icon={<Building2 className="w-4 h-4" />}
                                    {...field}
                                    formatNumber={true}
                                    hasError={!!errors.expectedRent}
                                    className="bg-white"
                                    helperText={ilsRent ? `≈ ${fmt(ilsRent, 'ILS')}` : undefined}
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
                        label={`${t.budgetCap} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                        suffix={t.optional}
                        currencySymbol={symbol}
                        icon={<CircleDollarSign className="w-4 h-4" />}
                        {...field}
                        formatNumber={true}
                        className="bg-white/50"
                        helperText={ilsBudget ? `≈ ${fmt(ilsBudget, 'ILS')}` : undefined}
                    />
                )}
            />

            {/* Max Loan Term */}
            <Controller
                name="maxLoanTerm"
                control={control}
                render={({ field }) => {
                    const currentVal = field.value ? parseInt(field.value as string) : 0;
                    const isActive = currentVal > 0;
                    return (
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {t.maxLoanTermWizardLabel}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {isActive
                                            ? t.maxLoanTermWizardActive.replace('{years}', field.value as string)
                                            : t.maxLoanTermWizardInactive}
                                    </p>
                                </div>
                                <span dir="ltr" className="flex items-center">
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={(on) => {
                                            if (!on) {
                                                field.onChange('');
                                            } else {
                                                field.onChange('20');
                                            }
                                        }}
                                    />
                                </span>
                            </div>

                            <div className={cn(
                                "grid transition-all duration-300 ease-in-out",
                                isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                            )}>
                                <div className="overflow-hidden">
                                    <FormInput
                                        label={t.maxLoanTermWizardYears}
                                        suffix={t.maxLoanTermWizardUnit}
                                        icon={<Clock className="w-4 h-4" />}
                                        {...field}
                                        value={field.value as string}
                                        formatNumber={false}
                                        hasError={!!errors.maxLoanTerm}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }}
            />

            <p className="text-[10px] text-muted-foreground mt-4 italic">
                {t.convertNotice}
            </p>
        </div>
    );
}
