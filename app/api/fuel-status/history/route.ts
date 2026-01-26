import { createClient } from '@/lib/supabase/server'
import { handleUnknownError } from '@/lib/api-helpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stationId = searchParams.get('stationId')
    const fuelType = searchParams.get('fuelType')
    const days = parseInt(searchParams.get('days') || '7')

    if (!stationId) {
      return NextResponse.json({ error: 'stationId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get historical data for the last N days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    let query = supabase
      .from('fuel_status_history')
      .select('*')
      .eq('station_id', stationId)
      .gte('recorded_at', cutoffDate.toISOString())
      .order('recorded_at', { ascending: false })

    if (fuelType) {
      query = query.eq('fuel_type', fuelType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by date for easier charting
    const groupedByDate = (data || []).reduce((acc, record) => {
      const date = new Date(record.recorded_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(record)
      return acc
    }, {} as Record<string, typeof data>)

    return NextResponse.json({
      stationId,
      fuelType: fuelType || 'all',
      days,
      totalRecords: data?.length || 0,
      history: data || [],
      groupedByDate,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}
