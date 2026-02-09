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

    // Linear progress 0-100%
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

    const getStepTitle = (step: number) => {
        switch (step) {
            case 1: return t.step1Title;
            case 2: return t.step2Title;
            case 3: return t.step3Title;
            case 4: return t.step4Title;
            default: return "";
        }
    };

    return (
        <div className="w-full max-w-[800px] mx-auto mb-8 px-8 relative">
            {/* Continuous Track Background */}
            <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 rounded-full z-0 overflow-hidden">
                {/* Linear Fill Line */}
                <div
                    className={cn(
                        "h-full bg-primary transition-all duration-1000 ease-out absolute rounded-full",
                        isRtl ? "right-0" : "left-0"
                    )}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Sequence Dots */}
            <div className="flex justify-between items-start relative z-10 w-full">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    return (
                        <div key={stepNum} className="flex flex-col items-center relative gap-4">
                            {/* Dot Shell */}
                            <div className={cn(
                                "w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all duration-500 bg-white relative z-20",
                                isCompleted ? "bg-primary border-primary text-white scale-90" :
                                    isActive ? "border-primary text-primary font-bold shadow-lg scale-110" :
                                        "border-slate-100 text-slate-300"
                            )}>
                                {isCompleted ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    <span className="text-sm font-black italic">{stepNum}</span>
                                )}
                            </div>

                            {/* Grounded Labels */}
                            <div className="absolute top-12 w-28 md:w-40 left-1/2 -translate-x-1/2 text-center">
                                <span className={cn(
                                    "text-[10px] md:text-sm font-black uppercase tracking-tighter transition-all duration-300 block leading-none",
                                    isActive ? "text-slate-800 scale-105" :
                                        isCompleted ? "text-slate-400" : "text-slate-300"
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
