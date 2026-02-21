import { supabase } from "@/integrations/supabase/client";

export const ADMIN_EMAILS = ["shlomo.elmaleh@gmail.com"]; // Admin email from migration hint

/**
 * Check if the current user has the admin role via server-side RPC.
 * No hardcoded emails in client code, EXCEPT for the initial admin setup if needed.
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

/**
 * Synchronous check for admin email.
 */
export function isAdminUser(user: { email?: string } | null | undefined): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
