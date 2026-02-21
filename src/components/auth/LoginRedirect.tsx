import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin";

export function LoginRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const handleRedirect = async (userId: string) => {
            const path = location.pathname;

            // 1. Check admin role via server-side RPC
            const isAdmin = await checkIsAdmin();
            if (isAdmin) {
                console.log("[LoginRedirect] Admin detected (Auto-redirect to /admin/partners disabled)");
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
                }
            } catch (err) {
                console.error("[LoginRedirect] Error:", err);
            } finally {
                setIsChecking(false);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                handleRedirect(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                handleRedirect(session.user.id);
            }
        });

        return () => { subscription.unsubscribe(); };
    }, [navigate, location.pathname]);

    if (isChecking) return null;
    return null;
}
