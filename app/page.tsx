import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StationList } from '@/components/station-list'
import { StationMap } from '@/components/station-map'
import { FuelFilter } from '@/components/fuel-filter'
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Find Fuel Near You
          </h1>
          <p className="text-muted-foreground">
            Real-time fuel availability at TotalEnergies stations in Addis Ababa
          </p>
        </div>

        <FuelFilter />

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <div className="order-2 lg:order-1">
            <StationList stations={stationsWithFuel} />
          </div>
          <div className="order-1 lg:order-2 h-[400px] lg:h-auto lg:min-h-[600px]">
            <StationMap stations={stationsWithFuel} />
          </div>
        </div>
      </main>
    </div>
  )
}
