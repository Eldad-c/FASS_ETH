'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Truck, Plus, MapPin, User, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Tanker, Profile, TankerStatus } from '@/lib/types'

export default function FleetPage() {
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTanker, setEditingTanker] = useState<Tanker | null>(null)
  const [formData, setFormData] = useState({
    plate_number: '',
    capacity_liters: '',
    status: 'available' as TankerStatus,
    driver_id: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [tankersResult, driversResult] = await Promise.all([
      supabase.from('tankers').select('*, driver:profiles(*)').order('plate_number'),
      supabase.from('profiles').select('*').eq('role', 'driver'),
    ])

    setTankers(tankersResult.data || [])
    setDrivers(driversResult.data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const data = {
      plate_number: formData.plate_number,
      capacity_liters: parseInt(formData.capacity_liters),
      status: formData.status,
      driver_id: formData.driver_id || null,
    }

    if (editingTanker) {
      await supabase.from('tankers').update(data).eq('id', editingTanker.id)
    } else {
      await supabase.from('tankers').insert(data)
    }

    setIsDialogOpen(false)
    setEditingTanker(null)
    setFormData({ plate_number: '', capacity_liters: '', status: 'available', driver_id: '' })
    fetchData()
  }

  const openEditDialog = (tanker: Tanker) => {
    setEditingTanker(tanker)
    setFormData({
      plate_number: tanker.plate_number,
      capacity_liters: tanker.capacity_liters.toString(),
      status: tanker.status,
      driver_id: tanker.driver_id || '',
    })
    setIsDialogOpen(true)
  }

  const statusColors: Record<TankerStatus, string> = {
    available: 'bg-green-500/15 text-green-700 border-green-500/30',
    in_transit: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    maintenance: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
    offline: 'bg-red-500/15 text-red-700 border-red-500/30',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fleet Management</h1>
          <p className="text-muted-foreground">Manage your tanker fleet and assign drivers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTanker(null)
              setFormData({ plate_number: '', capacity_liters: '', status: 'available', driver_id: '' })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tanker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTanker ? 'Edit Tanker' : 'Add New Tanker'}</DialogTitle>
              <DialogDescription>
                {editingTanker ? 'Update tanker details' : 'Register a new tanker to your fleet'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Plate Number</Label>
                <Input
                  id="plate"
                  value={formData.plate_number}
                  onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                  placeholder="e.g., 3-AA-12345"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Liters)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity_liters}
                  onChange={(e) => setFormData({ ...formData, capacity_liters: e.target.value })}
                  placeholder="e.g., 30000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: TankerStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver">Assigned Driver</Label>
                <Select
                  value={formData.driver_id || "unassigned"}
                  onValueChange={(value) => setFormData({ ...formData, driver_id: value === "unassigned" ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No driver assigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name || driver.email || 'Unknown Driver'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTanker ? 'Update' : 'Add'} Tanker
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{tankers.length}</p>
            <p className="text-sm text-muted-foreground">Total Tankers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {tankers.filter(t => t.status === 'available').length}
            </p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {tankers.filter(t => t.status === 'in_transit').length}
            </p>
            <p className="text-sm text-muted-foreground">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {tankers.filter(t => t.status === 'maintenance').length}
            </p>
            <p className="text-sm text-muted-foreground">Maintenance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tankers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tankers.map((tanker) => (
          <Card key={tanker.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tanker.plate_number}</CardTitle>
                    <CardDescription>{tanker.capacity_liters.toLocaleString()}L capacity</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={statusColors[tanker.status]}>
                  {tanker.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{tanker.driver?.full_name || 'No driver assigned'}</span>
              </div>
              {tanker.current_latitude && tanker.current_longitude && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {tanker.current_latitude.toFixed(4)}, {tanker.current_longitude.toFixed(4)}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={() => openEditDialog(tanker)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </CardContent>
          </Card>
        ))}

        {tankers.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No tankers registered yet. Add your first tanker to get started.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tanker
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
