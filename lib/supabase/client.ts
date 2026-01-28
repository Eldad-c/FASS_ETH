import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export function createClient() {
  const supabaseUrl = env.supabase.url || env.supabase.urlFallback
  const supabaseAnonKey = env.supabase.anonKey || env.supabase.anonKeyFallback

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
