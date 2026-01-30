
# Deal Feasibility Check with Traffic Light Visualization

## Overview
This feature adds an optional "Asking Price" input field to the calculator form and displays a visual Traffic Light component in the **admin and partner email reports only** (never shown to clients). The Traffic Light provides instant deal feasibility assessment based on comparing the target property price against the calculated maximum budget.

## Technical Implementation

### Phase 1: Form & Schema Updates

#### 1.1 Update Form Schema (`src/components/budget/types.ts`)
Add the new optional field to the Zod schema:
```typescript
targetPropertyPrice: z.string().default(''),
```

#### 1.2 Update Translations (`src/lib/translations.ts`)
Add i18n strings for all three languages:

**New keys to add:**
- `targetPropertyPrice` - Label for the input field
- `targetPropertyPriceHelper` - Helper text explaining the field is optional

| Key | HE | EN | FR |
|-----|-----|-----|-----|
| `targetPropertyPrice` | מחיר הנכס המבוקש (אופציונלי) | Asking Price (Optional) | Prix du bien visé (optionnel) |
| `targetPropertyPriceHelper` | אופציונלי: לצורך השוואה מול התקציב המחושב בלבד. | Optional: Only for comparing against your calculated budget. | Optionnel : pour comparer avec votre budget estimé. |

#### 1.3 Update Financial Section (`src/components/budget/FinancialSection.tsx`)
Add a new input field in the Financial Section after the existing equity/income fields:
- Use `FormInput` component with number formatting
- Include icon (e.g., `Target` from lucide-react)
- Show helper text below the input
- Field is NOT required (no error state needed)

#### 1.4 Update BudgetCalculator (`src/components/BudgetCalculator.tsx`)
- Add `targetPropertyPrice: ''` to form `defaultValues`
- Include `targetPropertyPrice` in the `simulationInputs` object sent to the email function
- Pass the value through to `send-report-email` edge function

---

### Phase 2: Backend Schema Updates

#### 2.1 Update Email Request Schema (`supabase/functions/send-report-email/index.ts`)
Extend the Zod `EmailRequestSchema.inputs` to include:
```typescript
targetPropertyPrice: z.string().max(30).optional(),
```

Also update the `ReportEmailRequest` TypeScript interface to include this field.

---

### Phase 3: Traffic Light Logic (Email Rendering)

#### 3.1 Traffic Light Calculation Logic
Inside `generateEmailHtml()`, add the following calculation (only when `targetPropertyPrice` is provided and > 0):

```typescript
const targetPrice = parseNumber(inputs.targetPropertyPrice || '');
const maxBudget = results.maxPropertyValue;

let trafficLightStatus: 'green' | 'orange' | 'red' | null = null;
let gap = 0;
let ratio = 0;

if (targetPrice > 0) {
  gap = maxBudget - targetPrice;
  ratio = maxBudget / targetPrice;
  
  if (ratio >= 1.0) {
    trafficLightStatus = 'green';  // Deal is safe
  } else if (ratio >= 0.90) {
    trafficLightStatus = 'orange'; // Borderline
  } else {
    trafficLightStatus = 'red';    // Gap too high
  }
}
```

#### 3.2 Add i18n Labels for Traffic Light
Add to the `texts` object inside `generateEmailHtml()`:

| Key | HE | EN | FR |
|-----|-----|-----|-----|
| `dealFeasibility` | בדיקת היתכנות עסקה | Deal Feasibility Check | Vérification de faisabilité |
| `askingPrice` | מחיר מבוקש | Asking Price | Prix demandé |
| `maxBudget` | תקציב מקסימלי | Max Budget | Budget maximum |
| `budgetGap` | פער | Gap | Écart |
| `statusGreen` | עסקה טובה | Excellent Fit | Excellente affaire |
| `statusOrange` | גבולי | Borderline | À la limite |
| `statusRed` | פער גבוה | High Gap | Écart élevé |

---

### Phase 4: Traffic Light Visual Component (Email HTML)

#### 4.1 Traffic Light HTML Structure
Create an email-compatible HTML component using inline styles (for Outlook/Gmail compatibility):

```text
┌──────────────────────────────────────────────────────────────┐
│  🚦 Deal Feasibility Check                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────┐                                                │
│   │  ⚫ OFF │  ← Red circle (ON if status = red)             │
│   │  ⚫ OFF │  ← Orange circle (ON if status = orange)       │
│   │  ⚫ OFF │  ← Green circle (ON if status = green)         │
│   └─────────┘                                                │
│                                                              │
│   Status Text: "Excellent Fit / עסקה טובה" (colored)         │
│                                                              │
│   ────────────────────────────────────────────────────────   │
│   Asking Price:     ₪ 2,500,000                              │
│   Max Budget:       ₪ 2,700,000                              │
│   Gap:              +₪ 200,000                               │
└──────────────────────────────────────────────────────────────┘
```

#### 4.2 CSS/Inline Styles Specification

**Container:**
```css
background: #2d3748;
border-radius: 20px;
padding: 12px;
width: fit-content;
```

**Traffic Light Circles (20px × 20px):**
- OFF state: `background: rgba(255,255,255,0.2); border-radius: 50%;`
- ON Red: `background: #ef4444; box-shadow: 0 0 10px #ef4444;`
- ON Orange: `background: #f97316; box-shadow: 0 0 10px #f97316;`
- ON Green: `background: #22c55e; box-shadow: 0 0 10px #22c55e;`

**Status Text Colors:**
- Green: `color: #22c55e;`
- Orange: `color: #f97316;`
- Red: `color: #ef4444;`

#### 4.3 Conditional Rendering
The Traffic Light block is ONLY rendered when:
1. `isAdvisorCopy === true` (Admin or Partner email)
2. `targetPrice > 0` (User provided a target price)

The block is **never** shown if `isAdvisorCopy === false` (Client email).

---

### Phase 5: Database Persistence

The `targetPropertyPrice` field will be stored in the existing `simulations.inputs` JSONB column automatically (no schema migration required), as it's already included in the `inputs` object sent to the edge function.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/budget/types.ts` | Add `targetPropertyPrice` to Zod schema |
| `src/lib/translations.ts` | Add i18n strings for label, helper, and traffic light statuses |
| `src/components/budget/FinancialSection.tsx` | Add new optional input field |
| `src/components/BudgetCalculator.tsx` | Add default value, include in payload |
| `supabase/functions/send-report-email/index.ts` | Add field to schema, add traffic light logic and HTML rendering |

## Safety Guarantees

1. ✅ **Client Privacy**: Traffic Light block wrapped in `isAdvisorCopy` check - clients never see it
2. ✅ **No Logic Changes**: Existing `maxPropertyValue` calculation untouched - traffic light is display-only
3. ✅ **Optional Field**: Empty `targetPropertyPrice` results in no traffic light block (graceful fallback)
4. ✅ **Validation**: Zod schema ensures the field is properly validated before processing
5. ✅ **Backward Compatibility**: Existing simulations without this field continue to work normally

## Deployment Requirements

After implementation:
- Deploy the `send-report-email` edge function
- No database migration needed (data stored in existing JSONB column)
