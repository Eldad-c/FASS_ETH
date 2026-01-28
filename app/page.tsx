import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StationList } from '@/components/station-list'
import { FuelReportForm } from '@/components/fuel-report-form'
import { Fuel, TrendingUp, AlertTriangle } from 'lucide-react'
import type { StationWithFuelStatus } from '@/lib/types'
import MapLoader from '@/components/map-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

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

  const handleSubscribe = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    
    if (!email || !email.includes('@')) {
      return { error: 'Invalid email' }
    }

    // Create an anonymous user record for email subscriptions
    const result = await supabase
      .from('subscriptions')
      .insert({
        user_id: crypto.randomUUID(),
        station_id: null,
        fuel_type: null,
        notify_on_available: true,
        notify_on_low: true,
        notify_on_delivery: true,
        is_active: true,
      })
    
    return result
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Real-Time Fuel Availability
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Check fuel availability across TotalEnergies stations in Addis Ababa
          </p>

          {/* Email Alert Registration */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-foreground mb-2">Get Alerts</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Register your email to receive notifications when fuel becomes available
            </p>
            <form action={handleSubscribe} className="flex gap-2">
              <Input 
                type="email" 
                name="email"
                placeholder="your@email.com" 
                className="flex-1"
                required
              />
              <Button type="submit" className="whitespace-nowrap">Subscribe</Button>
            </form>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-foreground">{stationsWithAvailable}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-foreground">{stationsWithLow}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Fuel className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{totalStations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <StationList stations={stationsWithFuel} />
          </div>
          <div className="order-1 lg:order-2 h-[500px] lg:h-[600px] sticky top-20 rounded-lg overflow-hidden border border-border">
            <MapLoader stations={stationsWithFuel} />
          </div>
        </div>

        {/* Report Form */}
        <div className="max-w-md">
          <FuelReportForm stations={stationsWithFuel} />
        </div>
      </main>
    </div>
  )
}
