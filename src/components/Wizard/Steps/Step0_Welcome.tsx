import { Play, Map, TrendingUp, ShieldCheck, Target, Clock, Lock, ChevronRight } from 'lucide-react';
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

    return (
        <div className={cn(
            "flex flex-col gap-8 lg:gap-12 items-stretch animate-in fade-in zoom-in duration-700 w-full max-w-6xl mx-auto pb-8 lg:pb-12 px-4",
            isHe ? "lg:flex-row-reverse" : "lg:flex-row"
        )}>
            {/* Visual Column (40%) */}
            <div className="lg:w-[40%] flex flex-col justify-center">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-[0.5px] border-amber-400/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1),0_10px_30px_rgba(0,0,0,0.05)] group cursor-pointer bg-slate-100">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-slate-900/10 transition-opacity duration-500 group-hover:opacity-30" />

                    {/* Centered Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-white border border-white/50">
                            <Play className="w-6 h-6 md:w-8 md:h-8 text-primary fill-primary ml-1" />
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                    {t.videoCaption}
                </p>
            </div>

            {/* Action Column (60%) */}
            <div className={cn(
                "lg:w-[60%] flex flex-col justify-between py-2 space-y-8",
                isHe ? "text-right" : "text-left"
            )}>
                {/* Top Internal Row: Logo & Language */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b border-slate-100/50">
                    <div className="flex-shrink-0">
                        <img
                            src={displayLogo}
                            alt="Logo"
                            className="w-[180px] h-auto object-contain md:w-[220px]"
                        />
                    </div>
                    <div className="scale-90 md:scale-100">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Headline */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-800 leading-[1.1] tracking-tight">
                        {t.welcomeTitle}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                        {t.welcomeSub}
                    </p>
                </div>

                {/* Balanced Station Grid (2x2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: Map, title: t.roadmap1Title, desc: t.roadmap1Desc, color: "text-blue-500", bg: "bg-blue-50" },
                        { icon: TrendingUp, title: t.roadmap2Title, desc: t.roadmap2Desc, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { icon: ShieldCheck, title: t.roadmap3Title, desc: t.roadmap3Desc, color: "text-amber-500", bg: "bg-amber-50" },
                        { icon: Target, title: t.roadmap4Title, desc: t.roadmap4Desc, color: "text-purple-500", bg: "bg-purple-50" },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group min-h-[85px]">
                            <div className={cn("flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all shadow-inner", step.bg)}>
                                <step.icon className={cn("w-6 h-6", step.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-slate-800 text-sm md:text-base mb-0.5">{step.title}</h4>
                                <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{step.desc}</p>
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
    );
}
