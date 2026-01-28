import { createClient } from "npm:@supabase/supabase-js@^2.89.0";
import { z } from "npm:zod@^3.25.76";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAIL = "shlomo.elmaleh@gmail.com";

const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

const hexColorSchema = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid color")
  .transform((v) => (v.startsWith("#") ? v : `#${v}`));

const sloganFontSizeSchema = z.enum(['xs', 'sm', 'base', 'lg', 'xl']).nullable().optional();
const sloganFontStyleSchema = z.enum(['normal', 'italic', 'bold', 'bold-italic']).nullable().optional();

const partnerSchema = z.object({
  name: z.string().min(1).max(120),
  slug: slugSchema,
  email: z.string().email().max(254).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  whatsapp: z.string().max(30).nullable().optional(),
  brand_color: hexColorSchema.nullable().optional(),
  logo_url: z.string().url().max(2048).nullable().optional(),
  slogan: z.string().max(200).nullable().optional(),
  slogan_font_size: sloganFontSizeSchema,
  slogan_font_style: sloganFontStyleSchema,
  is_active: z.boolean(),
});

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CREATE"), partner: partnerSchema }),
  z.object({ action: z.literal("UPDATE"), id: z.string().uuid(), partner: partnerSchema.partial().extend({ is_active: z.boolean().optional() }) }),
  z.object({ action: z.literal("DELETE"), id: z.string().uuid() }),
  z.object({ action: z.literal("SET_ACTIVE"), id: z.string().uuid(), is_active: z.boolean() }),
]);

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function describeAction(action: string, partnerId?: string, extra?: Record<string, unknown>) {
  const metadata = {
    action,
    ...(partnerId ? { partner_id: partnerId } : {}),
    ...(extra || {}),
  };
  return metadata;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Unauthorized" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json(500, { error: "Server misconfigured" });

    // 1) Verify caller identity using the end-user JWT
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    const email = userData?.user?.email?.toLowerCase();
    if (userErr || !email) return json(401, { error: "Unauthorized" });
    if (email !== ADMIN_EMAIL) return json(403, { error: "Forbidden" });

    // 2) Parse request body
    const rawBody = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return json(400, { error: "Invalid request", details: parsed.error.flatten() });
    }

    // 3) Execute privileged DB ops using service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const request = parsed.data;
    if (request.action === "CREATE") {
      const { data, error } = await adminClient
        .from("partners")
        .insert({
          name: request.partner.name,
          slug: request.partner.slug,
          email: request.partner.email ?? null,
          phone: request.partner.phone ?? null,
          whatsapp: request.partner.whatsapp ?? null,
          brand_color: request.partner.brand_color ?? null,
          logo_url: request.partner.logo_url ?? null,
          slogan: request.partner.slogan ?? null,
          slogan_font_size: request.partner.slogan_font_size ?? 'sm',
          slogan_font_style: request.partner.slogan_font_style ?? 'normal',
          is_active: request.partner.is_active,
        })
        .select("id")
        .single();
      if (error) return json(400, { error: error.message });

      await adminClient.from("activity_logs").insert({
        event_type: "PARTNER_CREATED",
        partner_id: data.id,
        description: `Partner created: ${request.partner.slug}`,
        metadata: describeAction("CREATE", data.id, { slug: request.partner.slug }),
      });

      return json(200, { ok: true, id: data.id });
    }

    if (request.action === "UPDATE") {
      const { id, partner } = request;
      const updatePayload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(partner)) {
        if (v !== undefined) updatePayload[k] = v;
      }

      const { error } = await adminClient.from("partners").update(updatePayload).eq("id", id);
      if (error) return json(400, { error: error.message });

      await adminClient.from("activity_logs").insert({
        event_type: "STATUS_CHANGE",
        partner_id: id,
        description: "Partner updated",
        metadata: describeAction("UPDATE", id, { fields: Object.keys(updatePayload) }),
      });

      return json(200, { ok: true });
    }

    if (request.action === "SET_ACTIVE") {
      const { id, is_active } = request;

      const { error } = await adminClient.from("partners").update({ is_active }).eq("id", id);
      if (error) return json(400, { error: error.message });

      await adminClient.from("activity_logs").insert({
        event_type: "STATUS_CHANGE",
        partner_id: id,
        description: `Partner ${is_active ? "activated" : "deactivated"}`,
        metadata: describeAction("SET_ACTIVE", id, { is_active }),
      });

      return json(200, { ok: true });
    }

    if (request.action === "DELETE") {
      const { id } = request;

      // log before deletion, while partner still exists
      await adminClient.from("activity_logs").insert({
        event_type: "STATUS_CHANGE",
        partner_id: id,
        description: "Partner deleted",
        metadata: describeAction("DELETE", id),
      });

      const { error } = await adminClient.from("partners").delete().eq("id", id);
      if (error) return json(400, { error: error.message });

      return json(200, { ok: true });
    }

    // Exhaustive fallback
    return json(400, { error: "Unknown action" });
  } catch (_e) {
    return json(500, { error: "Internal server error" });
  }
});
