import { Control, Controller, useWatch } from 'react-hook-form';
import { Home, Banknote, Lock } from 'lucide-react';
import { FormSection } from '../FormSection';
import { FormInput } from '../FormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fmt } from '@/lib/currencyUtils';

interface RentInvestmentSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
}

export function RentInvestmentSection({ control, t }: RentInvestmentSectionProps) {
  const isRented = useWatch({
    control,
    name: "isRented",
  });

  const { symbol, currency, parseInput } = useCurrency();

  const expectedRentInput = useWatch({ control, name: 'expectedRent' });
  const rawRent = parseFloat(expectedRentInput?.toString().replace(/,/g, '') || '0');
  const ilsRent = rawRent > 0 && currency !== 'ILS' ? parseInput(rawRent) : null;

  const budgetCapInput = useWatch({ control, name: 'budgetCap' });
  const rawBudget = parseFloat(budgetCapInput?.toString().replace(/,/g, '') || '0');
  const ilsBudget = rawBudget > 0 && currency !== 'ILS' ? parseInput(rawBudget) : null;

  return (
    <FormSection icon={<Home className="w-5 h-5 text-secondary" />} title={t.titleRent} variant="secondary">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Controller
              name="isRented"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isRented"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="w-5 h-5"
                />
              )}
            />
            <Label htmlFor="isRented" className="cursor-pointer font-medium">
              {t.isRented}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ms-8">
            {t.helperRentEstimate}
          </p>
        </div>

        {/* Expected Monthly Rent - only visible when property will be rented */}
        {isRented && (
          <div className="space-y-2">
            <Controller
              name="expectedRent"
              control={control}
              render={({ field }) => (
                <FormInput
                  label={`${t.expectedRent} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                  icon={<Banknote className="w-4 h-4" />}
                  currencySymbol={symbol}
                  placeholder={t.expectedRentPlaceholder}
                  value={field.value}
                  onChange={field.onChange}
                  formatNumber
                  helperText={ilsRent ? `≈ ${fmt(ilsRent, 'ILS')}` : undefined}
                />
              )}
            />
          </div>
        )}

        <div className="space-y-2">
          <Controller
            name="budgetCap"
            control={control}
            render={({ field }) => (
              <FormInput
                label={`${t.budgetCap} ${currency === 'ILS' ? '' : `(${currency})`}`.trim()}
                icon={<Lock className="w-4 h-4" />}
                currencySymbol={symbol}
                value={field.value}
                onChange={field.onChange}
                formatNumber
                helperText={ilsBudget ? `≈ ${fmt(ilsBudget, 'ILS')}` : undefined}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            {t.helperBudgetCap}
          </p>
        </div>
      </div>
    </FormSection>
  );
}
