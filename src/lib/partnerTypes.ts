export type SloganFontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type SloganFontStyle = 'normal' | 'italic' | 'bold' | 'bold-italic';

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
