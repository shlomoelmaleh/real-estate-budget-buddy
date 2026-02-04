declare global {
    interface Window {
        _userway_config?: {
            account: string;
            position: string;
            language: string;
        };
    }
}

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        // Position logic: 3 = Bottom Right (Hebrew), 5 = Bottom Left (Others)
        const position = language === 'he' ? '3' : '5';

        // FORCE CONFIGURATION via Global Object
        // This is more reliable than data attributes for dynamic changes
        window._userway_config = {
            account: '1pjEW7NzD7',
            position: position,
            language: language
        };

        // Remove existing script to force reload with new config
        const existingScript = document.getElementById('userway-script');
        if (existingScript) existingScript.remove();

        const script = document.createElement('script');
        script.id = 'userway-script';
        script.src = "https://cdn.userway.org/widget.js";
        script.async = true;
        // We still keep data-account as a fallback for the loader itself
        script.setAttribute('data-account', '1pjEW7NzD7');

        document.body.appendChild(script);

        return () => {
            const scriptToRemove = document.getElementById('userway-script');
            if (scriptToRemove) scriptToRemove.remove();
        };
    }, [language]);

    return null;
}
