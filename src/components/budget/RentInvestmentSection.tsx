import { Control, Controller, useWatch } from 'react-hook-form';
import { Home, Banknote, Lock } from 'lucide-react';
import { FormSection } from '../FormSection';
import { FormInput } from '../FormInput';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';

interface RentInvestmentSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
}

export function RentInvestmentSection({ control, t }: RentInvestmentSectionProps) {
  const isRented = useWatch({
    control,
    name: "isRented",
  });

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
                  label={t.expectedRent}
                  icon={<Banknote className="w-4 h-4" />}
                  suffix="₪"
                  placeholder={t.expectedRentPlaceholder}
                  value={field.value}
                  onChange={field.onChange}
                  formatNumber
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
                label={t.budgetCap}
                icon={<Lock className="w-4 h-4" />}
                suffix="₪"
                value={field.value}
                onChange={field.onChange}
                formatNumber
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
