import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyAuth } from '@/lib/api-helpers'
import { subscriptionSchema, uuidSchema } from '@/lib/validations'
import { z } from 'zod'
import { NextResponse } from 'next/server'

// GET - Fetch user subscriptions
export async function GET() {
  try {
    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        stations (id, name, address)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscriptions: subscriptions || [] })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// POST - Create a subscription
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validationResult = subscriptionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { station_id, fuel_type, notify_on_available, notify_on_low, notify_on_delivery } =
      validationResult.data

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if subscription already exists
    let existingQuery = supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (station_id) {
      existingQuery = existingQuery.eq('station_id', station_id)
    }

    if (fuel_type) {
      existingQuery = existingQuery.eq('fuel_type', fuel_type)
    }

    const { data: existing } = await existingQuery.maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Subscription already exists for this station' }, { status: 409 })
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        station_id: station_id ?? null,
        fuel_type: fuel_type ?? null,
        notify_on_available,
        notify_on_low,
        notify_on_delivery,
        is_active: true,
      })
      .select(`
        *,
        stations (id, name, address)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// DELETE - Remove a subscription
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    // Validate subscription ID
    const validationResult = uuidSchema.safeParse(subscriptionId)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid subscription ID', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('id', subscriptionId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleUnknownError(error)
  }
}

// PATCH - Update a subscription
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const updateSchema = z.object({
      subscriptionId: uuidSchema,
      station_id: uuidSchema.nullable().optional(),
      fuel_type: z.enum(['diesel', 'benzene_95', 'benzene_97']).nullable().optional(),
      notify_on_available: z.boolean().optional(),
      notify_on_low: z.boolean().optional(),
      notify_on_delivery: z.boolean().optional(),
      is_active: z.boolean().optional(),
    })

    const validationResult = updateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { subscriptionId, ...updateData } = validationResult.data

    const supabase = await createClient()

    const { user, error: authError } = await verifyAuth(supabase)
    if (authError || !user) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .select(`
        *,
        station:stations (id, name, address)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    return handleUnknownError(error)
  }
}
