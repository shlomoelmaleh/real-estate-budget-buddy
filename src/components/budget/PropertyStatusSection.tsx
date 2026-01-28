import { Control, Controller, FieldErrors } from 'react-hook-form';
import { Home, Flag, Banknote } from 'lucide-react';
import { FormSection } from '../FormSection';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Translations } from '@/lib/translations';
import { CalculatorFormValues } from './types';

interface PropertyStatusSectionProps {
  control: Control<CalculatorFormValues>;
  t: Translations;
  errors: FieldErrors<CalculatorFormValues>;
}

export function PropertyStatusSection({ control, t, errors }: PropertyStatusSectionProps) {
  return (
    <FormSection icon={<Home className="w-5 h-5 text-secondary" />} title={t.titlePropertyStatus} variant="secondary">
      <div className="grid grid-cols-1 gap-5">
        {/* First Property Question */}
        <div className={cn("space-y-2", errors.isFirstProperty && "ring-2 ring-destructive rounded-lg p-3")}>
          <Label className="text-sm font-medium flex items-center gap-1">
            <Home className="w-4 h-4" />
            {t.isFirstProperty} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="isFirstProperty"
            control={control}
            render={({ field }) => (
              <div className="inline-flex gap-0 rounded-lg border border-border overflow-hidden max-w-[280px]">
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap",
                    field.value === true
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.yes}
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap border-s border-border",
                    field.value === false
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.no}
                </button>
              </div>
            )}
          />
        </div>

        {/* Israeli Citizenship Question */}
        <div className={cn("space-y-2", errors.isIsraeliCitizen && "ring-2 ring-destructive rounded-lg p-3")}>
          <Label className="text-sm font-medium flex items-center gap-1">
            <Flag className="w-4 h-4" />
            {t.isIsraeliCitizen} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="isIsraeliCitizen"
            control={control}
            render={({ field }) => (
              <div className="inline-flex gap-0 rounded-lg border border-border overflow-hidden max-w-[280px]">
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap",
                    field.value === true
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.yes}
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap border-s border-border",
                    field.value === false
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.no}
                </button>
              </div>
            )}
          />
        </div>

        {/* Israeli Tax Resident Question */}
        <div className={cn("space-y-2", errors.isIsraeliTaxResident && "ring-2 ring-destructive rounded-lg p-3")}>
          <Label className="text-sm font-medium flex items-center gap-1">
            <Banknote className="w-4 h-4" />
            {t.isIsraeliTaxResident} <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="isIsraeliTaxResident"
            control={control}
            render={({ field }) => (
              <div className="inline-flex gap-0 rounded-lg border border-border overflow-hidden max-w-[280px]">
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap",
                    field.value === true
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.yes}
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "w-[110px] sm:w-[130px] h-11 px-4 transition-all font-medium text-sm whitespace-nowrap border-s border-border",
                    field.value === false
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  {t.no}
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </FormSection>
  );
}
