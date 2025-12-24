import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { cn } from '@/lib/utils';

const languages: { code: Language; label: string }[] = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={cn(
            "px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300",
            "border-2 hover:scale-105",
            language === lang.code
              ? "bg-primary border-primary text-primary-foreground shadow-soft"
              : "bg-card border-border text-foreground hover:border-primary/50"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
