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
  error?: string;
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
  error,
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
    <div className={cn("space-y-1.5", className)}>
      <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground leading-tight">
        {icon && <span className="w-3.5 h-3.5 text-primary/70">{icon}</span>}
        <span className="truncate">{label}</span>
        {required && <span className="text-destructive">*</span>}
        {suffix && <span className="text-[10px] sm:text-xs text-muted-foreground/70 shrink-0">({suffix})</span>}
      </Label>
      <div className="relative flex items-center">
        {currencySymbol && (
          <span
            className={cn(
              "absolute text-primary/70 opacity-40 pointer-events-none text-sm sm:text-base font-medium",
              isRtl ? "right-2 sm:right-3" : "left-2 sm:left-3"
            )}
            aria-hidden="true"
          >
            {currencySymbol}
          </span>
        )}
        <Input
          {...props}
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "h-10 sm:h-12 rounded-lg border",
            "bg-card/80 backdrop-blur-sm",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "transition-all duration-200",
            "text-sm sm:text-base font-medium",
            currencySymbol ? (isRtl ? "pr-8 sm:pr-10 pl-3 sm:pl-4" : "pl-8 sm:pl-10 pr-3 sm:pr-4") : "px-3 sm:px-4",
            hasError
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border/60"
          )}
        />
      </div>
      {error && (
        <p className="text-[10px] sm:text-xs font-semibold text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
