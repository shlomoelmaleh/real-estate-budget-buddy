import { Landmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function HeroHeader() {
  const { t } = useLanguage();

  return (
    <header className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative z-10 text-center py-10 px-4 space-y-6">
        <LanguageSwitcher />
        
        {/* Logo & Title */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              {/* Outer ring */}
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 rounded-full blur-lg" />
              
              {/* Icon container */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-elevated">
                <Landmark className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
              </div>
              
              {/* Accent dot */}
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent shadow-lg flex items-center justify-center">
                <span className="text-[10px] font-bold text-accent-foreground">₪</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">
              {t.mainTitle}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto">
              Professional real estate acquisition planning tool
            </p>
          </div>
        </div>
        
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
          <div className="w-2 h-2 rounded-full bg-accent/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
        </div>
      </div>
    </header>
  );
}
