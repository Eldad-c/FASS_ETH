'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Fuel, Navigation, Clock, Users, X, Locate, Route, Truck } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel, FuelType } from '@/lib/types'
import type * as L from 'leaflet'
import { formatDistanceToNow } from 'date-fns'

interface StationMapProps {
  stations: StationWithFuelStatus[]
}

// Queue level colors for display
const queueColors: Record<QueueLevel, string> = {
  'none': 'text-green-600',
  'short': 'text-blue-600',
  'medium': 'text-yellow-600',
  'long': 'text-orange-600',
  'very_long': 'text-red-600',
}

// Queue level labels for display
const queueLabels: Record<QueueLevel, string> = {
  'none': 'No Queue',
  'short': 'Short (< 5 min)',
  'medium': 'Medium (5-15 min)',
  'long': 'Long (15-30 min)',
  'very_long': 'Very Long (30+ min)',
}

// Status colors for fuel availability
const statusColors: Record<AvailabilityStatus, string> = {
  'available': 'bg-green-500',
  'low': 'bg-yellow-500',
  'out_of_stock': 'bg-red-500',
}

const statusLabels: Record<AvailabilityStatus, string> = {
  'available': 'Available',
  'low': 'Low Stock',
  'out_of_stock': 'Out of Stock',
}

const fuelTypeLabels: Record<FuelType, string> = {
  'diesel': 'Diesel',
  'benzene_95': 'Benzene 95',
  'benzene_97': 'Benzene 97',
}

// Calculate average queue level from fuel status entries
function getAverageQueueLevel(station: StationWithFuelStatus): QueueLevel {
  const levels = station.fuel_status?.map(f => f.queue_level).filter(Boolean) || []
  if (levels.length === 0) return 'none'
  
  // Priority order for queue levels (worst to best)
  const priorityOrder: QueueLevel[] = ['very_long', 'long', 'medium', 'short', 'none']
  
  // Return the worst queue level found
  for (const level of priorityOrder) {
    if (levels.includes(level)) {
      return level
    }
  }
  
  return 'none'
}

// Get best availability status from fuel status entries
function getBestAvailability(station: StationWithFuelStatus): AvailabilityStatus {
  const statuses = station.fuel_status?.map(f => f.status).filter(Boolean) || []
  if (statuses.length === 0) return 'out_of_stock'
  
  if (statuses.includes('available')) return 'available'
  if (statuses.includes('low')) return 'low'
  return 'out_of_stock'
}

export function StationMap({ stations }: StationMapProps) {
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Ethiopia center coordinates (Addis Ababa)
  const defaultCenter: [number, number] = [9.0192, 38.7525]
  const defaultZoom = 12

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return

    const initMap = async () => {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Fix default marker icons
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (mapRef.current) {
        mapRef.current.remove()
      }

      const map = leaflet.map(mapContainerRef.current!, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
      })

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      // Add station markers
      stations.forEach(station => {
        if (station.latitude && station.longitude) {
          const availability = getBestAvailability(station)
          const markerColor = availability === 'available' ? 'green' : 
                              availability === 'low' ? 'orange' : 'red'
          
          const customIcon = leaflet.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${markerColor === 'green' ? '#22c55e' : markerColor === 'orange' ? '#f59e0b' : '#ef4444'};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            "><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h18"/><path d="M6 18v-4a6 6 0 0 1 12 0v4"/><path d="M10 10V5a2 2 0 0 1 4 0v5"/></svg></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = leaflet.marker([station.latitude, station.longitude], { icon: customIcon })
            .addTo(map)
            .on('click', () => setSelectedStation(station))

          marker.bindTooltip(station.name, {
            permanent: false,
            direction: 'top',
            offset: [0, -12]
          })
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
  }, [stations])

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(coords)
        setIsLocating(false)
        
        if (mapRef.current) {
          mapRef.current.setView(coords, 14)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  // Open directions in Google Maps
  const openDirections = (station: StationWithFuelStatus) => {
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${station.latitude},${station.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`
    window.open(url, '_blank')
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Map Container */}
        <div ref={mapContainerRef} className="h-full w-full min-h-[400px]" />

        {/* Location Button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-10 shadow-lg"
          onClick={getUserLocation}
          disabled={isLocating}
          aria-label="Find my location"
        >
          <Locate className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
        </Button>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
          <p className="text-xs font-medium mb-2">Fuel Availability</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-xs">Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs">Out of Stock</span>
            </div>
          </div>
        </div>

        {/* Selected Station Panel */}
        {selectedStation && (
          <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20 bg-card rounded-xl shadow-2xl border border-border p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base leading-tight">{selectedStation.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedStation.address}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 -mt-1"
                onClick={() => setSelectedStation(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Queue Level */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Queue:</span>
              <span className={`text-xs font-medium ${queueColors[getAverageQueueLevel(selectedStation)]}`}>
                {queueLabels[getAverageQueueLevel(selectedStation)]}
              </span>
            </div>

            {/* Next Delivery ETA */}
            {(selectedStation as StationWithFuelStatus & { next_delivery_eta?: string }).next_delivery_eta && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Next Delivery:</span>
                <span className="text-xs font-medium text-primary">
                  {formatDistanceToNow(new Date((selectedStation as StationWithFuelStatus & { next_delivery_eta?: string }).next_delivery_eta!), { addSuffix: true })}
                </span>
              </div>
            )}

            {/* Fuel Status */}
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium flex items-center gap-1">
                <Fuel className="h-3 w-3" />
                Fuel Status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {selectedStation.fuel_status?.map((fuel) => (
                  <div key={fuel.id} className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {fuelTypeLabels[fuel.fuel_type as FuelType] || fuel.fuel_type}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${statusColors[fuel.status as AvailabilityStatus]} text-white`}
                    >
                      {statusLabels[fuel.status as AvailabilityStatus] || fuel.status}
                    </Badge>
                    {fuel.price_per_liter && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {fuel.price_per_liter} ETB/L
                      </p>
                    )}
                  </div>
                )) || (
                  <p className="col-span-3 text-xs text-muted-foreground text-center">No fuel data available</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => openDirections(selectedStation)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Directions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`/stations/${selectedStation.id}`, '_blank')}
              >
                <Route className="h-4 w-4 mr-1" />
                Details
              </Button>
            </div>

            {/* Operating Hours */}
            {selectedStation.operating_hours && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {selectedStation.operating_hours}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
