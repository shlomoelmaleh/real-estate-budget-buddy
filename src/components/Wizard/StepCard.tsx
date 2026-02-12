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
                "bg-white/80 backdrop-blur-xl border border-white/20",
                "rounded-2xl shadow-2xl",
                "p-4 md:p-8 space-y-6",
                className
            )}
        >
            {/* Header Section */}
            {(title || description || emotionalMessage) && (
                <div className="space-y-1 text-center">
                    {description && (
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {description}
                        </p>
                    )}
                    {title && (
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-dark text-balance">
                            {title}
                        </h2>
                    )}
                    {emotionalMessage && (
                        <div className="inline-block mt-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                            <p className="text-xs sm:text-sm text-primary/80 font-medium italic">
                                "{emotionalMessage}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}
