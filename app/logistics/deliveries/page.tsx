'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Fuel
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Delivery {
  id: string
  trip_id: string
  station_id: string
  fuel_type: string
  quantity_liters: number
  delivered_at: string
  status: string
  trips: {
    tankers: {
      plate_number: string
    } | null
  } | null
  stations: {
    name: string
    address: string
  } | null
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeliveries = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        trips (
          tankers (plate_number)
        ),
        stations (name, address)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    setDeliveries((data as Delivery[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchDeliveries()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30">Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const completedDeliveries = deliveries.filter(d => d.status === 'confirmed')
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending')
  const totalLiters = completedDeliveries.reduce((acc, d) => acc + d.quantity_liters, 0)

  return (
    <main className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Delivery Records
          </h1>
          <p className="text-muted-foreground">Track all fuel deliveries to stations</p>
        </div>
        <Button onClick={fetchDeliveries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveries.length}</p>
                <p className="text-xs text-muted-foreground">Total Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedDeliveries.length}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingDeliveries.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{(totalLiters / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground">Liters Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>All recorded fuel deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Station</TableHead>
                  <TableHead>Tanker</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{delivery.stations?.name}</p>
                          <p className="text-xs text-muted-foreground">{delivery.stations?.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {delivery.trips?.tankers?.plate_number || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{delivery.fuel_type === 'diesel' ? 'Diesel' : delivery.fuel_type === 'benzene_95' ? 'Benzene 95' : delivery.fuel_type === 'benzene_97' ? 'Benzene 97' : delivery.fuel_type}</TableCell>
                    <TableCell>{delivery.quantity_liters.toLocaleString()} L</TableCell>
                    <TableCell>
                      {new Date(delivery.delivered_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No deliveries recorded yet
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
