'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FuelReportProps {
  stations: Array<{ id: string; name: string }>
}

export function FuelReportForm({ stations }: FuelReportProps) {
  const [selectedStation, setSelectedStation] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const fuelTypes = ['PETROL_95', 'PETROL_91', 'DIESEL', 'JET_A1']
  const statuses = ['available', 'low', 'out_of_stock']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('fuel_reports').insert([
        {
          station_id: selectedStation,
          fuel_type: fuelType,
          reported_status: status,
          description: description || null,
          reporter_email: email,
          is_verified: false,
        },
      ])

      if (error) throw error

      setSubmitted(true)
      setSelectedStation('')
      setFuelType('')
      setStatus('')
      setEmail('')
      setDescription('')

      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Report Fuel Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-700">Report submitted successfully</p>
              <p className="text-sm text-green-600">Thank you for helping us stay accurate</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Station *</label>
              <Select value={selectedStation} onValueChange={setSelectedStation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a station" />
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

            <div>
              <label className="text-sm font-medium mb-2 block">Fuel Type *</label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status *</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Email *</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Details (optional)</label>
              <Textarea
                placeholder="Add any additional information about the fuel status..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedStation || !fuelType || !status || !email}
              className="w-full"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
