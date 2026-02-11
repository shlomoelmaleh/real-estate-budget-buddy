import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Rate limiting: 10 requests per minute per IP
        const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const { data: rateData, error: rateError } = await supabase.rpc('atomic_rate_limit', {
            p_identifier: `ip:${clientIP}`,
            p_endpoint: 'log-error',
            p_max_requests: 10,
            p_window_minutes: 1
        })

        if (rateError) {
            console.error('Rate limit check failed:', rateError)
        } else if (rateData && rateData.length > 0 && !rateData[0].allowed) {
            return new Response(
                JSON.stringify({ error: 'Rate limited' }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Parse and validate request body
        const raw = await req.json()

        const error_type = typeof raw.error_type === 'string' ? raw.error_type.slice(0, 200) : null
        const message = typeof raw.message === 'string' ? raw.message.slice(0, 2000) : null

        if (!error_type || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: error_type, message' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const stack = typeof raw.stack === 'string' ? raw.stack.slice(0, 5000) : null
        const user_agent = typeof raw.user_agent === 'string' ? raw.user_agent.slice(0, 500) : null
        const url = typeof raw.url === 'string' ? raw.url.slice(0, 2000) : null
        const client_timestamp = typeof raw.timestamp === 'string' ? raw.timestamp.slice(0, 50) : new Date().toISOString()

        // Insert error log using correct schema fields
        const { error } = await supabase.from('activity_logs').insert({
            event_type: 'STATUS_CHANGE' as const,
            description: `Client Error: ${error_type}: ${message.slice(0, 200)}`,
            metadata: {
                error_type,
                message,
                stack,
                user_agent,
                url,
                client_timestamp,
            },
        })

        if (error) {
            console.error('Failed to log error:', error)
            return new Response(
                JSON.stringify({ error: 'Failed to insert log' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err) {
        console.error('Log-error function error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})