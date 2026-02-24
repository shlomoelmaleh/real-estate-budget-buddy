// ─── CURRENCY UTILITIES — Single Source of Truth ─────────────────────────────
// Used by: src/contexts/CurrencyContext.tsx (frontend)
//          supabase/functions/calculate-budget (Edge Function)
//          supabase/functions/send-report-email (Edge Function)
//
// RULE: The calculator engine ALWAYS works in ILS.
//       Currency is a display/conversion layer only.
//       Edge Function converts outputs → frontend only formats.

// ─── Types ───────────────────────────────────────────────────────────────────

export type SupportedCurrency = 'ILS' | 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface ExchangeRates {
    /** ILS per 1 unit of foreign currency: { USD: 3.68, EUR: 3.97 } */
    rates: Record<string, number>;
    /** ISO timestamp of when rates were fetched */
    fetchedAt: string;
    /** Source of the rates */
    source: 'boi' | 'exchangerate-api' | 'cache';
    /** ISO timestamp — cache valid until this time */
    nextRefreshAfter: string;
}

export interface CurrencyConfig {
    symbol: string;
    name: { he: string; en: string; fr: string };
    /** Position of symbol: 'prefix' ($100) or 'suffix' (100₪) */
    symbolPosition: 'prefix' | 'suffix';
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
    ILS: '₪',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
};

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
    ILS: { symbol: '₪', name: { he: 'שקל חדש', en: 'Israeli Shekel', fr: 'Shekel israélien' }, symbolPosition: 'prefix' },
    USD: { symbol: '$', name: { he: 'דולר אמריקאי', en: 'US Dollar', fr: 'Dollar américain' }, symbolPosition: 'prefix' },
    EUR: { symbol: '€', name: { he: 'אירו', en: 'Euro', fr: 'Euro' }, symbolPosition: 'prefix' },
    GBP: { symbol: '£', name: { he: 'ליש"ט', en: 'British Pound', fr: 'Livre sterling' }, symbolPosition: 'prefix' },
    CAD: { symbol: 'CA$', name: { he: 'דולר קנדי', en: 'Canadian Dollar', fr: 'Dollar canadien' }, symbolPosition: 'prefix' },
};

/** Currencies available in Phase 1 (CAD excluded — Phase 1.5) */
export const PHASE1_CURRENCIES: SupportedCurrency[] = ['ILS', 'USD', 'EUR', 'GBP'];

// ─── Conversion Functions ────────────────────────────────────────────────────

/**
 * Convert an amount FROM a foreign currency TO ILS.
 * Used on inputs before sending to the calculator engine.
 *
 * @example toILS(200_000, 'USD', rates) → 736_000
 */
export function toILS(amount: number, currency: SupportedCurrency, rates: ExchangeRates): number {
    if (currency === 'ILS') return amount;
    const rate = rates.rates[currency];
    if (!rate || rate <= 0) return amount; // Safety: return unchanged if rate unavailable
    return Math.round(amount * rate);
}

/**
 * Convert an amount FROM ILS TO a foreign currency.
 * Used on outputs after the calculator engine returns results.
 *
 * @example fromILS(736_000, 'USD', rates) → 200_000
 */
export function fromILS(amount: number, currency: SupportedCurrency, rates: ExchangeRates): number {
    if (currency === 'ILS') return amount;
    const rate = rates.rates[currency];
    if (!rate || rate <= 0) return amount; // Safety: return unchanged if rate unavailable
    return Math.round(amount / rate);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Format an amount with the correct currency symbol.
 * 0 decimal places for all amounts.
 *
 * @example fmt(570652, 'USD') → '$570,652'
 * @example fmt(2100000, 'ILS') → '₪2,100,000'
 */
export function fmt(amount: number, currency: SupportedCurrency): string {
    const config = CURRENCY_CONFIG[currency];
    const formatted = Math.round(amount).toLocaleString('en-US');
    return `${config.symbol}${formatted}`;
}

/**
 * Format amount with both chosen currency AND ILS secondary.
 * Used in client-facing displays when currency ≠ ILS.
 *
 * @example fmtWithILS(570652, 'USD', 2100000) → '$570,652 (₪2,100,000)'
 */
export function fmtWithILS(
    amount: number,
    currency: SupportedCurrency,
    amountILS: number,
): string {
    if (currency === 'ILS') return fmt(amount, 'ILS');
    return `${fmt(amount, currency)} (${fmt(amountILS, 'ILS')})`;
}

/**
 * Format the exchange rate label for display.
 *
 * @example rateLabel('USD', 3.68, '2026-02-24T07:00:00Z', 'en')
 *          → 'Rate: 3.68 ILS/$ | Updated: 24.2.26'
 */
export function formatRateLabel(
    currency: SupportedCurrency,
    rate: number,
    fetchedAt: string,
    lang: 'he' | 'en' | 'fr' = 'en',
): string {
    if (currency === 'ILS') return '';
    const symbol = CURRENCY_SYMBOLS[currency];
    const date = new Date(fetchedAt);
    const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${String(date.getFullYear()).slice(2)}`;
    const rateStr = rate.toFixed(2);

    if (lang === 'he') return `שער: ${rateStr} ₪/${symbol} | עדכון: ${dateStr}`;
    if (lang === 'fr') return `Taux: ${rateStr} ILS/${symbol} | Mis à jour: ${dateStr}`;
    return `Rate: ${rateStr} ILS/${symbol} | Updated: ${dateStr}`;
}

/**
 * Footer disclaimer for emails — multi-language.
 */
export function getCurrencyDisclaimer(
    currency: SupportedCurrency,
    rate: number,
    fetchedAt: string,
    lang: 'he' | 'en' | 'fr' = 'en',
): string {
    if (currency === 'ILS') return '';
    const rateLabel = formatRateLabel(currency, rate, fetchedAt, lang);

    if (lang === 'he') return `${rateLabel} | המחיר החוקי בישראל הוא בשקלים`;
    if (lang === 'fr') return `${rateLabel} | Le prix légal en Israël est en ILS`;
    return `${rateLabel} | The legal price in Israel is in ILS`;
}

/**
 * Format fixed-ILS amount for display when currency ≠ ILS.
 * Shows converted amount + original ILS amount with explanation.
 *
 * @example fmtFixedILS(9000, 'USD', rates, 'en')
 *          → '$2,446 (₪9,000 — fixed by advisor)'
 */
export function fmtFixedILS(
    amountILS: number,
    currency: SupportedCurrency,
    rates: ExchangeRates,
    lang: 'he' | 'en' | 'fr' = 'en',
): string {
    if (currency === 'ILS') return fmt(amountILS, 'ILS');

    const converted = fromILS(amountILS, currency, rates);
    const fixedLabel = lang === 'he' ? 'קבוע ע"י היועץ'
        : lang === 'fr' ? 'fixé par le conseiller'
            : 'fixed by advisor';

    return `${fmt(converted, currency)} (${fmt(amountILS, 'ILS')} — ${fixedLabel})`;
}
