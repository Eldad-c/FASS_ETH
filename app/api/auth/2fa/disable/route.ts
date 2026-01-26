import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { verify2FAToken } from '@/lib/two-factor'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const disableSchema = z.object({
  token: z.string().length(6),
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
    const validationResult = disableSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { token } = validationResult.data

    // Get user's 2FA secret
    const { data: profile } = await supabase
      .from('profiles')
      .select('two_factor_secret, two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (!profile?.two_factor_enabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
    }

    // Verify token before disabling
    if (!profile.two_factor_secret) {
      return NextResponse.json({ error: '2FA secret not found' }, { status: 400 })
    }

    const isValid = verify2FAToken(token, profile.two_factor_secret)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Disable 2FA
    const { error: disableError } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null,
      })
      .eq('id', user.id)

    if (disableError) {
      return NextResponse.json({ error: disableError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
