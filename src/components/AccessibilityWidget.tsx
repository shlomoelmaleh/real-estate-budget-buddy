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
        // 1. Map to UserWay specific codes (they use underscore or dash, but let's be precise)
        const uwLang = language === 'he' ? 'he-IL' : language === 'fr' ? 'fr-FR' : 'en-US';
        const uwPos = language === 'he' ? 'right' : 'left';

        // 2. Update the config objects (UserWay looks at both sometimes)
        const config = {
            account: '1pjEW7NzD7',
            lang: uwLang,
            position: uwPos,
            forceLanguage: true, // This tells UserWay to ignore the browser preference!
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

        // 4. THE MAGIC NUDGE: 
        // If the widget is already loaded, we force it to change NOW
        const forceUpdate = () => {
            if (window.UserWay) {
                if (typeof window.UserWay.changeLanguage === 'function') {
                    window.UserWay.changeLanguage(uwLang);
                }
                if (typeof window.UserWay.widgetPosition === 'function') {
                    window.UserWay.widgetPosition(uwPos);
                }
            }
        };

        // Check immediately and then a few times (UserWay takes time to initialize)
        forceUpdate();
        const interval = setInterval(forceUpdate, 500);
        const timeout = setTimeout(() => clearInterval(interval), 5000); // Stop checking after 5 seconds

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [language]);

    return null;
}
