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
        <div className="w-full max-w-[800px] mx-auto mb-12 px-6 relative">
            {/* 
                Structure:
                - Outer container has px-6 (24px padding).
                - First and last dots are justified to the edges of the inner width.
                - Dot size is w-8 (32px).
                - Track should start at center of first dot: 24px (pad) + 16px (half dot) = 40px from left.
                - Track should end at center of last dot: 24px (pad) + 16px (half dot) = 40px from right.
            */}

            {/* Layer 1 & 2: Background Track & Active Progress Line */}
            <div className="absolute top-3 left-10 right-10 h-2 bg-slate-200 z-0">
                <div
                    className={cn(
                        "h-full bg-primary transition-all duration-700 ease-in-out absolute",
                        isRtl ? "right-0" : "left-0"
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Layer 3: Interactive Stations (Dots) */}
            <div className="flex justify-between items-start relative z-10 w-full">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    return (
                        <div key={stepNum} className="flex flex-col items-center relative">
                            {/* The Dot */}
                            <div className={cn(
                                "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 bg-white shrink-0 relative z-20",
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

                            {/* Active Pulse Ring (Blinking animation) */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-8 rounded-full border border-primary animate-ping z-10" />
                            )}
                            {/* Layer 4: Labels (Below Dot) */}
                            <div className="mt-4 absolute top-8 w-24 md:w-32 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                <span className={cn(
                                    "text-[10px] md:text-xs font-semibold transition-colors duration-300 block leading-tight",
                                    isActive ? "text-primary font-bold" :
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
