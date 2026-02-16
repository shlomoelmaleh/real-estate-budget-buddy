import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * LoginRedirect (The Watchdog)
 * Listens to authentication state changes and forces partners to /admin/settings.
 */
export function LoginRedirect() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        const checkPartnerAndRedirect = async (userId: string) => {
            // Avoid loops if already on settings
            if (location.pathname === "/partner/config") {
                return;
            }

            setIsChecking(true);
            try {
                const { data: partner, error } = await supabase
                    .from("partners")
                    .select("id")
                    .eq("owner_user_id", userId)
                    .maybeSingle();

                if (!error && partner) {
                    console.log("[LoginRedirect] Partner detected, forcing redirect to /partner/config");
                    navigate("/partner/config", { replace: true });
                }
            } catch (err) {
                console.error("[LoginRedirect] Error check:", err);
            } finally {
                setIsChecking(false);
            }
        };

        // 1. Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                checkPartnerAndRedirect(session.user.id);
            }
        });

        // 2. Listen for SIGNED_IN events
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                checkPartnerAndRedirect(session.user.id);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate, location.pathname]);

    if (isChecking) {
        return null; // Keep it invisible or show a very subtle spinner if preferred
    }

    return null;
}
