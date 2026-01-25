'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import {
  Fuel,
  LogOut,
  Droplet,
  Flame,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import type { Profile, StationWithFuelStatus, UserReport, FuelType, AvailabilityStatus } from '@/lib/types'

interface StaffDashboardProps {
  profile: Profile
  station: StationWithFuelStatus
  pendingReports: UserReport[]
}

const fuelIcons: Record<FuelType, typeof Droplet> = {
  petrol: Flame,
  diesel: Droplet,
  premium: Star,
}

const fuelLabels: Record<FuelType, string> = {
  petrol: 'Petrol',
  diesel: 'Diesel',
  premium: 'Premium',
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  out_of_stock: 'bg-red-500/15 text-red-700 border-red-500/30',
}

const statusLabels: Record<AvailabilityStatus, string> = {
  available: 'Available',
  low: 'Low Stock',
  out_of_stock: 'Out of Stock',
}

export function StaffDashboard({ profile, station, pendingReports: initialReports }: StaffDashboardProps) {
  const router = useRouter()
  const [fuelStatuses, setFuelStatuses] = useState(station.fuel_status)
  const [pendingReports, setPendingReports] = useState(initialReports)
  const [updating, setUpdating] = useState<string | null>(null)
  const [processingReport, setProcessingReport] = useState<string | null>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const updateFuelStatus = async (
    fuelStatusId: string,
    newStatus: AvailabilityStatus,
    newPrice: number | null
  ) => {
    setUpdating(fuelStatusId)
    const supabase = createClient()

    const { error } = await supabase
      .from('fuel_status')
      .update({
        status: newStatus,
        price_per_liter: newPrice,
        last_updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fuelStatusId)

    if (!error) {
      setFuelStatuses((prev) =>
        prev.map((fs) =>
          fs.id === fuelStatusId
            ? { ...fs, status: newStatus, price_per_liter: newPrice }
            : fs
        )
      )
    }

    setUpdating(null)
  }

  const handleReportAction = async (reportId: string, action: 'verified' | 'rejected') => {
    setProcessingReport(reportId)
    const supabase = createClient()

    const { error } = await supabase
      .from('user_reports')
      .update({ status: action })
      .eq('id', reportId)

    if (!error) {
      setPendingReports((prev) => prev.filter((r) => r.id !== reportId))
    }

    setProcessingReport(null)
  }

  const refreshData = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Fuel className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold">Staff Dashboard</h1>
                <p className="text-xs text-muted-foreground">{station.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={refreshData} aria-label="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fuel Status Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Update Fuel Availability</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {fuelStatuses.map((fuel) => {
                const Icon = fuelIcons[fuel.fuel_type]
                return (
                  <Card key={fuel.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-5 w-5" />
                        {fuelLabels[fuel.fuel_type]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`status-${fuel.id}`}>Status</Label>
                        <Select
                          value={fuel.status}
                          onValueChange={(value) =>
                            updateFuelStatus(fuel.id, value as AvailabilityStatus, fuel.price_per_liter)
                          }
                          disabled={updating === fuel.id}
                        >
                          <SelectTrigger id={`status-${fuel.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="low">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${fuel.id}`}>Price (ETB/L)</Label>
                        <Input
                          id={`price-${fuel.id}`}
                          type="number"
                          step="0.01"
                          value={fuel.price_per_liter || ''}
                          onChange={(e) => {
                            const newPrice = e.target.value ? parseFloat(e.target.value) : null
                            setFuelStatuses((prev) =>
                              prev.map((fs) =>
                                fs.id === fuel.id ? { ...fs, price_per_liter: newPrice } : fs
                              )
                            )
                          }}
                          onBlur={(e) => {
                            const newPrice = e.target.value ? parseFloat(e.target.value) : null
                            updateFuelStatus(fuel.id, fuel.status, newPrice)
                          }}
                          disabled={updating === fuel.id}
                        />
                      </div>

                      <Badge variant="outline" className={statusColors[fuel.status]}>
                        {updating === fuel.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : null}
                        {statusLabels[fuel.status]}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Pending Reports */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pending Reports</h2>
            {pendingReports.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No pending reports</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="capitalize">{report.fuel_type}</span>
                        <Badge variant="outline" className={statusColors[report.reported_status]}>
                          {statusLabels[report.reported_status]}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(report.created_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {report.comment && (
                        <p className="text-sm text-muted-foreground">{report.comment}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 bg-transparent"
                          onClick={() => handleReportAction(report.id, 'verified')}
                          disabled={processingReport === report.id}
                        >
                          {processingReport === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => handleReportAction(report.id, 'rejected')}
                          disabled={processingReport === report.id}
                        >
                          {processingReport === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
