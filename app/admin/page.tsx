'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Fuel, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FuelReport {
  id: string
  station_id: string
  fuel_type: string
  reported_status: string
  description: string | null
  reporter_email: string
  created_at: string
  is_verified: boolean
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    stations: 0,
    users: 0,
    fuelStatus: { available: 0, low: 0, outOfStock: 0 }
  })
  const [reports, setReports] = useState<FuelReport[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadStats()
    loadReports()

    // Subscribe to real-time updates
    const fuelSubscription = supabase
      .channel('fuel_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_status' }, () => {
        loadStats()
      })
      .subscribe()

    const reportSubscription = supabase
      .channel('fuel_reports_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fuel_reports' }, () => {
        loadReports()
      })
      .subscribe()

    return () => {
      fuelSubscription.unsubscribe()
      reportSubscription.unsubscribe()
    }
  }, [])

  const loadStats = async () => {
    const [stationResult, userResult, fuelResult] = await Promise.all([
      supabase.from('stations').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('fuel_status').select('status')
    ])

    const fuelData = fuelResult.data || []
    const fuelStats = {
      available: fuelData.filter(f => f.status === 'available').length,
      low: fuelData.filter(f => f.status === 'low').length,
      outOfStock: fuelData.filter(f => f.status === 'out_of_stock').length
    }

    setStats({
      stations: stationResult.count || 0,
      users: userResult.count || 0,
      fuelStatus: fuelStats
    })
    setLoading(false)
  }

  const loadReports = async () => {
    const { data } = await supabase
      .from('fuel_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    setReports(data || [])
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const totalFuel = stats.fuelStatus.available + stats.fuelStatus.low + stats.fuelStatus.outOfStock || 1
  const unverifiedReports = reports.filter(r => !r.is_verified).length

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Console</h1>
          <p className="text-muted-foreground mt-1">System management and monitoring</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Stations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stations}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fuel Types Tracked</CardTitle>
              <Fuel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFuel}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unverified Reports</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unverifiedReports}</div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Fuel Status Overview - Left (2/3) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Availability Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Available */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Available</span>
                      </div>
                      <span className="text-sm font-bold">{stats.fuelStatus.available}/{totalFuel}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${(stats.fuelStatus.available / totalFuel) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.fuelStatus.available / totalFuel) * 100)}%
                    </p>
                  </div>

                  {/* Low Stock */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500" />
                        <span className="text-sm font-medium">Low Stock</span>
                      </div>
                      <span className="text-sm font-bold">{stats.fuelStatus.low}/{totalFuel}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${(stats.fuelStatus.low / totalFuel) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.fuelStatus.low / totalFuel) * 100)}%
                    </p>
                  </div>

                  {/* Out of Stock */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm font-medium">Out of Stock</span>
                      </div>
                      <span className="text-sm font-bold">{stats.fuelStatus.outOfStock}/{totalFuel}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${(stats.fuelStatus.outOfStock / totalFuel) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((stats.fuelStatus.outOfStock / totalFuel) * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports - Right (1/3) */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Recent Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reports.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No reports yet</p>
                  ) : (
                    reports.map((report) => (
                      <div key={report.id} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium capitalize">{report.fuel_type.replace('_', ' ')}</p>
                          <Badge 
                            variant={report.is_verified ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {report.is_verified ? 'Verified' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{report.reporter_email}</p>
                        <p className="text-xs text-muted-foreground mb-1">
                          Status: {report.reported_status.replace('_', ' ')}
                        </p>
                        {report.description && (
                          <p className="text-xs text-muted-foreground">{report.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
