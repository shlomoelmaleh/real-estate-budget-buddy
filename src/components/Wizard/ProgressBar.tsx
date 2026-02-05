import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressBarProps {
    currentStep: number;
    totalSteps?: number;
}

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
    const { t } = useLanguage();

    const getStepLabel = (step: number) => {
        switch (step) {
            case 1: return t.step1Desc;
            case 2: return t.step2Desc;
            case 3: return t.step3Desc;
            case 4: return t.step4Desc;
            default: return "";
        }
    };

    return (
        <div className="w-full max-w-[600px] mx-auto mb-8 px-2">
            {/* Label Info */}
            <div className="flex justify-start items-center gap-4 mb-3">
                <span className="text-sm font-semibold text-primary">
                    {t.step1Title.split(':')[0].replace('1', currentStep.toString())}: {getStepLabel(currentStep)}
                </span>
                <span className="text-xs text-muted-foreground font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                    {Math.round((currentStep / totalSteps) * 100)}%
                </span>
            </div>

            {/* Segments */}
            <div className="flex gap-2 h-1">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isActive = stepNum <= currentStep;

                    return (
                        <div
                            key={stepNum}
                            className={cn(
                                "h-full flex-1 rounded-full transition-all duration-500 relative overflow-hidden bg-muted",
                            )}
                        >
                            <div
                                className={cn(
                                    "absolute inset-0 transition-all duration-700 ease-out",
                                    isActive ? "bg-gradient-to-r from-primary to-primary-dark w-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "w-0"
                                )}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
