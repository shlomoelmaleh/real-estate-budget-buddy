export type Partner = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
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
