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
  stations: StationWithFuelStatus[];
}

// Corrected status colors to match AvailabilityStatus type
const statusColors: Record<AvailabilityStatus, string> = {
  available: 'text-emerald-500',
  low: 'text-amber-500',
  out_of_stock: 'text-rose-500',
};

// Corrected queue labels to match QueueLevel type
const queueLabels: Record<QueueLevel, string> = {
  none: 'None',
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  very_long: 'Very Long',
};

// Corrected queue colors to match QueueLevel type
const queueColors: Record<QueueLevel, string> = {
  none: 'text-emerald-500',
  short: 'text-cyan-500',
  medium: 'text-amber-500',
  long: 'text-rose-500',
  very_long: 'text-red-700',
};

// Renamed and corrected function to get the most significant queue level
const getDominantQueueLevel = (station: StationWithFuelStatus): QueueLevel => {
  const levels = station.fuel_status.map(f => f.queue_level).filter(Boolean) as QueueLevel[];
  if (levels.length === 0) return 'none';

  const levelOrder: QueueLevel[] = ['very_long', 'long', 'medium', 'short', 'none'];
  
  for (const level of levelOrder) {
    if (levels.includes(level)) {
      return level;
    }
  }
  
  return 'none';
};

export function StationMap({ stations }: StationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const [selectedStation, setSelectedStation] = useState<StationWithFuelStatus | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  const initMap = useCallback(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const L = require('leaflet');
      
      const map = L.map(mapContainerRef.current, {
        center: [9.0054, 38.7636], // Default to Addis Ababa
        zoom: 12,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapRef.current = map;
      
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, []);

  useEffect(() => {
    initMap();
  }, [initMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    const L = require('leaflet');
    stations.forEach(station => {
      const isAvailable = station.fuel_status.some(f => f.status === 'available');
      
      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <svg class="w-8 h-10" viewBox="0 0 32 40">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 6.685 4.162 12.35 9.88 14.685L16 40l6.12-9.315C27.838 28.35 32 22.685 32 16 32 7.163 24.837 0 16 0z" fill="${isAvailable ? '#10B981' : '#6B7280'}"/>
          </svg>
          <svg class="absolute w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 7h12M6 12h7"/></svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([station.latitude, station.longitude], { icon: customIcon }).addTo(map);
      marker.on('click', () => setSelectedStation(station));
    });

  }, [stations]);

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const L = require('leaflet');
        const latLng = new L.LatLng(latitude, longitude);
        setUserLocation(latLng);
        mapRef.current?.setView(latLng, 14);
      }, () => {
        alert("Could not get your location.");
      });
    }
  };

  const handleShowDirections = () => {
    if (selectedStation) {
      const { latitude, longitude } = selectedStation;
      const url = userLocation
        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${latitude},${longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const stationId = searchParams.get('stationId');
    if (stationId) {
      const station = stations.find(s => s.id === stationId);
      if (station) {
        setSelectedStation(station);
        mapRef.current?.setView([station.latitude, station.longitude], 15);
      }
    }
  }, [searchParams, stations]);

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full relative">
        <div ref={mapContainerRef} className="h-full w-full bg-muted" />

        <div className="absolute top-4 left-4 z-[1000]">
          <Button size="icon" onClick={handleLocateUser} className="rounded-full shadow-lg">
            <Locate className="h-5 w-5" />
          </Button>
        </div>

        {selectedStation && (
          <div className="absolute bottom-4 left-4 right-4 md:bottom-auto md:top-4 md:left-auto md:right-4 md:w-80 z-[1000] bg-card rounded-xl shadow-2xl border border-border p-4 transition-all duration-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg max-w-[90%]">{selectedStation.name}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1" onClick={() => setSelectedStation(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">{selectedStation.address}</p>

            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Queue:</span>
              <span className={`text-xs font-medium ${queueColors[getDominantQueueLevel(selectedStation)]}`}>
                {queueLabels[getDominantQueueLevel(selectedStation)]}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              {selectedStation.fuel_status.map(fuel => (
                <div key={fuel.id} className="flex justify-between items-center text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Fuel className={`h-4 w-4 ${statusColors[fuel.status]}`} />
                    {fuel.fuel_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <Badge variant={fuel.status === 'available' ? 'default' : 'outline'} className={`capitalize ${fuel.status === 'available' ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                    {fuel.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleShowDirections}>
                <Route className="h-4 w-4 mr-2" />
                Directions
              </Button>
            </div>

            <div className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{selectedStation.operating_hours || 'Not specified'}</span>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}
