import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffDashboard } from '@/components/staff/staff-dashboard'

export default async function StaffPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, stations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'staff') {
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

  const { data: station } = await supabase
    .from('stations')
    .select('*, fuel_status(*)')
    .eq('id', profile.assigned_station_id)
    .single()

  const { data: reports } = await supabase
    .from('user_reports')
    .select('*')
    .eq('station_id', profile.assigned_station_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <StaffDashboard
      profile={profile}
      station={station}
      pendingReports={reports || []}
    />
  )
}
