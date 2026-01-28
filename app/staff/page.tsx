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
import { Edit2 } from 'lucide-react'

interface FuelStatus {
  id: string
  fuel_type: string
  status: string
  is_available: boolean
  queue_level: number
  price_per_liter: number
}

export default function StaffPage() {
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<any[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [fuelStatus, setFuelStatus] = useState<FuelStatus[]>([])
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
  }, [])

  const loadStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('id, name')
      .order('name')
    
    if (data && data.length > 0) {
      setStations(data)
      setSelectedStation(data[0].id)
      loadFuelStatus(data[0].id)
    }
    setLoading(false)
  }

  const loadFuelStatus = async (stationId: string) => {
    const { data } = await supabase
      .from('fuel_status')
      .select('id, fuel_type, status, is_available, queue_level, price_per_liter')
      .eq('station_id', stationId)
    
    setFuelStatus(data || [])
  }

  const handleStationChange = (value: string) => {
    setSelectedStation(value)
    loadFuelStatus(value)
  }

  const openEditModal = (fuel: FuelStatus) => {
    setEditingFuel(fuel)
    setModalStatus(fuel.status)
    setModalQueueLevel(fuel.queue_level.toString())
    setModalPrice(fuel.price_per_liter.toString())
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
        })
        .eq('id', editingFuel.id)
      
      if (error) throw error
      
      await loadFuelStatus(selectedStation)
      closeEditModal()
    } catch (error) {
      console.error('Error updating fuel status:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const currentStation = stations.find(s => s.id === selectedStation)
  const statusColors = {
    available: 'bg-green-500/10 text-green-700 border-green-500/20',
    low: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    out_of_stock: 'bg-red-500/10 text-red-700 border-red-500/20',
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Staff Portal</h1>
          <p className="text-muted-foreground mt-1">Update fuel availability and pricing in real-time</p>
        </div>

        {/* Station Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Station</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStation} onValueChange={handleStationChange}>
              <SelectTrigger>
                <SelectValue />
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
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">Fuel Status at {currentStation?.name}</h2>
          
          {fuelStatus.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">No fuel status data available</p>
              </CardContent>
            </Card>
          ) : (
            fuelStatus.map((fuel) => (
              <Card key={fuel.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg font-semibold text-foreground capitalize">
                          {fuel.fuel_type.replace('_', ' ')}
                        </h3>
                        <Badge 
                          variant="outline"
                          className={statusColors[fuel.status as keyof typeof statusColors] || 'bg-gray-500/10 text-gray-700'}
                        >
                          {fuel.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Queue Level</p>
                          <p className="text-lg font-bold text-foreground">{fuel.queue_level} cars</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p className="text-lg font-bold text-foreground">ETB {fuel.price_per_liter.toFixed(2)}/L</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Availability</p>
                          <p className="text-lg font-bold text-foreground">
                            {fuel.is_available ? 'In Stock' : 'Out of Stock'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => openEditModal(fuel)}
                      variant="outline"
                      size="sm"
                      className="gap-2 whitespace-nowrap"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingFuel} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update {editingFuel?.fuel_type.replace('_', ' ')} Status
            </DialogTitle>
            <DialogDescription>
              Modify the fuel status, queue level, and pricing information
            </DialogDescription>
          </DialogHeader>

          {editingFuel && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Fuel Status *</label>
                <Select value={modalStatus} onValueChange={setModalStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Queue Level (cars) *</label>
                <Input
                  type="number"
                  min="0"
                  value={modalQueueLevel}
                  onChange={(e) => setModalQueueLevel(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Price per Liter (ETB) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveFuelStatus}
              disabled={submitting || !modalStatus || !modalQueueLevel || !modalPrice}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
