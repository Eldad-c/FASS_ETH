'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Fuel, Navigation, Clock, Users, X, Locate, Route, Truck } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel } from '@/lib/types'
import type * as L from 'leaflet'
import { formatDistanceToNow } from 'date-fns'

// Existing props and utility functions...

export function StationMap({ stations }: StationMapProps) {
  // ... existing state and hooks

  // ... existing functions

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* ... existing map elements ... */}

        {/* Selected Station Panel */}
        {selectedStation && (
          <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20 bg-card rounded-xl shadow-2xl border border-border p-4">
            {/* ... existing panel header ... */}

            {/* Queue Level */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Queue:</span>
              <span className={`text-xs font-medium ${queueColors[selectedStation.estimated_queue_level || getAverageQueueLevel(selectedStation)]}`}>
                {queueLabels[selectedStation.estimated_queue_level || getAverageQueueLevel(selectedStation)]}
              </span>
            </div>

            {/* Next Delivery ETA */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Next Delivery:</span>
              <span className="text-xs font-medium text-primary">
                {selectedStation.next_delivery_eta 
                  ? `${formatDistanceToNow(new Date(selectedStation.next_delivery_eta), { addSuffix: true })}`
                  : 'No upcoming deliveries'
                }
              </span>
            </div>
            
            {/* ... existing fuel status, actions, and operating hours ... */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
