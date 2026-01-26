import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

/**
 * GET /api/analytics/reports
 * Use Case 5: List generated AnalyticsReports
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError ?? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('analytics_reports')
      .select('id, report_type, generated_at, date_range_start, date_range_end')
      .order('generated_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ reports: data ?? [] })
  } catch (e) {
    return handleUnknownError(e)
  }
}
