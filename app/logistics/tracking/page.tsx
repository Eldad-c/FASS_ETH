'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Truck, Navigation, Fuel } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tanker, Trip, TankerStatus } from '@/lib/types'

interface TankerWithTrip extends Tanker {
  active_trip?: Trip & { destination_station?: { name: string; latitude: number; longitude: number } }
}

export default function TrackingPage() {
  const [tankers, setTankers] = useState<TankerWithTrip[]>([])
  const [selectedTanker, setSelectedTanker] = useState<TankerWithTrip | null>(null)

  useEffect(() => {
    fetchData()
    // Set up real-time subscription for tanker location updates
    const supabase = createClient()
    const subscription = supabase
      .channel('tanker_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tankers' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const { data: tankersData } = await supabase
      .from('tankers')
      .select('*, driver:profiles(*)')
      .order('plate_number')

    // Get active trips for in-transit tankers
    const inTransitTankers = (tankersData || []).filter(t => t.status === 'in_transit')
    
    if (inTransitTankers.length > 0) {
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*, destination_station:stations!trips_destination_station_id_fkey(*)')
        .in('tanker_id', inTransitTankers.map(t => t.id))
        .eq('status', 'in_progress')

      const tankersWithTrips = (tankersData || []).map(tanker => ({
        ...tanker,
        active_trip: tripsData?.find(t => t.tanker_id === tanker.id),
      }))

      setTankers(tankersWithTrips)
    } else {
      setTankers(tankersData || [])
    }
  }

  const statusColors: Record<TankerStatus, string> = {
    available: 'bg-green-500',
    in_transit: 'bg-blue-500',
    maintenance: 'bg-yellow-500',
    offline: 'bg-red-500',
  }

  const mapCenter = { lat: 9.0054, lng: 38.7636 }

  const getTankerPosition = (tanker: Tanker) => {
    if (!tanker.current_latitude || !tanker.current_longitude) {
      return null
    }
    const latRange = 0.08
    const lngRange = 0.12
    const normalizedLat = ((tanker.current_latitude - mapCenter.lat + latRange) / (latRange * 2)) * 100
    const normalizedLng = ((tanker.current_longitude - mapCenter.lng + lngRange) / (lngRange * 2)) * 100
    return {
      top: `${Math.max(5, Math.min(90, 100 - normalizedLat))}%`,
      left: `${Math.max(5, Math.min(95, normalizedLng))}%`,
    }
  }

  const inTransitTankers = tankers.filter(t => t.status === 'in_transit')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
        <p className="text-muted-foreground">
          Real-time location tracking of tanker fleet powered by Gebeta Maps
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map View */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] overflow-hidden">
            <CardContent className="p-0 h-full relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50/30 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Grid pattern */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                      linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                  }}
                />

                {/* Map Header */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Live Fleet Tracking</span>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>

                {/* Tanker Markers */}
                {tankers.map((tanker) => {
                  const position = getTankerPosition(tanker)
                  if (!position) return null

                  const isSelected = selectedTanker?.id === tanker.id

                  return (
                    <button
                      key={tanker.id}
                      type="button"
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                        isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                      }`}
                      style={{ top: position.top, left: position.left }}
                      onClick={() => setSelectedTanker(isSelected ? null : tanker)}
                    >
                      <div className={`flex items-center justify-center h-10 w-10 rounded-full border-3 border-white shadow-lg ${statusColors[tanker.status]}`}>
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-card px-1 rounded whitespace-nowrap">
                        {tanker.plate_number}
                      </span>
                    </button>
                  )
                })}

                {/* Selected Tanker Popup */}
                {selectedTanker && getTankerPosition(selectedTanker) && (
                  <div
                    className="absolute z-30 bg-card rounded-xl shadow-2xl border border-border p-4 w-72 transform -translate-x-1/2"
                    style={{
                      top: `calc(${getTankerPosition(selectedTanker)!.top} + 40px)`,
                      left: getTankerPosition(selectedTanker)!.left,
                    }}
                  >
                    <button
                      type="button"
                      className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted flex items-center justify-center"
                      onClick={() => setSelectedTanker(null)}
                    >
                      &times;
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-full ${statusColors[selectedTanker.status]} flex items-center justify-center`}>
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedTanker.plate_number}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedTanker.driver?.full_name || 'No driver'}
                        </p>
                      </div>
                    </div>

                    {selectedTanker.active_trip && (
                      <div className="space-y-2 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-blue-600" />
                          <span>En route to {selectedTanker.active_trip.destination_station?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedTanker.active_trip.quantity_liters.toLocaleString()}L {selectedTanker.active_trip.fuel_type}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
                  <span className="text-xs font-semibold mb-2 block">Tanker Status</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-xs">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-xs">In Transit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span className="text-xs">Maintenance</span>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
                  <span className="text-xs text-muted-foreground">Powered by </span>
                  <span className="text-xs font-semibold text-primary">Gebeta Maps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Deliveries List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Deliveries</CardTitle>
              <CardDescription>{inTransitTankers.length} tankers in transit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inTransitTankers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active deliveries
                </p>
              ) : (
                inTransitTankers.map((tanker) => (
                  <div
                    key={tanker.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTanker?.id === tanker.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTanker(tanker)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-sm">{tanker.plate_number}</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-500/30">
                        In Transit
                      </Badge>
                    </div>
                    {tanker.active_trip && (
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {tanker.active_trip.destination_station?.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Fuel className="h-3 w-3" />
                          {tanker.active_trip.quantity_liters.toLocaleString()}L {tanker.active_trip.fuel_type}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fleet Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Tankers</span>
                  <span className="font-medium">{tankers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Available</span>
                  <span className="font-medium">{tankers.filter(t => t.status === 'available').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">In Transit</span>
                  <span className="font-medium">{inTransitTankers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-600">Maintenance</span>
                  <span className="font-medium">{tankers.filter(t => t.status === 'maintenance').length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
