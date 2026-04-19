# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Vite dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run test         # Vitest (single run)
npm run test:watch   # Vitest watch mode
npm run predeploy    # Pre-deployment environment check
```

## Architecture Overview

Real estate budget calculator with multi-language (he/en/fr), multi-currency (ILS/USD/EUR/GBP), and white-label partner support. Built with React 18 + TypeScript + Vite, deployed via Lovable, backend on Supabase.

### Context Provider Hierarchy (App.tsx)

```
QueryClientProvider
  └─ LanguageProvider
       └─ PartnerProvider
            └─ PartnerLanguageApplier (syncs partner's default language)
                 └─ CurrencyProviderWithPartner
                      └─ Routes
```

### Wizard Flow (5 steps)

The main UX is a multi-step wizard (`src/hooks/useBudgetWizard.ts`):
- **Step 0** — Welcome, language/currency selection
- **Step 1** — Personal info (name, phone, email, citizenship flags)
- **Step 2** — Property status & equity
- **Step 3** — Financial info (income, age, DTI)
- **Step 4** — Investment/rental properties
- **Step 5** — Results reveal, lead capture form, report email

Each step component lives in `src/components/Wizard/Steps/Step{N}_*.tsx`.

### Partner/White-Label System

Partners are loaded via URL (`?ref=slug` or `?partnerId=uuid`), persisted in localStorage for 30 days. Each partner has configurable: brand color (injected as CSS variable), logo, slogan (with font customization), regulatory params (DTI, LTV, max age), fee structure, and feature flags.

- `src/contexts/PartnerContext.tsx` — Loads partner, manages binding, detects owner/admin
- `src/types/partnerConfig.ts` — Zod-validated config schema with defaults
- `src/lib/partnerTypes.ts` — Partner type definition
- DB table: `partners` (admin RLS), `partners_public` (public view)

### Translation System

Single-file translations in `src/lib/translations.ts` with 150+ keys. Hebrew is RTL. All UI strings go through the `t` object from `useLanguage()`. When adding translations, update all three language blocks (he, en, fr) and the `Translations` interface.

### Currency System

`src/lib/currencyUtils.ts` is the single source of truth. Calculator always works in ILS internally; display values are converted. Currency is locked after Step 1 to prevent mid-form confusion. Exchange rates stored in Supabase `system_settings` table.

### Calculations

All budget calculations run server-side in the `calculate-budget` Edge Function — the frontend only handles UI and form state. Results include max property value, loan amount, monthly payment, amortization table, and limiting factor diagnosis.

## Supabase Edge Functions

Located in `supabase/functions/`:
- `calculate-budget/` — Core calculation engine
- `send-report-email/` — HTML email with CSV attachment, lead scoring, rate limiting
- `admin-partners/` — Partner CRUD (admin-only)
- `update-exchange-rates/` — Currency rate refresh
- `log-error/` — Client error logging

## Testing

Golden snapshot tests for calculator scenarios:
- `src/lib/__tests__/scenarios.ts` — Test scenario definitions
- `npm run test:snapshot` — Run snapshot tests
- `npm run test:approve` — Approve new golden files
- Golden files stored in `src/lib/__tests__/golden/`

## Key Conventions

- **RTL awareness**: All UI components must handle `isHe` / `language === 'he'` for flex direction, text alignment, icon rotation
- **Partner-aware pages**: When opening links in new tabs (e.g., privacy page), pass `&ref=slug` in URL so PartnerContext can load the correct partner
- **Supabase types**: `src/integrations/supabase/types.ts` is auto-generated — do not edit manually
- **localStorage keys**: `partner_binding_v1`, `budget-buddy-currency`, `budget_buddy_analytics_queue`
- **Form numbers**: Inputs use comma formatting; parse with `parseFormattedNumber()` before calculations
