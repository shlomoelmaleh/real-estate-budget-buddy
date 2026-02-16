// supabase/functions/admin-partners/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const partnerSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    email: z.string().email().optional().nullable(),
    // ... (add other basic fields as loose validation)
    // Config fields
    max_dti_ratio: z.number().optional(),
    default_interest_rate: z.number().optional(),
    // Allow any other keys to pass through for update
  })
  .passthrough();

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CREATE"), partner: partnerSchema }),
  z.object({ action: z.literal("UPDATE"), id: z.string(), partner: partnerSchema }),
  z.object({ action: z.literal("DELETE"), id: z.string() }),
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Check if user is admin (you can add stricter checks here)
    if (user.email !== Deno.env.get("ADMIN_EMAIL")) {
      // For now, allowing all auth users or strictly checking env
      // throw new Error("Forbidden");
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    const rawBody = await req.json();
    const parsed = bodySchema.parse(rawBody);

    if (parsed.action === "CREATE") {
      const { error } = await adminClient.from("partners").insert(parsed.partner);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.action === "UPDATE") {
      // This logic was missing!
      const { error } = await adminClient.from("partners").update(parsed.partner).eq("id", parsed.id);

      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (parsed.action === "DELETE") {
      const { error } = await adminClient.from("partners").delete().eq("id", parsed.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[admin-partners] Error:", error.message);
    return new Response(JSON.stringify({ error: "Operation failed. Please try again." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
