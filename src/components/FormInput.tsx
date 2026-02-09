import { InputHTMLAttributes, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon?: ReactNode;
  suffix?: string;
  currencySymbol?: string;
  formatNumber?: boolean;
  allowDecimals?: boolean;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hasError?: boolean;
}

export function FormInput({
  label,
  icon,
  suffix,
  currencySymbol,
  formatNumber = false,
  allowDecimals = false,
  value,
  onChange,
  className,
  required = false,
  hasError = false,
  ...props
}: FormInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const isRtl = typeof document !== 'undefined' ? document.documentElement.dir === 'rtl' : false;

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (formatNumber) {
      // Remove commas for processing
      const numericValue = newValue.replace(/,/g, '');

      if (allowDecimals) {
        // Allow numbers and one decimal point
        if (!/^-?\d*\.?\d*$/.test(numericValue)) return;
        newValue = numericValue;
      } else {
        // Only allow integers
        if (!/^\d*$/.test(numericValue)) return;
        // Format with commas
        if (numericValue !== '') {
          newValue = Number(numericValue).toLocaleString('en-US');
        } else {
          newValue = '';
        }
      }
    }

    setDisplayValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon && <span className="w-4 h-4 text-primary/70">{icon}</span>}
        {label}
        {required && <span className="text-destructive">*</span>}
        {suffix && <span className="text-xs text-muted-foreground/70">({suffix})</span>}
      </Label>
      <div className="relative flex items-center group">
        {currencySymbol && (
          <span
            className={cn(
              "absolute text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none text-base font-bold",
              isRtl ? "right-4" : "left-4"
            )}
            aria-hidden="true"
          >
            ₪
          </span>
        )}
        <Input
          {...props}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "h-14 rounded-xl border-2 bg-white",
            "focus:border-primary focus:ring-0",
            "transition-all duration-200",
            "text-base font-bold text-slate-800",
            currencySymbol ? (isRtl ? "pr-10 pl-4" : "pl-10 pr-4") : "px-5",
            hasError
              ? "border-destructive"
              : "border-slate-100 hover:border-slate-200"
          )}
        />
      </div>
    </div>
  );
}
