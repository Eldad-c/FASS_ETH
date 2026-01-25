import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Route, Package, MapPin, Clock, CheckCircle } from 'lucide-react'

export default async function LogisticsDashboardPage() {
  const supabase = await createClient()

  // Fetch tankers
  const { data: tankers } = await supabase
    .from('tankers')
    .select('*, driver:profiles(*)')

  // Fetch trips
  const { data: trips } = await supabase
    .from('trips')
    .select('*, tanker:tankers(*), destination_station:stations!trips_destination_station_id_fkey(*)')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch deliveries
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('*, station:stations(*)')
    .order('created_at', { ascending: false })
    .limit(10)

  const tankersList = tankers || []
  const tripsList = trips || []
  const deliveriesList = deliveries || []

  // Calculate stats
  const availableTankers = tankersList.filter(t => t.status === 'available').length
  const inTransitTankers = tankersList.filter(t => t.status === 'in_transit').length
  const activeTrips = tripsList.filter(t => t.status === 'in_progress').length
  const pendingDeliveries = deliveriesList.filter(d => d.status === 'pending').length

  const statusColors: Record<string, string> = {
    available: 'bg-green-500/15 text-green-700 border-green-500/30',
    in_transit: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    maintenance: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
    offline: 'bg-red-500/15 text-red-700 border-red-500/30',
    scheduled: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
    in_progress: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    completed: 'bg-green-500/15 text-green-700 border-green-500/30',
    cancelled: 'bg-red-500/15 text-red-700 border-red-500/30',
    pending: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
    delivered: 'bg-green-500/15 text-green-700 border-green-500/30',
    failed: 'bg-red-500/15 text-red-700 border-red-500/30',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Logistics Dashboard</h1>
        <p className="text-muted-foreground">
          Manage fleet operations, track deliveries, and dispatch tankers
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{availableTankers}</p>
                <p className="text-sm text-muted-foreground">Available Tankers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{inTransitTankers}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Route className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{activeTrips}</p>
                <p className="text-sm text-muted-foreground">Active Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{pendingDeliveries}</p>
                <p className="text-sm text-muted-foreground">Pending Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fleet Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fleet Status
            </CardTitle>
            <CardDescription>Current status of all tankers</CardDescription>
          </CardHeader>
          <CardContent>
            {tankersList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tankers registered</p>
            ) : (
              <div className="space-y-3">
                {tankersList.slice(0, 5).map((tanker) => (
                  <div key={tanker.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tanker.plate_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {tanker.capacity_liters.toLocaleString()}L capacity
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[tanker.status]}>
                      {tanker.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Recent Trips
            </CardTitle>
            <CardDescription>Latest scheduled and active trips</CardDescription>
          </CardHeader>
          <CardContent>
            {tripsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No trips scheduled</p>
            ) : (
              <div className="space-y-3">
                {tripsList.slice(0, 5).map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        trip.status === 'in_progress' ? 'bg-blue-500/10' :
                        trip.status === 'completed' ? 'bg-green-500/10' : 'bg-purple-500/10'
                      }`}>
                        {trip.status === 'in_progress' ? (
                          <MapPin className="h-5 w-5 text-blue-600" />
                        ) : trip.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          To {trip.destination_station?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {trip.quantity_liters.toLocaleString()}L {trip.fuel_type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[trip.status]}>
                      {trip.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Deliveries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Queue
            </CardTitle>
            <CardDescription>Upcoming and pending deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveriesList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No pending deliveries</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {deliveriesList.slice(0, 6).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        delivery.status === 'delivered' ? 'bg-green-500/10' :
                        delivery.status === 'in_transit' ? 'bg-blue-500/10' : 'bg-yellow-500/10'
                      }`}>
                        <Package className={`h-5 w-5 ${
                          delivery.status === 'delivered' ? 'text-green-600' :
                          delivery.status === 'in_transit' ? 'text-blue-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{delivery.station?.name || 'Unknown Station'}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.quantity_liters.toLocaleString()}L {delivery.fuel_type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[delivery.status]}>
                      {delivery.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
