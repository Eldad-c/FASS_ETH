'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Fuel, MapPin, Truck, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Station, Subscription } from '@/lib/types'

export default function SubscribePage() {
  const [stations, setStations] = useState<Station[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [selectedStation, setSelectedStation] = useState<string>('all')
  const [selectedFuelType, setSelectedFuelType] = useState<string>('all')
  const [notifyAvailable, setNotifyAvailable] = useState(true)
  const [notifyLow, setNotifyLow] = useState(true)
  const [notifyDelivery, setNotifyDelivery] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const fetchData = async () => {
      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      // Get stations
      const { data: stationsData } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      setStations(stationsData || [])

      // Get user subscriptions if logged in
      if (user) {
        const { data: subsData } = await supabase
          .from('subscriptions')
          .select('*, station:stations(*)')
          .eq('user_id', user.id)
          .eq('is_active', true)
        
        setSubscriptions(subsData || [])
      }
    }

    fetchData()
  }, [])

  const handleSubscribe = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'Please sign in to subscribe to alerts' })
      return
    }

    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        station_id: selectedStation === 'all' ? null : selectedStation,
        fuel_type: selectedFuelType === 'all' ? null : selectedFuelType,
        notify_on_available: notifyAvailable,
        notify_on_low: notifyLow,
        notify_on_delivery: notifyDelivery,
        is_active: true,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Successfully subscribed to alerts!' })
      
      // Refresh subscriptions
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*, station:stations(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      setSubscriptions(subsData || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async (subscriptionId: string) => {
    const supabase = createClient()

    try {
      await supabase
        .from('subscriptions')
        .update({ is_active: false })
        .eq('id', subscriptionId)

      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId))
    } catch (error) {
      console.error('Error unsubscribing:', error)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Fuel Alerts</h1>
            <p className="text-muted-foreground">
              Subscribe to get notified when fuel becomes available at your preferred stations
            </p>
          </div>

          {!user && (
            <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm">
                  <a href="/auth/login" className="font-medium text-primary hover:underline">Sign in</a> to subscribe to fuel alerts and manage your notifications.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
              <CardDescription>
                Choose your preferences to receive fuel availability notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="station">Station</Label>
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger id="station">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          All Stations
                        </div>
                      </SelectItem>
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
                  <Select value={selectedFuelType} onValueChange={setSelectedFuelType}>
                    <SelectTrigger id="fuelType">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4" />
                          All Fuel Types
                        </div>
                      </SelectItem>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notify me when:</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fuel Available</p>
                        <p className="text-xs text-muted-foreground">When fuel becomes available</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifyAvailable}
                      onCheckedChange={setNotifyAvailable}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-500/15 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Low Stock Warning</p>
                        <p className="text-xs text-muted-foreground">When stock is running low</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifyLow}
                      onCheckedChange={setNotifyLow}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Delivery Alerts</p>
                        <p className="text-xs text-muted-foreground">When a delivery is scheduled</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifyDelivery}
                      onCheckedChange={setNotifyDelivery}
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              <Button 
                onClick={handleSubscribe} 
                disabled={isLoading || !user}
                className="w-full"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe to Alerts'}
              </Button>
            </CardContent>
          </Card>

          {user && subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Active Subscriptions</CardTitle>
                <CardDescription>
                  Manage your existing fuel alert subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {sub.station ? sub.station.name : 'All Stations'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sub.fuel_type ? sub.fuel_type.charAt(0).toUpperCase() + sub.fuel_type.slice(1) : 'All Fuels'}
                            {' | '}
                            {[
                              sub.notify_on_available && 'Available',
                              sub.notify_on_low && 'Low Stock',
                              sub.notify_on_delivery && 'Delivery'
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleUnsubscribe(sub.id)}
                      >
                        Unsubscribe
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
