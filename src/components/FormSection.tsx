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
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  accent: 'border-l-accent',
};

export function FormSection({ icon, title, children, className, variant = 'primary' }: FormSectionProps) {
  return (
    <section
      className={cn(
        "glass rounded-2xl p-6 md:p-8 shadow-card",
        "border-l-4 rtl:border-l-0 rtl:border-r-4",
        variantStyles[variant],
        "animate-slide-in",
        className
      )}
    >
      <h2 className="flex items-center gap-3 text-xl font-bold text-foreground mb-6">
        <span className="text-2xl">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
