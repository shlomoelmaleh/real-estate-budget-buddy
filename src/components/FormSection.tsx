import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

const variantStyles = {
  primary: 'border-l-primary/60',
  secondary: 'border-l-secondary/60',
  accent: 'border-l-accent/60',
};

export function FormSection({ icon, title, children, className, variant = 'primary' }: FormSectionProps) {
  return (
    <section
      className={cn(
        "bg-card/90 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-card",
        "border border-border/40",
        "border-l-[3px] rtl:border-l rtl:border-r-[3px]",
        variantStyles[variant],
        "animate-slide-in",
        className
      )}
    >
      <h2 className="flex items-center gap-3 text-lg font-display font-semibold text-foreground mb-6">
        <span className="flex-shrink-0">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
