import { PartnerConfig } from '@/types/partnerConfig';
import { SloganFontSize, SloganFontStyle, SloganFontFamily } from '@/lib/partnerTypes';
import { SupportedCurrency } from '@/lib/currencyUtils';

// Extended config with all partner fields
export interface ExtendedConfig extends PartnerConfig {
    // Branding & Contact - EDITABLE
    logo_url: string | null;
    brand_color: string | null;
    slogan: string | null;
    slogan_font_size: SloganFontSize | null;
    slogan_font_style: SloganFontStyle | null;
    slogan_font_family: SloganFontFamily | null;
    phone: string | null;
    whatsapp: string | null;
    default_language: "he" | "en" | "fr";
    default_currency: SupportedCurrency;

    // Read-only display fields (NOT in update payload)
    name: string;
    slug: string;
    email: string | null;
    is_active: boolean;
}

export interface TabProps {
    config: ExtendedConfig;
    updateConfig: <K extends keyof ExtendedConfig>(key: K, value: ExtendedConfig[K]) => void;
    t: any;
    partnerId: string | null;
}

// Helper: Convert DB percentage decimals to display percentages (0.17 → 17)
export function toDisplayPercent(value: number): number {
    return Math.round(value * 100);
}

// Helper: Convert display percentages to DB decimals (17 → 0.17)
export function toDbDecimal(value: number): number {
    return value / 100;
}
