import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResultRowProps {
  label: string;
  value: string;
  suffix?: string;
}

function ResultRow({ label, value, suffix = '₪' }: ResultRowProps) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-dashed border-border/50 last:border-b-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="font-bold text-lg bg-card px-4 py-1.5 rounded-lg min-w-[140px] text-center shadow-soft">
        {value} {suffix}
      </span>
    </div>
  );
}

interface ResultsGroupProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}

const variantStyles = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  accent: 'border-l-accent',
};

export function ResultsGroup({ icon, title, children, variant = 'primary' }: ResultsGroupProps) {
  return (
    <div
      className={cn(
        "bg-muted/50 rounded-xl p-5 border",
        "border-l-4 rtl:border-l border-l-0 rtl:border-r-4",
        variantStyles[variant],
        "animate-fade-in"
      )}
    >
      <div className="flex items-center gap-2 mb-4 font-bold text-lg">
        <span className="text-xl">{icon}</span>
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export { ResultRow };
