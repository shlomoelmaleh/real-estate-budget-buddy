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
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const normalized = useMemo(() => email.trim().toLowerCase(), [email]);

  const sendLink = async () => {
    if (!normalized || !normalized.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsSending(true);
    try {
      // Preserve partner ref parameter if present
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');

      let redirectUrl = window.location.origin;
      if (refParam) {
        redirectUrl += `?ref=${refParam}`;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
          emailRedirectTo: redirectUrl
        },
      });

      if (error) throw error;
      toast.success("Magic link sent! Check your email.");
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
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-sm text-muted-foreground">Receive a magic link (OTP) to your email.</p>
        </header>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address</label>
          <Input
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={sendLink} disabled={isSending} className="w-full">
            {isSending ? "Sending…" : "Send magic link"}
          </Button>
          <Button variant="ghost" onClick={goHome} className="w-full">
            Back to Home
          </Button>
        </div>
      </Card>
    </main>
  );
}
