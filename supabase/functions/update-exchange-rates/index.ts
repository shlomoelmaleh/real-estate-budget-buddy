/**
 * UPDATE EXCHANGE RATES — Edge Function
 * ======================================
 * Fetches current exchange rates from Bank of Israel (BOI) API,
 * with fallback to exchangerate-api.com, and stores them in system_settings.
 *
 * Triggered by pg_cron: Sun-Thu at 07:00 UTC (09:00 Israel time, after BOI publishes).
 * Can also be called manually for testing.
 *
 * Priority chain:
 *   1. BOI (boi.gov.il) — official, free, SDMX-JSON format
 *   2. exchangerate-api.com — free tier (1,500 req/month)
 *   3. Last known rate from DB (cache) — with stale badge
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Currencies we track (ILS is implicit base = 1.0)
const TARGET_CURRENCIES = ['USD', 'EUR', 'GBP'];

// ─── BOI API (Primary) ──────────────────────────────────────────────────────

interface BOIRates {
    rates: Record<string, number>;
    source: 'boi';
}

async function fetchBOIRates(): Promise<BOIRates | null> {
    try {
        // BOI publishes daily rates — fetch today's
        const today = new Date().toISOString().slice(0, 10);
        const url = `https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI.STATISTICS/EXR/1.0/?startperiod=${today}&endperiod=${today}&format=sdmx-json`;

        console.log('[BOI] Fetching rates from:', url);
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });

        if (!res.ok) {
            console.warn(`[BOI] HTTP ${res.status}: ${res.statusText}`);
            return null;
        }

        const data = await res.json();

        // Parse SDMX-JSON structure
        // The BOI API returns data in a nested structure with series keyed by currency
        const rates: Record<string, number> = {};

        // Try to extract rates from the SDMX-JSON response
        const dataSets = data?.data?.dataSets;
        const structure = data?.data?.structure;

        if (!dataSets || !structure) {
            console.warn('[BOI] Unexpected response structure — missing dataSets or structure');
            // Try simplified BOI XML endpoint as alternative
            return await fetchBOISimple();
        }

        // Extract dimension values (currency codes)
        const dimensions = structure.dimensions?.series;
        if (!dimensions) {
            console.warn('[BOI] Missing dimensions in structure');
            return await fetchBOISimple();
        }

        // Find currency dimension and extract rates
        const series = dataSets[0]?.series;
        if (series) {
            for (const [key, seriesData] of Object.entries(series)) {
                const obs = (seriesData as any)?.observations;
                if (obs) {
                    // Get the latest observation value
                    const latestObs = Object.values(obs).pop() as number[] | undefined;
                    if (latestObs && latestObs[0]) {
                        // Map key index to currency code
                        const keyParts = key.split(':');
                        const currIdx = parseInt(keyParts[0]);
                        const currCode = dimensions[0]?.values?.[currIdx]?.id;

                        if (currCode && TARGET_CURRENCIES.includes(currCode)) {
                            rates[currCode] = latestObs[0];
                        }
                    }
                }
            }
        }

        if (Object.keys(rates).length === 0) {
            console.warn('[BOI] No rates extracted from response');
            return await fetchBOISimple();
        }

        console.log('[BOI] Extracted rates:', rates);
        return { rates, source: 'boi' };
    } catch (err) {
        console.error('[BOI] Fetch error:', err);
        return null;
    }
}

/**
 * Simplified BOI fetch — uses the XML/JSON representative rates endpoint
 */
async function fetchBOISimple(): Promise<BOIRates | null> {
    try {
        // Alternative: BOI representative rates JSON endpoint
        const url = 'https://www.boi.org.il/PublicApi/GetExchangeRates?asXML=false';
        console.log('[BOI-Simple] Trying alternative endpoint:', url);

        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return null;

        const data = await res.json();
        const rates: Record<string, number> = {};

        // BOI returns array of { Key, CurrentExchangeRate, Unit, ... }
        if (Array.isArray(data?.exchangeRates)) {
            for (const entry of data.exchangeRates) {
                const code = entry.key;
                const rate = entry.currentExchangeRate;
                const unit = entry.unit || 1;
                if (code && rate && TARGET_CURRENCIES.includes(code)) {
                    rates[code] = rate / unit; // Normalize to 1 unit
                }
            }
        }

        if (Object.keys(rates).length === 0) return null;
        console.log('[BOI-Simple] Extracted rates:', rates);
        return { rates, source: 'boi' };
    } catch (err) {
        console.error('[BOI-Simple] Fetch error:', err);
        return null;
    }
}

