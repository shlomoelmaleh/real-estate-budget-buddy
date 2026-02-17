import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verify() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) { setOk(false); navigate("/login", { replace: true }); }
        return;
      }
      const isAdmin = await checkIsAdmin();
      if (!mounted) return;
      if (!isAdmin) {
        setOk(false);
        navigate("/login", { replace: true });
      } else {
        setOk(true);
      }
    }

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) {
        setOk(false);
        navigate("/login", { replace: true });
      } else if (session) {
        verify();
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  if (ok !== true) return null;
  return <>{children}</>;
}
