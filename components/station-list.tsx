'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Droplets, Fuel, Sparkles, Users, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel, FuelType } from '@/lib/types'

interface StationListProps {
  stations: StationWithFuelStatus[]
}

const fuelConfig: Record<FuelType, { label: string; icon: typeof Fuel; color: string }> = {
  petrol: { label: 'Petrol', icon: Fuel, color: 'orange' },
  diesel: { label: 'Diesel', icon: Droplets, color: 'blue' },
  premium: { label: 'Premium', icon: Sparkles, color: 'amber' },
}

const statusConfig: Record<AvailabilityStatus, { label: string; bgColor: string; textColor: string; dotColor: string }> = {
  available: {
    label: 'Available',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-700 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  low: {
    label: 'Low Stock',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-700 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
  out_of_stock: {
    label: 'Out of Stock',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-700 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
}

const queueConfig: Record<QueueLevel, { label: string; color: string }> = {
  none: { label: 'No queue', color: 'text-green-600 dark:text-green-400' },
  short: { label: '< 5 min', color: 'text-green-600 dark:text-green-400' },
  medium: { label: '5-15 min', color: 'text-yellow-600 dark:text-yellow-400' },
  long: { label: '15-30 min', color: 'text-orange-600 dark:text-orange-400' },
  very_long: { label: '> 30 min', color: 'text-red-600 dark:text-red-400' },
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
    .filter(f => f.queue_level && f.status !== 'out_of_stock')
    .map(f => f.queue_level)
  
  if (queueLevels.length === 0) return 'none'
  
  const queueOrder: QueueLevel[] = ['none', 'short', 'medium', 'long', 'very_long']
  const avgIndex = Math.round(
    queueLevels.reduce((acc, q) => acc + queueOrder.indexOf(q || 'none'), 0) / queueLevels.length
  )
  return queueOrder[avgIndex] || 'none'
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

  // Open directions in Google Maps
  const openDirections = (station: StationWithFuelStatus) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${station.latitude},${station.longitude}`
          window.open(url, '_blank')
        },
        () => {
          // Fallback: just show the station location
          const url = `https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`
          window.open(url, '_blank')
        }
      )
    }
  }

  if (filteredStations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Fuel className="h-12 w-12 text-muted-foreground mb-4" />
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
      {filteredStations.map((station) => {
        const overallStatus = getOverallStatus(station)
        const queueLevel = getAverageQueueLevel(station)
        const overallStatusConfig = statusConfig[overallStatus]

        return (
          <Card key={station.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Status indicator */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${overallStatusConfig.bgColor} flex items-center justify-center`}>
                    <div className={`h-3 w-3 rounded-full ${overallStatusConfig.dotColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base mb-1">
                      <span className="text-balance">{station.name}</span>
                    </CardTitle>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <Badge 
                        variant="outline" 
                        className={`${overallStatusConfig.bgColor} ${overallStatusConfig.textColor} border-0 font-medium text-xs`}
                      >
                        {overallStatusConfig.label}
                      </Badge>
                      {queueLevel !== 'none' && (
                        <span className={`flex items-center gap-1 text-xs ${queueConfig[queueLevel].color}`}>
                          <Users className="h-3 w-3" />
                          {queueConfig[queueLevel].label} wait
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => openDirections(station)}
                >
                  <Navigation className="h-4 w-4 mr-1.5" />
                  Directions
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Station Info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{station.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  {station.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <a href={`tel:${station.phone}`} className="hover:text-foreground transition-colors text-xs">
                        {station.phone}
                      </a>
                    </div>
                  )}
                  {station.operating_hours && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs">{station.operating_hours}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fuel Availability Boxes */}
              <div className="border-t border-border pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Fuel Availability
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {station.fuel_status.map((fuel) => {
                    const config = fuelConfig[fuel.fuel_type as FuelType] || fuelConfig.petrol
                    const status = statusConfig[fuel.status]
                    const queue = queueConfig[fuel.queue_level || 'none']
                    const FuelIcon = config.icon

                    return (
                      <div
                        key={fuel.id}
                        className={`relative flex flex-col p-3 rounded-lg border transition-all ${
                          fuel.status === 'available'
                            ? 'bg-green-500/5 border-green-500/20'
                            : fuel.status === 'low'
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-muted/50 border-border opacity-60'
                        }`}
                      >
                        {/* Status dot */}
                        <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${status.dotColor}`} />
                        
                        {/* Fuel Type Header */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <FuelIcon className={`h-4 w-4 ${status.textColor}`} />
                          <span className="text-xs font-semibold text-foreground">
                            {config.label}
                          </span>
                        </div>
                        
                        {/* Status */}
                        <span className={`text-xs font-medium ${status.textColor} mb-1`}>
                          {status.label}
                        </span>
                        
                        {/* Price */}
                        {fuel.price_per_liter && fuel.status !== 'out_of_stock' && (
                          <span className="text-sm font-bold text-foreground">
                            {fuel.price_per_liter.toFixed(2)} ETB
                          </span>
                        )}
                        
                        {/* Queue for available fuels */}
                        {fuel.status !== 'out_of_stock' && fuel.queue_level && fuel.queue_level !== 'none' && (
                          <span className={`text-[10px] mt-1 ${queue.color}`}>
                            {queue.label} queue
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
