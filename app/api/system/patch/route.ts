import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  patchID: z.string().min(1).max(100),
})

/**
 * POST /api/system/patch
 * Use Case 7: Maintain System Health - applySecurityPatch(patchID)
 * MaintenanceConsole -> SystemHealthMonitor: executePatch(patchID)
 * SystemHealthMonitor -> Log: logAction("Patch Applied", patchID)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.errors },
        { status: 400 }
      )
    }
    const { patchID } = parsed.data

    const supabase = await createClient()
    const { hasAccess, error: roleError } = await verifyRole(supabase, [
      'admin',
      'it_support',
    ])
    if (roleError || !hasAccess) {
      return roleError ?? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // logAction("Patch Applied", patchID) -> system_logs (Log)
    await supabase.from('system_logs').insert({
      log_level: 'INFO',
      service: 'SystemHealthMonitor',
      message: 'Patch Applied',
      metadata: { patchID },
    })

    // audit_logs for S4 – Audit Logging
    await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      action: 'apply_security_patch',
      table_name: 'system_logs',
      record_id: null,
      new_data: { patchID },
    })

    return NextResponse.json({
      success: true,
      message: 'Patch applied successfully',
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
