'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Fuel, Navigation, Clock, Users } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel } from '@/lib/types'

interface StationMapProps {
  stations: StationWithFuelStatus[]
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-500',
  low: 'bg-yellow-500',
  out_of_stock: 'bg-red-500',
}

const statusBorderColors: Record<AvailabilityStatus, string> = {
  available: 'border-green-500',
  low: 'border-yellow-500',
  out_of_stock: 'border-red-500',
}

const queueLabels: Record<QueueLevel, string> = {
  none: 'No Queue',
  short: '< 5 min',
  medium: '5-15 min',
  long: '> 15 min',
}

const queueColors: Record<QueueLevel, string> = {
  none: 'text-green-600',
  short: 'text-green-600',
  medium: 'text-yellow-600',
  long: 'text-red-600',
}

function getOverallStatus(station: StationWithFuelStatus): AvailabilityStatus {
  const hasAvailable = station.fuel_status.some((f) => f.status === 'available')
  const hasLow = station.fuel_status.some((f) => f.status === 'low')

  if (hasAvailable) return 'available'
  if (hasLow) return 'low'
  return 'out_of_stock'
}

function getAverageQueueLevel(station: StationWithFuelStatus): QueueLevel {
  const queueLevels = station.fuel_status
    .filter(f => f.queue_level)
    .map(f => f.queue_level)
  
  if (queueLevels.length === 0) return 'none'
  
  const queueOrder: QueueLevel[] = ['none', 'short', 'medium', 'long']
  const avgIndex = Math.round(
    queueLevels.reduce((acc, q) => acc + queueOrder.indexOf(q || 'none'), 0) / queueLevels.length
  )
  return queueOrder[avgIndex] || 'none'
}

export function StationMap({ stations }: StationMapProps) {
  const searchParams = useSearchParams()
  const fuelFilter = searchParams.get('fuel') || 'all'
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Get user location
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
          // Default to Addis Ababa center if location denied
          setUserLocation({ lat: 9.0054, lng: 38.7636 })
        }
      )
    }
  }, [])

  const filteredStations = stations.filter((station) => {
    if (fuelFilter === 'all') return true
    return station.fuel_status.some(
      (fs) => fs.fuel_type === fuelFilter && fs.status !== 'out_of_stock'
    )
  })

  // Addis Ababa center coordinates
  const mapCenter = { lat: 9.0054, lng: 38.7636 }

  // Calculate positions for stations on map
  const getStationPosition = (station: StationWithFuelStatus) => {
    const latRange = 0.08
    const lngRange = 0.12
    const normalizedLat = ((station.latitude - mapCenter.lat + latRange) / (latRange * 2)) * 100
    const normalizedLng = ((station.longitude - mapCenter.lng + lngRange) / (lngRange * 2)) * 100
    return {
      top: `${Math.max(5, Math.min(90, 100 - normalizedLat))}%`,
      left: `${Math.max(5, Math.min(95, normalizedLng))}%`,
    }
  }

  // Open directions in Gebeta Maps
  const openDirections = (station: StationWithFuelStatus) => {
    const apiKey = process.env.NEXT_PUBLIC_GEBETA_MAPS_API_KEY
    if (userLocation && apiKey) {
      window.open(
        `https://gebeta.app/directions?origin=${userLocation.lat},${userLocation.lng}&destination=${station.latitude},${station.longitude}`,
        '_blank'
      )
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Map Background with Gebeta Maps styling */}
        <div 
          ref={mapContainerRef}
          className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50/30 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
        >
          {/* Road grid pattern overlay */}
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
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Addis Ababa, Ethiopia</span>
            </div>
            <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-border">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <span className="text-xs font-semibold text-primary">Gebeta Maps</span>
            </div>
          </div>

          {/* Legend with fuel availability indicators */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
            <span className="text-xs font-semibold text-foreground mb-1">Fuel Availability</span>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-green-600 shadow-sm" />
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500 border-2 border-yellow-600 shadow-sm" />
              <span className="text-xs">Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500 border-2 border-red-600 shadow-sm" />
              <span className="text-xs">Out of Stock</span>
            </div>
          </div>

          {/* Station Count */}
          <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
            <span className="text-sm font-medium">{filteredStations.length}</span>
            <span className="text-xs text-muted-foreground ml-1">stations</span>
          </div>

          {/* User Location Marker */}
          {userLocation && (
            <div
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                top: `${Math.max(5, Math.min(90, 100 - ((userLocation.lat - mapCenter.lat + 0.08) / 0.16) * 100))}%`,
                left: `${Math.max(5, Math.min(95, ((userLocation.lng - mapCenter.lng + 0.12) / 0.24) * 100))}%`,
              }}
            >
              <div className="relative">
                <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
                <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping" />
              </div>
            </div>
          )}

          {/* Station Markers */}
          {filteredStations.map((station) => {
            const position = getStationPosition(station)
            const status = getOverallStatus(station)
            const isSelected = selectedStation?.id === station.id

            return (
              <button
                key={station.id}
                type="button"
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
                  isSelected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                }`}
                style={{ top: position.top, left: position.left }}
                onClick={() => setSelectedStation(isSelected ? null : station)}
                aria-label={`View ${station.name}`}
              >
                <div
                  className={`flex items-center justify-center h-10 w-10 rounded-full border-3 border-white shadow-lg ${statusColors[status]} transition-transform`}
                >
                  <Fuel className="h-5 w-5 text-white" />
                </div>
                {isSelected && (
                  <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent ${statusBorderColors[status].replace('border-', 'border-t-')}`} />
                )}
              </button>
            )
          })}

          {/* Selected Station Popup */}
          {selectedStation && (
            <div
              className="absolute z-30 bg-card rounded-xl shadow-2xl border border-border p-4 w-72 transform -translate-x-1/2"
              style={{
                top: `calc(${getStationPosition(selectedStation).top} + 32px)`,
                left: getStationPosition(selectedStation).left,
              }}
            >
              <button
                type="button"
                className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedStation(null)}
                aria-label="Close popup"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
              
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full ${statusColors[getOverallStatus(selectedStation)]}`}>
                  <Fuel className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5 pr-6 text-balance">
                    {selectedStation.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedStation.address}
                  </p>
                </div>
              </div>

              {/* Queue Level Indicator */}
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Queue:</span>
                <span className={`text-xs font-medium ${queueColors[getAverageQueueLevel(selectedStation)]}`}>
                  {queueLabels[getAverageQueueLevel(selectedStation)]}
                </span>
              </div>
              
              {/* Fuel Status Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedStation.fuel_status.map((fuel) => (
                  <Badge
                    key={fuel.id}
                    variant="outline"
                    className={`text-xs px-2 py-1 ${
                      fuel.status === 'available'
                        ? 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400'
                        : fuel.status === 'low'
                          ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400'
                          : 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400'
                    }`}
                  >
                    {fuel.fuel_type.charAt(0).toUpperCase() + fuel.fuel_type.slice(1)}
                    {fuel.price_per_liter && (
                      <span className="ml-1 opacity-75">
                        {fuel.price_per_liter} ETB
                      </span>
                    )}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openDirections(selectedStation)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </button>
                {selectedStation.phone && (
                  <a
                    href={`tel:${selectedStation.phone}`}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    Call
                  </a>
                )}
              </div>

              {/* Operating Hours */}
              {selectedStation.operating_hours && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {selectedStation.operating_hours}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
