import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { generate2FASecret, generateBackupCodes, get2FAQRCodeURL } from '@/lib/two-factor'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user has admin or manager role (2FA required for these roles)
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin', 'manager'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Generate 2FA secret and backup codes
    const secret = generate2FASecret(profile.email)
    const backupCodes = generateBackupCodes(10)
    const qrCodeURL = get2FAQRCodeURL(secret, profile.email, 'FASS')

    // Store secret and backup codes in database (encrypted in production)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: secret,
        two_factor_backup_codes: backupCodes,
        // Don't enable 2FA yet - user needs to verify first
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      secret,
      qrCodeURL,
      backupCodes, // Show these to user - they won't be shown again
      message: 'Scan the QR code with your authenticator app, then verify to enable 2FA',
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
