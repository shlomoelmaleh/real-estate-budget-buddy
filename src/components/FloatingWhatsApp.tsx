import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { usePartner } from "@/contexts/PartnerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp() {
    const { partner } = usePartner();
    const { t, language } = useLanguage();

    // Logic: Hebrew -> Left side | English/French -> Right side
    const isLeftSide = language === 'he';

    // Logic to get the correct phone number
    const normalizeToWaMeDigits = (raw: string) => {
        const digitsOnly = (raw || "").replace(/[^0-9]/g, "");
        if (!digitsOnly) return "";
        let d = digitsOnly.startsWith("00") ? digitsOnly.slice(2) : digitsOnly;
        if (d.startsWith("9720")) d = `972${d.slice(4)}`;
        else if (d.startsWith("0")) d = `972${d.slice(1)}`;
        else if (d.length === 9 && d.startsWith("5")) d = `972${d}`;
        return d;
    };

    const getWhatsAppHref = () => {
        const rawWhatsApp = partner?.whatsapp || partner?.phone || "0549997711"; // Fallback to Shlomo
        const digits = normalizeToWaMeDigits(rawWhatsApp);
        const message = encodeURIComponent(
            partner?.name
                ? t.whatsappMessageWithPartner(partner.name)
                : t.whatsappMessageDefault
        );
        return `https://wa.me/${digits}?text=${message}`;
    };

    return (
        <div
            // We force "dir='ltr'" here to ensure the order [Button][Label] or [Label][Button] 
            // is controlled by us and not the browser's RTL auto-correction
            dir="ltr"
            className={cn(
                "fixed bottom-24 z-[9999] flex items-center group transition-all duration-500 ease-in-out",
                isLeftSide ? "left-0 flex-row" : "right-0 flex-row-reverse"
            )}
        >
            {/* 1. THE BUTTON (The Anchor) */}
            <a
                href={getWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "w-14 h-14 bg-[#25D366] text-white flex items-center justify-center shadow-glow z-20 transition-all duration-500",
                    // Shape: Flat against the screen edge, round on the inside
                    isLeftSide ? "rounded-r-full rounded-l-none" : "rounded-l-full rounded-r-none",
                    // Initial half-masking (28px = half of w-14)
                    isLeftSide ? "-translate-x-7 group-hover:translate-x-0" : "translate-x-7 group-hover:translate-x-0"
                )}
            >
                {/* Align icon so it's centered in the visible half when masked */}
                <div className={cn(
                    "transition-all duration-500",
                    isLeftSide ? "pl-5 group-hover:pl-0" : "pr-5 group-hover:pr-0"
                )}>
                    <WhatsAppIcon size={28} />
                </div>

                <span className={cn(
                    "absolute inset-0 bg-[#25D366] animate-ping opacity-20 group-hover:hidden",
                    isLeftSide ? "rounded-r-full" : "rounded-l-full"
                )}></span>
            </a>

            {/* 2. THE LABEL (Slides out INWARD) */}
            <div
                className={cn(
                    "bg-white text-primary text-[13px] font-bold py-2.5 px-4 shadow-md border border-border transition-all duration-500 z-10",
                    "whitespace-nowrap pointer-events-none opacity-0",
                    // Position: On the inside of the button, sliding out from behind it
                    isLeftSide
                        ? "rounded-r-xl border-l-0 -translate-x-full group-hover:opacity-100 group-hover:translate-x-0"
                        : "rounded-l-xl border-r-0 translate-x-full group-hover:opacity-100 group-hover:translate-x-0"
                )}
                // Force the text inside the label to respect the site language (Hebrew RTL)
                style={{ direction: isLeftSide ? 'rtl' : 'ltr' }}
            >
                {t.floatingContact}
            </div>
        </div>
    );
}
