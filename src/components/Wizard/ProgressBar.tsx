import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check } from 'lucide-react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps?: number;
}

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
    const { t, language } = useLanguage();
    const isRtl = language === 'he';

    const getStepTitle = (step: number) => {
        switch (step) {
            case 1: return t.step1Title;
            case 2: return t.step2Title;
            case 3: return t.step3Title;
            case 4: return t.step4Title;
            default: return "";
        }
    };

    const effectiveStep = Math.min(currentStep, totalSteps);
    const progressPercent = ((effectiveStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="w-full max-w-[800px] mx-auto mb-12 px-8 relative">
            {/* Layer 1 & 2: Background Track & Active Progress Line */}
            <div className="absolute top-4 left-12 right-12 h-[2px] bg-slate-200 -z-10">
                <div
                    className={cn(
                        "h-full bg-primary transition-all duration-700 ease-in-out absolute",
                        isRtl ? "right-0" : "left-0"
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Layer 3: Interactive Stations (Dots) */}
            <div className="flex justify-between items-center relative z-10 w-full">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;
                    const isUpcoming = stepNum > currentStep;

                    return (
                        <div key={stepNum} className="flex flex-col items-center group w-0">
                            {/* The Dot */}
                            <div className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-white shrink-0",
                                isCompleted ? "bg-primary border-primary text-white" :
                                    isActive ? "border-primary text-primary font-bold shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" :
                                        "border-slate-200 text-slate-300"
                            )}>
                                {isCompleted ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <span className="text-xs">{stepNum}</span>
                                )}
                            </div>

                            {/* Layer 4: Labels (Below Dot) */}
                            <div className="mt-3 w-32 text-center">
                                <span className={cn(
                                    "text-[10px] md:text-sm font-semibold transition-colors duration-300 block leading-tight",
                                    isActive ? "text-primary" :
                                        isCompleted ? "text-slate-600" : "text-slate-400"
                                )}>
                                    {getStepTitle(stepNum)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
