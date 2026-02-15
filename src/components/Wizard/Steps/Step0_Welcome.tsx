import { Link } from 'react-router-dom';
import { Play, Map, TrendingUp, ShieldCheck, Target, Clock, Lock, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartner } from '@/contexts/PartnerContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logoEshel from '@/assets/logo-eshel.png';

export function Step0({ onNext }: { onNext: () => void }) {
    const { t, language } = useLanguage();
    const { partner, isOwner } = usePartner();
    const displayLogo = partner?.logo_url || logoEshel;
    const isHe = language === 'he';

    return (
        <div className="relative w-full">
            {/* Language Switcher - Absolutely Centered on Entire Screen */}
            <div className="absolute top-0 left-0 right-0 flex justify-center z-30 pt-4 gap-4">
                <div className="scale-90 md:scale-100">
                    <LanguageSwitcher />
                </div>
                {isOwner && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-white/80 backdrop-blur-sm border border-slate-200"
                        asChild
                    >
                        <Link to="/partner/config">
                            <Settings className="w-5 h-5 text-slate-600" />
                        </Link>
                    </Button>
                )}
            </div>

            <div className={cn(
                "flex flex-col gap-8 lg:gap-12 items-stretch animate-in fade-in zoom-in duration-700 w-full max-w-6xl mx-auto pb-8 lg:pb-12 px-4 pt-16",
                isHe ? "lg:flex-row-reverse" : "lg:flex-row"
            )}>
                {/* Media Frame (40%) - Brand First */}
                <div className="lg:basis-[40%] flex-shrink-0 flex flex-col justify-center">
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden border border-amber-400/40 shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white group cursor-pointer">
                        {/* Logo Background */}
                        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-8">
                            <img
                                src={displayLogo}
                                alt="Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Play Button - Corner Position */}
                        <div className={cn(
                            "absolute bottom-4",
                            isHe ? "left-4" : "right-4"
                        )}>
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl border-2 border-amber-400/50 animate-pulse">
                                <Play className="w-6 h-6 md:w-7 md:h-7 text-primary fill-primary ml-1" />
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                        {t.videoCaption}
                    </p>
                </div>

                {/* Action Column (60%) */}
                <div className={cn(
                    "lg:basis-[60%] flex-shrink-0 flex flex-col justify-between space-y-8",
                    isHe ? "text-right" : "text-left"
                )}>
                    {/* Headline */}
                    <div className={cn("space-y-4 overflow-visible")}>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
                            {t.welcomeTitle}
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                            {partner?.slogan || t.welcomeSub}
                        </p>
                    </div>

                    {/* Balanced Station Grid (Responsive Column Shift) with Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { icon: Map, title: t.roadmap1Title, desc: t.roadmap1Desc, color: "text-blue-500", bg: "bg-blue-50", numberBg: "bg-blue-500" },
                            { icon: TrendingUp, title: t.roadmap2Title, desc: t.roadmap2Desc, color: "text-emerald-500", bg: "bg-emerald-50", numberBg: "bg-emerald-500" },
                            { icon: ShieldCheck, title: t.roadmap3Title, desc: t.roadmap3Desc, color: "text-amber-500", bg: "bg-amber-50", numberBg: "bg-amber-500" },
                            { icon: Target, title: t.roadmap4Title, desc: t.roadmap4Desc, color: "text-purple-500", bg: "bg-purple-50", numberBg: "bg-purple-500" },
                        ].map((step, i) => (
                            <div key={i} className="relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group h-auto min-h-[80px] md:h-[90px]">
                                {/* Prominent Number Badge */}
                                <div className={cn(
                                    "absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10",
                                    step.numberBg
                                )}>
                                    <span className="text-white font-black text-base sm:text-lg">{i + 1}</span>
                                </div>

                                <div className={cn("flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all shadow-inner", step.bg)}>
                                    <step.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", step.color)} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-0.5 leading-tight">{step.title}</h4>
                                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight line-clamp-2">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Primary Action Button */}
                    <div className="pt-2">
                        <Button
                            onClick={onNext}
                            className="w-full py-8 text-xl rounded-xl shadow-[0_10px_20px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_25px_rgba(var(--primary),0.4)] hover:scale-[1.01] transition-all bg-primary hover:bg-primary-dark text-white font-bold group border-t border-white/20"
                        >
                            {t.welcomeBtn}
                            <ChevronRight className={cn(
                                "w-6 h-6 transition-transform",
                                isHe ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2 group-hover:translate-x-1"
                            )} />
                        </Button>

                        <div className={cn(
                            "flex items-center gap-8 mt-6 justify-center lg:justify-start opacity-70",
                            isHe && "flex-row-reverse"
                        )}>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t.trustTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t.trustSecurity}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
