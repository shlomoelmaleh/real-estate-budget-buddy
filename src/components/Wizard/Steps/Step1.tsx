import { Controller, useWatch } from 'react-hook-form';
import { User, Clock, Target } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fmt } from '@/lib/currencyUtils';

export function Step1({ control, errors, t }: StepProps) {
    const { symbol, currency, parseInput } = useCurrency();
    const targetPropertyPrice = useWatch({ control, name: 'targetPropertyPrice' });
    const rawPrice = parseFloat(targetPropertyPrice?.toString().replace(/,/g, '') || '0');
    const ilsEquivalent = rawPrice > 0 && currency !== 'ILS' ? parseInput(rawPrice) : null;

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
                <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={t.fullName}
                            required={true}
                            icon={<User className="w-4 h-4" />}
                            {...field}
                            hasError={!!errors.fullName}
                            error={errors.fullName?.message}
                            className="bg-white/50"
                        />
                    )}
                />

                <Controller
                    name="age"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={t.age}
                            required={true}
                            icon={<Clock className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.age}
                            error={errors.age?.message}
                            className="bg-white/50"
                        />
                    )}
                />

                <Controller
                    name="targetPropertyPrice"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={`${t.targetPropertyPrice} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                            suffix={t.optional}
                            currencySymbol={symbol}
                            icon={<Target className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            className="bg-white/50"
                            helperText={ilsEquivalent ? `≈ ${fmt(ilsEquivalent, 'ILS')}` : undefined}
                        />
                    )}
                />
            </div>

            <p className="text-[10px] text-muted-foreground mt-4 italic">
                {t.convertNotice}
            </p>
        </div>
    );
}
