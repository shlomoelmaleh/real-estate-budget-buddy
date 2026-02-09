import { Play, Map, TrendingUp, ShieldCheck, Target, Clock, Lock, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartner } from '@/contexts/PartnerContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logoEshel from '@/assets/logo-eshel.png';

export function Step0({ onNext }: { onNext: () => void }) {
    const { t, language } = useLanguage();
    const { partner } = usePartner();
    const displayLogo = partner?.logo_url || logoEshel;
    const isHe = language === 'he';

    const roadmapSteps = [
        { icon: Map, title: t.roadmap1Title, desc: t.roadmap1Desc, color: "text-blue-500", bg: "bg-blue-50" },
        { icon: TrendingUp, title: t.roadmap2Title, desc: t.roadmap2Desc, color: "text-emerald-500", bg: "bg-emerald-50" },
        { icon: ShieldCheck, title: t.roadmap3Title, desc: t.roadmap3Desc, color: "text-amber-500", bg: "bg-amber-50" },
        { icon: Target, title: t.roadmap4Title, desc: t.roadmap4Desc, color: "text-purple-500", bg: "bg-purple-50" },
    ];

    return (
        <div className={cn(
            "flex flex-col gap-8 lg:gap-0 items-stretch animate-in fade-in zoom-in duration-700 w-full max-w-6xl mx-auto pb-8 lg:pb-0 px-4 min-h-[600px]",
            isHe ? "lg:flex-row-reverse" : "lg:flex-row"
        )}>
            {/* Branding & Media Window (40%) */}
            <div className="lg:w-[40%] flex flex-col justify-center lg:pr-6 lg:pl-0 rtl:lg:pl-6 rtl:lg:pr-0">
                <div className="relative aspect-video lg:aspect-square w-full rounded-[2rem] overflow-hidden border-[0.5px] border-white/20 shadow-2xl group cursor-pointer bg-slate-900/5">
                    {/* Logo Background (Authoritative) */}
                    <div className="absolute inset-0 flex items-center justify-center p-12 bg-white">
                        <img
                            src={displayLogo}
                            alt="Brand Poster"
                            className="w-full h-full object-contain opacity-90 transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>

                    {/* Professional Overlay */}
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] transition-all duration-500 group-hover:backdrop-blur-0 group-hover:bg-transparent" />

                    {/* Corner Play Button */}
                    <div className={cn(
                        "absolute bottom-6 flex items-center justify-center",
                        isHe ? "left-6" : "right-6"
                    )}>
                        <div className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white border border-white/50">
                            <Play className={cn("w-6 h-6 fill-current", !isHe && "ml-1")} />
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-center lg:text-start text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold">
                    {t.videoCaption}
                </p>
            </div>

            {/* Sequential Roadmap (60%) */}
            <div className={cn(
                "lg:w-[60%] flex flex-col justify-center py-6 lg:py-12 space-y-10",
                isHe ? "lg:pr-12 text-right" : "lg:pl-12 text-left"
            )}>
                {/* Internal Header (Switcher Only now) */}
                <div className={cn("flex items-center", isHe ? "justify-start" : "justify-end")}>
                    <div className="bg-slate-50/50 p-1 rounded-full border border-slate-100">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Headline */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-display font-black text-slate-800 leading-[1] tracking-tighter">
                        {t.welcomeTitle}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
                        {t.welcomeSub}
                    </p>
                </div>

                {/* Numbered Sequence Roadmap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 relative">
                    {roadmapSteps.map((step, i) => (
                        <div key={i} className="group relative flex items-start gap-5 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-h-[110px]">
                            {/* Number Badge */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-lg z-10">
                                0{i + 1}
                            </div>

                            <div className={cn("flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all shadow-inner", step.bg)}>
                                <step.icon className={cn("w-7 h-7", step.color)} />
                            </div>

                            <div className="min-w-0 flex-1 pt-1">
                                <h4 className="font-black text-slate-800 text-base md:text-lg mb-1 leading-tight">{step.title}</h4>
                                <p className="text-xs text-muted-foreground leading-snug font-medium line-clamp-2">{step.desc}</p>
                            </div>

                            {/* Directional Arrow (Except last) */}
                            {i < 3 && (
                                <div className={cn(
                                    "hidden lg:block absolute z-0 pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity",
                                    i % 2 === 0 ? "top-1/2 -right-8 -translate-y-1/2" : "-bottom-8 left-1/2 -translate-x-1/2 rotate-90"
                                )}>
                                    {isHe ? <ArrowLeft className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Primary Action */}
                <div className="pt-6">
                    <Button
                        onClick={onNext}
                        className="w-full py-9 text-2xl rounded-2xl shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_25px_50px_rgba(var(--primary-rgb),0.4)] hover:scale-[1.02] transition-all bg-primary hover:bg-primary-dark text-white font-black group border-b-4 border-primary-dark/30"
                    >
                        {t.welcomeBtn}
                        <ChevronRight className={cn(
                            "w-8 h-8 transition-transform duration-300 ml-3",
                            isHe ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2"
                        )} />
                    </Button>

                    <div className={cn(
                        "flex items-center gap-10 mt-8 justify-center lg:justify-start opacity-40",
                        isHe && "flex-row-reverse"
                    )}>
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">{t.trustTime}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">{t.trustSecurity}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
