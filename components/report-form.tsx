'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { FuelType, AvailabilityStatus } from '@/lib/types'

interface Station {
  id: string
  name: string
  address: string
}

interface ReportFormProps {
  stations: Station[]
}

export function ReportForm({ stations }: ReportFormProps) {
  const router = useRouter()
  const [stationId, setStationId] = useState('')
  const [fuelType, setFuelType] = useState<FuelType | ''>('')
  const [status, setStatus] = useState<AvailabilityStatus | ''>('')
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
            Your report has been submitted and will be reviewed by station staff.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a Report</CardTitle>
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

          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select value={fuelType} onValueChange={(v) => setFuelType(v as FuelType)}>
              <SelectTrigger id="fuelType">
                <SelectValue placeholder="Select fuel type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Availability Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AvailabilityStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any additional details about the fuel situation..."
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
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
