/**
 * Email Notification Utilities
 * Handles sending email notifications for alerts
 */

export interface EmailNotificationData {
  to: string
  subject: string
  body: string
  userId?: string
  notificationId?: string
}

/**
 * Queue an email notification to be sent
 * In production, this would integrate with an email service (SendGrid, AWS SES, etc.)
 */
export async function queueEmailNotification(
  supabase: any,
  data: EmailNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('email_notifications').insert({
      user_id: data.userId || null,
      notification_id: data.notificationId || null,
      email_address: data.to,
      subject: data.subject,
      body: data.body,
      status: 'PENDING',
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // In production, trigger email sending service here
    // For now, we just queue it in the database
    // A background job would process these and send emails

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(
  supabase: any,
  userId: string,
  stationName: string,
  fuelType: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()

  if (!profile?.email) return

  await queueEmailNotification(supabase, {
    to: profile.email,
    subject: `Low Stock Alert - ${stationName}`,
    body: `Dear ${profile.name || 'User'},

This is an automated alert from the Fuel Availability System.

Station: ${stationName}
Fuel Type: ${fuelType}
Status: Low Stock

Please update the fuel status or arrange for a delivery.

Thank you,
FASS Team`,
    userId,
  })
}

/**
 * Send delivery delay alert email
 */
export async function sendDeliveryDelayAlert(
  supabase: any,
  userId: string,
  stationName: string,
  expectedArrival: string
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .single()

  if (!profile?.email) return

  await queueEmailNotification(supabase, {
    to: profile.email,
    subject: `Delivery Delay Alert - ${stationName}`,
    body: `Dear ${profile.name || 'User'},

This is an automated alert from the Fuel Availability System.

Station: ${stationName}
Expected Arrival: ${expectedArrival}
Status: Delayed

Please check with the logistics team for updates.

Thank you,
FASS Team`,
    userId,
  })
}
