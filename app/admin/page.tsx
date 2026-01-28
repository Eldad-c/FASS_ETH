'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Fuel, AlertCircle, CheckCircle2, Trash2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useShared } from '@/lib/shared-context'

interface FuelStatus {
  id: string
  station_id: string
  fuel_type: string
  status: string
  queue_level: number
  price_per_liter: number
}

interface FuelReport {
  id: string
  station_id: string
  fuel_type: string
  reported_status: string
  description: string | null
  created_at: string
  is_verified: boolean
}

export default function AdminPage() {
  const shared = useShared()
  const [reports, setReports] = useState<FuelReport[]>([])
  const [allFuelStatus, setAllFuelStatus] = useState<FuelStatus[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    loadReports()
    loadAllFuelStatus()
  }, [])

  const loadReports = async () => {
    const { data } = await supabase
      .from('user_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    setReports(data as FuelReport[] || [])
  }

  const loadAllFuelStatus = async () => {
    const { data } = await supabase
      .from('fuel_status')
      .select('*')
    
    if (data) {
      setAllFuelStatus(data as FuelStatus[])
    }
    setLoading(false)
  }

  const confirmReport = (reportId: string) => {
    shared.confirmReport(reportId)
  }

  const deleteReport = (reportId: string) => {
    shared.deleteReport(reportId)
  }

  // Calculate fuel availability stats
  const availableCount = allFuelStatus.filter(f => f.status === 'available').length
  const lowCount = allFuelStatus.filter(f => f.status === 'low').length
  const outOfStockCount = allFuelStatus.filter(f => f.status === 'out_of_stock').length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        {/* Fuel Availability Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-foreground">{availableCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-foreground">{lowCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-foreground">{outOfStockCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Reports Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending System Reports - Verify & Manage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shared.reports.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No pending reports</p>
              ) : (
                shared.reports
                  .filter(r => r.status === 'pending')
                  .map((report) => (
                    <div key={report.id} className="p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">{report.reportedBy}</p>
                            <Badge variant="outline" className={`text-xs ${report.severity === 'high' ? 'bg-red-500/10 text-red-700' : report.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-blue-500/10 text-blue-700'}`}>
                              {report.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">{report.type}</Badge>
                          </div>
                          <p className="text-sm text-foreground">{report.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(report.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmReport(report.id)}
                          className="gap-2 flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteReport(report.id)}
                          className="gap-2 flex-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmed Reports */}
        {shared.reports.filter(r => r.status === 'confirmed').length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" />
                Confirmed Reports ({shared.reports.filter(r => r.status === 'confirmed').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shared.reports
                  .filter(r => r.status === 'confirmed')
                  .map((report) => (
                    <div key={report.id} className="p-3 border border-green-200/50 bg-green-50/50 dark:bg-green-950/20 rounded-lg text-sm">
                      <p className="font-medium text-green-900 dark:text-green-100">{report.reportedBy} - {report.description}</p>
                      <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                        Confirmed: {new Date(report.confirmedAt!).toLocaleString()}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fuel Status Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              All Fuel Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Fuel Type</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Queue Level</th>
                    <th className="text-left py-2 px-2">Price/L</th>
                  </tr>
                </thead>
                <tbody>
                  {allFuelStatus.map((fuel) => (
                    <tr key={fuel.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 capitalize">{fuel.fuel_type.replace('_', ' ')}</td>
                      <td className="py-2 px-2">
                        <Badge variant={fuel.status === 'available' ? 'default' : fuel.status === 'low' ? 'secondary' : 'destructive'}>
                          {fuel.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{fuel.queue_level}</td>
                      <td className="py-2 px-2">ETB {fuel.price_per_liter?.toFixed(2) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
