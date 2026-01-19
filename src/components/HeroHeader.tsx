import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import heroBg from '@/assets/hero-bg.jpg';
import logoEshel from '@/assets/logo-eshel.png';

export function HeroHeader() {
  const { t } = useLanguage();

  return (
    <header className="relative overflow-hidden min-h-[220px] md:min-h-[260px]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95" />
      
      <div className="relative z-10 text-center py-6 md:py-8 px-4 space-y-4 md:space-y-5">
        <LanguageSwitcher />
        
        {/* Logo */}
        <div className="flex justify-center pt-2">
          <img 
            src={logoEshel} 
            alt="Eshel Finances - אשל פיננסים" 
            className="h-24 md:h-32 lg:h-36 w-auto object-contain drop-shadow-lg"
          />
        </div>
        
        {/* Title Section */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight drop-shadow-sm">
            {t.mainTitle}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-2xl mx-auto font-medium">
            {t.subtitle}
          </p>
        </div>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-primary/40 to-primary/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-accent to-accent/60 shadow-sm" />
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent via-primary/40 to-primary/60" />
        </div>
      </div>
    </header>
  );
}
