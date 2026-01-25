import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, Fuel, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: stationCount },
    { count: userCount },
    { count: pendingReportCount },
    { data: recentReports },
    { data: fuelStats },
  ] = await Promise.all([
    supabase.from('stations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('user_reports')
      .select('*, stations(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('fuel_status').select('status'),
  ])

  const availableCount = fuelStats?.filter((f) => f.status === 'available').length || 0
  const lowCount = fuelStats?.filter((f) => f.status === 'low').length || 0
  const outOfStockCount = fuelStats?.filter((f) => f.status === 'out_of_stock').length || 0
  const totalFuelEntries = fuelStats?.length || 1

  const stats = [
    {
      title: 'Active Stations',
      value: stationCount || 0,
      icon: Building2,
      href: '/admin/stations',
    },
    {
      title: 'Total Users',
      value: userCount || 0,
      icon: Users,
      href: '/admin/users',
    },
    {
      title: 'Pending Reports',
      value: pendingReportCount || 0,
      icon: FileText,
      href: '/admin/reports',
    },
    {
      title: 'Fuel Types Tracked',
      value: totalFuelEntries,
      icon: Fuel,
      href: '/admin/stations',
    },
  ]

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of the Fuel Availability System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel Availability Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fuel Availability Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{availableCount}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((availableCount / totalFuelEntries) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(availableCount / totalFuelEntries) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Low Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lowCount}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((lowCount / totalFuelEntries) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(lowCount / totalFuelEntries) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Out of Stock</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{outOfStockCount}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((outOfStockCount / totalFuelEntries) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(outOfStockCount / totalFuelEntries) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent User Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentReports && recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {(report.stations as { name: string })?.name || 'Unknown Station'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {report.fuel_type} - {report.reported_status.replace('_', ' ')}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        report.status === 'pending'
                          ? 'bg-yellow-500/15 text-yellow-700'
                          : report.status === 'verified'
                            ? 'bg-green-500/15 text-green-700'
                            : 'bg-red-500/15 text-red-700'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent reports</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
