import { Play, Map, TrendingUp, ShieldCheck, Target, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Step0({ t, onNext }: { t: any, onNext: () => void }) {
    return (
        <div className="space-y-12 animate-in fade-in zoom-in duration-700 max-w-4xl mx-auto pb-12">
            {/* Section A: The Cinematic Explanation Frame */}
            <div className="space-y-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden relative border border-amber-200/50 shadow-[0_0_30px_rgba(245,158,11,0.15)] group cursor-pointer">
                    {/* Placeholder for Cinematic Background */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity duration-500 group-hover:opacity-40" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-white animate-pulse">
                            <Play className="w-8 h-8 text-primary fill-primary ml-1" />
                        </div>
                    </div>
                </div>
                <p className="text-center text-sm text-muted-foreground/80 font-medium">
                    {t.videoCaption}
                </p>
            </div>

            {/* Section B: The 4-Step Roadmap (The Journey) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Map, title: t.roadmap1Title, desc: t.roadmap1Desc, color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: TrendingUp, title: t.roadmap2Title, desc: t.roadmap2Desc, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { icon: ShieldCheck, title: t.roadmap3Title, desc: t.roadmap3Desc, color: "text-amber-500", bg: "bg-amber-50" },
                    { icon: Target, title: t.roadmap4Title, desc: t.roadmap4Desc, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((step, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-xl border border-slate-200/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center space-y-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-1", step.bg)}>
                            <step.icon className={cn("w-6 h-6", step.color)} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-800 text-sm md:text-base">{step.title}</h4>
                            <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Section C: The High-Conversion CTA */}
            <div className="flex flex-col items-center space-y-6">
                <Button
                    onClick={onNext}
                    className="group w-full md:w-auto px-16 py-8 text-xl md:text-2xl rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-primary-dark text-white font-bold"
                >
                    {t.welcomeBtn}
                    <TrendingUp className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
                </Button>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 text-muted-foreground/70">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">{t.trustTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/70">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs font-medium">{t.trustSecurity}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
