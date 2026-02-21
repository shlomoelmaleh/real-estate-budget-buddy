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

            // Only auto-redirect when coming from /login page
            // Never redirect users away from the main app (/) or admin pages
            if (path !== "/login") return;

            // 1. Check admin role via server-side RPC
            const isAdmin = await checkIsAdmin();
            if (isAdmin) {
                console.log("[LoginRedirect] Admin detected → /admin/partners");
                navigate("/admin/partners", { replace: true });
                return;
            }

            // 2. Check if the user owns a partner record
            setIsChecking(true);
            try {
                const { data: partner, error } = await supabase
                    .from("partners")
                    .select("id")
                    .eq("owner_user_id", userId)
                    .maybeSingle();

                if (!error && partner) {
                    console.log("[LoginRedirect] Partner owner → /admin/settings");
                    navigate("/admin/settings", { replace: true });
                    return;
                }
            } catch (err) {
                console.error("[LoginRedirect] Error:", err);
            } finally {
                setIsChecking(false);
            }

            // 3. Regular user — go home
            navigate("/", { replace: true });
        };

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
