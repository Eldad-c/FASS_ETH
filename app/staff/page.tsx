'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Edit2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'
import { useShared } from '@/lib/shared-context'

interface FuelStatus {
  id: string
  station_id: string
  fuel_type: string
  status: string
  is_available: boolean
  queue_level: number
  price_per_liter: number
}

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

export default function StaffPage() {
  const shared = useShared()
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<any[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [fuelStatus, setFuelStatus] = useState<FuelStatus[]>([])
  const [reports, setReports] = useState<FuelReport[]>([])
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal state
  const [editingFuel, setEditingFuel] = useState<FuelStatus | null>(null)
  const [modalStatus, setModalStatus] = useState('')
  const [modalQueueLevel, setModalQueueLevel] = useState('')
  const [modalPrice, setModalPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadStations()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('fuel_status_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fuel_status' }, () => {
        if (selectedStation) {
          loadFuelStatus(selectedStation)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (selectedStation) {
      loadFuelStatus(selectedStation)
      loadReports(selectedStation)
    }
  }, [selectedStation])

  const loadStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('id, name')
      .order('name')
    
    if (data && data.length > 0) {
      setStations(data)
      setSelectedStation(data[0].id)
    }
    setLoading(false)
  }

  const loadFuelStatus = async (stationId: string) => {
    const { data } = await supabase
      .from('fuel_status')
      .select('*')
      .eq('station_id', stationId)
    
    if (data) {
      setFuelStatus(data as FuelStatus[])
      // Broadcast updates to shared context
      data.forEach(fuel => {
        shared.setFuelUpdate(`${stationId}-${fuel.fuel_type}`, fuel)
      })
    }
  }

  const loadReports = async (stationId: string) => {
    const { data } = await supabase
      .from('user_reports')
      .select('*')
      .eq('station_id', stationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setReports(data as FuelReport[] || [])
  }

  const openEditModal = (fuel: FuelStatus) => {
    setEditingFuel(fuel)
    setModalStatus(fuel.status)
    setModalQueueLevel(fuel.queue_level.toString())
    setModalPrice(fuel.price_per_liter?.toString() || '')
  }

  const closeEditModal = () => {
    setEditingFuel(null)
    setModalStatus('')
    setModalQueueLevel('')
    setModalPrice('')
  }

  const saveFuelStatus = async () => {
    if (!editingFuel) return
    
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('fuel_status')
        .update({
          status: modalStatus,
          queue_level: parseInt(modalQueueLevel) || 0,
          price_per_liter: parseFloat(modalPrice) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingFuel.id)
      
      if (error) throw error
      
      // Update shared context
      const updatedFuel = { ...editingFuel, status: modalStatus, queue_level: parseInt(modalQueueLevel), price_per_liter: parseFloat(modalPrice) }
      shared.setFuelUpdate(`${selectedStation}-${editingFuel.fuel_type}`, updatedFuel)
      
      await loadFuelStatus(selectedStation)
      closeEditModal()
    } catch (error) {
      console.error('Error updating fuel status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmReport = (reportId: string) => {
    shared.confirmReport(reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  const deleteReport = (reportId: string) => {
    shared.deleteReport(reportId)
    setReports(prev => prev.filter(r => r.id !== reportId))
  }

  const getQueueLabel = (level: number) => {
    if (level <= 3) return 'Short'
    if (level <= 6) return 'Medium'
    return 'Long'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Staff Portal - Fuel Status Updates</h1>

        {/* System Reports Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Reports - Verify & Manage
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

        {/* Station Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Station</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Fuel Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fuelStatus.map((fuel) => (
                <div key={fuel.id} className="border border-border rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg capitalize">{fuel.fuel_type.replace('_', ' ')}</h3>
                    <Badge className="mt-1" variant={fuel.status === 'available' ? 'default' : fuel.status === 'low' ? 'secondary' : 'destructive'}>
                      {fuel.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Queue Level</p>
                      <p className="text-lg font-bold text-foreground">{getQueueLabel(fuel.queue_level)}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Price per Liter</p>
                      <p className="text-lg font-bold text-foreground">ETB {fuel.price_per_liter?.toFixed(2) || '-'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => openEditModal(fuel)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={!!editingFuel} onOpenChange={(open) => !open && closeEditModal()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Fuel Status</DialogTitle>
              <DialogDescription>
                Updating {editingFuel?.fuel_type.replace('_', ' ')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={modalStatus} onValueChange={setModalStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Queue Level</label>
                <Input
                  type="number"
                  value={modalQueueLevel}
                  onChange={(e) => setModalQueueLevel(e.target.value)}
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price per Liter (ETB)</label>
                <Input
                  type="number"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
              <Button onClick={saveFuelStatus} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
