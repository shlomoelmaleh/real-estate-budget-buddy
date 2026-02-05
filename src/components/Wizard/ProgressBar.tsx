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

    // effectiveStep limits max to 4 to avoid trying to render step 5 on the bar if passed
    const effectiveStep = Math.min(currentStep, totalSteps);
    // Calculate raw percentage (0 to 100)
    const progressPercent = ((effectiveStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="w-full max-w-[800px] mx-auto mb-10 px-4 relative">

            {/* 
                Structure:
                - Container: relative, padded (px-4 = 16px).
                - Dots: w-8 (32px).
                - Track Start/End: 16px (pad) + 16px (half dot) = 32px (left-8 / right-8).
                - Vertical Align: Labels (h-10) + mb-4 (16px) + Half Dot (16px) = 72px top.
            */}

            {/* Background Track (Center to Center) - Spans full width minus outer centers */}
            <div className="absolute top-[72px] left-8 right-8 h-[2px] bg-primary/20 -z-10" />

            {/* Active Progress Line (Overlaid) */}
            <div
                className={cn(
                    "absolute top-[72px] h-[2px] bg-primary transition-all duration-700 ease-in-out -z-10",
                    isRtl ? "right-8" : "left-8" // Anchor to 'start' based on direction
                )}
                style={{
                    // Width is percentage of the track length (100% - 64px)
                    width: `calc((100% - 64px) * ${progressPercent / 100})`
                }}
            />

            {/* Main Stations Container */}
            <div className="flex justify-between items-start w-full relative z-10">
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isActive = stepNum === currentStep;

                    const transitionDelay = isActive ? "delay-500" : "delay-0";

                    return (
                        <div key={stepNum} className="flex flex-col items-center group w-24">
                            {/* Title Section (Above Circle) */}
                            {/* Fixed height container to align all dots horizontally */}
                            <div className="h-10 flex items-end justify-center mb-4 w-full text-center">
                                <span className={cn(
                                    "text-xs md:text-sm font-semibold transition-all duration-300 block leading-tight",
                                    isActive ? "text-primary scale-110 font-bold" :
                                        isCompleted ? "text-primary/80" : "text-muted-foreground/50",
                                    transitionDelay
                                )}>
                                    {getStepTitle(stepNum)}
                                </span>
                            </div>

                            {/* Station Circle */}
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 bg-background z-20 relative",
                                isActive ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-110" :
                                    isCompleted ? "border-primary bg-primary text-primary-foreground" :
                                        "border-muted-foreground/20 text-muted-foreground/20",
                                transitionDelay
                            )}>
                                {isCompleted ? (
                                    <Check className="w-4 h-4 animate-in zoom-in spin-in-45 duration-300" />
                                ) : (
                                    <span className={cn(
                                        "text-xs font-bold transition-all duration-300",
                                        isActive && "text-primary"
                                    )}>
                                        {stepNum}
                                    </span>
                                )}
                            </div>

                            {/* Active Pulse Ring (Synced) */}
                            {isActive && (
                                <div className="absolute top-[64px] w-12 h-12 rounded-full border border-primary/30 animate-ping -z-10 opacity-0 animate-in fade-in duration-1000 delay-700 fill-mode-forwards" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
