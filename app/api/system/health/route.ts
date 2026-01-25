import { createClient } from '@/lib/supabase/server'
import { handleUnknownError } from '@/lib/api-helpers'
import { logLevelSchema } from '@/lib/validations'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

const systemLogSchema = z.object({
  level: logLevelSchema,
  component: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  metadata: z.record(z.unknown()).nullable().optional(),
})

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

    // Log system health check (non-blocking)
    const logData = {
      level: 'INFO' as const,
      component: 'health_check',
      message: 'System health check performed',
      metadata: {
        db_latency_ms: dbLatency,
        timestamp: new Date().toISOString(),
      },
    }

    const logValidation = systemLogSchema.safeParse(logData)
    if (logValidation.success) {
      // Don't fail health check if logging fails (non-blocking)
      void (async () => {
        try {
          await supabase.from('system_logs').insert(logValidation.data)
        } catch (err: unknown) {
          console.error('Failed to log health check:', err)
        }
      })()
    }

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
          status: env.gebetaMapsApiKey ? 'configured' : 'not_configured',
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
    return handleUnknownError(error)
  }
}
