import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { calculateTrustScore, getSourceType } from '@/lib/trust-score'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Only admins and system can trigger trust score updates
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all fuel status records
    const { data: fuelStatuses, error: fetchError } = await supabase
      .from('fuel_status')
      .select(`
        *,
        updated_by_profile:profiles!fuel_status_updated_by_fkey(role)
      `)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Update trust scores
    const updates = (fuelStatuses || []).map(async (fs) => {
      const sourceType = getSourceType(fs.updated_by_profile?.role, false)
      
      // Get verification count from user reports
      const { count: verificationCount } = await supabase
        .from('user_reports')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', fs.station_id)
        .eq('fuel_type', fs.fuel_type)
        .eq('status', 'verified')

      const trustScore = calculateTrustScore({
        lastUpdated: fs.last_updated || fs.updated_at,
        sourceType,
        verificationCount: verificationCount || 0,
      })

      return supabase
        .from('fuel_status')
        .update({ trust_score: trustScore })
        .eq('id', fs.id)
    })

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      message: `Updated trust scores for ${fuelStatuses?.length || 0} fuel status records`,
      count: fuelStatuses?.length || 0,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
