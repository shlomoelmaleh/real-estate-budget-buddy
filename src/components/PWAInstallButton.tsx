import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';

export function PWAInstallButton() {
  const { isInstallable, installApp } = usePWAInstall();
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  const translations = {
    he: {
      install: 'התקן אפליקציה',
      description: 'התקן את הסימולטור על המכשיר שלך לגישה מהירה',
    },
    fr: {
      install: 'Installer l\'app',
      description: 'Installez le simulateur sur votre appareil pour un accès rapide',
    },
    en: {
      install: 'Install App',
      description: 'Install the simulator on your device for quick access',
    },
  };

  const t = translations[language];

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-slide-up">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-elegant p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t.install}</p>
          <p className="text-xs opacity-80 truncate">{t.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={installApp}
            size="sm"
            variant="secondary"
            className="bg-white text-primary hover:bg-white/90"
          >
            {t.install}
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
