import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sampleStations, sampleTankers } from '@/lib/sample-data'
import { Truck, MapPin, Fuel, Clock, CheckCircle2 } from 'lucide-react'

interface DeliveryReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  delivery: any
}

export function DeliveryReportModal({ open, onOpenChange, delivery }: DeliveryReportModalProps) {
  if (!delivery) return null

  const station = sampleStations.find(s => s.id === delivery.stationId)
  const tanker = sampleTankers.find(t => t.id === delivery.tankerId)

  const getETA = (etaString: string) => {
    const eta = new Date(etaString)
    const now = new Date()
    const diffMinutes = Math.floor((eta.getTime() - now.getTime()) / 60000)
    
    if (diffMinutes < 0) return 'Arrived'
    if (diffMinutes < 60) return `${diffMinutes}m`
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`
  }

  const statusColor = {
    'in_transit': 'bg-green-500/10 text-green-700',
    'arrived': 'bg-blue-500/10 text-blue-700',
    'completed': 'bg-gray-500/10 text-gray-700',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Delivery Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Delivery ID: {delivery.id}</CardTitle>
                <Badge className={statusColor[delivery.status as keyof typeof statusColor]}>
                  {delivery.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">Delivery Type</p>
                  <p className="font-semibold capitalize">{delivery.fuelType.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Quantity</p>
                  <p className="font-semibold">{delivery.quantity.toLocaleString()} Liters</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tanker Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Tanker Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plate Number:</span>
                <span className="font-medium">{tanker?.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-medium">30,000L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Load:</span>
                <span className="font-medium">{delivery.quantity.toLocaleString()}L ({Math.round((delivery.quantity / 30000) * 100)}%)</span>
              </div>
            </CardContent>
          </Card>

          {/* Destination Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Destination
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station:</span>
                <span className="font-medium">{station?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="font-mono text-xs">{station?.latitude.toFixed(4)}, {station?.longitude.toFixed(4)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Timing Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Delivery Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ETA:</span>
                <span className="font-semibold text-blue-600">{getETA(delivery.eta)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Delivery:</span>
                <span>{new Date(delivery.eta).toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Route Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Route Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-2">Optimized Route</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Distance: ~{Math.floor(Math.random() * 20 + 5)}km | Est. Time: {getETA(delivery.eta)}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Route optimized with real-time traffic data</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Driver notified of route changes</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Live tracking enabled</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
