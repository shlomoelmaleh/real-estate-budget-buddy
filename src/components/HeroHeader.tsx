import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import heroBg from '@/assets/hero-bg.jpg';

export function HeroHeader() {
  const { t } = useLanguage();

  return (
    <header className="relative overflow-hidden min-h-[240px]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
      
      <div className="relative z-10 text-center py-10 px-4 space-y-6">
        <LanguageSwitcher />
        
        {/* Title Section */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight drop-shadow-sm">
            {t.mainTitle}
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto font-medium">
            {t.subtitle}
          </p>
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