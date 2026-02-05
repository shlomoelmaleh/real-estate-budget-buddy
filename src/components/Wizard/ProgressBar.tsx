import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Check } from 'lucide-react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps?: number;
}

export function ProgressBar({ currentStep, totalSteps = 4 }: ProgressBarProps) {
    const { t } = useLanguage();

    const getStepTitle = (step: number) => {
        switch (step) {
            case 1: return t.step1Title;
            case 2: return t.step2Title;
            case 3: return t.step3Title;
            case 4: return t.step4Title;
            default: return "";
        }
    };

    // effectiveStep limits max to 4 to avoid trying to render step 5 on the bar if passed
    const effectiveStep = Math.min(currentStep, totalSteps);
    const progressPercent = ((effectiveStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="w-full max-w-[800px] mx-auto mb-10 px-4 relative">
            {/* Background Track */}
            <div className="absolute top-[34px] left-4 right-4 h-[2px] bg-primary/20 -z-10" />

            {/* Active Progress Track (The "Flow") */}
            <div
                className="absolute top-[34px] left-4 h-[2px] bg-gradient-to-r from-primary to-primary-dark transition-all duration-700 ease-in-out -z-10"
                style={{ width: `calc(${progressPercent}% - 32px)` }} // Adjust for padding approx
            />
            {/* Note: Precise width calculation for the line between flex items is complex with percentage. 
          A better approach is a container for the line that matches the flex container width exactly.
      */}
            <div className="absolute top-[34px] left-4 right-4 h-[2px] -z-10 flex items-center">
                <div
                    className="h-full bg-primary transition-all duration-700 ease-in-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>


            {/* Main Stations Container */}
            <div className="flex justify-between items-start relative z-10 w-full">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;
                    const isUpcoming = stepNum > currentStep;

                    return (
                        <div key={stepNum} className="flex flex-col items-center group">
                            {/* Title Section (Above Circle) */}
                            <span className={cn(
                                "text-xs md:text-sm font-semibold mb-3 transition-colors duration-300",
                                isActive ? "text-primary scale-105" :
                                    isCompleted ? "text-primary/80" : "text-muted-foreground/50"
                            )}>
                                {getStepTitle(stepNum)}
                            </span>

                            {/* Station Circle */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                                "border-2 bg-background",
                                isActive ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.4)] scale-110" :
                                    isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                        "border-muted-foreground/20 text-muted-foreground/20"
                            )}>
                                {isCompleted ? (
                                    <Check className="w-4 h-4 animate-in zoom-in spin-in-45 duration-300" />
                                ) : (
                                    <span className={cn("text-xs font-bold", isActive && "text-primary")}>
                                        {stepNum}
                                    </span>
                                )}
                            </div>

                            {/* Active Pulse Ring */}
                            {isActive && (
                                <div className="absolute top-[28px] w-12 h-12 rounded-full border border-primary/30 animate-ping -z-10" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
