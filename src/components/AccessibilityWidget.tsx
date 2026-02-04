import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
    interface Window {
        UserWay?: {
            changeLanguage: (lang: string) => void;
            widgetPosition: (pos: string) => void;
        };
        userway_config?: any;
    }
}

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        const uwLang = language === 'he' ? 'he-IL' : language === 'fr' ? 'fr-FR' : 'en-US';
        const uwPos = language === 'he' ? 'right' : 'left'; // Opposite of WhatsApp

        // 1. Initial Config
        window.userway_config = {
            account: '1pjEW7NzD7',
            lang: uwLang,
            position: uwPos,
        };

        // 2. Load Script if not present
        if (!document.getElementById('userway-script')) {
            const script = document.createElement('script');
            script.id = 'userway-script';
            script.src = "https://cdn.userway.org/widget.js";
            script.async = true;
            script.setAttribute('data-account', '1pjEW7NzD7');
            document.body.appendChild(script);
        }

        // 3. MAGIC FIX: Force update if UserWay is already active
        const interval = setInterval(() => {
            if (window.UserWay && typeof window.UserWay.changeLanguage === 'function') {
                window.UserWay.changeLanguage(uwLang);
                window.UserWay.widgetPosition(uwPos);
                clearInterval(interval);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [language]);

    return null;
}
