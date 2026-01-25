import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StationList } from '@/components/station-list'
import { StationMap } from '@/components/station-map'
import { FuelFilter } from '@/components/fuel-filter'
import { Card, CardContent } from '@/components/ui/card'
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
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
            Find Fuel Near You
          </h1>
          <p className="text-muted-foreground">
            Real-time fuel availability at TotalEnergiesEthiopia stations in Addis Ababa
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStations}</p>
                <p className="text-xs text-muted-foreground">Total Stations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stationsWithAvailable}</p>
                <p className="text-xs text-muted-foreground">Fuel Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stationsWithLow}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stationsOutOfStock}</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <FuelFilter />

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
