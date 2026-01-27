'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Fuel } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    stations: 0,
    users: 0,
    fuelStatus: { available: 0, low: 0, outOfStock: 0 }
  })
  const supabase = createClient()

  useEffect(() => {
    loadStats()
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

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const totalFuel = stats.fuelStatus.available + stats.fuelStatus.low + stats.fuelStatus.outOfStock || 1

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
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
        </div>

        {/* Fuel Status Overview */}
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
    </div>
  )
}
