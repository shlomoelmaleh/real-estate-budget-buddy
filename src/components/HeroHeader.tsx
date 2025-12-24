import { Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import heroBg from '@/assets/hero-bg.jpg';

export function HeroHeader() {
  const { t } = useLanguage();

  return (
    <header className="relative overflow-hidden min-h-[280px]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
      
      <div className="relative z-10 text-center py-12 px-4 space-y-8">
        <LanguageSwitcher />
        
        {/* Logo & Title */}
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 rounded-full blur-xl animate-pulse-soft" />
              
              {/* Icon container */}
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center shadow-elevated border border-primary-foreground/10">
                <Building2 className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
              </div>
              
              {/* Accent badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-lg flex items-center justify-center border-2 border-background">
                <span className="text-sm font-bold text-accent-foreground">₪</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight drop-shadow-sm">
              {t.mainTitle}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto font-medium">
              {t.subtitle}
            </p>
          </div>
        </div>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4">
          <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-accent to-accent/60 shadow-sm" />
          <div className="h-[2px] w-16 bg-gradient-to-l from-transparent via-primary/40 to-primary/60" />
        </div>
      </div>
    </header>
  );
}
