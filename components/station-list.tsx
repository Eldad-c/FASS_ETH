'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Droplet, Flame, Star } from 'lucide-react'
import type { StationWithFuelStatus } from '@/lib/types'

interface StationListProps {
  stations: StationWithFuelStatus[]
}

const fuelLabels: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  premium: 'Premium',
}

const statusColors: Record<string, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  out_of_stock: 'bg-red-500/15 text-red-700 border-red-500/30',
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  low: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export function StationList({ stations }: StationListProps) {
  const searchParams = useSearchParams()
  const fuelFilter = searchParams.get('fuel') || 'all'

  const filteredStations = stations.filter((station) => {
    if (fuelFilter === 'all') return true
    return station.fuel_status.some(
      (fs) => fs.fuel_type === fuelFilter && fs.status !== 'out_of_stock'
    )
  })

  if (filteredStations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Droplet className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No stations found with the selected fuel type available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''} found
      </p>
      {filteredStations.map((station) => (
        <Card key={station.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-start justify-between gap-2">
              <span className="text-balance">{station.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{station.address}</span>
              </div>
              {station.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{station.phone}</span>
                </div>
              )}
              {station.operating_hours && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{station.operating_hours}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Fuel Availability
              </p>
              <div className="grid grid-cols-3 gap-2">
                {station.fuel_status.map((fuel) => {
                  const FuelIcon = fuel.fuel_type === 'petrol' ? Flame : fuel.fuel_type === 'premium' ? Star : Droplet
                  return (
                    <div
                      key={fuel.id}
                      className="flex flex-col items-center p-2 rounded-lg bg-muted/50"
                    >
                      <FuelIcon className="h-4 w-4 mb-1 text-muted-foreground" />
                      <span className="text-xs font-medium mb-1">
                        {fuelLabels[fuel.fuel_type]}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[fuel.status]}`}
                      >
                        {statusLabels[fuel.status]}
                      </Badge>
                      {fuel.price_per_liter && fuel.status !== 'out_of_stock' && (
                        <span className="text-xs text-muted-foreground mt-1">
                          {fuel.price_per_liter.toFixed(2)} ETB/L
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
