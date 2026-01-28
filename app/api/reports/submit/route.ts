import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { station_id, fuel_type, reported_status, description, reporter_email } = body

    if (!station_id || !fuel_type || !reported_status || !reporter_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('fuel_reports')
      .insert({
        station_id,
        fuel_type,
        reported_status,
        description: description || null,
        reporter_email,
        is_verified: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
