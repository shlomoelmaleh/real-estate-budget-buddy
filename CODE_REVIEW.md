# Property Budget Pro: Deep Technical Review & Roadmap

This document summarizes the technical architecture, business logic, and future development opportunities for the Property Budget Pro application.

## 1. Technical Architecture

### Frontend
- **Framework:** React 18 with Vite and TypeScript.
- **UI Components:** Built using **shadcn/ui** and **Tailwind CSS**.
- **Form Handling:** **React Hook Form** with **Zod** schema validation.
- **State Management:** Uses **React Context API** for `LanguageContext` and `PartnerContext` (white-labeling).

### Backend (Supabase)
- **Database:** PostgreSQL with tables for `partners`, `simulations`, and `activity_logs`.
- **Auth:** Supabase Auth with custom `AdminRoute` protection based on hardcoded `ADMIN_EMAIL`.
- **Edge Functions:**
  - `calculate-budget`: Performs complex mortgage affordability calculations (Binary Search solver).
  - `send-report-email`: Dispatches role-based emails via **Resend**.
  - `admin-partners`: Managed partner lifecycle (CRUD operations).

## 2. Core Business Logic: The Budget Solver

The application uses a sophisticated binary search algorithm in the `calculate-budget` edge function to solve for the maximum affordable property price.

### Key Constraints Handled:
- **Equity:** (Price + Closing Costs) - Loan must be <= Available Equity.
- **LTV (Loan to Value):**
  - First Property (Israeli Citizen): 75%
  - Investment/Other: 50%
- **DTI (Debt-to-Income):**
  - Banks recognize **80% of rental income** for investment properties.
  - Banks recognize **0% of rental income** for first-time buyers (per Israeli regulation).
- **Age Factor:** Loan term is capped at `min(30, MaxAge - CurrentAge)`, which dynamically adjusts the monthly payment and borrowing power.

## 3. White-Labeling Strategy

The app is built as a multi-tenant B2B platform:
- **Partner Detection:** `PartnerContext` checks for `?ref=slug` in the URL.
- **Persistence:** Branding is cached in `localStorage` for 30 days.
- **Dynamic Branding:**
  - `brand_color` (Hex) is converted to HSL to override CSS variables (`--primary`).
  - Logos and slogans are dynamically swapped in the `HeroHeader`.
  - Partners are automatically CC'd on lead generation emails.

## 4. Proposed Roadmap for Feature Development

### Phase 1: Lead Management & Dashboard
- **Admin Leads View:** Create a dashboard at `/admin/leads` to track and filter all simulations.
- **Lead Scoring:** Implement a logic to flag "Hot Leads" (e.g., Equity > 1.5M, Income > 25k).

### Phase 2: Enhanced Reporting
- **PDF Generation:** Use a server-side service or `jspdf` to generate a branded PDF report.
- **Comparison Tool:** Allow users to compare two different mortgage scenarios side-by-side.

### Phase 3: Advanced Financial Tools
- **Equity Extraction:** A calculator for existing owners to see how much they can leverage their current home.
- **Refinance Analysis:** Compare current mortgage terms vs. new market rates.

### Phase 4: Partner Self-Service
- **Partner Dashboard:** Allow partners to log in and see their own leads and analytics.
- **Customization Settings:** Enable partners to adjust their own "default" interest rates or yields.
