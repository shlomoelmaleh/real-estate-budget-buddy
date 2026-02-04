import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        // Position logic for UserWay:
        // 1 = Top Right, 2 = Middle Right, 3 = Bottom Right, 
        // 4 = Bottom Middle, 5 = Bottom Left, 6 = Middle Left, ...

        // Hebrew (RTL): WhatsApp is Left, so Accessibility goes Right (Pos 3)
        // LTR (En/Fr): WhatsApp is Right, so Accessibility goes Left (Pos 5)
        const position = language === 'he' ? '3' : '5';

        // Remove existing script to allow re-initialization with new position
        const existingScript = document.getElementById('userway-script');
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.id = 'userway-script';
        script.src = "https://cdn.userway.org/widget.js";

        // UserWay Account ID
        script.setAttribute('data-account', '1pjEW7NzD7');
        script.setAttribute('data-position', position);
        script.setAttribute('data-language', language); // Sync language (he, en, fr)
        script.async = true;

        document.body.appendChild(script);

        return () => {
            const scriptToRemove = document.getElementById('userway-script');
            if (scriptToRemove) scriptToRemove.remove();
        };
    }, [language]);

    return null;
}
