import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function AuthRedirect() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkUser = async (user: any) => {
            if (!user) return;
            setIsLoading(true);
            try {
                const { data: partner, error } = await supabase
                    .from("partners")
                    .select("slug")
                    .eq("owner_user_id", user.id)
                    .maybeSingle();

                if (!error && partner) {
                    console.log("[AuthRedirect] Partner detected, redirecting to settings");
                    navigate("/admin/settings");
                } else if (!error && !partner) {
                    console.log("[AuthRedirect] No partner record, redirecting home");
                    navigate("/");
                }
            } catch (err) {
                console.error("[AuthRedirect] Error in checkUser:", err);
            } finally {
                setIsLoading(false);
            }
        };

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                checkUser(session.user);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("[AuthRedirect] Event:", event);
            if (event === "SIGNED_IN" && session?.user) {
                checkUser(session.user);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-medium animate-pulse">Authenticating...</p>
                </div>
            </div>
        );
    }

    return null;
}
