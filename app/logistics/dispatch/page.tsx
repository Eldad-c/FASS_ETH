'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Bell, 
  Plus, 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Send,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Station {
  id: string
  name: string
  address: string
}

interface Tanker {
  id: string
  plate_number: string
  capacity_liters: number
  status: string
  driver_id: string
  profiles?: {
    full_name: string
  }
}

interface PendingRequest {
  id: string
  station_id: string
  fuel_type: string
  priority: string
  stations: Station
}

export default function DispatchPage() {
  const [stations, setStations] = useState<Station[]>([])
  const [tankers, setTankers] = useState<Tanker[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form state
  const [selectedStation, setSelectedStation] = useState('')
  const [selectedTanker, setSelectedTanker] = useState('')
  const [selectedFuelType, setSelectedFuelType] = useState<string>('')
  const [quantity, setQuantity] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    const [stationsRes, tankersRes] = await Promise.all([
      supabase.from('stations').select('*').eq('is_active', true).order('name'),
      supabase.from('tankers').select('*, profiles(full_name)').eq('status', 'available'),
    ])

    setStations(stationsRes.data || [])
    setTankers(tankersRes.data || [])
    
    // Fetch stations with low fuel as pending requests
    const { data: fuelStatus } = await supabase
      .from('fuel_status')
      .select('*, stations(*)')
      .in('status', ['low', 'out_of_stock'])

    const requests = (fuelStatus || []).map(fs => ({
      id: fs.id,
      station_id: fs.station_id,
      fuel_type: fs.fuel_type,
      priority: fs.status === 'out_of_stock' ? 'high' : 'medium',
      stations: fs.stations
    }))

    setPendingRequests(requests as PendingRequest[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDispatch = async () => {
    if (!selectedStation || !selectedTanker || !selectedFuelType || !quantity) return

    setDispatching(true)
    const supabase = createClient()

    // Create a new trip
    const { error } = await supabase.from('trips').insert({
      tanker_id: selectedTanker,
      destination_station_id: selectedStation,
      fuel_type: selectedFuelType,
      quantity_liters: parseInt(quantity),
      status: 'scheduled',
      estimated_arrival: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    })

    if (!error) {
      // Update tanker status
      await supabase
        .from('tankers')
        .update({ status: 'in_transit' })
        .eq('id', selectedTanker)

      // Create notification
      await supabase.from('notifications').insert({
        station_id: selectedStation,
        title: 'Fuel Dispatch Scheduled',
        message: `A tanker with ${quantity}L of ${selectedFuelType} has been dispatched to your station.`,
        type: 'delivery',
      })

      setDialogOpen(false)
      setSelectedStation('')
      setSelectedTanker('')
      setSelectedFuelType('')
      setQuantity('')
      fetchData()
    }

    setDispatching(false)
  }

  const quickDispatch = async (request: PendingRequest) => {
    const availableTanker = tankers[0]
    if (!availableTanker) {
      alert('No available tankers')
      return
    }

    setDispatching(true)
    const supabase = createClient()

    await supabase.from('trips').insert({
      tanker_id: availableTanker.id,
      destination_station_id: request.station_id,
      fuel_type: request.fuel_type,
      quantity_liters: availableTanker.capacity_liters,
      status: 'scheduled',
      estimated_arrival: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

    await supabase
      .from('tankers')
      .update({ status: 'in_transit' })
      .eq('id', availableTanker.id)

    fetchData()
    setDispatching(false)
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">High Priority</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">Medium</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Dispatch Control
          </h1>
          <p className="text-muted-foreground">Manage fuel dispatches and respond to requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dispatch</DialogTitle>
              <DialogDescription>
                Schedule a fuel delivery to a station
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Station</Label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map(station => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanker</Label>
                <Select value={selectedTanker} onValueChange={setSelectedTanker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tanker" />
                  </SelectTrigger>
                  <SelectContent>
                    {tankers.map(tanker => (
                      <SelectItem key={tanker.id} value={tanker.id}>
                        {tanker.plate_number} ({tanker.capacity_liters}L)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petrol">Petrol</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity (Liters)</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDispatch}
                disabled={dispatching || !selectedStation || !selectedTanker || !selectedFuelType || !quantity}
              >
                {dispatching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Dispatch
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Resources */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Available Tankers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{tankers.length}</p>
            <p className="text-sm text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
            <p className="text-sm text-muted-foreground">Stations need fuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Requests</CardTitle>
          <CardDescription>Stations with low or no fuel that need resupply</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{request.stations?.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        Needs {request.fuel_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getPriorityBadge(request.priority)}
                    <Button
                      size="sm"
                      onClick={() => quickDispatch(request)}
                      disabled={dispatching || tankers.length === 0}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Quick Dispatch
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending fuel requests</p>
              <p className="text-sm">All stations are well-stocked</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
