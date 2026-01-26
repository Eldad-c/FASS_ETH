'use client'

import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Fuel, Navigation, Clock, Users, X, Locate, Route } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { StationWithFuelStatus, AvailabilityStatus, QueueLevel } from '@/lib/types'
import type * as L from 'leaflet'

interface StationMapProps {
  stations: StationWithFuelStatus[]
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: '#22c55e',
  low: '#eab308',
  out_of_stock: '#ef4444',
}

const queueLabels: Record<QueueLevel, string> = {
  none: 'No Queue',
  short: '< 5 min',
  medium: '5-15 min',
  long: '> 15 min',
  very_long: '> 30 min',
}

const queueColors: Record<QueueLevel, string> = {
  none: 'text-green-600 dark:text-green-400',
  short: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  long: 'text-red-600 dark:text-red-400',
  very_long: 'text-red-600 dark:text-red-400',
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
  const queueOrder: QueueLevel[] = ['none', 'short', 'medium', 'long', 'very_long']
  const avgIndex = Math.round(
    queueLevels.reduce((acc, q) => acc + queueOrder.indexOf(q || 'none'), 0) / queueLevels.length
  )
  return queueOrder[avgIndex] || 'none'
}

// Custom hook for Leaflet map
function useLeafletMap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  userLocation: { lat: number; lng: number } | null,
  stations: StationWithFuelStatus[],
  onStationSelect: (station: StationWithFuelStatus | null) => void
) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      // CSS is imported via link tag for proper loading
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
      
      const map = L.map(containerRef.current!, {
        center,
        zoom: 13,
        zoomControl: false,
      })

      // Add OpenStreetMap tiles with roads
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Add zoom control to bottom right
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
  }, [containerRef])

  // Update station markers
  useEffect(() => {
    if (!mapRef.current) return

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()

      // Create custom icon function
      const createStationIcon = (status: AvailabilityStatus) => {
        const color = statusColors[status]
        return L.divIcon({
          className: 'custom-station-marker',
          html: `
            <div style="
              width: 36px;
              height: 36px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
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
          popupAnchor: [0, -20],
        })
      }

      // Add markers for each station
      stations.forEach(station => {
        const status = getOverallStatus(station)
        const marker = L.marker([station.latitude, station.longitude], {
          icon: createStationIcon(status),
        })

        marker.on('click', () => {
          onStationSelect(station)
        })

        marker.addTo(mapRef.current!)
        markersRef.current.set(station.id, marker)
      })
    }

    updateMarkers()
  }, [stations, onStationSelect])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    const updateUserMarker = async () => {
      const L = (await import('leaflet')).default

      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
          <div style="position: relative;">
            <div style="
              width: 20px;
              height: 20px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
            "></div>
            <div style="
              position: absolute;
              top: -8px;
              left: -8px;
              width: 36px;
              height: 36px;
              background: rgba(59, 130, 246, 0.2);
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.5); opacity: 0; }
            }
          </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current!)
    }

    updateUserMarker()
  }, [userLocation])

  // Function to show route
  const showRoute = useCallback(async (destination: { lat: number; lng: number }) => {
    if (!mapRef.current || !userLocation) return

    const L = (await import('leaflet')).default

    // Clear existing route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
    }

    try {
      // Use OSRM for routing (free, no API key needed)
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        )

        routeLayerRef.current = L.polyline(coordinates, {
          color: '#3b82f6',
          weight: 5,
          opacity: 0.8,
          dashArray: '10, 10',
        }).addTo(mapRef.current!)

        // Fit map to show the entire route
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [destination.lat, destination.lng],
        ])
        mapRef.current!.fitBounds(bounds, { padding: [50, 50] })

        return {
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(data.routes[0].duration / 60),
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
    return null
  }, [userLocation])

  // Function to clear route
  const clearRoute = useCallback(() => {
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
      routeLayerRef.current = null
    }
  }, [])

  // Function to center on user
  const centerOnUser = useCallback(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 14)
    }
  }, [userLocation])

  // Function to fit all stations
  const fitAllStations = useCallback(async () => {
    if (!mapRef.current || stations.length === 0) return

    const L = (await import('leaflet')).default
    const bounds = L.latLngBounds(
      stations.map(s => [s.latitude, s.longitude] as [number, number])
    )
    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng])
    }
    mapRef.current.fitBounds(bounds, { padding: [50, 50] })
  }, [stations, userLocation])

  return { showRoute, clearRoute, centerOnUser, fitAllStations }
}

export function StationMap({ stations }: StationMapProps) {
  const searchParams = useSearchParams()
  const fuelFilter = searchParams.get('fuel') || 'all'
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const filteredStations = stations.filter((station) => {
    if (fuelFilter === 'all') return true
    return station.fuel_status.some(
      (fs) => fs.fuel_type === fuelFilter && fs.status !== 'out_of_stock'
    )
  })

  const handleStationSelect = useCallback((station: StationWithFuelStatus | null) => {
    setSelectedStation(station)
    setRouteInfo(null)
  }, [])

  const { showRoute, clearRoute, centerOnUser, fitAllStations } = useLeafletMap(
    mapContainerRef,
    userLocation,
    filteredStations,
    handleStationSelect
  )

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

  // Handle get directions
  const handleGetDirections = async () => {
    if (!selectedStation || !userLocation) return
    setIsLoadingRoute(true)
    const info = await showRoute({
      lat: selectedStation.latitude,
      lng: selectedStation.longitude,
    })
    if (info) {
      setRouteInfo(info)
    }
    setIsLoadingRoute(false)
  }

  // Open in external maps
  const openInMaps = (station: StationWithFuelStatus) => {
    if (userLocation) {
      // Try Google Maps first, fallback to OpenStreetMap
      const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.latitude},${station.longitude}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Leaflet Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Addis Ababa</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-card/95 backdrop-blur-sm shadow-md"
            onClick={centerOnUser}
            title="Center on my location"
          >
            <Locate className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-card/95 backdrop-blur-sm shadow-md"
            onClick={fitAllStations}
            title="Show all stations"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
          <span className="text-xs font-semibold text-foreground mb-1">Fuel Availability</span>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
            <span className="text-xs">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            <span className="text-xs">Out of Stock</span>
          </div>
        </div>

        {/* Station Count */}
        <div className="absolute bottom-4 right-4 z-10 bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-border">
          <span className="text-sm font-medium">{filteredStations.length}</span>
          <span className="text-xs text-muted-foreground ml-1">stations</span>
        </div>

        {/* Route Info Banner */}
        {routeInfo && (
          <div className="absolute top-16 left-4 right-4 z-10 bg-primary text-primary-foreground rounded-lg px-4 py-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Route className="h-5 w-5" />
              <div>
                <span className="font-medium">{routeInfo.distance} km</span>
                <span className="mx-2 opacity-60">|</span>
                <span>{routeInfo.duration} min</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                clearRoute()
                setRouteInfo(null)
              }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Selected Station Panel */}
        {selectedStation && (
          <div className="absolute bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-20 bg-card rounded-xl shadow-2xl border border-border p-4">
            <button
              type="button"
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              onClick={() => {
                setSelectedStation(null)
                clearRoute()
                setRouteInfo(null)
              }}
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-start gap-3 mb-3">
              <div 
                className="flex items-center justify-center h-10 w-10 rounded-full"
                style={{ backgroundColor: statusColors[getOverallStatus(selectedStation)] }}
              >
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

            {/* Queue Level */}
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Queue:</span>
              <span className={`text-xs font-medium ${queueColors[getAverageQueueLevel(selectedStation)]}`}>
                {queueLabels[getAverageQueueLevel(selectedStation)]}
              </span>
            </div>
            
            {/* Fuel Status */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedStation.fuel_status.map((fuel) => {
                // Format fuel type names per SDS
                const fuelLabel = fuel.fuel_type === 'diesel' ? 'Diesel' 
                  : fuel.fuel_type === 'benzene_95' ? 'Benzene 95'
                  : fuel.fuel_type === 'benzene_97' ? 'Benzene 97'
                  : fuel.fuel_type
                return (
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
                    {fuelLabel}
                    {fuel.price_per_liter && (
                      <span className="ml-1 opacity-75">{fuel.price_per_liter} ETB</span>
                    )}
                  </Badge>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={handleGetDirections}
                disabled={isLoadingRoute || !userLocation}
              >
                <Navigation className="h-4 w-4 mr-1.5" />
                {isLoadingRoute ? 'Loading...' : 'Directions'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(selectedStation)}
              >
                Open Maps
              </Button>
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
      </CardContent>
    </Card>
  )
}
