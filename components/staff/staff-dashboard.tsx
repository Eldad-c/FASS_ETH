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
  Users,
  Home,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import type { Profile, StationWithFuelStatus, UserReport, FuelType, AvailabilityStatus, QueueLevel } from '@/lib/types'

interface IncomingTrip {
  id: string
  fuel_type: string
  volume_liters?: number
  quantity_liters?: number
  status: string
  estimated_arrival: string | null
  tankers?: { plate_number?: string; status?: string } | null
  destination_station?: { name?: string; address?: string } | null
}

interface StaffDashboardProps {
  profile: Profile
  station: StationWithFuelStatus
  pendingReports: UserReport[]
  incomingDeliveries?: IncomingTrip[]
}

const fuelIcons: Record<FuelType, typeof Droplet> = {
  diesel: Droplet,
  benzene_95: Flame,
  benzene_97: Star,
}

const fuelLabels: Record<FuelType, string> = {
  diesel: 'Diesel',
  benzene_95: 'Benzene 95',
  benzene_97: 'Benzene 97',
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

const queueLabels: Record<QueueLevel, string> = {
  none: 'No Queue',
  short: 'Short (< 5 min)',
  medium: 'Medium (5-15 min)',
  long: 'Long (15-30 min)',
  very_long: 'Very Long (30+ min)',
}

const queueColors: Record<QueueLevel, string> = {
  none: 'text-green-600',
  short: 'text-green-600',
  medium: 'text-yellow-600',
  long: 'text-orange-600',
  very_long: 'text-red-600',
}

export function StaffDashboard({ profile, station, pendingReports: initialReports, incomingDeliveries = [] }: StaffDashboardProps) {
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
    updates: {
      status?: AvailabilityStatus
      price?: number | null
      queue_level?: QueueLevel
    }
  ) => {
    setUpdating(fuelStatusId)
    const supabase = createClient()

    const currentFuel = fuelStatuses.find(f => f.id === fuelStatusId)
    if (!currentFuel) return

    // Check if approval is required (check if station has a manager)
    const { data: station } = await supabase
      .from('stations')
      .select('manager_id')
      .eq('id', currentFuel.station_id)
      .single()

    const requiresApproval = !!station?.manager_id

    const updateData: Record<string, string | number | null> = {
      updated_by: profile.id,
      submitted_by: profile.id,
      last_updated: new Date().toISOString(),
      approval_status: requiresApproval ? 'PENDING' : 'APPROVED',
    }

    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.price !== undefined) updateData.price_per_liter = updates.price
    if (updates.queue_level !== undefined) updateData.queue_level = updates.queue_level

    // Update fuel status
    const { error: updateError } = await supabase
      .from('fuel_status')
      .update(updateData)
      .eq('id', fuelStatusId)

    if (updateError) {
      console.error('Error updating fuel status:', updateError)
      setUpdating(null)
      return
    }

    // If approval is required, create pending approval record
    if (requiresApproval && station.manager_id) {
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .insert({
          fuel_status_id: fuelStatusId,
          station_id: currentFuel.station_id,
          submitted_by: profile.id,
          manager_id: station.manager_id,
          status: 'PENDING',
        })

      if (approvalError) {
        console.error('Error creating pending approval:', approvalError)
      }
    }

    // Update local state
    setFuelStatuses((prev) =>
      prev.map((fs) =>
        fs.id === fuelStatusId
          ? {
              ...fs,
              ...(updates.status !== undefined && { status: updates.status }),
              ...(updates.price !== undefined && { price_per_liter: updates.price }),
              ...(updates.queue_level !== undefined && { queue_level: updates.queue_level }),
              approval_status: requiresApproval ? 'PENDING' : 'APPROVED',
            }
          : fs
      )
    )

    setUpdating(null)
  }

  const handleReportAction = async (reportId: string, action: 'verified' | 'rejected') => {
    setProcessingReport(reportId)
    const supabase = createClient()

    const { error } = await supabase
      .from('user_reports')
      .update({ 
        status: action,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
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
                <h1 className="text-sm font-bold">TotalEnergiesEthiopia</h1>
                <p className="text-xs text-muted-foreground">Staff Portal - {station.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" aria-label="Home">
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
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
        {/* Welcome Card */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="text-lg font-semibold">{profile.full_name || 'Staff Member'}</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {station.name}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Use Case 2: displayDashboard(alerts) - Incoming Deliveries from checkIncomingDeliveries */}
        {incomingDeliveries.length > 0 && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Incoming Deliveries
              </CardTitle>
              <CardDescription>Trips en route to this station</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {incomingDeliveries.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-2 py-2 border-b text-sm last:border-0">
                    <span className="font-medium">
                      {(t.tankers as { plate_number?: string })?.plate_number || 'Tanker'} — {(t.volume_liters ?? (t as { quantity_liters?: number }).quantity_liters ?? 0).toLocaleString()}L {t.fuel_type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {t.status === 'IN_PROGRESS' ? 'En route' : 'Scheduled'}
                    </Badge>
                    {t.estimated_arrival && (
                      <span className="text-muted-foreground text-xs">
                        ETA: {new Date(t.estimated_arrival).toLocaleString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Fuel Status Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Update Fuel Availability & Queue</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {fuelStatuses.map((fuel) => {
                const Icon = fuelIcons[fuel.fuel_type]
                const queueLevel = fuel.queue_level || 'none'
                return (
                  <Card key={fuel.id} className="relative overflow-hidden">
                    {/* Status indicator bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      fuel.status === 'available' ? 'bg-green-500' :
                      fuel.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    
                    <CardHeader className="pb-3 pt-4">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          fuel.status === 'available' ? 'bg-green-500/15' :
                          fuel.status === 'low' ? 'bg-yellow-500/15' : 'bg-red-500/15'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            fuel.status === 'available' ? 'text-green-600' :
                            fuel.status === 'low' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        {fuelLabels[fuel.fuel_type]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`status-${fuel.id}`}>Availability</Label>
                        <Select
                          value={fuel.status}
                          onValueChange={(value) =>
                            updateFuelStatus(fuel.id, { status: value as AvailabilityStatus })
                          }
                          disabled={updating === fuel.id}
                        >
                          <SelectTrigger id={`status-${fuel.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                Available
                              </div>
                            </SelectItem>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                Low Stock
                              </div>
                            </SelectItem>
                            <SelectItem value="out_of_stock">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                Out of Stock
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`queue-${fuel.id}`} className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Queue Level
                        </Label>
                        <Select
                          value={queueLevel}
                          onValueChange={(value) =>
                            updateFuelStatus(fuel.id, { queue_level: value as QueueLevel })
                          }
                          disabled={updating === fuel.id || fuel.status === 'out_of_stock'}
                        >
                          <SelectTrigger id={`queue-${fuel.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Queue</SelectItem>
                            <SelectItem value="short">Short ({'<'} 5 min)</SelectItem>
                            <SelectItem value="medium">Medium (5-15 min)</SelectItem>
                            <SelectItem value="long">Long ({'>'} 15 min)</SelectItem>
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
                            updateFuelStatus(fuel.id, { price: newPrice })
                          }}
                          disabled={updating === fuel.id}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <Badge variant="outline" className={statusColors[fuel.status]}>
                          {updating === fuel.id ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : null}
                          {statusLabels[fuel.status]}
                        </Badge>
                        {fuel.status !== 'out_of_stock' && (
                          <span className={`text-xs font-medium ${queueColors[queueLevel]}`}>
                            {queueLabels[queueLevel]}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Pending Reports */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Crowdsourced Reports</h2>
            <p className="text-sm text-muted-foreground">
              Review and verify reports from public users
            </p>
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
                      {(report.reported_queue_level || report.queue_level) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className={queueColors[report.reported_queue_level || report.queue_level || 'none']}>
                            {queueLabels[report.reported_queue_level || report.queue_level || 'none']}
                          </span>
                        </div>
                      )}
                      {report.comment && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {report.comment}
                        </p>
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
