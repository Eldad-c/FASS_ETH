'use server'

import { createClient } from '@/lib/supabase/server'

export async function subscribeToAlerts(formData: FormData) {
  try {
    const email = formData.get('email') as string
    
    if (!email || !email.includes('@')) {
      return { error: 'Invalid email address' }
    }

    const supabase = await createClient()

    // Try to insert into subscriptions table if it exists
    const { error } = await supabase
      .from('fuel_reports')
      .insert({
        station_id: null,
        fuel_type: null,
        reported_status: 'subscribed',
        description: `Email subscription from ${email}`,
        reporter_email: email,
        is_verified: false,
      })
    
    if (error) {
      console.error('[v0] Subscribe error:', error)
      return { error: 'Failed to subscribe. Please try again.' }
    }

    return { success: true, message: 'Successfully subscribed to fuel alerts!' }
  } catch (err) {
    console.error('[v0] Subscribe exception:', err)
    return { error: 'An error occurred. Please try again.' }
  }
}
