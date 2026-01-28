import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Partner } from "@/lib/partnerTypes";
import { applyPartnerBrandColor, normalizeHexColor } from "@/lib/color";

type PartnerBinding = {
  partnerId: string;
  slug: string;
  expiresAt: number; // epoch ms
};

type PartnerContextValue = {
  partner: Partner | null;
  binding: PartnerBinding | null;
  isLoading: boolean;
  clearBinding: () => void;
};

const PartnerContext = createContext<PartnerContextValue | undefined>(undefined);

const STORAGE_KEY = "partner_binding_v1";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function fetchPartnerBySlug(slug: string): Promise<Partner | null> {
  // Use partners_public view - base partners table has admin-only RLS
  const { data, error } = await supabase
    .from("partners_public")
    .select("id,name,slug,logo_url,brand_color,phone,whatsapp,email,slogan,slogan_font_size,slogan_font_style,is_active,created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Partner;
}

async function fetchPartnerById(id: string): Promise<Partner | null> {
  // Use partners_public view - base partners table has admin-only RLS
  const { data, error } = await supabase
    .from("partners_public")
    .select("id,name,slug,logo_url,brand_color,phone,whatsapp,email,slogan,slogan_font_size,slogan_font_style,is_active,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Partner;
}

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [binding, setBinding] = useState<PartnerBinding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearBinding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBinding(null);
    setPartner(null);
    applyPartnerBrandColor(null);
  };

  // Detect ?ref=slug (initial load is the primary use-case)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sp = new URLSearchParams(window.location.search);
      const ref = sp.get("ref")?.trim() || "";
      if (!ref) return;

      setIsLoading(true);
      const p = await fetchPartnerBySlug(ref);
      if (cancelled) return;

      if (!p || !p.is_active) {
        // Fallback immediately (invalid/inactive)
        clearBinding();
        setIsLoading(false);
        return;
      }

      const newBinding: PartnerBinding = {
        partnerId: p.id,
        slug: p.slug,
        expiresAt: Date.now() + THIRTY_DAYS_MS,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBinding));
      setBinding(newBinding);
      setPartner(p);
      applyPartnerBrandColor(normalizeHexColor(p.brand_color));
      setIsLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boot from localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = safeJsonParse<PartnerBinding>(localStorage.getItem(STORAGE_KEY));
      if (!stored || !stored.partnerId || !stored.expiresAt || stored.expiresAt < Date.now()) {
        clearBinding();
        setIsLoading(false);
        return;
      }
      setBinding(stored);
      const p = await fetchPartnerById(stored.partnerId);
      if (cancelled) return;
      if (!p || !p.is_active) {
        clearBinding();
        setIsLoading(false);
        return;
      }
      setPartner(p);
      applyPartnerBrandColor(normalizeHexColor(p.brand_color));
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<PartnerContextValue>(
    () => ({ partner, binding, isLoading, clearBinding }),
    [partner, binding, isLoading],
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used within PartnerProvider");
  return ctx;
}
