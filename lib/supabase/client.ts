import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export function createClient() {
  const url = env.supabase.url
  const anonKey = env.supabase.anonKey

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  return createBrowserClient(url, anonKey)
}