// ─── Fallback: exchangerate-api.com ──────────────────────────────────────────

interface FallbackRates {
    rates: Record<string, number>;
    source: 'exchangerate-api';
}

async function fetchFallbackRates(): Promise<FallbackRates | null> {
    try {
        const url = 'https://api.exchangerate-api.com/v4/latest/ILS';
        console.log('[Fallback] Fetching from exchangerate-api.com');

        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) {
            console.warn(`[Fallback] HTTP ${res.status}`);
            return null;
        }

        const data = await res.json();
        const rates: Record<string, number> = {};

        // API returns ILS-based rates: { rates: { USD: 0.272, EUR: 0.252 } }
        // We need ILS per 1 unit: 1/0.272 = 3.68
        for (const code of TARGET_CURRENCIES) {
            const apiRate = data?.rates?.[code];
            if (apiRate && apiRate > 0) {
                rates[code] = Math.round((1 / apiRate) * 10000) / 10000; // 4 decimal places
            }
        }

        if (Object.keys(rates).length === 0) return null;
        console.log('[Fallback] Converted rates:', rates);
        return { rates, source: 'exchangerate-api' };
    } catch (err) {
        console.error('[Fallback] Fetch error:', err);
        return null;
    }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        );

        // Try BOI first, then fallback
        let result = await fetchBOIRates();
        if (!result) {
            console.log('[Main] BOI failed, trying fallback...');
            result = await fetchFallbackRates() as any;
        }

        if (!result) {
            // Both failed — check for cached rates
            const { data: cached } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'exchange_rates')
                .single();

            if (cached?.value?.rates) {
                console.log('[Main] Using cached rates from:', cached.value.fetchedAt);
                return new Response(
                    JSON.stringify({
                        success: true,
                        source: 'cache',
                        message: 'Both APIs failed. Using cached rates.',
                        rates: cached.value,
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
                );
            }

            return new Response(
                JSON.stringify({ success: false, error: 'All rate sources failed and no cache available.' }),
                { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
            );
        }

        // Calculate next refresh: tomorrow at 07:00 UTC (skip weekends — Fri/Sat)
        const now = new Date();
        const nextRefresh = new Date(now);
        nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 1);
        nextRefresh.setUTCHours(7, 0, 0, 0);

        // If next refresh lands on Friday (5) or Saturday (6), push to Sunday
        const dayOfWeek = nextRefresh.getUTCDay();
        if (dayOfWeek === 5) nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 2); // Fri → Sun
        else if (dayOfWeek === 6) nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 1); // Sat → Sun

        const exchangeRatesValue = {
            rates: result.rates,
            base: 'ILS',
            fetchedAt: now.toISOString(),
            source: result.source,
            nextRefreshAfter: nextRefresh.toISOString(),
        };

        // Upsert to system_settings
        const { error: upsertError } = await supabase
            .from('system_settings')
            .upsert(
                {
                    key: 'exchange_rates',
                    value: exchangeRatesValue,
                    description: 'Exchange rates — ILS per 1 unit of foreign currency. Updated daily by cron.',
                    updated_at: now.toISOString(),
                },
                { onConflict: 'key' },
            );

        if (upsertError) {
            console.error('[Main] Upsert error:', upsertError);
            return new Response(
                JSON.stringify({ success: false, error: 'Failed to save rates', details: upsertError.message }),
                { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
            );
        }

        console.log(`[Main] ✅ Rates updated from ${result.source}:`, result.rates);
        return new Response(
            JSON.stringify({
                success: true,
                source: result.source,
                rates: exchangeRatesValue,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
    } catch (error) {
        console.error('[Main] Unexpected error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
    }
});
