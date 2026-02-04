import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function AccessibilityWidget() {
    const { language } = useLanguage();

    useEffect(() => {
        // 1. Determine the side: Opposite of WhatsApp
        const side = language === 'he' ? 'right' : 'left';

        // 2. Remove any existing widget script to avoid duplicates on language switch
        const existingScript = document.getElementById('nagish-script');
        if (existingScript) {
            existingScript.remove();
        }

        // 3. Create and configure the accessibility script
        const script = document.createElement('script');
        script.id = 'nagish-script';
        script.src = "https://accessibility.org.il/nagishli.js";
        script.type = "text/javascript";
        script.async = true;

        // Custom attributes for the widget
        script.setAttribute('data-position', side);
        script.setAttribute('data-btn-side', side);
        script.setAttribute('data-color', '#1e40af'); // Matches your professional blue

        document.body.appendChild(script);

        return () => {
            // Cleanup when component unmounts
            const scriptToRemove = document.getElementById('nagish-script');
            if (scriptToRemove) scriptToRemove.remove();
        };
    }, [language]); // Re-run logic if language changes to swap sides

    return null;
}
