'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Locate, Navigation, MapPin, Clock, Fuel, Route, Maximize2, Minimize2 } from 'lucide-react'
import type { Station } from '@/lib/types'
import type * as L from 'leaflet'

interface DeliveryMapProps {
  userLocation: { lat: number; lng: number } | null
  destinationStation: Station | null
  onRouteCalculated?: (info: { distance: string; duration: number }) => void
}

export function DeliveryMap({ userLocation, destinationStation, onRouteCalculated }: DeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const destinationMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.Polyline | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
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

      // Default center (Addis Ababa)
      const center: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [9.0054, 38.7636]

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom: 14,
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
  }, [userLocation])

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    const updateUserMarker = async () => {
      const L = (await import('leaflet')).default

      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
      }

      // Truck icon for driver's current location
      const truckIcon = L.divIcon({
        className: 'driver-location-marker',
        html: `
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              border: 3px solid white;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 17h4V5H2v12h3"/>
                <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/>
                <circle cx="7.5" cy="17.5" r="2.5"/>
                <circle cx="17.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
            <div style="
              position: absolute;
              top: -6px;
              left: -6px;
              width: 52px;
              height: 52px;
              background: rgba(220, 38, 38, 0.15);
              border-radius: 14px;
              animation: pulse 2s infinite;
            "></div>
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.15); opacity: 0.5; }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: truckIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current!)

      userMarkerRef.current.bindPopup('<b>Your Location</b><br>Tanker current position')
    }

    updateUserMarker()
  }, [userLocation])

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current || !destinationStation) return

    const updateDestinationMarker = async () => {
      const L = (await import('leaflet')).default

      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove()
      }

      // Station marker
      const stationIcon = L.divIcon({
        className: 'destination-marker',
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
        popupAnchor: [0, -20],
      })

      destinationMarkerRef.current = L.marker(
        [destinationStation.latitude, destinationStation.longitude],
        { icon: stationIcon }
      ).addTo(mapRef.current!)

      destinationMarkerRef.current.bindPopup(
        `<b>${destinationStation.name}</b><br>${destinationStation.address}`
      )
    }

    updateDestinationMarker()
  }, [destinationStation])

  // Calculate and show route
  const showRoute = useCallback(async () => {
    if (!mapRef.current || !userLocation || !destinationStation) return

    const L = (await import('leaflet')).default

    // Clear existing route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
    }

    try {
      // Use OSRM for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destinationStation.longitude},${destinationStation.latitude}?overview=full&geometries=geojson`
      )
      const data = await response.json()

      if (data.routes && data.routes[0]) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
        )

        // Create animated dashed line for route
        routeLayerRef.current = L.polyline(coordinates, {
          color: '#3b82f6',
          weight: 6,
          opacity: 0.8,
          dashArray: '12, 12',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current!)

        // Fit map to show the entire route
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [destinationStation.latitude, destinationStation.longitude],
        ])
        mapRef.current!.fitBounds(bounds, { padding: [50, 50] })

        const info = {
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(data.routes[0].duration / 60),
        }
        
        setRouteInfo(info)
        onRouteCalculated?.(info)
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }, [userLocation, destinationStation, onRouteCalculated])

  // Auto-show route when we have both locations
  useEffect(() => {
    if (userLocation && destinationStation) {
      showRoute()
    }
  }, [userLocation, destinationStation, showRoute])

  // Center on user
  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15)
    }
  }

  // Open in external navigation
  const openNavigation = () => {
    if (userLocation && destinationStation) {
      const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${destinationStation.latitude},${destinationStation.longitude}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  return (
    <Card className={`overflow-hidden transition-all ${isExpanded ? 'fixed inset-4 z-50' : 'h-[300px]'}`}>
      <CardContent className="p-0 h-full relative">
        {/* Map Container */}
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 bg-card/95 backdrop-blur-sm shadow-md"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
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
            onClick={openNavigation}
            title="Open in Maps"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="absolute top-3 left-3 z-10 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">{routeInfo.distance} km</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold">{routeInfo.duration} min</span>
              </div>
            </div>
          </div>
        )}

        {/* Destination Info */}
        {destinationStation && (
          <div className="absolute bottom-3 left-3 right-3 z-10 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md border border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Fuel className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{destinationStation.name}</p>
                <p className="text-xs text-muted-foreground truncate">{destinationStation.address}</p>
              </div>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 flex-shrink-0">
                <MapPin className="h-3 w-3 mr-1" />
                Destination
              </Badge>
            </div>
          </div>
        )}

        {/* No destination message */}
        {!destinationStation && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-[2px]">
            <div className="text-center p-6 bg-card rounded-xl shadow-lg border border-border">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No active delivery</p>
              <p className="text-xs text-muted-foreground/70">Start a trip to see navigation</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
