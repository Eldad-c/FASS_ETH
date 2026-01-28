'use client'

import { useEffect, useRef } from 'react'

interface DriverMapProps {
  driverLocation: { latitude: number; longitude: number }
  destination: { latitude: number; longitude: number; name: string }
}

export function DriverMap({ driverLocation, destination }: DriverMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current) return

    const initMap = async () => {
      const leaflet = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Fix default marker icons
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      if (map.current) {
        map.current.remove()
      }

      // Center between driver and destination
      const centerLat = (driverLocation.latitude + destination.latitude) / 2
      const centerLon = (driverLocation.longitude + destination.longitude) / 2

      const map_instance = leaflet.map(mapContainer.current!, {
        center: [centerLat, centerLon],
        zoom: 13,
        zoomControl: true,
      })

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map_instance)

      // Driver location marker (blue)
      const driverIcon = leaflet.divIcon({
        className: 'driver-marker',
        html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center"><span class="text-white text-xs font-bold">D</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      leaflet.marker([driverLocation.latitude, driverLocation.longitude], { icon: driverIcon })
        .addTo(map_instance)
        .bindPopup('Your Current Location')
        .bindTooltip('Current Position', { permanent: false })

      // Destination marker (red)
      const destIcon = leaflet.divIcon({
        className: 'destination-marker',
        html: `<div class="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center"><span class="text-white text-xs font-bold">✓</span></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      leaflet.marker([destination.latitude, destination.longitude], { icon: destIcon })
        .addTo(map_instance)
        .bindPopup(destination.name)
        .bindTooltip(destination.name, { permanent: false })

      // Draw route line
      const routeLine = leaflet.polyline(
        [
          [driverLocation.latitude, driverLocation.longitude],
          [destination.latitude, destination.longitude],
        ],
        {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 5',
        }
      ).addTo(map_instance)

      map.current = map_instance
    }

    initMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [driverLocation, destination])

  return <div ref={mapContainer} className="w-full h-full rounded-lg" />
}
