import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch system logs (Admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const component = searchParams.get('component')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (level) {
      query = query.eq('level', level)
    }

    if (component) {
      query = query.eq('component', component)
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
    console.error('Fetch logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a system log entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { level, component, message, metadata } = body

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: log, error } = await supabase
      .from('system_logs')
      .insert({
        level: level || 'info',
        component: component || 'api',
        message,
        metadata: metadata || {},
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Create log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
