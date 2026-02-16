import { Controller } from 'react-hook-form';
import { Building2, CircleDollarSign, Target } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function Step4({ control, errors, t, watch, setValue }: StepProps) {
    const isRented = watch ? watch('isRented') : false;

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
