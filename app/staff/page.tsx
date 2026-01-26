import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffDashboard } from '@/components/staff/staff-dashboard'
import { isStaff } from '@/lib/role-helpers'

export default async function StaffPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, stations(*)')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  if (!isStaff(profile.role)) {
    redirect('/')
  }

  if (!profile.assigned_station_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Station Assigned</h1>
          <p className="text-muted-foreground">
            Please contact an administrator to be assigned to a station.
          </p>
        </div>
      </div>
    )
  }

  const { data: station, error: stationError } = await supabase
    .from('stations')
    .select('*, fuel_status(*)')
    .eq('id', profile.assigned_station_id)
    .maybeSingle()

  if (stationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Unable to Load Station</h1>
          <p className="text-muted-foreground">{stationError.message}</p>
        </div>
      </div>
    )
  }

  const { data: reports, error: reportsError } = await supabase
    .from('user_reports')
    .select('*')
    .eq('station_id', profile.assigned_station_id)
    .in('status', ['pending', 'OPEN'])
    .order('created_at', { ascending: false })
    .limit(10)

  // Use Case 2: checkIncomingDeliveries(stationID) -> LogisticsEngine -> Delivery
  const { data: incomingTrips } = await supabase
    .from('trips')
    .select('*, tankers(plate_number, status), destination_station:stations!trips_destination_station_id_fkey(name, address)')
    .eq('destination_station_id', profile.assigned_station_id)
    .in('status', ['SCHEDULED', 'IN_PROGRESS'])
    .order('estimated_arrival', { ascending: true })
    .limit(10)

  return (
    <StaffDashboard
      profile={profile}
      station={station}
      pendingReports={reportsError ? [] : reports || []}
      incomingDeliveries={incomingTrips || []}
    />
  )
}
