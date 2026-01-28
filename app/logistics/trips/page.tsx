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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Route, Plus, MapPin, Truck, Clock, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Trip, Tanker, Station, TripStatus, FuelType } from '@/lib/types'

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tanker_id: '',
    destination_station_id: '',
    fuel_type: 'diesel' as FuelType,
    quantity_liters: '',
    scheduled_departure: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()

    const [tripsResult, tankersResult, stationsResult] = await Promise.all([
      supabase
        .from('trips')
        .select('*, tanker:tankers(*), destination_station:stations!trips_destination_station_id_fkey(*)')
        .order('created_at', { ascending: false }),
      supabase.from('tankers').select('*').eq('status', 'available'),
      supabase.from('stations').select('*').eq('is_active', true).order('name'),
    ])

    setTrips(tripsResult.data || [])
    setTankers(tankersResult.data || [])
    setStations(stationsResult.data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    await supabase.from('trips').insert({
      tanker_id: formData.tanker_id,
      destination_station_id: formData.destination_station_id,
      fuel_type: formData.fuel_type,
      quantity_liters: parseInt(formData.quantity_liters),
      scheduled_departure: formData.scheduled_departure || null,
      status: 'scheduled',
      created_by: 'demo-user',
    })

    setIsDialogOpen(false)
    setFormData({
      tanker_id: '',
      destination_station_id: '',
      fuel_type: 'diesel',
      quantity_liters: '',
      scheduled_departure: '',
    })
    fetchData()
  }

  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    const supabase = createClient()

    const updates: Record<string, string> = { status }
    if (status === 'in_progress') {
      updates.actual_departure = new Date().toISOString()
    } else if (status === 'completed') {
      updates.actual_arrival = new Date().toISOString()
    }

    await supabase.from('trips').update(updates).eq('id', tripId)
    fetchData()
  }

  const statusColors: Record<TripStatus, string> = {
    scheduled: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
    in_progress: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    completed: 'bg-green-500/15 text-green-700 border-green-500/30',
    cancelled: 'bg-red-500/15 text-red-700 border-red-500/30',
  }

  const statusIcons: Record<TripStatus, typeof Clock> = {
    scheduled: Clock,
    in_progress: MapPin,
    completed: CheckCircle,
    cancelled: XCircle,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trip Management</h1>
          <p className="text-muted-foreground">Schedule and track fuel delivery trips</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Trip</DialogTitle>
              <DialogDescription>
                Create a new fuel delivery trip assignment
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tanker">Tanker</Label>
                <Select
                  value={formData.tanker_id}
                  onValueChange={(value) => setFormData({ ...formData, tanker_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tanker" />
                  </SelectTrigger>
                  <SelectContent>
                    {tankers.map((tanker) => (
                      <SelectItem key={tanker.id} value={tanker.id}>
                        {tanker.plate_number} ({tanker.capacity_liters.toLocaleString()}L)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination Station</Label>
                <Select
                  value={formData.destination_station_id}
                  onValueChange={(value) => setFormData({ ...formData, destination_station_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value: FuelType) => setFormData({ ...formData, fuel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="benzene_95">Benzene 95</SelectItem>
                      <SelectItem value="benzene_97">Benzene 97</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (Liters)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity_liters}
                    onChange={(e) => setFormData({ ...formData, quantity_liters: e.target.value })}
                    placeholder="e.g., 20000"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure">Scheduled Departure</Label>
                <Input
                  id="departure"
                  type="datetime-local"
                  value={formData.scheduled_departure}
                  onChange={(e) => setFormData({ ...formData, scheduled_departure: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Trip</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
          <CardDescription>Manage scheduled and active delivery trips</CardDescription>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Route className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No trips scheduled yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanker</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => {
                  const StatusIcon = statusIcons[trip.status]
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[trip.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {trip.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {trip.tanker?.plate_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{trip.destination_station?.name || 'N/A'}</TableCell>
                      <TableCell>{trip.fuel_type === 'diesel' ? 'Diesel' : trip.fuel_type === 'benzene_95' ? 'Benzene 95' : trip.fuel_type === 'benzene_97' ? 'Benzene 97' : trip.fuel_type}</TableCell>
                      <TableCell>{trip.quantity_liters.toLocaleString()}L</TableCell>
                      <TableCell>
                        {trip.scheduled_departure
                          ? new Date(trip.scheduled_departure).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {trip.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTripStatus(trip.id, 'in_progress')}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => updateTripStatus(trip.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {trip.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTripStatus(trip.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

  const updateTripStatus = async (tripId: string, status: TripStatus) => {
    const supabase = createClient()

    const updates: Record<string, string> = { status }
    if (status === 'in_progress') {
      updates.actual_departure = new Date().toISOString()
    } else if (status === 'completed') {
      updates.actual_arrival = new Date().toISOString()
    }

    await supabase.from('trips').update(updates).eq('id', tripId)
    fetchData()
  }

  const statusColors: Record<TripStatus, string> = {
    scheduled: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
    in_progress: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    completed: 'bg-green-500/15 text-green-700 border-green-500/30',
    cancelled: 'bg-red-500/15 text-red-700 border-red-500/30',
  }

  const statusIcons: Record<TripStatus, typeof Clock> = {
    scheduled: Clock,
    in_progress: MapPin,
    completed: CheckCircle,
    cancelled: XCircle,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trip Management</h1>
          <p className="text-muted-foreground">Schedule and track fuel delivery trips</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Trip</DialogTitle>
              <DialogDescription>
                Create a new fuel delivery trip assignment
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tanker">Tanker</Label>
                <Select
                  value={formData.tanker_id}
                  onValueChange={(value) => setFormData({ ...formData, tanker_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tanker" />
                  </SelectTrigger>
                  <SelectContent>
                    {tankers.map((tanker) => (
                      <SelectItem key={tanker.id} value={tanker.id}>
                        {tanker.plate_number} ({tanker.capacity_liters.toLocaleString()}L)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination Station</Label>
                <Select
                  value={formData.destination_station_id}
                  onValueChange={(value) => setFormData({ ...formData, destination_station_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelType">Fuel Type</Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value: FuelType) => setFormData({ ...formData, fuel_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="benzene_95">Benzene 95</SelectItem>
                      <SelectItem value="benzene_97">Benzene 97</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (Liters)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity_liters}
                    onChange={(e) => setFormData({ ...formData, quantity_liters: e.target.value })}
                    placeholder="e.g., 20000"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure">Scheduled Departure</Label>
                <Input
                  id="departure"
                  type="datetime-local"
                  value={formData.scheduled_departure}
                  onChange={(e) => setFormData({ ...formData, scheduled_departure: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Trip</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
          <CardDescription>Manage scheduled and active delivery trips</CardDescription>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Route className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No trips scheduled yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanker</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => {
                  const StatusIcon = statusIcons[trip.status]
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[trip.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {trip.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {trip.tanker?.plate_number || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{trip.destination_station?.name || 'N/A'}</TableCell>
                      <TableCell>{trip.fuel_type === 'diesel' ? 'Diesel' : trip.fuel_type === 'benzene_95' ? 'Benzene 95' : trip.fuel_type === 'benzene_97' ? 'Benzene 97' : trip.fuel_type}</TableCell>
                      <TableCell>{trip.quantity_liters.toLocaleString()}L</TableCell>
                      <TableCell>
                        {trip.scheduled_departure
                          ? new Date(trip.scheduled_departure).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {trip.status === 'scheduled' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTripStatus(trip.id, 'in_progress')}
                              >
                                Start
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => updateTripStatus(trip.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {trip.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTripStatus(trip.id, 'completed')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
