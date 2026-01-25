import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch user subscriptions
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Fetch subscriptions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a subscription
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stationId, fuelTypes, alertTypes, deliveryMethod } = body

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('station_id', stationId)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Subscription already exists for this station' }, { status: 409 })
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        station_id: stationId,
        fuel_types: fuelTypes || ['petrol', 'diesel', 'premium'],
        alert_types: alertTypes || ['availability', 'low_stock', 'delivery'],
        delivery_method: deliveryMethod || 'in_app',
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
    console.error('Create subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a subscription
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Delete subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a subscription
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionId, fuelTypes, alertTypes, deliveryMethod } = body

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData: Record<string, unknown> = {}
    if (fuelTypes) updateData.fuel_types = fuelTypes
    if (alertTypes) updateData.alert_types = alertTypes
    if (deliveryMethod) updateData.delivery_method = deliveryMethod

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
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
    console.error('Update subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
