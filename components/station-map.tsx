'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Fuel } from 'lucide-react'
import { useState } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus } from '@/lib/types'

interface StationMapProps {
  stations: StationWithFuelStatus[]
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-500',
  low: 'bg-yellow-500',
  out_of_stock: 'bg-red-500',
}

function getOverallStatus(station: StationWithFuelStatus): AvailabilityStatus {
  const hasAvailable = station.fuel_status.some((f) => f.status === 'available')
  const hasLow = station.fuel_status.some((f) => f.status === 'low')

  if (hasAvailable) return 'available'
  if (hasLow) return 'low'
  return 'out_of_stock'
}

export function StationMap({ stations }: StationMapProps) {
  const searchParams = useSearchParams()
  const fuelFilter = searchParams.get('fuel') || 'all'
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null)

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

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/80 via-muted/50 to-muted/80">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--border) 1px, transparent 1px),
                linear-gradient(to bottom, var(--border) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Map Label */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-border">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Addis Ababa</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-border">
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
                  className={`flex items-center justify-center h-8 w-8 rounded-full border-2 border-card shadow-lg ${statusColors[status]}`}
                >
                  <Fuel className="h-4 w-4 text-card" />
                </div>
              </button>
            )
          })}

          {/* Selected Station Popup */}
          {selectedStation && (
            <div
              className="absolute z-30 bg-card rounded-lg shadow-xl border border-border p-4 w-64 transform -translate-x-1/2"
              style={{
                top: `calc(${getStationPosition(selectedStation).top} + 24px)`,
                left: getStationPosition(selectedStation).left,
              }}
            >
              <button
                type="button"
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedStation(null)}
                aria-label="Close popup"
              >
                &times;
              </button>
              <h3 className="font-semibold text-sm mb-1 pr-4 text-balance">
                {selectedStation.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {selectedStation.address}
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedStation.fuel_status.map((fuel) => (
                  <Badge
                    key={fuel.id}
                    variant="outline"
                    className={`text-xs ${
                      fuel.status === 'available'
                        ? 'bg-green-500/15 text-green-700 border-green-500/30'
                        : fuel.status === 'low'
                          ? 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30'
                          : 'bg-red-500/15 text-red-700 border-red-500/30'
                    }`}
                  >
                    {fuel.fuel_type.charAt(0).toUpperCase() + fuel.fuel_type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
