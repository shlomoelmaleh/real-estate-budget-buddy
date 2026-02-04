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
        <div className="fixed bottom-6 right-6 z-[9999] group flex flex-col items-end gap-2 animate-fade-in">
            {/* Psychological Tooltip */}
            <div className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "bg-white text-primary text-sm font-bold py-2 px-4 rounded-2xl shadow-elevated border border-border",
                "mb-1 whitespace-nowrap pointer-events-none"
            )}>
                {t.floatingContact}
            </div>

            {/* Floating Button */}
            <a
                href={getWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-glow",
                    "hover:scale-110 active:scale-95 transition-all duration-300 ease-out",
                    "relative"
                )}
            >
                {/* Subtle Pulse Animation */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:hidden"></span>

                <WhatsAppIcon size={32} />
            </a>
        </div>
    );
}
