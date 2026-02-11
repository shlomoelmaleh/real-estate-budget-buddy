#!/usr/bin/env tsx

/**
 * Environment Verification Script
 * Validates required environment variables before deployment
 * Prevents deployment with incomplete configuration
 */

const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'RESEND_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
] as const

let hasErrors = false

console.log('🔍 Verifying environment variables...\n')

for (const envVar of requiredEnvVars) {
    const value = process.env[envVar]

    if (!value) {
        console.error(`❌ Missing required environment variable: ${envVar}`)
        hasErrors = true
    } else {
        // Show first 10 chars for security
        const preview = value.substring(0, 10) + '...'
        console.log(`✅ ${envVar}: ${preview}`)
    }
}

console.log()

if (hasErrors) {
    console.error('❌ Environment verification failed!')
    console.error('Please set all required environment variables before deploying.')
    process.exit(1)
} else {
    console.log('✅ All required environment variables are set.')
    console.log('Proceeding with deployment...\n')
    process.exit(0)
}
