import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Partner } from "@/lib/partnerTypes";
import { applyPartnerBrandColor, normalizeHexColor } from "@/lib/color";
import { PartnerConfig, DEFAULT_PARTNER_CONFIG } from "@/types/partnerConfig";

type PartnerBinding = {
  partnerId: string;
  slug: string;
  expiresAt: number; // epoch ms
};

type PartnerContextValue = {
  partner: Partner | null;
  config: PartnerConfig;
  binding: PartnerBinding | null;
  isLoading: boolean;
  isOwner: boolean;
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
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Partner;
}

async function fetchPartnerById(id: string): Promise<Partner | null> {
  const { data, error } = await supabase
    .from("partners_public")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as Partner;
}

function mapToPartnerConfig(data: any): PartnerConfig {
  return {
    max_dti_ratio: data.max_dti_ratio ?? DEFAULT_PARTNER_CONFIG.max_dti_ratio,
    max_age: data.max_age ?? DEFAULT_PARTNER_CONFIG.max_age,
    max_loan_term_years: data.max_loan_term_years ?? DEFAULT_PARTNER_CONFIG.max_loan_term_years,
    rent_recognition_first_property: data.rent_recognition_first_property ?? DEFAULT_PARTNER_CONFIG.rent_recognition_first_property,
    rent_recognition_investment: data.rent_recognition_investment ?? DEFAULT_PARTNER_CONFIG.rent_recognition_investment,
    default_interest_rate: data.default_interest_rate ?? DEFAULT_PARTNER_CONFIG.default_interest_rate,
    lawyer_fee_percent: data.lawyer_fee_percent ?? DEFAULT_PARTNER_CONFIG.lawyer_fee_percent,
    broker_fee_percent: data.broker_fee_percent ?? DEFAULT_PARTNER_CONFIG.broker_fee_percent,
    vat_percent: data.vat_percent ?? DEFAULT_PARTNER_CONFIG.vat_percent,
    advisor_fee_fixed: data.advisor_fee_fixed ?? DEFAULT_PARTNER_CONFIG.advisor_fee_fixed,
    other_fee_fixed: data.other_fee_fixed ?? DEFAULT_PARTNER_CONFIG.other_fee_fixed,
    rental_yield_default: data.rental_yield_default ?? DEFAULT_PARTNER_CONFIG.rental_yield_default,
    rent_warning_high_multiplier: data.rent_warning_high_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_high_multiplier,
    rent_warning_low_multiplier: data.rent_warning_low_multiplier ?? DEFAULT_PARTNER_CONFIG.rent_warning_low_multiplier,
    enable_rent_validation: data.enable_rent_validation ?? DEFAULT_PARTNER_CONFIG.enable_rent_validation,
    enable_what_if_calculator: data.enable_what_if_calculator ?? DEFAULT_PARTNER_CONFIG.enable_what_if_calculator,
    show_amortization_table: data.show_amortization_table ?? DEFAULT_PARTNER_CONFIG.show_amortization_table,
    max_amortization_months: data.max_amortization_months ?? DEFAULT_PARTNER_CONFIG.max_amortization_months,
  };
}

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [config, setConfig] = useState<PartnerConfig>(DEFAULT_PARTNER_CONFIG);
  const [binding, setBinding] = useState<PartnerBinding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const clearBinding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBinding(null);
    setPartner(null);
    setConfig(DEFAULT_PARTNER_CONFIG);
    setIsOwner(false);
    applyPartnerBrandColor(null);
  };

  // Detect ?ref=slug (initial load is the primary use-case)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sp = new URLSearchParams(window.location.search);
      const refParam = sp.get("ref")?.trim();
      const idParam = sp.get("partnerId")?.trim();
      const param = refParam || idParam;

      if (!param) return;

      setIsLoading(true);

      let p: Partner | null = null;
      // If it looks like a UUID, try fetching by ID, otherwise by slug
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param)) {
        p = await fetchPartnerById(param);
      } else {
        p = await fetchPartnerBySlug(param);
      }

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
      setConfig(mapToPartnerConfig(p));
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
      setConfig(mapToPartnerConfig(p));
      applyPartnerBrandColor(normalizeHexColor(p.brand_color));
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if current user is owner & Load their partner data automatically
  useEffect(() => {
    let cancelled = false;

    const checkAndLoadOwnerPartner = async (userId: string | undefined) => {
      if (!userId) {
        if (!cancelled) setIsOwner(false);
        return;
      }

      const { data: pData, error: pError } = await supabase
        .from("partners")
        .select("*")
        .eq("owner_user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (!pError && pData) {
        setIsOwner(true);
        // Force load this partner as active if no partner is loaded or it's a different one
        if (!partner || partner.id !== pData.id) {
          console.log("[PartnerContext] Owner detected, auto-loading partner config:", pData.name);
          setPartner(pData as unknown as Partner);
          setConfig(mapToPartnerConfig(pData));
          applyPartnerBrandColor(normalizeHexColor(pData.brand_color));
        }
      } else {
        setIsOwner(false);
      }
    };

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled && user) {
        checkAndLoadOwnerPartner(user.id);
      } else if (!cancelled && !user) {
        setIsOwner(false);
      }
    });

    // Listen for auth changes to load partner immediately on login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled) {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          checkAndLoadOwnerPartner(session?.user?.id);
        } else if (event === "SIGNED_OUT") {
          setIsOwner(false);
          // Only clear if it was an owner-loaded partner? 
          // For now, let's keep it simple: if signed out, you aren't an owner.
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [partner]);

  const value = useMemo<PartnerContextValue>(
    () => ({ partner, config, binding, isLoading, isOwner, clearBinding }),
    [partner, config, binding, isLoading, isOwner],
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used within PartnerProvider");
  return ctx;
}

// Non-throwing variant for global widgets that must never blank-screen the app.
export function useOptionalPartner() {
  return useContext(PartnerContext) ?? null;
}
