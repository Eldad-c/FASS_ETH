'use client'

if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections gracefully
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    
    // Ignore AbortError from Supabase auth - these are normal and expected
    if (error?.name === 'AbortError' || error?.message?.includes('abort')) {
      console.debug('[v0] Suppressed AbortError - normal Supabase auth behavior')
      event.preventDefault()
      return
    }

    // Log other unhandled rejections
    console.error('[v0] Unhandled promise rejection:', error)
  })

  // Also handle global errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('abort')) {
      console.debug('[v0] Suppressed abort error')
      event.preventDefault()
    }
  })
}

export {}
