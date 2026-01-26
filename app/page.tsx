import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StationList } from '@/components/station-list'
import { StationMap } from '@/components/station-map'
import { FuelFilter } from '@/components/fuel-filter'
import { Fuel, TrendingUp, AlertTriangle, Clock } from 'lucide-react'
import type { StationWithFuelStatus } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: stations } = await supabase
    .from('stations')
    .select(`
      *,
      fuel_status (*)
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

        {/* Stats Overview - Minimal Notion-like cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50">
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Fuel className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold tabular-nums">{totalStations}</p>
              <p className="text-xs text-muted-foreground truncate">Total Stations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="h-9 w-9 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{stationsWithAvailable}</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 truncate">Available</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
            <div className="h-9 w-9 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{stationsWithLow}</p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate">Low Stock</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/30">
            <div className="h-9 w-9 rounded-md bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center flex-shrink-0">
              <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-rose-700 dark:text-rose-400 tabular-nums">{stationsOutOfStock}</p>
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70 truncate">Out of Stock</p>
            </div>
          </div>
        </div>

        {/* Fuel Filter */}
        <FuelFilter />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="order-2 lg:order-1">
            <StationList stations={stationsWithFuel} />
          </div>
          <div className="order-1 lg:order-2 h-[400px] lg:h-auto lg:min-h-[600px] lg:sticky lg:top-20">
            <StationMap stations={stationsWithFuel} />
          </div>
        </div>
      </main>
    </div>
  )
}
