'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Fuel, Navigation, X, Locate, Route } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus, FuelType } from '@/lib/types'

interface StationMapProps {
  stations: StationWithFuelStatus[]
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

// Get best availability status from fuel status entries
function getBestAvailability(station: StationWithFuelStatus): AvailabilityStatus {
  const statuses = station.fuel_status?.map(f => f.status).filter(Boolean) || []
  if (statuses.length === 0) return 'out_of_stock'
  
  if (statuses.includes('available')) return 'available'
  if (statuses.includes('low')) return 'low'
  return 'out_of_stock'
}

export default function MapLoader({ stations }: StationMapProps) {
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const mapRef = useRef<any>(null)
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
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Add station markers
      stations.forEach(station => {
        if (station.latitude && station.longitude) {
          const availability = getBestAvailability(station)
          const markerColor = availability === 'available' ? 'green' : 
            availability === 'low' ? 'orange' : 'red'
          
          const customIcon = leaflet.divIcon({
            className: 'custom-marker',
            html: `<div class="w-6 h-6 rounded-full ${statusColors[availability]} border-2 border-white shadow-lg flex items-center justify-center"><span class="text-white text-xs font-bold">•</span></div>`,
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
        console.error('[v0] Error getting location:', error)
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
    <div className="w-full h-full flex flex-col gap-4">
      {/* Map Container */}
      <div className="relative flex-1 rounded-lg border border-border overflow-hidden bg-muted">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Location Button */}
        <Button
          onClick={getUserLocation}
          disabled={isLocating}
          size="sm"
          className="absolute bottom-4 right-4 z-10 gap-2"
        >
          <Locate className="h-4 w-4" />
          {isLocating ? 'Locating...' : 'My Location'}
        </Button>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="h-4 w-4" />
            <span className="font-medium text-sm">Fuel Availability</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs">Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs">Out of Stock</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Station Panel */}
      {selectedStation && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{selectedStation.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedStation.address}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStation(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Fuel Status */}
            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium">Fuel Status</p>
              {selectedStation.fuel_status?.map((fuel) => (
                <div key={fuel.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{fuelTypeLabels[fuel.fuel_type as FuelType]}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {statusLabels[fuel.status as AvailabilityStatus]}
                    </Badge>
                  </div>
                  {fuel.price_per_liter && (
                    <p className="text-sm font-semibold">{fuel.price_per_liter.toFixed(2)} ETB/L</p>
                  )}
                </div>
              )) || (
                <p className="text-xs text-muted-foreground">No fuel data available</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDirections(selectedStation)}
                className="flex-1 gap-2"
              >
                <Route className="h-4 w-4" />
                Directions
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(`/stations/${selectedStation.id}`, '_blank')}
                className="flex-1"
              >
                Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
