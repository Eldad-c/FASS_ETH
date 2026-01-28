'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Truck, MapPin, Route, Edit2, X, Save, Phone, Package, Clock } from 'lucide-react'
import type { Tanker, Trip, Station } from '@/lib/types'
import { SAMPLE_TANKERS, SAMPLE_TRIPS, SAMPLE_STATIONS } from '@/lib/sample-data'

interface TankerWithTrip extends Tanker {
  trip?: Trip
  destination_station?: Station
}

export default function LogisticsMapComponent() {
  const [tankers, setTankers] = useState<TankerWithTrip[]>([])
  const [selectedTanker, setSelectedTanker] = useState<TankerWithTrip | null>(null)
  const [editingRoute, setEditingRoute] = useState<string | null>(null)
  const [newDestination, setNewDestination] = useState<string>('')
  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Initialize tankers with trip data
  useEffect(() => {
    const enrichedTankers = SAMPLE_TANKERS.map(tanker => {
      const trip = SAMPLE_TRIPS.find(t => t.tanker_id === tanker.id)
      const destination = trip ? SAMPLE_STATIONS.find(s => s.id === trip.destination_station_id) : undefined
      return { ...tanker, trip, destination_station: destination }
    })
    setTankers(enrichedTankers)
  }, [])

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current || !tankers.length) return

    const initMap = async () => {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (mapRef.current) {
        mapRef.current.remove()
      }

      const map = leaflet.map(mapContainerRef.current!, {
        center: [9.0320, 38.7469],
        zoom: 12,
        zoomControl: true,
      })

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Add station markers (static, light colored)
      SAMPLE_STATIONS.forEach(station => {
        const icon = leaflet.divIcon({
          className: 'station-marker',
          html: `<div class="w-5 h-5 rounded-full bg-blue-300 border-2 border-blue-600 flex items-center justify-center"><span class="text-white text-xs font-bold">S</span></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        leaflet.marker([station.latitude, station.longitude], { icon })
          .addTo(map)
          .bindTooltip(station.name, { permanent: false, direction: 'top' })
      })

      // Add tanker markers (active, colored by status)
      tankers.forEach(tanker => {
        if (tanker.current_latitude && tanker.current_longitude) {
          const statusColor = 
            tanker.status === 'in_transit' ? 'bg-green-500' :
            tanker.status === 'available' ? 'bg-yellow-500' :
            'bg-gray-400'

          const icon = leaflet.divIcon({
            className: 'tanker-marker',
            html: `<div class="w-7 h-7 rounded-full ${statusColor} border-2 border-white shadow-lg flex items-center justify-center"><span class="text-white text-xs font-bold">🚛</span></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })

          const marker = leaflet.marker([tanker.current_latitude, tanker.current_longitude], { icon })
            .addTo(map)
            .on('click', () => setSelectedTanker(tanker))

          marker.bindTooltip(`${tanker.plate_number} - ${tanker.status}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -12]
          })

          // Draw route to destination if in transit
          if (tanker.trip && tanker.trip.status === 'in_progress' && tanker.destination_station) {
            const route = leaflet.polyline(
              [
                [tanker.current_latitude, tanker.current_longitude],
                [tanker.destination_station.latitude, tanker.destination_station.longitude]
              ],
              { color: 'blue', weight: 2, opacity: 0.6, dashArray: '5, 5' }
            ).addTo(map)
          }
        }
      })

      mapRef.current = map
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [tankers])

  const handleSaveRoute = (tankerId: string) => {
    if (!newDestination) return

    const newDestinationStation = SAMPLE_STATIONS.find(s => s.id === newDestination)
    if (!newDestinationStation) return

    setTankers(tankers.map(t => 
      t.id === tankerId && t.trip
        ? {
            ...t,
            trip: { ...t.trip, destination_station_id: newDestination },
            destination_station: newDestinationStation
          }
        : t
    ))

    setEditingRoute(null)
    setNewDestination('')
    setSelectedTanker(tankers.find(t => t.id === tankerId) || null)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'bg-green-500 text-white'
      case 'available':
        return 'bg-yellow-500 text-white'
      case 'maintenance':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatETA = (eta: string | null | undefined) => {
    if (!eta) return 'N/A'
    const date = new Date(eta)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins > 0) return `${diffMins}m`
    return 'Arrived'
  }

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Map Container */}
      <div className="relative flex-1 rounded-lg border border-border overflow-hidden bg-muted">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Fleet Status Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {tankers.filter(t => t.status === 'in_transit').length}
            </div>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {tankers.filter(t => t.status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {tankers.filter(t => t.status === 'maintenance').length}
            </div>
            <p className="text-xs text-muted-foreground">Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {SAMPLE_TRIPS.filter(t => t.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">Active Deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* Selected Tanker Details Panel */}
      {selectedTanker && (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{selectedTanker.plate_number}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTanker(null)
                setEditingRoute(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className={getStatusBadgeVariant(selectedTanker.status)}>
                {selectedTanker.status}
              </Badge>
            </div>

            {/* Capacity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Capacity:</span>
              </div>
              <span className="text-sm">{selectedTanker.capacity_liters.toLocaleString()}L</span>
            </div>

            {/* Current Trip */}
            {selectedTanker.trip ? (
              <>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Current Delivery</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fuel Type:</span>
                      <span className="font-medium capitalize">
                        {selectedTanker.trip.fuel_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{selectedTanker.trip.quantity_liters.toLocaleString()}L</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Destination:</span>
                      </div>
                      <span className="font-medium">{selectedTanker.destination_station?.name || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">ETA:</span>
                      </div>
                      <span className={`font-medium ${formatETA(selectedTanker.trip.estimated_arrival) === 'Arrived' ? 'text-green-600' : ''}`}>
                        {formatETA(selectedTanker.trip.estimated_arrival)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route Editing */}
                {editingRoute === selectedTanker.id ? (
                  <div className="border-t pt-3 space-y-2">
                    <label className="text-sm font-medium block">Change Destination:</label>
                    <select
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    >
                      <option value="">Select a station...</option>
                      {SAMPLE_STATIONS.map(station => (
                        <option key={station.id} value={station.id}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveRoute(selectedTanker.id)}
                        disabled={!newDestination}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Route
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRoute(null)
                          setNewDestination('')
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRoute(selectedTanker.id)}
                    className="w-full gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Route
                  </Button>
                )}
              </>
            ) : (
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">No active delivery</p>
              </div>
            )}

            {/* Last Location Update */}
            <div className="border-t pt-3 text-xs text-muted-foreground">
              Last updated: {new Date(selectedTanker.last_location_update || '').toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>In Transit</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-300" />
              <span>Station</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
