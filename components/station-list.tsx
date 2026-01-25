'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Droplet, Flame, Star, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel } from '@/lib/types'

interface StationListProps {
  stations: StationWithFuelStatus[]
}

const fuelLabels: Record<string, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  premium: 'Premium',
}

const statusColors: Record<string, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400',
  low: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
  out_of_stock: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  available: 'Available',
  low: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

const statusIndicators: Record<AvailabilityStatus, { color: string; icon: typeof TrendingUp }> = {
  available: { color: 'bg-green-500', icon: TrendingUp },
  low: { color: 'bg-yellow-500', icon: TrendingDown },
  out_of_stock: { color: 'bg-red-500', icon: Minus },
}

const queueLabels: Record<QueueLevel, string> = {
  none: 'No Queue',
  short: '< 5 min wait',
  medium: '5-15 min wait',
  long: '> 15 min wait',
}

const queueColors: Record<QueueLevel, string> = {
  none: 'text-green-600 dark:text-green-400',
  short: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  long: 'text-red-600 dark:text-red-400',
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
      {filteredStations.map((station) => {
        const overallStatus = getOverallStatus(station)
        const queueLevel = getAverageQueueLevel(station)
        const StatusIndicator = statusIndicators[overallStatus]

        return (
          <Card key={station.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {/* Overall Status Indicator */}
                <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${StatusIndicator.color} flex items-center justify-center shadow-sm`}>
                  <Fuel className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-1">
                    <span className="text-balance">{station.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge 
                      variant="outline" 
                      className={`${statusColors[overallStatus]} font-medium`}
                    >
                      {statusLabels[overallStatus]}
                    </Badge>
                    <div className={`flex items-center gap-1 ${queueColors[queueLevel]}`}>
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{queueLabels[queueLevel]}</span>
                    </div>
                  </div>
                </div>
              </div>
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
                    <a href={`tel:${station.phone}`} className="hover:text-foreground transition-colors">
                      {station.phone}
                    </a>
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
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Fuel Availability
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {station.fuel_status.map((fuel) => {
                    const FuelIcon = fuel.fuel_type === 'petrol' ? Flame : fuel.fuel_type === 'premium' ? Star : Droplet
                    return (
                      <div
                        key={fuel.id}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${
                          fuel.status === 'available'
                            ? 'bg-green-500/5 border-green-500/30'
                            : fuel.status === 'low'
                              ? 'bg-yellow-500/5 border-yellow-500/30'
                              : 'bg-red-500/5 border-red-500/30'
                        }`}
                      >
                        {/* Status dot indicator */}
                        <div className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full ${
                          fuel.status === 'available'
                            ? 'bg-green-500'
                            : fuel.status === 'low'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`} />
                        
                        <FuelIcon className={`h-5 w-5 mb-1.5 ${
                          fuel.status === 'available'
                            ? 'text-green-600 dark:text-green-400'
                            : fuel.status === 'low'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`} />
                        <span className="text-xs font-semibold mb-1">
                          {fuelLabels[fuel.fuel_type]}
                        </span>
                        <span className={`text-xs ${
                          fuel.status === 'available'
                            ? 'text-green-700 dark:text-green-400'
                            : fuel.status === 'low'
                              ? 'text-yellow-700 dark:text-yellow-400'
                              : 'text-red-700 dark:text-red-400'
                        }`}>
                          {statusLabels[fuel.status]}
                        </span>
                        {fuel.price_per_liter && fuel.status !== 'out_of_stock' && (
                          <span className="text-xs font-medium text-foreground mt-1">
                            {fuel.price_per_liter.toFixed(2)} ETB
                          </span>
                        )}
                        {fuel.queue_level && fuel.queue_level !== 'none' && (
                          <span className={`text-xs mt-1 ${queueColors[fuel.queue_level]}`}>
                            {queueLabels[fuel.queue_level]}
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

// Fuel icon import for the status indicator
function Fuel({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </svg>
  )
}
