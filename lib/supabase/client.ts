import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  try {
    // Return cached instance if available
    if (clientInstance) {
      return clientInstance
    }

    const url = env.supabase.url
    const anonKey = env.supabase.anonKey

    if (!url || !anonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.'
      )
    }

    clientInstance = createBrowserClient(url, anonKey)
    return clientInstance
  } catch (err) {
    console.error('[v0] Error creating Supabase client:', err)
    // Return a mock client that won't crash the app
    if (typeof window === 'undefined') {
      throw err
    }
    // On client side, we can try again next time
    clientInstance = null
    throw err
  }
}
