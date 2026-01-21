import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityLogRow, Partner } from "@/lib/partnerTypes";
import { ADMIN_EMAIL } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { normalizeHexColor } from "@/lib/color";

type LogFilter = "ALL" | "ERRORS" | "STATUS";

async function requireAdminSession() {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email?.toLowerCase();
  if (!data.session || email !== ADMIN_EMAIL) throw new Error("Unauthorized");
  return data.session;
}

async function adminMutate(body: any) {
  const session = await requireAdminSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-partners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  const payload = txt ? JSON.parse(txt) : null;
  if (!res.ok) throw new Error(payload?.error || "Request failed");
  return payload;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [filter, setFilter] = useState<LogFilter>("ALL");

  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    whatsapp: "",
    brand_color: "",
    logo_url: "",
    is_active: true,
  });

  const [pendingToggle, setPendingToggle] = useState<{ id: string; next: boolean } | null>(null);

  const loadPartners = async () => {
    setIsLoadingPartners(true);
    const { data, error } = await supabase
      .from("partners")
      .select("id,name,slug,logo_url,brand_color,phone,whatsapp,email,is_active,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load partners");
    setPartners((data || []) as any);
    setIsLoadingPartners(false);
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id,timestamp,event_type,partner_id,description,metadata")
      .order("timestamp", { ascending: false })
      .limit(500);
    if (error) toast.error("Failed to load logs");
    setLogs((data || []) as any);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    loadPartners();
    loadLogs();
  }, []);

  const partnersById = useMemo(() => {
    const m = new Map<string, Partner>();
    partners.forEach((p) => m.set(p.id, p));
    return m;
  }, [partners]);

  const filteredLogs = useMemo(() => {
    if (filter === "ERRORS") return logs.filter((l) => l.event_type === "LEAD_FAILED");
    if (filter === "STATUS") return logs.filter((l) => l.event_type === "STATUS_CHANGE");
    return logs;
  }, [logs, filter]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", slug: "", email: "", phone: "", whatsapp: "", brand_color: "", logo_url: "", is_active: true });
  };

  const startEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      email: p.email || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      brand_color: p.brand_color || "",
      logo_url: p.logo_url || "",
      is_active: !!p.is_active,
    });
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/?ref=${encodeURIComponent(slug)}`;
    await navigator.clipboard.writeText(url);
    toast.success("Copied");
  };

  const onLogoUpload = async (file: File) => {
    const session = await requireAdminSession();
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `logos/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("partner-logos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Upload failed");
      return;
    }
    // public bucket
    const { data } = supabase.storage.from("partner-logos").getPublicUrl(path);
    setForm((f) => ({ ...f, logo_url: data.publicUrl }));
    toast.success("Logo uploaded");
    void session; // keep session referenced (lint)
  };

  const savePartner = async () => {
    const brand = normalizeHexColor(form.brand_color) || null;
    try {
      await adminMutate({
        action: editing ? "UPDATE" : "CREATE",
        id: editing?.id,
        partner: {
          name: form.name,
          slug: form.slug,
          email: form.email || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          brand_color: brand,
          logo_url: form.logo_url || null,
          is_active: !!form.is_active,
        },
      });
      toast.success("Saved");
      resetForm();
      await loadPartners();
      await loadLogs();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  const requestToggle = (p: Partner, next: boolean) => {
    if (!next) {
      setPendingToggle({ id: p.id, next });
    } else {
      // activation is safe without confirmation
      void confirmToggle(p.id, next);
    }
  };

  const confirmToggle = async (id: string, next: boolean) => {
    setPendingToggle(null);
    try {
      await adminMutate({ action: "SET_ACTIVE", id, is_active: next });
      toast.success("Updated");
      await loadPartners();
      await loadLogs();
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  const deletePartner = async (id: string) => {
    try {
      await adminMutate({ action: "DELETE", id });
      toast.success("Deleted");
      resetForm();
      await loadPartners();
      await loadLogs();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Partners</h1>
            <p className="text-sm text-muted-foreground">White-label management & audit trail</p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Signed out");
            }}
          >
            Sign out
          </Button>
        </header>

        <Tabs defaultValue="partners">
          <TabsList>
            <TabsTrigger value="partners">Partner Management</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="partners">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-4 lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Partners</h2>
                  <Button variant="outline" onClick={loadPartners} disabled={isLoadingPartners}>
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {partners.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 border border-border/60 rounded-lg p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{p.name}</p>
                          <Badge variant={p.is_active ? "secondary" : "outline"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                          <span className="text-xs text-muted-foreground truncate">/{p.slug}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{p.email || "—"}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" onClick={() => copyLink(p.slug)}>Copy Link</Button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch checked={p.is_active} onCheckedChange={(v) => requestToggle(p, v)} />
                        </div>
                        <Button variant="outline" onClick={() => startEdit(p)}>
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!partners.length && <p className="text-sm text-muted-foreground">No partners yet.</p>}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">{editing ? "Edit Partner" : "Add Partner"}</h2>
                  {editing ? (
                    <Button variant="outline" onClick={resetForm}>New</Button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Name</label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Slug</label>
                    <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">lowercase, dash-separated (e.g. acme-mortgage)</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email</label>
                    <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Phone</label>
                    <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">WhatsApp</label>
                    <Input value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Brand Color (hex)</label>
                    <Input value={form.brand_color} onChange={(e) => setForm((f) => ({ ...f, brand_color: e.target.value }))} placeholder="#1a73e8" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Logo</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onLogoUpload(file);
                      }}
                    />
                    {form.logo_url ? (
                      <div className="mt-2 rounded-md border border-border/60 p-2">
                        <img src={form.logo_url} alt="Partner logo preview" className="h-10 w-auto object-contain" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={savePartner} className="flex-1">Save</Button>
                    {editing ? (
                      <Button variant="destructive" onClick={() => deletePartner(editing.id)}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>

            <AlertDialog open={!!pendingToggle} onOpenChange={(o) => !o && setPendingToggle(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate partner?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately disable the white-label branding and stop CC emails to this partner.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (pendingToggle) void confirmToggle(pendingToggle.id, pendingToggle.next);
                    }}
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <h2 className="font-semibold">Audit Trail</h2>
                <div className="flex items-center gap-2">
                  <Button variant={filter === "ALL" ? "default" : "outline"} onClick={() => setFilter("ALL")}>
                    All
                  </Button>
                  <Button variant={filter === "ERRORS" ? "default" : "outline"} onClick={() => setFilter("ERRORS")}>
                    Errors
                  </Button>
                  <Button variant={filter === "STATUS" ? "default" : "outline"} onClick={() => setFilter("STATUS")}>
                    Status Changes
                  </Button>
                  <Button variant="outline" onClick={loadLogs} disabled={isLoadingLogs}>
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border/60">
                      <th className="py-2 pe-3">Date</th>
                      <th className="py-2 pe-3">Event</th>
                      <th className="py-2 pe-3">Partner</th>
                      <th className="py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((l) => (
                      <tr key={l.id} className="border-b border-border/40 align-top">
                        <td className="py-2 pe-3 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                        <td className="py-2 pe-3 whitespace-nowrap">
                          <Badge variant={l.event_type === "LEAD_FAILED" ? "destructive" : l.event_type === "STATUS_CHANGE" ? "secondary" : "outline"}>
                            {l.event_type}
                          </Badge>
                        </td>
                        <td className="py-2 pe-3 whitespace-nowrap">
                          {l.partner_id ? partnersById.get(l.partner_id)?.name || "(deleted)" : "—"}
                        </td>
                        <td className="py-2 break-words">{l.description}</td>
                      </tr>
                    ))}
                    {!filteredLogs.length && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          No logs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
