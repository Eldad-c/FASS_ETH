import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { etaQuerySchema } from '@/lib/validations'
import { NextResponse } from 'next/server'

// Haversine formula to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate ETA based on distance (average speed 40km/h in city)
function calculateETA(distanceKm: number): number {
  const avgSpeedKmH = 40
  return Math.round((distanceKm / avgSpeedKmH) * 60) // Returns minutes
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')
    const tankerId = searchParams.get('tankerId')

    // Validate query parameters
    const validationResult = etaQuerySchema.safeParse({ tripId, tankerId })
    if (!validationResult.success && (tripId || tankerId)) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user has logistics, admin, or driver role
    const { hasAccess, error: roleError } = await verifyRole(supabase, [
      'admin',
      'logistics',
      'driver',
    ])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If specific trip requested
    if (tripId) {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          *,
          tankers (*),
          destination_station:stations!trips_destination_station_id_fkey(*)
        `)
        .eq('id', tripId)
        .single()

      if (error || !trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }

      // Get latest tanker location
      const { data: location } = await supabase
        .from('tanker_locations')
        .select('*')
        .eq('tanker_id', trip.tanker_id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const destinationStation = trip.destination_station as { id: string; name: string; latitude: number; longitude: number } | null

      if (!location || !destinationStation) {
        return NextResponse.json(
          { eta: null, message: 'Location data unavailable' },
          { status: 404 }
        )
      }

      const distance = calculateDistance(
        Number(location.latitude),
        Number(location.longitude),
        Number(destinationStation.latitude),
        Number(destinationStation.longitude)
      )

      const eta = calculateETA(distance)

      // Use Case 6: [ETA < 30 Minutes AND Alert Not Sent] -> create Notification "Tanker Approaching"
      if (eta <= 30) {
        const { data: existing } = await supabase
          .from('tanker_approaching_alerts')
          .select('id')
          .eq('trip_id', trip.id)
          .eq('station_id', trip.destination_station_id)
          .maybeSingle()
        if (!existing) {
          await supabase.from('tanker_approaching_alerts').insert({
            trip_id: trip.id,
            station_id: trip.destination_station_id,
          })
          const { data: staff } = await supabase
            .from('station_staff')
            .select('user_id')
            .eq('station_id', trip.destination_station_id)
          for (const s of staff || []) {
            if (s.user_id) {
              await supabase.from('notifications').insert({
                user_id: s.user_id,
                station_id: trip.destination_station_id,
                title: 'Tanker Approaching',
                message: `Tanker en route to ${destinationStation.name}. ETA ~${eta} minutes.`,
              })
            }
          }
        }
      }

      return NextResponse.json({
        tripId: trip.id,
        tankerId: trip.tanker_id,
        stationId: trip.destination_station_id,
        stationName: destinationStation.name,
        currentLocation: {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
        },
        destination: {
          latitude: Number(destinationStation.latitude),
          longitude: Number(destinationStation.longitude),
        },
        distanceKm: Math.round(distance * 10) / 10,
        etaMinutes: eta,
        estimatedArrival: new Date(Date.now() + eta * 60 * 1000).toISOString(),
      })
    }

    // If tanker ID provided, get all active trips for that tanker
    if (tankerId) {
      const { data: trips } = await supabase
        .from('trips')
        .select(`
          *,
          destination_station:stations!trips_destination_station_id_fkey(*)
        `)
        .eq('tanker_id', tankerId)
        .eq('status', 'in_progress')

      return NextResponse.json({ trips: trips || [] })
    }

    // Return all active trips with ETAs
    const { data: activeTrips } = await supabase
      .from('trips')
      .select(`
        *,
        tankers (*),
        destination_station:stations!trips_destination_station_id_fkey(*)
      `)
      .eq('status', 'in_progress')

    const tripsWithETA = await Promise.all(
      (activeTrips || []).map(async (trip) => {
        const { data: location } = await supabase
          .from('tanker_locations')
          .select('*')
          .eq('tanker_id', trip.tanker_id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const destinationStation = trip.destination_station as { id: string; name: string; latitude: number; longitude: number } | null

        if (!location || !destinationStation) {
          return { ...trip, eta: null, distanceKm: null, etaMinutes: null }
        }

        const distance = calculateDistance(
          Number(location.latitude),
          Number(location.longitude),
          Number(destinationStation.latitude),
          Number(destinationStation.longitude)
        )

        return {
          ...trip,
          currentLocation: {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
          },
          distanceKm: Math.round(distance * 10) / 10,
          etaMinutes: calculateETA(distance),
        }
      })
    )

    return NextResponse.json({ trips: tripsWithETA })
  } catch (error) {
    return handleUnknownError(error)
  }
}
