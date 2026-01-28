import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import heroBg from '@/assets/hero-bg.jpg';
import logoEshel from '@/assets/logo-eshel.png';
import { usePartner } from '@/contexts/PartnerContext';

export function HeroHeader() {
  const { t } = useLanguage();
  const { partner } = usePartner();

  return (
    <header className="relative overflow-hidden min-h-[280px] md:min-h-[320px]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/65 to-background/85" />
      
      <div className="relative z-10 text-center py-6 md:py-8 px-4 space-y-4 md:space-y-5">
        <LanguageSwitcher />
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center pt-3 md:pt-4 gap-3">
          <img
            src={partner?.logo_url || logoEshel}
            alt={partner?.name ? `${partner.name} logo` : 'Eshel Finances - אשל פיננסים'}
            className={
              partner?.logo_url
                ? "w-full max-w-[85vw] md:max-w-[480px] lg:max-w-[540px] h-auto object-contain drop-shadow-lg"
                : "h-44 md:h-64 lg:h-80 xl:h-96 w-auto max-w-[90vw] md:max-w-[72vw] lg:max-w-[60vw] object-contain drop-shadow-xl"
            }
          />
          {/* Partner slogan - displayed if defined, otherwise invisible placeholder */}
          {partner?.logo_url ? (
            <span className={`text-sm ${partner?.slogan ? 'text-muted-foreground' : 'text-transparent select-none'}`}>
              {partner?.slogan || '\u00A0'}
            </span>
          ) : null}
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
