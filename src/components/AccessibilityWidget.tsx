import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
    interface Window {
        UserWay?: {
            changeLanguage: (lang: string) => void;
            widgetPosition: (pos: string) => void;
        };
        userway_config?: any;
        _userway_config?: any;
    }
}

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        // 1. Map to UserWay specific codes
        const uwLang = language === 'he' ? 'he-IL' : language === 'fr' ? 'fr-FR' : 'en-US';
        // WhatsApp is on the Left for HE (usually) or Right? 
        // Typically in RTL apps, WhatsApp is bottom-left, so Accessibility should be bottom-right.
        // Let's stick to the prompt: "opposite side of the WhatsApp button (Right for HE, Left for EN/FR)".
        const uwPos = language === 'he' ? 'bottom-right' : 'bottom-left';

        // 2. Update the config objects
        const config = {
            account: '1pjEW7NzD7',
            lang: uwLang,
            position: uwPos,
            forceLanguage: true,
        };

        window.userway_config = config;
        window._userway_config = config;

        // 3. Load the script only once
        if (!document.getElementById('userway-script')) {
            const script = document.createElement('script');
            script.id = 'userway-script';
            script.src = "https://cdn.userway.org/widget.js";
            script.async = true;
            script.setAttribute('data-account', '1pjEW7NzD7');
            document.body.appendChild(script);
        }

        // 4. Force update if widget is already loaded
        const forceUpdate = () => {
            if (window.UserWay) {
                if (typeof window.UserWay.changeLanguage === 'function') {
                    window.UserWay.changeLanguage(uwLang);
                }
                if (typeof window.UserWay.widgetPosition === 'function') {
                    // UserWay widgetPosition often takes 'left', 'right' or 'bottom-left', etc.
                    // We'll use the mapped position.
                    const simplifiedPos = language === 'he' ? 'right' : 'left';
                    window.UserWay.widgetPosition(simplifiedPos);
                }
            }
        };

        forceUpdate();
        const interval = setInterval(forceUpdate, 1000);
        const timeout = setTimeout(() => clearInterval(interval), 10000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [language]);

    return null;
}
