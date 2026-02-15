import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function PartnerRoute({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const [ok, setOk] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;

        async function checkPartner() {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                if (mounted) {
                    setOk(false);
                    navigate("/login", { replace: true });
                }
                return;
            }

            // Check if user owns a partner record
            const { data, error } = await supabase
                .from('partners')
                .select('id')
                .eq('owner_user_id', session.user.id)
                .maybeSingle();

            if (error || !data) {
                if (mounted) {
                    setOk(false);
                    navigate("/", { replace: true });
                }
                return;
            }

            if (mounted) setOk(true);
        }

        checkPartner();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session && mounted) {
                setOk(false);
                navigate("/login", { replace: true });
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [navigate]);

    if (ok !== true) return null;
    return <>{children}</>;
}
