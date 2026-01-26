import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

/**
 * GET /api/analytics/reports/[id]
 * Use Case 5: Get one AnalyticsReport; ?export=1 returns file download (exportReport)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const exportFlag = searchParams.get('export') === '1'

    const supabase = await createClient()
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError ?? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (exportFlag) {
      const filename = `fas-report-${data.report_type}-${new Date(data.generated_at).toISOString().slice(0, 10)}.json`
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json(data)
  } catch (e) {
    return handleUnknownError(e)
  }
}
