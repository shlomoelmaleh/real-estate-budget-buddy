import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://accessibility.org.il/nagishli.js";
        script.type = "text/javascript";
        script.async = true;

        // Switch Side: If WhatsApp is on the Left (Hebrew), Accessibility goes Right.
        const side = language === 'he' ? 'right' : 'left';

        script.setAttribute('data-position', side);
        script.setAttribute('data-btn-side', side);
        script.setAttribute('data-color', '#1e40af');

        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [language]); // Reload when language changes

    return null;
}
