import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_EMAIL } from "@/lib/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [isSending, setIsSending] = useState(false);

  const normalized = useMemo(() => email.trim().toLowerCase(), [email]);

  const sendLink = async () => {
    if (normalized !== ADMIN_EMAIL) {
      toast.error("Unauthorized email");
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: { emailRedirectTo: window.location.origin + "/admin/partners" },
      });
      if (error) throw error;
      toast.success("Magic link sent");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send link");
    } finally {
      setIsSending(false);
    }
  };

  const goHome = () => navigate("/");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Magic link (OTP) for the admin account.</p>
        </header>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="flex gap-2">
          <Button onClick={sendLink} disabled={isSending} className="flex-1">
            {isSending ? "Sending…" : "Send magic link"}
          </Button>
          <Button variant="outline" onClick={goHome}>
            Back
          </Button>
        </div>
      </Card>
    </main>
  );
}
