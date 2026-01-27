'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<any[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [fuelStatus, setFuelStatus] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      loadStations()
      setLoading(false)
    }
    checkAuth()
  }, [])

  const loadStations = async () => {
    const { data } = await supabase
      .from('stations')
      .select('id, name')
      .order('name')
    
    if (data && data.length > 0) {
      setStations(data)
      setSelectedStation(data[0].id)
      loadFuelStatus(data[0].id)
    }
  }

  const loadFuelStatus = async (stationId: string) => {
    const { data } = await supabase
      .from('fuel_status')
      .select('id, fuel_type, status, is_available, queue_level, price_per_liter')
      .eq('station_id', stationId)
    
    setFuelStatus(data || [])
  }

  const handleStationChange = (value: string) => {
    setSelectedStation(value)
    loadFuelStatus(value)
  }

  const updateFuelStatus = async (fuelStatusId: string, newStatus: string) => {
    setRefreshing(true)
    const { error } = await supabase
      .from('fuel_status')
      .update({ status: newStatus })
      .eq('id', fuelStatusId)
    
    if (!error) {
      loadFuelStatus(selectedStation)
    }
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const currentStation = stations.find(s => s.id === selectedStation)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Portal</h1>
            <p className="text-muted-foreground mt-1">Manage fuel availability at your station</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Station Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Station</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStation} onValueChange={handleStationChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Fuel Status */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Status at {currentStation?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fuelStatus.length === 0 ? (
                <p className="text-muted-foreground">No fuel status data</p>
              ) : (
                fuelStatus.map((fuel) => (
                  <div key={fuel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-foreground capitalize">{fuel.fuel_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Status: <Badge variant={fuel.is_available ? 'default' : 'destructive'}>
                          {fuel.is_available ? 'Available' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Queue: <Badge variant="outline">{fuel.queue_level}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Price: ETB {fuel.price_per_liter}/L
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => updateFuelStatus(fuel.id, 'available')}
                        disabled={refreshing}
                      >
                        Available
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateFuelStatus(fuel.id, 'low')}
                        disabled={refreshing}
                      >
                        Low
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => updateFuelStatus(fuel.id, 'out_of_stock')}
                        disabled={refreshing}
                      >
                        Out
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
