import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { mapDatabaseFuelToApp } from '@/lib/fuel-helpers'

const bodySchema = z.object({
  reportType: z.enum(['FUEL_TRENDS', 'USER_ACTIVITY', 'REPORT_STATS']),
  dateRangeStart: z.string().datetime().optional(),
  dateRangeEnd: z.string().datetime().optional(),
})

const PROCESSING_LIMIT_MS = 8000
const LARGE_RANGE_DAYS = 31

/**
 * POST /api/analytics/generate
 * Use Case 5: Generate Reports - generateReport(criteria), historicalData, processData,
 * [Processing < Limit] create AnalyticsReport and return; [Timeout] return "Report will be emailed"
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
    const { reportType, dateRangeStart, dateRangeEnd } = parsed.data

    const supabase = await createClient()
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError ?? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const start = dateRangeStart ? new Date(dateRangeStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = dateRangeEnd ? new Date(dateRangeEnd) : new Date()
    const rangeDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)

    // Estimate processing time: large date range -> simulate timeout
    const estimateTimeout = rangeDays > LARGE_RANGE_DAYS

    if (estimateTimeout) {
      return NextResponse.json({
        timeout: true,
        message: 'Report will be emailed to you',
      })
    }

    const t0 = Date.now()

    let data: Record<string, unknown> = {}

    if (reportType === 'FUEL_TRENDS') {
      const { data: history } = await supabase
        .from('fuel_status_history')
        .select('*')
        .gte('recorded_at', start.toISOString())
        .lte('recorded_at', end.toISOString())

      const byFuel: Record<string, { available: number; low: number; out_of_stock: number }> = {}
      const byDay: Record<string, { available: number; low: number; out_of_stock: number }> = {}
      for (const h of history || []) {
        const ft = mapDatabaseFuelToApp(h.fuel_type) || h.fuel_type
        if (!byFuel[ft]) byFuel[ft] = { available: 0, low: 0, out_of_stock: 0 }
        const s = (h.status as string) || 'available'
        if (s === 'available') byFuel[ft].available++
        else if (s === 'low') byFuel[ft].low++
        else byFuel[ft].out_of_stock++

        const day = new Date(h.recorded_at).toISOString().slice(0, 10)
        if (!byDay[day]) byDay[day] = { available: 0, low: 0, out_of_stock: 0 }
        if (s === 'available') byDay[day].available++
        else if (s === 'low') byDay[day].low++
        else byDay[day].out_of_stock++
      }
      data = { byFuelType: byFuel, byDay }
    } else if (reportType === 'USER_ACTIVITY') {
      const { data: reports } = await supabase
        .from('user_reports')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
      const byStatus: Record<string, number> = {}
      for (const r of reports || []) {
        const s = (r.status as string) || 'OPEN'
        byStatus[s] = (byStatus[s] || 0) + 1
      }
      data = { total: reports?.length || 0, byStatus }
    } else if (reportType === 'REPORT_STATS') {
      const [
        { count: openCount },
        { count: inProgressCount },
        { count: resolvedCount },
        { count: rejectedCount },
      ] = await Promise.all([
        supabase.from('user_reports').select('*', { count: 'exact', head: true }).in('status', ['OPEN', 'pending']),
        supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS'),
        supabase.from('user_reports').select('*', { count: 'exact', head: true }).in('status', ['RESOLVED', 'verified']),
        supabase.from('user_reports').select('*', { count: 'exact', head: true }).in('status', ['REJECTED', 'rejected']),
      ])
      data = {
        OPEN: openCount || 0,
        IN_PROGRESS: inProgressCount || 0,
        RESOLVED: resolvedCount || 0,
        REJECTED: rejectedCount || 0,
      }
    }

    if (Date.now() - t0 > PROCESSING_LIMIT_MS) {
      return NextResponse.json({
        timeout: true,
        message: 'Report will be emailed to you',
      })
    }

    const { data: row, error } = await supabase
      .from('analytics_reports')
      .insert({
        report_type: reportType,
        generated_by: user?.id ?? null,
        data,
        date_range_start: start.toISOString(),
        date_range_end: end.toISOString(),
      })
      .select('id, generated_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      reportID: row.id,
      reportType,
      generatedAt: row.generated_at,
      data,
    })
  } catch (e) {
    return handleUnknownError(e)
  }
}
