import { Control, Controller, FieldErrors, useWatch } from 'react-hook-form';
import { Wallet, Banknote, TrendingUp, Target } from 'lucide-react';
import { FormSection } from '../FormSection';
import { FormInput } from '../FormInput';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fmt } from '@/lib/currencyUtils';

interface FinancialSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
  errors: FieldErrors<CalculatorFormValues>;
}

export function FinancialSection({ control, t, errors }: FinancialSectionProps) {
  const { symbol, currency, parseInput } = useCurrency();

  const equityInput = useWatch({ control, name: 'equity' });
  const rawEquity = parseFloat(equityInput?.toString().replace(/,/g, '') || '0');
  const ilsEquity = rawEquity > 0 && currency !== 'ILS' ? parseInput(rawEquity) : null;

  const netIncomeInput = useWatch({ control, name: 'netIncome' });
  const rawIncome = parseFloat(netIncomeInput?.toString().replace(/,/g, '') || '0');
  const ilsIncome = rawIncome > 0 && currency !== 'ILS' ? parseInput(rawIncome) : null;

  const targetPropertyPriceInput = useWatch({ control, name: 'targetPropertyPrice' });
  const rawTargetPrice = parseFloat(targetPropertyPriceInput?.toString().replace(/,/g, '') || '0');
  const ilsTargetPrice = rawTargetPrice > 0 && currency !== 'ILS' ? parseInput(rawTargetPrice) : null;

  return (
    <FormSection icon={<Wallet className="w-5 h-5 text-accent" />} title={t.titleFinancial} variant="accent">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          name="equity"
          control={control}
          render={({ field }) => (
            <FormInput
              label={`${t.equity} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
              icon={<Banknote className="w-4 h-4" />}
              currencySymbol={symbol}
              value={field.value}
              onChange={field.onChange}
              formatNumber
              required
              hasError={!!errors.equity}
              helperText={ilsEquity ? `≈ ${fmt(ilsEquity, 'ILS')}` : undefined}
            />
          )}
        />
        <div className="space-y-2">
          <Controller
            name="netIncome"
            control={control}
            render={({ field }) => (
              <FormInput
                label={`${t.netIncomeLabel} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                icon={<TrendingUp className="w-4 h-4" />}
                currencySymbol={symbol}
                value={field.value}
                onChange={field.onChange}
                formatNumber
                required
                hasError={!!errors.netIncome}
                helperText={ilsIncome ? `≈ ${fmt(ilsIncome, 'ILS')}` : undefined}
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
              label={`${t.targetPropertyPrice} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
              icon={<Target className="w-4 h-4" />}
              currencySymbol={symbol}
              value={field.value}
              onChange={field.onChange}
              formatNumber
              helperText={ilsTargetPrice ? `≈ ${fmt(ilsTargetPrice, 'ILS')}` : undefined}
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
