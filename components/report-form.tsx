'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Loader2, Users, Clock, Fuel } from 'lucide-react'
import type { FuelType, AvailabilityStatus, QueueLevel } from '@/lib/types'

interface Station {
  id: string
  name: string
  address: string
}

interface ReportFormProps {
  stations: Station[]
}

const queueLabels: Record<QueueLevel, { label: string; description: string; color: string }> = {
  none: { label: 'No Queue', description: '0 vehicles waiting', color: 'bg-green-500' },
  short: { label: 'Short Queue', description: '1-5 vehicles', color: 'bg-green-400' },
  medium: { label: 'Medium Queue', description: '6-15 vehicles', color: 'bg-yellow-500' },
  long: { label: 'Long Queue', description: '16-30 vehicles', color: 'bg-orange-500' },
  very_long: { label: 'Very Long Queue', description: '30+ vehicles', color: 'bg-red-500' },
}

export function ReportForm({ stations }: ReportFormProps) {
  const router = useRouter()
  const [stationId, setStationId] = useState('')
  const [fuelType, setFuelType] = useState<FuelType | ''>('')
  const [status, setStatus] = useState<AvailabilityStatus | ''>('')
  const [queueLevel, setQueueLevel] = useState<QueueLevel>('none')
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stationId || !fuelType || !status) return

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: submitError } = await supabase.from('user_reports').insert({
      station_id: stationId,
      fuel_type: fuelType,
      reported_status: status,
      reported_queue_level: queueLevel,
      estimated_wait_time: estimatedWaitTime > 0 ? estimatedWaitTime : null,
      comment: comment || null,
    })

    setLoading(false)

    if (submitError) {
      setError('Failed to submit report. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
          <p className="text-muted-foreground text-center">
            Your report has been submitted and will help other drivers find fuel.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Crowdsource reports are reviewed by station staff for verification.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5" />
          Crowdsource Report
        </CardTitle>
        <CardDescription>
          Help other drivers by reporting the current fuel situation at a station
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="station">Select Station</Label>
            <Select value={stationId} onValueChange={setStationId}>
              <SelectTrigger id="station">
                <SelectValue placeholder="Choose a station..." />
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
              <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelType)}>
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Availability</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AvailabilityStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Available
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Low Stock
                    </span>
                  </SelectItem>
                  <SelectItem value="out_of_stock">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Out of Stock
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Queue Level Section */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-medium">Queue Estimation</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="queueLevel">Current Queue Level</Label>
              <Select value={queueLevel} onValueChange={(v) => setQueueLevel(v as QueueLevel)}>
                <SelectTrigger id="queueLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(queueLabels) as [QueueLevel, typeof queueLabels[QueueLevel]][]).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${value.color}`} />
                        {value.label} - {value.description}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="waitTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Estimated Wait Time
                </Label>
                <span className="text-sm font-medium">
                  {estimatedWaitTime === 0 ? 'No wait' : `${estimatedWaitTime} min`}
                </span>
              </div>
              <Slider
                id="waitTime"
                value={[estimatedWaitTime]}
                onValueChange={(v) => setEstimatedWaitTime(v[0])}
                max={120}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 min</span>
                <span>30 min</span>
                <span>60 min</span>
                <span>90 min</span>
                <span>120 min</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="E.g., 'Station is busy but moving fast', 'Only premium available', etc."
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !stationId || !fuelType || !status}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              'Submit Crowdsource Report'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
