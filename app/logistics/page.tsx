'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Truck, MapPin, Clock, AlertCircle, Fuel, Navigation } from 'lucide-react'
import LogisticsMapComponent from '@/components/logistics-map'
import { RouteEditorModal } from '@/components/route-editor-modal'
import { DeliveryReportModal } from '@/components/delivery-report-modal'
import { sampleTankers, sampleStations, sampleDeliveries, sampleRestockingTimes } from '@/lib/sample-data'

interface Delivery {
  id: string
  tankerId: string
  stationId: string
  fuelType: string
  quantity: number
  eta: string
  status: 'in_transit' | 'arrived' | 'completed'
}

export default function LogisticsHubPage() {
  const [selectedTanker, setSelectedTanker] = useState<string | null>(null)
  const [routeEditorOpen, setRouteEditorOpen] = useState(false)
  const [reportViewOpen, setReportViewOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [deliveries, setDeliveries] = useState(sampleDeliveries)

  // Calculate active deliveries
  const activeDeliveries = deliveries.filter((d: Delivery) => d.status === 'in_transit' || d.status === 'arrived')
  
  // Get fleet summary
  const fleetSummary = {
    total: sampleTankers.length,
    inTransit: sampleTankers.filter((t: any) => t.status === 'in_transit').length,
    available: sampleTankers.filter((t: any) => t.status === 'available').length,
    maintenance: sampleTankers.filter((t: any) => t.status === 'maintenance').length,
  }

  // Calculate ETA
  const getETA = (etaString: string) => {
    const eta = new Date(etaString)
    const now = new Date()
    const diffMinutes = Math.floor((eta.getTime() - now.getTime()) / 60000)
    
    if (diffMinutes < 0) return 'Arrived'
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
  }

  const handleRouteChange = (tankerId: string, newStationId: string) => {
    // Update the delivery with new station
    setDeliveries((prev) =>
      prev.map((delivery) =>
        delivery.tankerId === tankerId
          ? { ...delivery, stationId: newStationId }
          : delivery
      )
    )
    setSelectedTanker(null)
  }

  const handleViewDetails = (delivery: any) => {
    setSelectedDelivery(delivery)
    setReportViewOpen(true)
  }

  const currentTanker = sampleTankers.find((t) => t.id === selectedTanker)
  const currentDelivery = deliveries.find((d) => d.tankerId === selectedTanker)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Truck className="h-6 w-6 text-red-600" />
                Logistics Hub
              </h1>
              <p className="text-sm text-muted-foreground">Fleet tracking & route management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-700 rounded-full text-sm">
            <Truck className="h-4 w-4" />
            Live Tracking
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-12">
        {/* Map Section */}
        <Card className="overflow-hidden mb-6 h-[500px]">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fleet Map & Delivery Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-60px)]">
            <LogisticsMapComponent />
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Fleet Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fleet Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-muted-foreground">Total Tankers</span>
                  <span className="text-2xl font-bold">{fleetSummary.total}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    In Transit
                  </span>
                  <span className="font-semibold">{fleetSummary.inTransit}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Available
                  </span>
                  <span className="font-semibold">{fleetSummary.available}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Maintenance
                  </span>
                  <span className="font-semibold">{fleetSummary.maintenance}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Deliveries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-2 border-b">
                  <p className="text-3xl font-bold text-primary">{activeDeliveries.length}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                {activeDeliveries.map((delivery: Delivery) => {
                  const station = sampleStations.find(s => s.id === delivery.stationId)
                  return (
                    <div key={delivery.id} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium capitalize">{delivery.fuelType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{station?.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{delivery.quantity}L</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Estimated Delivery Times */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estimated Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeDeliveries.slice(0, 4).map((delivery: Delivery) => {
                  const station = sampleStations.find(s => s.id === delivery.stationId)
                  return (
                    <div key={delivery.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground truncate flex-1 mr-2">{station?.name}</span>
                      <span className="font-semibold text-primary flex items-center gap-1 whitespace-nowrap">
                        <Clock className="h-3 w-3" />
                        {getETA(delivery.eta)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restocking Schedule & Route Editing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Station Restocking Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Fuel className="h-4 w-4" />
                Station Restocking Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sampleRestockingTimes.map((restock: any) => {
                  const station = sampleStations.find(s => s.id === restock.stationId)
                  return (
                    <div key={restock.id} className="p-3 border border-border rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm">{station?.name}</p>
                        <Badge variant="outline" className="text-xs">{restock.fuelType.replace('_', ' ')}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Next Restock: {new Date(restock.nextRestockTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p>Current Level: {restock.currentLevel} / {restock.capacity}L</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Route Editing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4" />
                Edit Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">Select a tanker on the map to edit its route</p>
                {sampleTankers.filter((t: any) => t.status === 'in_transit').map((tanker: any) => (
                  <div key={tanker.id} className="p-3 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedTanker(tanker.id)}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium text-sm">{tanker.plate}</p>
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">{tanker.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Current Route: {tanker.currentRoute || 'Not assigned'}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs flex-1"
                        onClick={() => {
                          setSelectedTanker(tanker.id)
                          setRouteEditorOpen(true)
                        }}
                      >
                        Change Route
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs flex-1"
                        onClick={() => {
                          const delivery = deliveries.find(d => d.tankerId === tanker.id)
                          if (delivery) handleViewDetails(delivery)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Route Editor Modal */}
      {currentTanker && currentDelivery && (
        <RouteEditorModal
          open={routeEditorOpen}
          onOpenChange={setRouteEditorOpen}
          tanker={currentTanker}
          currentDelivery={currentDelivery}
          onRouteChange={handleRouteChange}
        />
      )}

      {/* Delivery Report Modal */}
      {selectedDelivery && (
        <DeliveryReportModal
          open={reportViewOpen}
          onOpenChange={setReportViewOpen}
          delivery={selectedDelivery}
        />
      )}
    </div>
  )
}
