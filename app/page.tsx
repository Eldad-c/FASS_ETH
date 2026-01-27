import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StationList } from '@/components/station-list'
import { FuelFilter } from '@/components/fuel-filter'
import { Fuel, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import type { StationWithFuelStatus } from '@/lib/types'
import MapLoader from '@/components/map-loader' // Import the new MapLoader component

export default async function HomePage() {
  const supabase = await createClient()

  // Updated query to fetch SDS-aligned fields
  const { data: stations } = await supabase
    .from('stations')
    .select(`
      id,
      name,
      address,
      latitude,
      longitude,
      operating_hours,
      is_active,
      estimated_queue_level,
      next_delivery_eta,
      fuel_status (
        id,
        fuel_type,
        status,
        queue_level,
        price_per_liter,
        updated_at
      )
    `)
    .eq('is_active', true)
    .order('name')

  const stationsWithFuel = (stations || []) as StationWithFuelStatus[]

  // Calculate stats
  const totalStations = stationsWithFuel.length
  const stationsWithAvailable = stationsWithFuel.filter(s => 
    s.fuel_status.some(f => f.status === 'available')
  ).length
  const stationsWithLow = stationsWithFuel.filter(s => 
    s.fuel_status.some(f => f.status === 'low') && 
    !s.fuel_status.some(f => f.status === 'available')
  ).length
  const stationsOutOfStock = totalStations - stationsWithAvailable - stationsWithLow

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 tracking-tight">
            Find Fuel Near You
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Real-time fuel availability at TotalEnergies stations in Addis Ababa
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* ... stats ... */}
        </div>

        {/* Fuel Filter */}
        <FuelFilter />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="order-2 lg:order-1">
            <StationList stations={stationsWithFuel} />
          </div>
          {/* Simplified map container for stable height */}
          <div className="order-1 lg:order-2 h-[500px] lg:h-[600px] sticky top-20 rounded-lg overflow-hidden">
            <MapLoader stations={stationsWithFuel} />
          </div>
        </div>
      </main>
    </div>
  )
}
