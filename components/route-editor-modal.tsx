import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sampleStations } from '@/lib/sample-data'
import { MapPin, Truck, Fuel } from 'lucide-react'

interface RouteEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tanker: any
  currentDelivery: any
  onRouteChange: (tankerId: string, newStationId: string) => void
}

export function RouteEditorModal({ open, onOpenChange, tanker, currentDelivery, onRouteChange }: RouteEditorModalProps) {
  const [selectedStation, setSelectedStation] = useState(currentDelivery?.stationId || '')
  const [generating, setGenerating] = useState(false)

  const currentStation = sampleStations.find(s => s.id === currentDelivery?.stationId)
  const newStation = sampleStations.find(s => s.id === selectedStation)

  const handleApplyRoute = () => {
    setGenerating(true)
    setTimeout(() => {
      onRouteChange(tanker.id, selectedStation)
      setGenerating(false)
      onOpenChange(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Edit Route - {tanker?.plate}
          </DialogTitle>
          <DialogDescription>
            Change the delivery destination for this tanker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Route Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Current Route</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="font-medium">{currentStation?.name}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {currentDelivery?.quantity.toLocaleString()}L of {currentDelivery?.fuelType.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>

          {/* New Station Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select New Destination</label>
            <Select value={selectedStation} onValueChange={setSelectedStation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a station..." />
              </SelectTrigger>
              <SelectContent>
                {sampleStations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* New Route Preview */}
          {newStation && selectedStation !== currentDelivery?.stationId && (
            <Card className="border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900 dark:text-blue-100">New Route Preview</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{newStation.name}</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-200 ml-6">
                    Route will be calculated and optimized
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyRoute}
            disabled={!selectedStation || generating || selectedStation === currentDelivery?.stationId}
            className="gap-2"
          >
            {generating ? 'Generating Route...' : 'Apply Route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
