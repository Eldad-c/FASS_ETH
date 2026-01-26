import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isManager } from '@/lib/role-helpers'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !isManager(profile.role)) {
    redirect('/')
  }

  // Get stations managed by this manager
  const { data: stations } = await supabase
    .from('stations')
    .select('*')
    .eq('manager_id', user.id)
    .eq('is_active', true)

  // Get pending approvals
  const { data: pendingApprovals } = await supabase
    .from('pending_approvals')
    .select(`
      *,
      fuel_status:fuel_status_id (*),
      station:stations (*),
      submitter:profiles!pending_approvals_submitted_by_fkey (name, email)
    `)
    .eq('status', 'PENDING')
    .eq('manager_id', user.id)
    .order('submitted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve staff updates for your stations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Managed Stations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stations?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Review and approve staff fuel status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals && pendingApprovals.length > 0 ? (
              <div className="space-y-4">
                {pendingApprovals.map((approval: any) => (
                  <div
                    key={approval.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {approval.station?.name || 'Unknown Station'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fuel: {approval.fuel_status?.fuel_type || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Submitted by: {approval.submitter?.name || 'Unknown'} on{' '}
                        {new Date(approval.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="default">
                        <Link href={`/manager/approve/${approval.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No pending approvals
              </div>
            )}
          </CardContent>
        </Card>

        {/* Managed Stations */}
        <Card>
          <CardHeader>
            <CardTitle>Managed Stations</CardTitle>
            <CardDescription>Stations under your management</CardDescription>
          </CardHeader>
          <CardContent>
            {stations && stations.length > 0 ? (
              <div className="space-y-2">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className="border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold">{station.name}</div>
                      <div className="text-sm text-muted-foreground">{station.address}</div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/stations/${station.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No stations assigned
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
