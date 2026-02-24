import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { SupportedCurrency, ExchangeRates } from '@/lib/currencyUtils';
import { CURRENCY_SYMBOLS, CURRENCY_CONFIG, PHASE1_CURRENCIES, fmt, fromILS, toILS, formatRateLabel } from '@/lib/currencyUtils';

// ─── Context Interface ───────────────────────────────────────────────────────

interface CurrencyContextType {
    /** Currently selected currency */
    currency: SupportedCurrency;
    /** Set currency (only works when !isLocked) */
    setCurrency: (c: SupportedCurrency) => void;
    /** Exchange rates data (null if not loaded yet) */
    rates: ExchangeRates | null;
    /** Whether rates are currently loading */
    isLoading: boolean;
    /** Whether currency selection is locked (after Step 1 advancement) */
    isLocked: boolean;
    /** Lock currency selection — called when user advances past Step 1 */
    lockCurrency: () => void;
    /** Unlock currency selection — called when user goes back to Step 0/1 */
    unlockCurrency: () => void;

    // ── Convenience helpers ──────────────────────────────────────────────────

    /** Format an amount (already in chosen currency) for display: '$570,652' */
    display: (amount: number) => string;
    /** Convert user input from chosen currency to ILS */
    parseInput: (amount: number) => number;
    /** Current currency symbol: '$' */
    symbol: string;
    /** Rate label: 'Rate: 3.68 ILS/$ | Updated: 24.2.26' */
    rateLabel: string;
    /** Available currencies for the switcher */
    availableCurrencies: SupportedCurrency[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ─── Storage Key ─────────────────────────────────────────────────────────────

const CURRENCY_STORAGE_KEY = 'budget-buddy-currency';

// ─── Provider ────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children, defaultCurrency }: {
    children: React.ReactNode;
    /** Partner's default currency (from config) */
    defaultCurrency?: SupportedCurrency;
}) {
    // Initialize from: localStorage > partner default > 'ILS'
    const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
        try {
            const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as SupportedCurrency | null;
            if (stored && PHASE1_CURRENCIES.includes(stored)) return stored;
        } catch { }
        return defaultCurrency && PHASE1_CURRENCIES.includes(defaultCurrency)
            ? defaultCurrency
            : 'ILS';
    });

    const [rates, setRates] = useState<ExchangeRates | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const fetchedRef = useRef(false);

    // Load exchange rates from Supabase on mount
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        async function loadRates() {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'exchange_rates')
                    .single();

                if (error || !data?.value) {
                    console.warn('[CurrencyContext] Failed to load rates:', error?.message);
                    setIsLoading(false);
                    return;
                }

                setRates(data.value as ExchangeRates);
            } catch (err) {
                console.error('[CurrencyContext] Error loading rates:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadRates();
    }, []);

    // Persist currency to localStorage
    const setCurrency = useCallback((c: SupportedCurrency) => {
        if (isLocked) return; // Cannot change after lock
        if (!PHASE1_CURRENCIES.includes(c)) return;
        setCurrencyState(c);
        try { localStorage.setItem(CURRENCY_STORAGE_KEY, c); } catch { }
    }, [isLocked]);

    const lockCurrency = useCallback(() => setIsLocked(true), []);
    const unlockCurrency = useCallback(() => setIsLocked(false), []);

    // Convenience helpers
    const display = useCallback((amount: number) => fmt(amount, currency), [currency]);

    const parseInput = useCallback((amount: number) => {
        if (!rates) return amount;
        return toILS(amount, currency, rates);
    }, [currency, rates]);

    const symbol = CURRENCY_SYMBOLS[currency];

    const rateLabel = rates && currency !== 'ILS'
        ? formatRateLabel(currency, rates.rates[currency] || 0, rates.fetchedAt)
        : '';

    // If rates not available, only ILS is available
    const availableCurrencies = rates
        ? PHASE1_CURRENCIES
        : (['ILS'] as SupportedCurrency[]);

    const value: CurrencyContextType = {
        currency,
        setCurrency,
        rates,
        isLoading,
        isLocked,
        lockCurrency,
        unlockCurrency,
        display,
        parseInput,
        symbol,
        rateLabel,
        availableCurrencies,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

/** Non-throwing variant for components that may render outside the provider */
export function useOptionalCurrency() {
    return useContext(CurrencyContext) ?? null;
}
