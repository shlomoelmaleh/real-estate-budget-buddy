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
  // Use partners_public view which is designed for public access and bypasses RLS
  const { data, error } = await supabase
    .from("partners_public")
    .select("id,name,slug,logo_url,brand_color,phone,whatsapp,email,is_active,created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Partner;
}

async function fetchPartnerById(id: string): Promise<Partner | null> {
  // Use partners_public view which is designed for public access and bypasses RLS
  const { data, error } = await supabase
    .from("partners_public")
    .select("id,name,slug,logo_url,brand_color,phone,whatsapp,email,is_active,created_at")
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

  // Consolidated boot effect: Handle URL parameters and localStorage
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sp = new URLSearchParams(window.location.search);
      const urlRef = sp.get("ref")?.trim() || sp.get("partner")?.trim() || "";
      const urlId = sp.get("partnerId")?.trim() || sp.get("id")?.trim() || "";

      const stored = safeJsonParse<PartnerBinding>(localStorage.getItem(STORAGE_KEY));
      const hasStored = stored && stored.partnerId && stored.expiresAt && stored.expiresAt > Date.now();

      // Case 1: URL has parameters (Primary)
      if (urlRef || urlId) {
        setIsLoading(true);
        console.log(`[PartnerContext] Detecting from URL: slug="${urlRef}", id="${urlId}"`);

        let p: Partner | null = null;
        if (urlRef) p = await fetchPartnerBySlug(urlRef);
        if (!p && urlId) p = await fetchPartnerById(urlId);

        if (cancelled) return;

        if (p && p.is_active) {
          console.log(`[PartnerContext] URL Partner loaded: ${p.name}`);
          const newBinding: PartnerBinding = { partnerId: p.id, slug: p.slug, expiresAt: Date.now() + THIRTY_DAYS_MS };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newBinding));
          setBinding(newBinding);
          setPartner(p);
          applyPartnerBrandColor(normalizeHexColor(p.brand_color));
          setIsLoading(false);
          return;
        } else {
          if (p && !p.is_active) {
            console.warn(`[PartnerContext] URL Partner found (${p.name}) but is NOT ACTIVE. Falling back to Admin.`);
          } else {
            console.warn(`[PartnerContext] URL param provided but NO PARTNER FOUND. Clearing binding.`);
          }
          clearBinding();
          setIsLoading(false);
          return;
        }
      }

      // Case 2: No URL params, try localStorage
      if (hasStored) {
        setIsLoading(true);
        console.log(`[PartnerContext] Loading from localStorage: ${stored?.partnerId}`);
        setBinding(stored);

        const p = await fetchPartnerById(stored!.partnerId);
        if (cancelled) return;

        if (p && p.is_active) {
          console.log(`[PartnerContext] Persistent Partner loaded: ${p.name}`);
          setPartner(p);
          applyPartnerBrandColor(normalizeHexColor(p.brand_color));
        } else {
          console.warn(`[PartnerContext] Stored partner no longer exists or is inactive. Clearing.`);
          clearBinding();
        }
        setIsLoading(false);
        return;
      }

      // Case 3: Nothing found
      console.log(`[PartnerContext] No partner binding active.`);
      setIsLoading(false);
    };

    void run();
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
