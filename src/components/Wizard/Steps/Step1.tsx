import { Controller } from 'react-hook-form';
import { User, Clock, Target } from 'lucide-react';
import { FormInput } from '@/components/FormInput';
import { StepProps } from '../types';

export function Step1({ control, errors, t }: StepProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="space-y-4">
                <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={t.fullName}
                            icon={<User className="w-4 h-4" />}
                            {...field}
                            hasError={!!errors.fullName}
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
                            icon={<Clock className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            hasError={!!errors.age}
                            className="bg-white/50"
                        />
                    )}
                />

                <Controller
                    name="targetPropertyPrice"
                    control={control}
                    render={({ field }) => (
                        <FormInput
                            label={`${t.targetPropertyPrice} (₪)`}
                            suffix={t.optional}
                            currencySymbol={t.currencySymbol}
                            icon={<Target className="w-4 h-4" />}
                            {...field}
                            formatNumber={true}
                            className="bg-white/50"
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
