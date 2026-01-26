import { createClient } from '@/lib/supabase/server'
import { handleUnknownError } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  mode: z.enum(['incorrect', 'crowdsource']),
  stationId: z.string().uuid(),
  // incorrect
  issueType: z.enum(['NO_FUEL', 'INCORRECT_INFO', 'OTHER']).optional(),
  comment: z.string().optional(),
  // crowdsource
  fuel_type: z.string().optional(),
  reported_status: z.string().optional(),
  reported_queue_level: z.string().optional(),
  estimated_wait_time: z.number().nullable().optional(),
})

/**
 * Use Case 4: Report Incorrect Information
 * createReport(stationID, issueType, comment) -> UserReport, Notification "New Issue Reported"
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.errors }, { status: 400 })
    }
    const { mode, stationId, issueType, comment, fuel_type, reported_status, reported_queue_level, estimated_wait_time } = parsed.data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (mode === 'incorrect') {
      if (!issueType) {
        return NextResponse.json({ error: 'issueType required for Report Incorrect Information' }, { status: 400 })
      }
      const { data: report, error: reportErr } = await supabase
        .from('user_reports')
        .insert({
          station_id: stationId,
          user_id: user?.id ?? null,
          report_type: issueType,
          description: comment || '',
          status: 'OPEN',
        })
        .select('id')
        .single()

      if (reportErr) return NextResponse.json({ error: reportErr.message }, { status: 500 })

      const { data: st } = await supabase.from('stations').select('name').eq('id', stationId).single()
      const stationName = (st as { name?: string } | null)?.name || 'Station'

      const { data: staff } = await supabase.from('station_staff').select('user_id').eq('station_id', stationId)
      const msg = `New issue reported for ${stationName}. Type: ${issueType}. ${comment || ''}`
      for (const s of staff || []) {
        if (s.user_id) {
          await supabase.from('notifications').insert({
            user_id: s.user_id,
            title: 'New Issue Reported',
            message: msg,
            station_id: stationId,
          })
        }
      }

      return NextResponse.json({ reportID: report?.id, message: 'Thank you. Your report has been submitted.' })
    }

    // crowdsource
    if (!fuel_type || !reported_status) {
      return NextResponse.json({ error: 'fuel_type and reported_status required for crowdsource' }, { status: 400 })
    }
    const { error: insertErr } = await supabase.from('user_reports').insert({
      station_id: stationId,
      user_id: user?.id ?? null,
      fuel_type,
      reported_status,
      reported_queue_level: reported_queue_level || null,
      estimated_wait_time: estimated_wait_time ?? null,
      description: comment || null,
      report_type: 'OTHER',
      status: 'OPEN',
    })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    return NextResponse.json({ message: 'Thank you. Your report has been submitted.' })
  } catch (e) {
    return handleUnknownError(e)
  }
}
