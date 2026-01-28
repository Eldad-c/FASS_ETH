'use client'

import type { StationWithFuelStatus } from '@/lib/types'
import { MapPin } from 'lucide-react'

interface MapLoaderProps {
  stations: StationWithFuelStatus[]
}

export default function MapLoader({ stations }: MapLoaderProps) {
  return (
    <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-4">
      <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Map View</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Showing {stations.length} stations
        </p>
        <div className="max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {stations.map((station) => (
              <div key={station.id} className="text-xs bg-background p-2 rounded border border-border">
                <p className="font-medium text-foreground">{station.name}</p>
                <p className="text-muted-foreground">{station.address}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
