import { Controller } from 'react-hook-form';
import { Coins, TrendingUp } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';

export function Step2({ control, errors, t }: StepProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
                <Controller
                    name="equity"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={t.equity}
                            icon={<Coins className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.equity}
                            className="bg-white/50"
                        />
                    )}
                />

                <Controller
                    name="netIncome"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={t.netIncome}
                            icon={<TrendingUp className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.netIncome}
                            className="bg-white/50"
                        />
                    )}
                />
            </div>
        </div>
    );
}
