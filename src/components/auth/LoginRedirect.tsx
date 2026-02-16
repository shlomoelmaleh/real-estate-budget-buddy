import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin";

/**
 * LoginRedirect (The Watchdog)
 * Routes users after sign-in:
 *   - Super Admin  → /admin/partners
 *   - Partner Owner → /admin/settings
 *   - Everyone else → stays where they are
 *
 * Never redirects if already on the correct admin page.
 */
export function LoginRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const handleRedirect = async (userId: string, email: string | undefined) => {
            const path = location.pathname;

            // 1. Super Admin — send to /admin/partners (unless already there)
            if (email?.toLowerCase() === ADMIN_EMAIL) {
                if (path.startsWith("/admin")) return; // don't redirect if already on any admin page
                console.log("[LoginRedirect] Admin detected → /admin/partners");
                navigate("/admin/partners", { replace: true });
                return;
            }

            // 2. Already on the partner settings page — nothing to do
            if (path === "/admin/settings") return;

            // 3. Check if the user owns a partner record
            setIsChecking(true);
            try {
                const { data: partner, error } = await supabase
                    .from("partners")
                    .select("id")
                    .eq("owner_user_id", userId)
                    .maybeSingle();

                if (!error && partner) {
                    console.log("[LoginRedirect] Partner owner detected (Auto-redirect disabled)");
                    // navigate("/admin/settings", { replace: true }); <--- DISABLED
                }
            } catch (err) {
                console.error("[LoginRedirect] Error:", err);
            } finally {
                setIsChecking(false);
            }
        };

        // Initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                handleRedirect(session.user.id, session.user.email);
            }
        });

        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                handleRedirect(session.user.id, session.user.email);
            }
        });

        return () => { subscription.unsubscribe(); };
    }, [navigate, location.pathname]);

    if (isChecking) return null;
    return null;
}
