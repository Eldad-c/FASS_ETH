import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { logLevelSchema, paginationSchema } from '@/lib/validations'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const logsQuerySchema = paginationSchema.extend({
  level: logLevelSchema.optional(),
  component: z.string().max(100).optional(),
})

// GET - Fetch system logs (Admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const component = searchParams.get('component')
    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')

    // Validate query parameters
    const validationResult = logsQuerySchema.safeParse({
      level,
      component,
      limit: limitParam,
      page: pageParam,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { level: validatedLevel, component: validatedComponent, limit, page } =
      validationResult.data
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Verify admin role
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (validatedLevel) {
      query = query.eq('log_level', validatedLevel)
    }

    if (validatedComponent) {
      query = query.eq('service', validatedComponent)
    }

    const { data: logs, count, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// POST - Create a system log entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const logSchema = z.object({
      level: logLevelSchema.default('INFO'),
      component: z.string().min(1).max(100).default('api'),
      message: z.string().min(1).max(1000),
      metadata: z.record(z.unknown()).nullable().optional(),
    })

    const validationResult = logSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { level, component, message, metadata } = validationResult.data

    const supabase = await createClient()

    // Verify admin role
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: log, error } = await supabase
      .from('system_logs')
      .insert({
        log_level: level.toUpperCase(),
        service: component,
        message,
        metadata: metadata || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ log })
  } catch (error) {
    return handleUnknownError(error)
  }
}
