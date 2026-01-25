import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const startTime = Date.now()
    const supabase = await createClient()

    // Check database connectivity
    const { error: dbError } = await supabase.from('stations').select('id').limit(1)
    const dbLatency = Date.now() - startTime

    // Get system stats
    const [
      { count: stationCount },
      { count: userCount },
      { count: tripCount },
      { count: reportCount },
    ] = await Promise.all([
      supabase.from('stations').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('trips').select('*', { count: 'exact', head: true }),
      supabase.from('user_reports').select('*', { count: 'exact', head: true }),
    ])

    // Log system health check
    await supabase.from('system_logs').insert({
      level: 'info',
      component: 'health_check',
      message: 'System health check performed',
      metadata: {
        db_latency_ms: dbLatency,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      status: dbError ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: {
          status: dbError ? 'error' : 'healthy',
          latencyMs: dbLatency,
          error: dbError?.message || null,
        },
        api: {
          status: 'healthy',
        },
        gebetaMaps: {
          status: process.env.NEXT_PUBLIC_GEBETA_MAPS_API_KEY ? 'configured' : 'not_configured',
        },
      },
      stats: {
        stations: stationCount || 0,
        users: userCount || 0,
        trips: tripCount || 0,
        reports: reportCount || 0,
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
