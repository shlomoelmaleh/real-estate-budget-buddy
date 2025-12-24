import { InputHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon?: string;
  suffix?: string;
  formatNumber?: boolean;
  allowDecimals?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function FormInput({
  label,
  icon,
  suffix,
  formatNumber = false,
  allowDecimals = false,
  value,
  onChange,
  className,
  ...props
}: FormInputProps) {
  const [displayValue, setDisplayValue] = useState(value);

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
        {icon && <span className="text-lg">{icon}</span>}
        {label}
        {suffix && <span className="text-xs text-muted-foreground/70">({suffix})</span>}
      </Label>
      <Input
        {...props}
        value={displayValue}
        onChange={handleChange}
        className={cn(
          "h-12 px-4 rounded-xl border-2 border-border/50",
          "bg-card/50 backdrop-blur-sm",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "transition-all duration-200",
          "text-base font-medium"
        )}
      />
    </div>
  );
}
