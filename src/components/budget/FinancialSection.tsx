import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Wallet, Banknote, TrendingUp, Target } from 'lucide-react';
import { FormSection } from '../FormSection';
import { FormInput } from '../FormInput';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';

interface FinancialSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
  errors: FieldErrors<CalculatorFormValues>;
}

export function FinancialSection({ control, t, errors }: FinancialSectionProps) {
  return (
    <FormSection icon={<Wallet className="w-5 h-5 text-accent" />} title={t.titleFinancial} variant="accent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          name="equity"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.equity}
              icon={<Banknote className="w-4 h-4" />}
              suffix="₪"
              value={field.value}
              onChange={field.onChange}
              formatNumber
              required
              hasError={!!errors.equity}
            />
          )}
        />
        <div className="space-y-2">
          <Controller
            name="netIncome"
            control={control}
            render={({ field }) => (
              <FormInput
                label={t.netIncomeLabel}
                icon={<TrendingUp className="w-4 h-4" />}
                suffix="₪"
                value={field.value}
                onChange={field.onChange}
                formatNumber
                required
                hasError={!!errors.netIncome}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            {t.helperNetIncome}
          </p>
        </div>
      </div>
      
      {/* Target Property Price - Optional */}
      <div className="mt-5 space-y-2">
        <Controller
          name="targetPropertyPrice"
          control={control}
          render={({ field }) => (
            <FormInput
              label={t.targetPropertyPrice}
              icon={<Target className="w-4 h-4" />}
              suffix="₪"
              value={field.value}
              onChange={field.onChange}
              formatNumber
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          {t.targetPropertyPriceHelper}
        </p>
      </div>
    </FormSection>
  );
}
