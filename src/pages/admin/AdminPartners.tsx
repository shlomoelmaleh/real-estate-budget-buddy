import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityLogRow, Partner, SloganFontSize, SloganFontStyle } from "@/lib/partnerTypes";
import { checkIsAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeHexColor } from "@/lib/color";

type LogFilter = "ALL" | "ERRORS" | "STATUS";

async function requireAdminSession() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Unauthorized");
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized");
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    whatsapp: "",
    brand_color: "",
    logo_url: "",
    slogan: "",
    slogan_font_size: "sm" as SloganFontSize,
    slogan_font_style: "normal" as SloganFontStyle,
    is_active: true,
    // Config params
    max_dti_ratio: 0.33,
    max_age: 80,
    max_loan_term_years: 30,
    rent_recognition_first_property: 0.0,
    rent_recognition_investment: 0.8,
    default_interest_rate: 5.0,
    lawyer_fee_percent: 1.0,
    broker_fee_percent: 2.0,
    vat_percent: 17.0,
    advisor_fee_fixed: 9000,
    other_fee_fixed: 3000,
    rental_yield_default: 3.0,
    rent_warning_high_multiplier: 1.5,
    rent_warning_low_multiplier: 0.7,
    enable_rent_validation: true,
    enable_what_if_calculator: true,
    show_amortization_table: true,
    max_amortization_months: 60,
  });

  const [pendingToggle, setPendingToggle] = useState<{ id: string; next: boolean } | null>(null);

  const loadPartners = async () => {
    setIsLoadingPartners(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
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
    setShowCreateDialog(false);
    setForm({ name: "", slug: "", email: "", phone: "", whatsapp: "", brand_color: "", logo_url: "", slogan: "", slogan_font_size: "sm", slogan_font_style: "normal", is_active: true, max_dti_ratio: 0.33, max_age: 80, max_loan_term_years: 30, rent_recognition_first_property: 0.0, rent_recognition_investment: 0.8, default_interest_rate: 5.0, lawyer_fee_percent: 1.0, broker_fee_percent: 2.0, vat_percent: 17.0, advisor_fee_fixed: 9000, other_fee_fixed: 3000, rental_yield_default: 3.0, rent_warning_high_multiplier: 1.5, rent_warning_low_multiplier: 0.7, enable_rent_validation: true, enable_what_if_calculator: true, show_amortization_table: true, max_amortization_months: 60 });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const startEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      email: p.email || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      brand_color: p.brand_color || "",
      logo_url: p.logo_url || "",
      slogan: p.slogan || "",
      slogan_font_size: (p.slogan_font_size || "sm") as SloganFontSize,
      slogan_font_style: (p.slogan_font_style || "normal") as SloganFontStyle,
      is_active: !!p.is_active,
      max_dti_ratio: p.max_dti_ratio ?? 0.33,
      max_age: p.max_age ?? 80,
      max_loan_term_years: p.max_loan_term_years ?? 30,
      rent_recognition_first_property: p.rent_recognition_first_property ?? 0.0,
      rent_recognition_investment: p.rent_recognition_investment ?? 0.8,
      default_interest_rate: p.default_interest_rate ?? 5.0,
      lawyer_fee_percent: p.lawyer_fee_percent ?? 1.0,
      broker_fee_percent: p.broker_fee_percent ?? 2.0,
      vat_percent: p.vat_percent ?? 17.0,
      advisor_fee_fixed: p.advisor_fee_fixed ?? 9000,
      other_fee_fixed: p.other_fee_fixed ?? 3000,
      rental_yield_default: p.rental_yield_default ?? 3.0,
      rent_warning_high_multiplier: p.rent_warning_high_multiplier ?? 1.5,
      rent_warning_low_multiplier: p.rent_warning_low_multiplier ?? 0.7,
      enable_rent_validation: p.enable_rent_validation ?? true,
      enable_what_if_calculator: p.enable_what_if_calculator ?? true,
      show_amortization_table: p.show_amortization_table ?? true,
      max_amortization_months: p.max_amortization_months ?? 60,
    });
  };

  const copyLink = async (slug: string) => {
    const url = `https://dream-deal-planner-29.lovable.app/?ref=${encodeURIComponent(slug)}`;
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
          slogan: form.slogan || null,
          slogan_font_size: form.slogan_font_size || "sm",
          slogan_font_style: form.slogan_font_style || "normal",
          is_active: !!form.is_active,
          max_dti_ratio: form.max_dti_ratio,
          max_age: form.max_age,
          max_loan_term_years: form.max_loan_term_years,
          rent_recognition_first_property: form.rent_recognition_first_property,
          rent_recognition_investment: form.rent_recognition_investment,
          default_interest_rate: form.default_interest_rate,
          lawyer_fee_percent: form.lawyer_fee_percent,
          broker_fee_percent: form.broker_fee_percent,
          vat_percent: form.vat_percent,
          advisor_fee_fixed: form.advisor_fee_fixed,
          other_fee_fixed: form.other_fee_fixed,
          rental_yield_default: form.rental_yield_default,
          rent_warning_high_multiplier: form.rent_warning_high_multiplier,
          rent_warning_low_multiplier: form.rent_warning_low_multiplier,
          enable_rent_validation: form.enable_rent_validation,
          enable_what_if_calculator: form.enable_what_if_calculator,
          show_amortization_table: form.show_amortization_table,
          max_amortization_months: form.max_amortization_months,
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
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Partner
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Signed out");
              }}
            >
              Sign out
            </Button>
          </div>
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
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Slogan</label>
                    <Input
                      value={form.slogan}
                      onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))}
                      placeholder="Your trusted mortgage partner"
                    />
                    <p className="text-xs text-muted-foreground">Optional text displayed under the logo in the header</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Slogan Font Size</label>
                      <Select
                        value={form.slogan_font_size}
                        onValueChange={(v) => setForm((f) => ({ ...f, slogan_font_size: v as SloganFontSize }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xs">Extra Small</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="base">Normal</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Slogan Font Style</label>
                      <Select
                        value={form.slogan_font_style}
                        onValueChange={(v) => setForm((f) => ({ ...f, slogan_font_style: v as SloganFontStyle }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="italic">Italic</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                          <SelectItem value="bold-italic">Bold Italic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ===== Configuration Parameters ===== */}
                  <details className="border border-border/60 rounded-lg p-3 space-y-3">
                    <summary className="cursor-pointer font-semibold text-sm">⚙️ Configuration Parameters</summary>
                    <p className="text-xs text-muted-foreground">Risk & regulatory limits, fees, and feature flags.</p>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Max DTI Ratio</label>
                      <Input type="number" step="0.01" min="0.25" max="0.50" value={form.max_dti_ratio} onChange={(e) => setForm((f) => ({ ...f, max_dti_ratio: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Max Borrower Age</label>
                      <Input type="number" min="70" max="95" value={form.max_age} onChange={(e) => setForm((f) => ({ ...f, max_age: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Max Loan Term (years)</label>
                      <Input type="number" min="10" max="35" value={form.max_loan_term_years} onChange={(e) => setForm((f) => ({ ...f, max_loan_term_years: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Default Interest Rate (%)</label>
                      <Input type="number" step="0.1" min="1" max="15" value={form.default_interest_rate} onChange={(e) => setForm((f) => ({ ...f, default_interest_rate: parseFloat(e.target.value) || 0 }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Lawyer Fee (%)</label>
                        <Input type="number" step="0.1" value={form.lawyer_fee_percent} onChange={(e) => setForm((f) => ({ ...f, lawyer_fee_percent: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Broker Fee (%)</label>
                        <Input type="number" step="0.1" value={form.broker_fee_percent} onChange={(e) => setForm((f) => ({ ...f, broker_fee_percent: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">VAT (%)</label>
                        <Input type="number" step="0.1" value={form.vat_percent} onChange={(e) => setForm((f) => ({ ...f, vat_percent: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Rental Yield (%)</label>
                        <Input type="number" step="0.1" value={form.rental_yield_default} onChange={(e) => setForm((f) => ({ ...f, rental_yield_default: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Advisor Fee (₪)</label>
                        <Input type="number" value={form.advisor_fee_fixed} onChange={(e) => setForm((f) => ({ ...f, advisor_fee_fixed: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Other Fee (₪)</label>
                        <Input type="number" value={form.other_fee_fixed} onChange={(e) => setForm((f) => ({ ...f, other_fee_fixed: parseInt(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Rent Recog. (1st)</label>
                        <Input type="number" step="0.1" min="0" max="1" value={form.rent_recognition_first_property} onChange={(e) => setForm((f) => ({ ...f, rent_recognition_first_property: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Rent Recog. (Inv.)</label>
                        <Input type="number" step="0.1" min="0" max="1" value={form.rent_recognition_investment} onChange={(e) => setForm((f) => ({ ...f, rent_recognition_investment: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Rent Warn High (×)</label>
                        <Input type="number" step="0.1" value={form.rent_warning_high_multiplier} onChange={(e) => setForm((f) => ({ ...f, rent_warning_high_multiplier: parseFloat(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Rent Warn Low (×)</label>
                        <Input type="number" step="0.1" value={form.rent_warning_low_multiplier} onChange={(e) => setForm((f) => ({ ...f, rent_warning_low_multiplier: parseFloat(e.target.value) || 0 }))} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Max Amortization Months</label>
                      <Input type="number" min="12" max="360" value={form.max_amortization_months} onChange={(e) => setForm((f) => ({ ...f, max_amortization_months: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Enable Rent Validation</label>
                        <Switch checked={form.enable_rent_validation} onCheckedChange={(v) => setForm((f) => ({ ...f, enable_rent_validation: v }))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Enable What-If Calculator</label>
                        <Switch checked={form.enable_what_if_calculator} onCheckedChange={(v) => setForm((f) => ({ ...f, enable_what_if_calculator: v }))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Show Amortization Table</label>
                        <Switch checked={form.show_amortization_table} onCheckedChange={(v) => setForm((f) => ({ ...f, show_amortization_table: v }))} />
                      </div>
                    </div>
                  </details>

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

        {/* Create Partner Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Partner</DialogTitle>
              <DialogDescription>
                Add a new partner with their basic information. You can configure advanced settings after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name *</Label>
                <Input
                  id="create-name"
                  value={form.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name: newName,
                      slug: generateSlug(newName),
                    }));
                  }}
                  placeholder="Acme Mortgage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug *</Label>
                <Input
                  id="create-slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="acme-mortgage"
                />
                <p className="text-xs text-muted-foreground">Auto-generated from name. Lowercase, dash-separated.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Owner Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="partner@example.com"
                />
                <p className="text-xs text-muted-foreground">This email will be used for Magic Link authentication.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await savePartner();
                  setShowCreateDialog(false);
                }}
                disabled={!form.name || !form.slug || !form.email}
              >
                Create Partner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
