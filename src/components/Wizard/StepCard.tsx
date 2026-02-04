import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StepCardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    description?: string;
    emotionalMessage?: string;
}

export function StepCard({ children, className, title, description, emotionalMessage }: StepCardProps) {
    return (
        <div
            className={cn(
                "relative w-full max-w-[600px] mx-auto",
                "bg-white/90 backdrop-blur-xl border border-white/20",
                "rounded-2xl shadow-2xl",
                "p-6 md:p-8 space-y-6",
                "animate-in slide-in-from-bottom-4 fade-in duration-500",
                className
            )}
        >
            {/* Header Section */}
            {(title || description) && (
                <div className="space-y-1 text-center">
                    {description && (
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {description}
                        </p>
                    )}
                    {title && (
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark">
                            {title}
                        </h2>
                    )}
                </div>
            )}

            {/* Emotional Message */}
            {emotionalMessage && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                    <p className="text-sm text-primary/80 font-medium italic">
                        "{emotionalMessage}"
                    </p>
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
