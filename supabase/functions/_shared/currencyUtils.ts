// ─── CURRENCY UTILITIES — Deno-compatible copy of src/lib/currencyUtils.ts ───
// This is a verbatim copy for use in Supabase Edge Functions (Deno runtime).
// DO NOT modify independently — keep in sync with src/lib/currencyUtils.ts.

// ─── Types ───────────────────────────────────────────────────────────────────

export type SupportedCurrency = 'ILS' | 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface ExchangeRates {
    rates: Record<string, number>;
    fetchedAt: string;
    source: 'boi' | 'exchangerate-api' | 'cache';
    nextRefreshAfter: string;
}

export interface CurrencyConfig {
    symbol: string;
    name: { he: string; en: string; fr: string };
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

export const PHASE1_CURRENCIES: SupportedCurrency[] = ['ILS', 'USD', 'EUR', 'GBP'];

// ─── Conversion Functions ────────────────────────────────────────────────────

export function toILS(amount: number, currency: SupportedCurrency, rates: ExchangeRates): number {
    if (currency === 'ILS') return amount;
    const rate = rates.rates[currency];
    if (!rate || rate <= 0) return amount;
    return Math.round(amount * rate);
}

export function fromILS(amount: number, currency: SupportedCurrency, rates: ExchangeRates): number {
    if (currency === 'ILS') return amount;
    const rate = rates.rates[currency];
    if (!rate || rate <= 0) return amount;
    return Math.round(amount / rate);
}

// ─── Formatting ──────────────────────────────────────────────────────────────

export function fmt(amount: number, currency: SupportedCurrency): string {
    const config = CURRENCY_CONFIG[currency];
    const formatted = Math.round(amount).toLocaleString('en-US');
    return `${config.symbol}${formatted}`;
}

export function fmtWithILS(
    amount: number,
    currency: SupportedCurrency,
    amountILS: number,
): string {
    if (currency === 'ILS') return fmt(amount, 'ILS');
    return `${fmt(amount, currency)} (${fmt(amountILS, 'ILS')})`;
}

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

export function getCurrencyDisclaimer(
    currency: SupportedCurrency,
    rate: number,
    fetchedAt: string,
    lang: 'he' | 'en' | 'fr' = 'en',
): string {
    if (currency === 'ILS') return '';
    const label = formatRateLabel(currency, rate, fetchedAt, lang);

    if (lang === 'he') return `${label} | המחיר החוקי בישראל הוא בשקלים`;
    if (lang === 'fr') return `${label} | Le prix légal en Israël est en ILS`;
    return `${label} | The legal price in Israel is in ILS`;
}

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
