'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import type { StationWithFuelStatus } from '@/lib/types'
import { MapPin, Loader2 } from 'lucide-react'

interface MapLoaderProps {
  stations: StationWithFuelStatus[]
}

export default function MapLoader({ stations }: MapLoaderProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dynamically load Leaflet only on client
    const initMap = async () => {
      if (!mapContainer.current || map.current) return

      try {
        const L = await import('leaflet')
        require('leaflet/dist/leaflet.css')

        // Fix Leaflet icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Initialize map - centered on Addis Ababa
        map.current = L.map(mapContainer.current).setView([9.0320, 38.7469], 12)

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map.current)

        // Add markers for each station
        stations.forEach((station) => {
          if (!station.latitude || !station.longitude) return

          const fuelStatus = station.fuel_status?.[0]
          const statusColor =
            fuelStatus?.status === 'available'
              ? '#22c55e'
              : fuelStatus?.status === 'low'
                ? '#eab308'
                : '#ef4444'

          // Create custom circle marker
          L.circleMarker([station.latitude, station.longitude], {
            radius: 8,
            fillColor: statusColor,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .bindPopup(
              `<div class="p-2 text-sm">
                <p class="font-bold">${station.name}</p>
                <p class="text-xs text-gray-600">${station.address}</p>
                ${
                  fuelStatus
                    ? `<p class="text-xs mt-1">Status: ${fuelStatus.status.replace('_', ' ')}</p>`
                    : ''
                }
              </div>`
            )
            .addTo(map.current)
        })

        // Get user location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              L.circleMarker([latitude, longitude], {
                radius: 6,
                fillColor: '#3b82f6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
              })
                .bindPopup('Your Location')
                .addTo(map.current)
            },
            (error) => {
              console.log('[v0] Geolocation error:', error.message)
            }
          )
        }

        setLoading(false)
      } catch (error) {
        console.error('[v0] Map initialization error:', error)
        setLoading(false)
      }
    }

    initMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [stations])

  if (loading) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg border border-border">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={mapContainer} className="flex-1 rounded-lg border border-border bg-muted" />
      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">Map Legend:</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Fuel Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Out of Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Your Location</span>
          </div>
        </div>
      </div>
    </div>
  )
}
