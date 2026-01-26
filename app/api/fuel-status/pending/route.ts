import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Verify user has manager or admin role
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

    // Get pending approvals
    // Managers see only their station's pending approvals, admins see all
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('pending_approvals')
      .select(`
        *,
        fuel_status:fuel_status_id (*),
        station:stations (*),
        submitter:profiles!pending_approvals_submitted_by_fkey (*)
      `)
      .eq('status', 'PENDING')
      .order('submitted_at', { ascending: false })

    // If manager, filter by their assigned stations
    if (profile?.role?.toLowerCase() === 'manager') {
      const { data: stations } = await supabase
        .from('stations')
        .select('id')
        .eq('manager_id', user.id)

      const stationIds = stations?.map((s) => s.id) || []
      if (stationIds.length > 0) {
        query = query.in('station_id', stationIds)
      } else {
        // Manager with no stations assigned
        return NextResponse.json({ pendingApprovals: [] })
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      pendingApprovals: data || [],
      count: data?.length || 0,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
