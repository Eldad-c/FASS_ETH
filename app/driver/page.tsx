'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Fuel,
  MapPin,
  Navigation,
  Phone,
  Clock,
  CheckCircle,
  Truck,
  Play,
  RefreshCw,
  Map,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DeliveryMap } from '@/components/driver/delivery-map'
import type { Trip, Tanker, Station } from '@/lib/types'

interface TripWithDetails extends Trip {
  destination_station?: Station
}

export default function DriverPage() {
  const [profile] = useState({
    full_name: 'Demo Driver',
    email: 'driver@demo.example.com',
  })
  const [tanker, setTanker] = useState<Tanker | null>(null)
  const [currentTrip, setCurrentTrip] = useState<TripWithDetails | null>(null)
  const [upcomingTrips, setUpcomingTrips] = useState<TripWithDetails[]>([])
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null)

  useEffect(() => {
    fetchData()
    // Update location every 30 seconds
    const locationInterval = setInterval(updateLocation, 30000)
    return () => clearInterval(locationInterval)
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    // Get first active tanker for demo
    const { data: tankerData, error: tankerError } = await supabase
      .from('tankers')
      .select('*')
      .eq('status', 'available')
      .limit(1)
      .maybeSingle()

    if (tankerError) {
      console.error('Failed to load tanker:', tankerError)
    }

    setTanker(tankerData)

    if (tankerData) {
      // Get current active trip
      const { data: currentTripData } = await supabase
        .from('trips')
        .select('*, destination_station:stations!trips_destination_station_id_fkey(*)')
        .eq('tanker_id', tankerData.id)
        .eq('status', 'in_progress')
        .maybeSingle()

      setCurrentTrip(currentTripData)

      // Get upcoming trips
      const { data: upcomingData } = await supabase
        .from('trips')
        .select('*, destination_station:stations!trips_destination_station_id_fkey(*)')
        .eq('tanker_id', tankerData.id)
        .eq('status', 'scheduled')
        .order('scheduled_departure', { ascending: true })

      setUpcomingTrips(upcomingData || [])
    }
  }

  const updateLocation = async () => {
    if (!navigator.geolocation) return

    setIsUpdatingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(newLocation)

        if (tanker) {
          const supabase = createClient()
          await supabase
            .from('tankers')
            .update({
              current_latitude: position.coords.latitude,
              current_longitude: position.coords.longitude,
              last_location_update: new Date().toISOString(),
            })
            .eq('id', tanker.id)

          // Also log to location history
          await supabase.from('tanker_locations').insert({
            tanker_id: tanker.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
          })
        }

        setIsUpdatingLocation(false)
        fetchData()
      },
      (error) => {
        console.error('Location error:', error)
        // Default to Addis Ababa if location denied
        setUserLocation({ lat: 9.0054, lng: 38.7636 })
        setIsUpdatingLocation(false)
      }
    )
  }

  // Get initial location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Default to Addis Ababa
          setUserLocation({ lat: 9.0054, lng: 38.7636 })
        }
      )
    }
  }, [])

  const startTrip = async (tripId: string) => {
    const supabase = createClient()

    await supabase
      .from('trips')
      .update({
        status: 'in_progress',
        actual_departure: new Date().toISOString(),
      })
      .eq('id', tripId)

    if (tanker) {
      await supabase
        .from('tankers')
        .update({ status: 'in_transit' })
        .eq('id', tanker.id)
    }

    fetchData()
  }

  const completeTrip = async () => {
    if (!currentTrip) return

    const supabase = createClient()

    await supabase
      .from('trips')
      .update({
        status: 'completed',
        actual_arrival: new Date().toISOString(),
      })
      .eq('id', currentTrip.id)

    // Create delivery record
    const volume = currentTrip.quantity_liters ?? 0
    await supabase.from('deliveries').insert({
      trip_id: currentTrip.id,
      station_id: currentTrip.destination_station_id,
      fuel_type: currentTrip.fuel_type,
      volume_delivered: volume,
      delivery_timestamp: new Date().toISOString(),
      received_by: null,
      signature_confirmed: false,
      notes: null,
      status: 'DELIVERED',
    })

    if (tanker) {
      await supabase
        .from('tankers')
        .update({ status: 'available' })
        .eq('id', tanker.id)
    }

    fetchData()
  }

  const openNavigation = () => {
    if (currentTrip?.destination_station) {
      const { latitude, longitude } = currentTrip.destination_station
      window.open(
        `https://gebeta.app/directions?destination=${latitude},${longitude}`,
        '_blank'
      )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Fuel className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm">TotalEnergiesEthiopia</h1>
              <p className="text-xs text-muted-foreground">Driver App</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Delivery Tracking Map */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Delivery Tracking</h2>
            {routeInfo && (
              <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-600 border-blue-500/30">
                {routeInfo.distance} km - {routeInfo.duration} min
              </Badge>
            )}
          </div>
          <DeliveryMap
            userLocation={userLocation}
            destinationStation={currentTrip?.destination_station || null}
            onRouteCalculated={setRouteInfo}
          />
        </div>

        {/* Driver Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-lg font-bold">
                    {profile.full_name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{profile.full_name || 'Driver'}</p>
                  <p className="text-sm text-muted-foreground">
                    {tanker ? `Tanker: ${tanker.plate_number}` : 'No tanker assigned'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={updateLocation}
                disabled={isUpdatingLocation}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingLocation ? 'animate-spin' : ''}`} />
                Sync
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Trip */}
        {currentTrip ? (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-blue-600" />
                  Active Delivery
                </CardTitle>
                <Badge className="bg-blue-500 text-white">In Progress</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {currentTrip.destination_station?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentTrip.destination_station?.address}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Fuel Type</p>
                    <p className="font-semibold">
                      {currentTrip.fuel_type === 'diesel' ? 'Diesel' 
                        : currentTrip.fuel_type === 'benzene_95' ? 'Benzene 95'
                        : currentTrip.fuel_type === 'benzene_97' ? 'Benzene 97'
                        : currentTrip.fuel_type}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{(currentTrip.quantity_liters ?? 0).toLocaleString()}L</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={openNavigation}>
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                  {currentTrip.destination_station?.phone && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`tel:${currentTrip.destination_station?.phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                onClick={completeTrip}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark Delivery Complete
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-1">No Active Delivery</p>
              <p className="text-sm text-muted-foreground text-center">
                Start a scheduled trip below or wait for dispatch
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scheduled Trips</CardTitle>
            <CardDescription>
              {upcomingTrips.length} upcoming {upcomingTrips.length === 1 ? 'trip' : 'trips'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scheduled trips
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{trip.destination_station?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(trip.quantity_liters ?? 0).toLocaleString()}L {trip.fuel_type}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/15 text-purple-700 border-purple-500/30">
                        Scheduled
                      </Badge>
                    </div>

                    {trip.scheduled_departure && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Scheduled: {new Date(trip.scheduled_departure).toLocaleString()}
                      </p>
                    )}

                    <Button
                      className="w-full bg-transparent"
                      variant="outline"
                      onClick={() => startTrip(trip.id)}
                      disabled={!!currentTrip}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Trip
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tanker Info */}
        {tanker && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Tanker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{tanker.plate_number}</p>
                  <p className="text-sm text-muted-foreground">
                    Capacity: {tanker.capacity_liters.toLocaleString()} Liters
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      tanker.status === 'available'
                        ? 'bg-green-500/15 text-green-700 border-green-500/30'
                        : tanker.status === 'in_transit'
                          ? 'bg-blue-500/15 text-blue-700 border-blue-500/30'
                          : 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30'
                    }
                  >
                    {tanker.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
