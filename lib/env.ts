/**
 * Environment variable validation
 * Validates all required environment variables at startup
 */

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

const optionalEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GEBETA_MAPS_API_KEY: process.env.NEXT_PUBLIC_GEBETA_MAPS_API_KEY,
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
} as const

export function validateEnv() {
  const missing: string[] = []

  const effectiveSupabaseUrl =
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL || optionalEnvVars.SUPABASE_URL
  const effectiveSupabaseAnonKey =
    requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    optionalEnvVars.SUPABASE_ANON_KEY ||
    optionalEnvVars.SUPABASE_PUBLISHABLE_KEY

  // Check required vars
  if (!effectiveSupabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)')
  }
  if (!effectiveSupabaseAnonKey) {
    missing.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY)'
    )
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  return {
    supabase: {
      url: effectiveSupabaseUrl!,
      anonKey: effectiveSupabaseAnonKey!,
      // Fallback to optional vars if needed
      urlFallback: optionalEnvVars.SUPABASE_URL,
      anonKeyFallback:
        optionalEnvVars.SUPABASE_ANON_KEY || optionalEnvVars.SUPABASE_PUBLISHABLE_KEY,
    },
    gebetaMapsApiKey: optionalEnvVars.NEXT_PUBLIC_GEBETA_MAPS_API_KEY,
    devSupabaseRedirectUrl: optionalEnvVars.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
  }
}

export type Env = ReturnType<typeof validateEnv>

function buildFallbackEnv(): Env {
  const effectiveSupabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const effectiveSupabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''

  return {
    supabase: {
      url: effectiveSupabaseUrl,
      anonKey: effectiveSupabaseAnonKey,
      urlFallback: process.env.SUPABASE_URL,
      anonKeyFallback: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
    },
    gebetaMapsApiKey: process.env.NEXT_PUBLIC_GEBETA_MAPS_API_KEY,
    devSupabaseRedirectUrl: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
  }
}

function buildEnv(): Env {
  try {
    return validateEnv()
  } catch (error) {
    // Never silently misconfigure production.
    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    console.warn(
      'Environment validation warning:',
      error instanceof Error ? error.message : error
    )

    return buildFallbackEnv()
  }
}

/**
 * Validated environment configuration.
 * - In production: throws if required vars are missing.
 * - In development: warns and falls back to best-effort values.
 */
export const env: Env = buildEnv()
