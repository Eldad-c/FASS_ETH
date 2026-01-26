import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { verify2FAToken, verifyBackupCode } from '@/lib/two-factor'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string().length(6),
  useBackupCode: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user has admin or manager role
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

    const body = await request.json()
    const validationResult = verifySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { token, useBackupCode } = validationResult.data

    // Get user's 2FA secret and backup codes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('two_factor_secret, two_factor_backup_codes, two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!profile.two_factor_secret) {
      return NextResponse.json({ error: '2FA not set up. Please set up 2FA first.' }, { status: 400 })
    }

    let isValid = false

    if (useBackupCode) {
      // Verify backup code
      if (!profile.two_factor_backup_codes || profile.two_factor_backup_codes.length === 0) {
        return NextResponse.json({ error: 'No backup codes available' }, { status: 400 })
      }
      isValid = verifyBackupCode(token, profile.two_factor_backup_codes)

      if (isValid) {
        // Remove used backup code
        const updatedCodes = profile.two_factor_backup_codes.filter((code) => code !== token)
        await supabase
          .from('profiles')
          .update({ two_factor_backup_codes: updatedCodes })
          .eq('id', user.id)
      }
    } else {
      // Verify TOTP token
      isValid = verify2FAToken(token, profile.two_factor_secret)
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // If 2FA is not yet enabled, enable it now
    if (!profile.two_factor_enabled) {
      const { error: enableError } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', user.id)

      if (enableError) {
        return NextResponse.json({ error: enableError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: '2FA verified successfully',
      enabled: true,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
