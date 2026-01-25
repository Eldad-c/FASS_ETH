import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()

    // If specific trip requested
    if (tripId) {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          *,
          tankers (*),
          stations (*)
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
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (!location || !trip.stations) {
        return NextResponse.json({ eta: null, message: 'Location data unavailable' })
      }

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        trip.stations.latitude,
        trip.stations.longitude
      )

      const eta = calculateETA(distance)

      return NextResponse.json({
        tripId: trip.id,
        tankerId: trip.tanker_id,
        stationId: trip.station_id,
        stationName: trip.stations.name,
        currentLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        destination: {
          latitude: trip.stations.latitude,
          longitude: trip.stations.longitude,
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
          stations (*)
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
        stations (*)
      `)
      .eq('status', 'in_progress')

    const tripsWithETA = await Promise.all(
      (activeTrips || []).map(async (trip) => {
        const { data: location } = await supabase
          .from('tanker_locations')
          .select('*')
          .eq('tanker_id', trip.tanker_id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        if (!location || !trip.stations) {
          return { ...trip, eta: null }
        }

        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          trip.stations.latitude,
          trip.stations.longitude
        )

        return {
          ...trip,
          currentLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          distanceKm: Math.round(distance * 10) / 10,
          etaMinutes: calculateETA(distance),
        }
      })
    )

    return NextResponse.json({ trips: tripsWithETA })
  } catch (error) {
    console.error('ETA calculation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
