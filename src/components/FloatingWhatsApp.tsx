import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { usePartner } from "@/contexts/PartnerContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp() {
    const { partner } = usePartner();
    const { t } = useLanguage();

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
                ? `שלום ${partner.name}, אני משתמש בסימולטור שלך ויש לי שאלה...`
                : `שלום, אני משתמש בסימולטור אשל פיננסים ויש לי שאלה...`
        );
        return `https://wa.me/${digits}?text=${message}`;
    };

    return (
        <div
            className={cn(
                "fixed bottom-24 z-[9999] flex items-center transition-all duration-500 ease-in-out group",
                // Position on the right edge, half-hidden by default
                "right-0 translate-x-[50%] hover:translate-x-0",
                // Better mobile support
                "touch-action-none"
            )}
        >
            {/* The Label (Reveals on hover/touch) */}
            <div className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-white text-primary text-sm font-bold py-2 px-4 rounded-l-xl shadow-elevated border border-r-0 border-border",
                "whitespace-nowrap pointer-events-none"
            )}>
                {t.floatingContact}
            </div>

            {/* The Button - Tab Style */}
            <a
                href={getWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "w-16 h-16 bg-[#25D366] text-white flex items-center justify-center shadow-glow",
                    // Round only the left side to create tab appearance
                    "rounded-l-full rounded-r-none",
                    "hover:scale-105 active:scale-95 transition-transform duration-300",
                    "relative"
                )}
            >
                {/* Icon with padding adjustment to keep it visible when half-hidden */}
                <div className="pr-2 group-hover:pr-0 transition-all duration-300">
                    <WhatsAppIcon size={32} />
                </div>

                {/* Subtle Pulse - only active when hidden to draw attention */}
                <span className="absolute inset-0 rounded-l-full bg-[#25D366] animate-ping opacity-20 group-hover:hidden"></span>
            </a>
        </div>
    );
}
