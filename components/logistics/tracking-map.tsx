'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Locate, Truck, MapPin, Clock, Fuel, Navigation, X, Route } from 'lucide-react'
import type { Tanker, Trip, TankerStatus } from '@/lib/types'
import type * as L from 'leaflet'

interface TankerWithTrip extends Tanker {
  active_trip?: Trip & { destination_station?: { name: string; latitude: number; longitude: number; address?: string } }
}

interface TrackingMapProps {
  tankers: TankerWithTrip[]
  selectedTanker: TankerWithTrip | null
  onSelectTanker: (tanker: TankerWithTrip | null) => void
}

const statusColors: Record<TankerStatus, string> = {
  available: '#22c55e',
  in_transit: '#3b82f6',
  maintenance: '#eab308',
  offline: '#ef4444',
}

const statusLabels: Record<TankerStatus, string> = {
  available: 'Available',
  in_transit: 'In Transit',
  maintenance: 'Maintenance',
  offline: 'Offline',
}

export function TrackingMap({ tankers, selectedTanker, onSelectTanker }: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const routeLayersRef = useRef<Map<string, L.Polyline>>(new Map())
  const destinationMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      
      // Add Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }

      // Addis Ababa center
      const center: [number, number] = [9.0054, 38.7636]

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom: 12,
        zoomControl: false,
      })

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      mapRef.current = map
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update tanker markers
  useEffect(() => {
    if (!mapRef.current) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()

      // Create truck icon function
      const createTruckIcon = (status: TankerStatus, isSelected: boolean) => {
        const color = statusColors[status]
        const size = isSelected ? 48 : 40
        return L.divIcon({
          className: 'tanker-marker',
          html: `
            <div style="
              width: ${size}px;
              height: ${size}px;
              background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
              border: 3px solid white;
              border-radius: 12px;
              box-shadow: 0 4px 12px ${color}66;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
              transition: transform 0.2s;
            ">
              <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 17h4V5H2v12h3"/>
                <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/>
                <circle cx="7.5" cy="17.5" r="2.5"/>
                <circle cx="17.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        })
      }

      // Add markers for each tanker with location
      tankers.forEach(tanker => {
        if (!tanker.current_latitude || !tanker.current_longitude) return

        const isSelected = selectedTanker?.id === tanker.id
        const marker = L.marker(
          [tanker.current_latitude, tanker.current_longitude],
          { icon: createTruckIcon(tanker.status, isSelected), zIndexOffset: isSelected ? 1000 : 0 }
        )

        marker.on('click', () => {
          onSelectTanker(isSelected ? null : tanker)
        })

        marker.bindTooltip(tanker.plate_number, {
          permanent: false,
          direction: 'bottom',
          offset: [0, 10],
        })

        marker.addTo(mapRef.current!)
        markersRef.current.set(tanker.id, marker)
      })
    }

    updateMarkers()
  }, [tankers, selectedTanker, onSelectTanker])

  // Show route for selected tanker
  const showRoute = useCallback(async (tanker: TankerWithTrip) => {
    if (!mapRef.current || !tanker.active_trip?.destination_station) return
    if (!tanker.current_latitude || !tanker.current_longitude) return

    const L = (await import('leaflet')).default
    const destination = tanker.active_trip.destination_station

    // Clear existing route for this tanker
    routeLayersRef.current.get(tanker.id)?.remove()
    destinationMarkersRef.current.get(tanker.id)?.remove()

    // Add destination marker
    const stationIcon = L.divIcon({
      className: 'station-destination-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 22h12M4 9h10M4 9l2-4h6l2 4M6 22V9M12 22V9"/>
            <path d="M19 17V9.5a2.5 2.5 0 0 0-5 0v.5"/>
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    const destMarker = L.marker([destination.latitude, destination.longitude], { icon: stationIcon })
    destMarker.bindPopup(`<b>${destination.name}</b><br>${destination.address || ''}`)
    destMarker.addTo(mapRef.current!)
    destinationMarkersRef.current.set(tanker.id, destMarker)

    try {
      // Fetch route from OSRM
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${tanker.current_longitude},${tanker.current_latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        )

        const routeLine = L.polyline(coordinates, {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.8,
          dashArray: '10, 10',
          lineCap: 'round',
          lineJoin: 'round',
        })

        routeLine.addTo(mapRef.current!)
        routeLayersRef.current.set(tanker.id, routeLine)

        // Fit bounds to show route
        const bounds = L.latLngBounds([
          [tanker.current_latitude, tanker.current_longitude],
          [destination.latitude, destination.longitude],
        ])
        mapRef.current!.fitBounds(bounds, { padding: [80, 80] })

        // Calculate route info
        setRouteInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(data.routes[0].duration / 60),
        })
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }, [])

  // Clear routes when selection changes
  const clearRoutes = useCallback(() => {
    routeLayersRef.current.forEach(route => route.remove())
    routeLayersRef.current.clear()
    destinationMarkersRef.current.forEach(marker => marker.remove())
    destinationMarkersRef.current.clear()
    setRouteInfo(null)
  }, [])

  // Show route when tanker is selected
  useEffect(() => {
    if (selectedTanker && selectedTanker.status === 'in_transit' && selectedTanker.active_trip) {
      showRoute(selectedTanker)
    } else {
      clearRoutes()
    }
  }, [selectedTanker, showRoute, clearRoutes])

  // Fit all tankers
  const fitAllTankers = useCallback(async () => {
    if (!mapRef.current) return

    const tankersWithLocation = tankers.filter(t => t.current_latitude && t.current_longitude)
    if (tankersWithLocation.length === 0) return

    const L = (await import('leaflet')).default
    const bounds = L.latLngBounds(
      tankersWithLocation.map(t => [t.current_latitude!, t.current_longitude!] as [number, number])
    )
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })
  }, [tankers])

  return (
    <Card className="h-[600px] overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Live Fleet Tracking</span>
          <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-card/95 backdrop-blur-sm shadow-md"
            onClick={fitAllTankers}
            title="Show all tankers"
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>

        {/* Route Info Banner */}
        {routeInfo && selectedTanker && (
          <div className="absolute top-16 left-4 right-4 z-10 bg-blue-600 text-white rounded-lg px-4 py-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Route className="h-5 w-5" />
              <div>
                <span className="font-medium">{routeInfo.distance} km</span>
                <span className="mx-2 opacity-60">|</span>
                <span>{routeInfo.duration} min ETA</span>
              </div>
            </div>
            <span className="text-sm opacity-80">
              {selectedTanker.plate_number} to {selectedTanker.active_trip?.destination_station?.name}
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
          <span className="text-xs font-semibold mb-2 block">Tanker Status</span>
          <div className="space-y-1.5">
            {(['available', 'in_transit', 'maintenance', 'offline'] as TankerStatus[]).map(status => (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: statusColors[status] }}
                />
                <span className="text-xs">{statusLabels[status]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tanker Count */}
        <div className="absolute bottom-4 right-4 z-10 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
          <span className="text-sm font-medium">{tankers.filter(t => t.current_latitude).length}</span>
          <span className="text-xs text-muted-foreground ml-1">tankers tracked</span>
        </div>

        {/* Selected Tanker Panel */}
        {selectedTanker && (
          <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20 bg-card rounded-xl shadow-2xl border border-border p-4">
            <button
              type="button"
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onSelectTanker(null)}
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div 
                className="h-12 w-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${statusColors[selectedTanker.status]}20` }}
              >
                <Truck className="h-6 w-6" style={{ color: statusColors[selectedTanker.status] }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedTanker.plate_number}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedTanker.driver?.full_name || 'No driver assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="outline"
                style={{ 
                  backgroundColor: `${statusColors[selectedTanker.status]}15`,
                  color: statusColors[selectedTanker.status],
                  borderColor: `${statusColors[selectedTanker.status]}40`,
                }}
              >
                {statusLabels[selectedTanker.status]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedTanker.capacity_liters.toLocaleString()}L capacity
              </span>
            </div>

            {selectedTanker.active_trip && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {selectedTanker.active_trip.destination_station?.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Fuel className="h-3 w-3" />
                    <span>
                      {selectedTanker.active_trip.fuel_type === 'diesel' ? 'Diesel' 
                        : selectedTanker.active_trip.fuel_type === 'benzene_95' ? 'Benzene 95'
                        : selectedTanker.active_trip.fuel_type === 'benzene_97' ? 'Benzene 97'
                        : selectedTanker.active_trip.fuel_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{selectedTanker.active_trip.quantity_liters?.toLocaleString()}L</span>
                  </div>
                </div>
                {routeInfo && (
                  <div className="flex items-center gap-4 text-xs pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Route className="h-3 w-3 text-blue-500" />
                      <span className="font-medium">{routeInfo.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-orange-500" />
                      <span className="font-medium">{routeInfo.duration} min</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTanker.last_location_update && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Last updated: {new Date(selectedTanker.last_location_update).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
