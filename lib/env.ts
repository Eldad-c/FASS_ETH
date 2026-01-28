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
    devSupabaseRedirectUrl: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
  }
}

function buildEnv(): Env {
  try {
    return validateEnv()
  } catch (error) {
    // During Next.js build phase, allow build to proceed even if env vars are missing
    // This prevents build failures when env vars aren't set yet
    // Runtime validation will occur when the app actually runs
    const isBuildTime = 
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-development-build' ||
      (typeof window === 'undefined' && process.env.NEXT_RUNTIME === undefined && !process.env.VERCEL_ENV)
    
    if (isBuildTime) {
      console.warn(
        '[BUILD] Environment validation warning:',
        error instanceof Error ? error.message : error,
        '\nBuild will continue. Ensure environment variables are set in your deployment platform.'
      )
      return buildFallbackEnv()
    }

    // At runtime in production (Vercel, etc.), fail fast if env vars are missing
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) {
      throw error
    }

    // In development, warn but allow to proceed
    console.warn(
      'Environment validation warning:',
      error instanceof Error ? error.message : error
    )

    return buildFallbackEnv()
  }
}

/**
 * Validated environment configuration.
 * - During build: allows build to proceed even if env vars are missing
 * - At runtime in production: throws if required vars are missing
 * - In development: warns and falls back to best-effort values
 */
export const env: Env = buildEnv()
