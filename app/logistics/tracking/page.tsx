'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Truck, Navigation, Fuel, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { TrackingMap } from '@/components/logistics/tracking-map'
import type { Tanker, Trip, TankerStatus } from '@/lib/types'

interface TankerWithTrip extends Tanker {
  active_trip?: Trip & { destination_station?: { name: string; latitude: number; longitude: number; address?: string } }
  driver?: { full_name?: string }
}

export default function TrackingPage() {
  const [tankers, setTankers] = useState<TankerWithTrip[]>([])
  const [selectedTanker, setSelectedTanker] = useState<TankerWithTrip | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const fetchData = useCallback(async () => {
    setIsRefreshing(true)
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
    setIsRefreshing(false)
  }, [])

  const statusColors: Record<TankerStatus, string> = {
    available: 'bg-green-500',
    in_transit: 'bg-blue-500',
    maintenance: 'bg-yellow-500',
    offline: 'bg-red-500',
  }

  const inTransitTankers = tankers.filter(t => t.status === 'in_transit')

  const handleSelectTanker = useCallback((tanker: TankerWithTrip | null) => {
    setSelectedTanker(tanker)
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Tracking</h1>
          <p className="text-muted-foreground">
            Real-time location tracking of tanker fleet
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Live Tracking Map with Leaflet */}
        <div className="lg:col-span-2">
          <TrackingMap
            tankers={tankers}
            selectedTanker={selectedTanker}
            onSelectTanker={handleSelectTanker}
          />
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
                          {tanker.active_trip.quantity_liters?.toLocaleString() || 0}L {
                          tanker.active_trip.fuel_type === 'diesel' ? 'Diesel'
                          : tanker.active_trip.fuel_type === 'benzene_95' ? 'Benzene 95'
                          : tanker.active_trip.fuel_type === 'benzene_97' ? 'Benzene 97'
                          : tanker.active_trip.fuel_type
                        }
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
