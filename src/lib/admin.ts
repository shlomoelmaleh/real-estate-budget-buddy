import { supabase } from "@/integrations/supabase/client";

/**
 * Check if the current user has the admin role via server-side RPC.
 * No hardcoded emails in client code.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_admin");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
