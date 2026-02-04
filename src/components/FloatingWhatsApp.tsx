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
                "fixed bottom-24 right-0 z-[9999] flex items-center group",
                "transition-all duration-500 ease-in-out flex-row-reverse"
            )}
        >
            {/* 1. THE BUTTON (Always pinned to the edge, half-hidden) */}
            <a
                href={getWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "w-14 h-14 bg-[#25D366] text-white flex items-center justify-center shadow-glow z-20",
                    "rounded-l-full rounded-r-none transition-all duration-500",
                    // The magic part: translate by exactly 28px (half of w-14) so it's always half-visible
                    "translate-x-7 group-hover:translate-x-0"
                )}
            >
                {/* We center the icon within the visible part */}
                <div className="pr-4 group-hover:pr-0 transition-all duration-500">
                    <WhatsAppIcon size={28} />
                </div>

                {/* Pulse animation - only active when NOT hovered */}
                <span className="absolute inset-0 rounded-l-full bg-[#25D366] animate-ping opacity-20 group-hover:hidden"></span>
            </a>

            {/* 2. THE LABEL (Slides out from behind the button to the LEFT) */}
            <div className={cn(
                "bg-white text-primary text-xs font-bold py-2 px-4 rounded-l-xl shadow-md border border-r-0 border-border",
                "whitespace-nowrap pointer-events-none transition-all duration-500 z-10",
                // Hidden state: pushed behind the button and invisible
                "opacity-0 translate-x-10 group-hover:opacity-100 group-hover:translate-x-0"
            )}>
                {t.floatingContact}
            </div>
        </div>
    );
}
