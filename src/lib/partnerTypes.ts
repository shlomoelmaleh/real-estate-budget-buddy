export type SloganFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type SloganFontStyle = 'normal' | 'italic' | 'bold' | 'bold-italic';
export type SloganFontFamily = 'system' | 'assistant' | 'heebo' | 'frank-ruhl-libre' | 'rubik' | 'inter';

export const FONT_FAMILY_OPTIONS: Record<SloganFontFamily, { label: string; css: string }> = {
  'system': {
    label: 'System Default',
    css: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  'assistant': {
    label: 'Assistant (Modern)',
    css: '"Assistant", sans-serif'
  },
  'heebo': {
    label: 'Heebo (Clean)',
    css: '"Heebo", sans-serif'
  },
  'frank-ruhl-libre': {
    label: 'Frank Ruhl Libre (Serif)',
    css: '"Frank Ruhl Libre", serif'
  },
  'rubik': {
    label: 'Rubik (Rounded)',
    css: '"Rubik", sans-serif'
  },
  'inter': {
    label: 'Inter (Professional)',
    css: '"Inter", sans-serif'
  },
};

export type Partner = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  slogan: string | null;
  slogan_font_size: SloganFontSize | null;
  slogan_font_style: SloganFontStyle | null;
  slogan_font_family: SloganFontFamily | null;
  is_active: boolean;
  created_at: string;
};

export type ActivityLogEventType = "LEAD_SENT" | "LEAD_FAILED" | "STATUS_CHANGE" | "PARTNER_CREATED";

export type ActivityLogRow = {
  id: string;
  timestamp: string;
  event_type: ActivityLogEventType;
  partner_id: string | null;
  description: string;
  metadata: any;
};
