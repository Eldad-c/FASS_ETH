'use client';

import dynamic from 'next/dynamic';
import type { StationWithFuelStatus } from '@/lib/types';

// Dynamically import the StationMap component with SSR turned off
const StationMap = dynamic(() => import('@/components/station-map').then((mod) => mod.StationMap), {
  ssr: false,
  loading: () => <div className="h-full bg-muted animate-pulse rounded-lg"></div>
});

interface MapLoaderProps {
  stations: StationWithFuelStatus[];
}

// This is a simple client component that will pass the stations prop to the map
export default function MapLoader({ stations }: MapLoaderProps) {
  return <StationMap stations={stations} />;
}
