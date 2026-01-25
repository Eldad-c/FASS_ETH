import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyAuth, verifyRole } from '@/lib/api-helpers'
import { paginationSchema, uuidSchema } from '@/lib/validations'
import { z } from 'zod'
import { NextResponse } from 'next/server'

const notificationQuerySchema = paginationSchema.extend({
  unread: z.coerce.boolean().optional(),
})

// GET - Fetch notifications for current user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const unreadParam = searchParams.get('unread')
    const pageParam = searchParams.get('page')

    // Validate query parameters
    const validationResult = notificationQuerySchema.safeParse({
      limit: limitParam,
      page: pageParam,
      unread: unreadParam,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { limit, page, unread: unreadOnly } = validationResult.data
    const offset = (page - 1) * limit

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Defensive: ensure auth user id is a UUID before using it in filters
    const userIdValidation = uuidSchema.safeParse(user.id)
    if (!userIdValidation.success) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    // Use safer filter approach: get user-specific and broadcast notifications separately
    // This avoids string interpolation in filter strings
    let query = supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userIdValidation.data},user_id.is.null`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Only count unread notifications that belong to the current user.
    // Broadcast notifications (`user_id` null) can't be marked read safely with a single `is_read` field.
    const { count: unreadCount, error: unreadCountError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (unreadCountError) {
      return NextResponse.json({ error: unreadCountError.message }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      page,
      limit,
    })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// POST - Create a notification (Admin/System only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const notificationSchema = z.object({
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      userId: z.string().uuid().nullable().optional(),
      stationId: z.string().uuid().nullable().optional(),
    })

    const validationResult = notificationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { title, message, userId, stationId } = validationResult.data

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId || null, // null = broadcast to all
        station_id: stationId || null,
        title,
        message,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const patchSchema = z.object({
      notificationId: z.string().uuid().optional(),
      markAllRead: z.boolean().optional(),
    })

    const validationResult = patchSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { notificationId, markAllRead } = validationResult.data

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (markAllRead) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleUnknownError(error)
  }
}
