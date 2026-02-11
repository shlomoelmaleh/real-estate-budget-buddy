import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ErrorPayload {
    error_type: string
    message: string
    stack?: string
    user_agent?: string
    url?: string
    timestamp?: string
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Parse request body
        const payload: ErrorPayload = await req.json()

        // Validate required fields
        if (!payload.error_type || !payload.message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: error_type, message' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Insert error log into activity_logs table
        const { error } = await supabase.from('activity_logs').insert({
            action: 'error',
            details: {
                error_type: payload.error_type,
                message: payload.message,
                stack: payload.stack || null,
                user_agent: payload.user_agent || null,
                url: payload.url || null,
                client_timestamp: payload.timestamp || new Date().toISOString(),
            },
        })

        if (error) {
            console.error('Failed to log error:', error)
            return new Response(
                JSON.stringify({ error: 'Failed to insert log', details: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Error logged successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (err) {
        console.error('Log-error function error:', err)
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
