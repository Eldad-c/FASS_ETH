import { createClient } from '@/lib/supabase/server'
import { StaffDashboard } from '@/components/staff/staff-dashboard'

export default async function StaffPage() {
  const supabase = await createClient()

  // Use first station as default for demo purposes
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  const station = stations?.[0]

  if (!station) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Station Available</h1>
          <p className="text-muted-foreground">
            Please check that stations are configured in the system.
          </p>
        </div>
      </div>
    )
  }

  // Create a dummy profile for demo purposes
  const profile = {
    id: 'demo-user',
    email: 'demo@example.com',
    full_name: 'Demo Staff',
    role: 'staff',
    assigned_station_id: station.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: stationWithFuel } = await supabase
    .from('stations')
    .select('*, fuel_status(*)')
    .eq('id', station.id)
    .maybeSingle()

  const { data: reports } = await supabase
    .from('user_reports')
    .select('*')
    .eq('station_id', station.id)
    .in('status', ['pending', 'OPEN'])
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: incomingTrips } = await supabase
    .from('trips')
    .select('*, tankers(plate_number, status), destination_station:stations!trips_destination_station_id_fkey(name, address)')
    .eq('destination_station_id', station.id)
    .in('status', ['SCHEDULED', 'IN_PROGRESS'])
    .order('estimated_arrival', { ascending: true })
    .limit(10)

  return (
    <StaffDashboard
      profile={profile}
      station={stationWithFuel}
      pendingReports={reports || []}
      incomingDeliveries={incomingTrips || []}
    />
  )
}
