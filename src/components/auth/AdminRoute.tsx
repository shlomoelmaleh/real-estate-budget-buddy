import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase();
      if (!mounted) return;
      if (!session || email !== ADMIN_EMAIL) {
        setOk(false);
        navigate("/login", { replace: true });
      } else {
        setOk(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email?.toLowerCase();
      if (!mounted) return;
      if (!data.session || email !== ADMIN_EMAIL) {
        setOk(false);
        navigate("/login", { replace: true });
      } else {
        setOk(true);
      }
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (ok !== true) return null;
  return <>{children}</>;
}
