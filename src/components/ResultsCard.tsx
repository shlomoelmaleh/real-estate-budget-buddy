import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResultRowProps {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}

function ResultRow({ label, value, suffix = '₪', highlight = false }: ResultRowProps) {
  return (
    <div className={cn(
      "flex justify-between items-center py-2.5 border-b border-dashed border-border/40 last:border-b-0",
      highlight && "bg-accent/10 -mx-2 px-2 rounded-lg border-none"
    )}>
      <span className={cn(
        "text-muted-foreground font-medium text-sm",
        highlight && "text-foreground font-semibold"
      )}>{label}</span>
      <span className={cn(
        "font-semibold text-base bg-card px-4 py-1.5 rounded-lg min-w-[130px] text-center shadow-soft border border-border/30",
        highlight && "bg-accent text-accent-foreground border-accent"
      )}>
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
  primary: 'border-l-primary/50',
  secondary: 'border-l-secondary/50',
  accent: 'border-l-accent/50',
};

export function ResultsGroup({ icon, title, children, variant = 'primary' }: ResultsGroupProps) {
  return (
    <div
      className={cn(
        "bg-muted/30 rounded-lg p-5 border border-border/30",
        "border-l-[3px] rtl:border-l border-l-0 rtl:border-r-[3px]",
        variantStyles[variant],
        "animate-fade-in"
      )}
    >
      <div className="flex items-center gap-2.5 mb-4 font-display font-semibold text-base text-foreground">
        <span className="flex-shrink-0">{icon}</span>
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export { ResultRow };
