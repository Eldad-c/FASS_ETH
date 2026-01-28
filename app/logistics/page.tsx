'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Truck, Zap } from 'lucide-react'
import LogisticsMapComponent from '@/components/logistics-map'

export default function LogisticsPage() {
  const [isCollapsed, setIsCollapsed] = useState(false)

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
                Logistics Manager
              </h1>
              <p className="text-sm text-muted-foreground">Real-time fleet tracking & route management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-sm">
            <Zap className="h-4 w-4" />
            Live Updates
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-12">
        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Fleet Size</p>
                <p className="text-3xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground mt-1">Total Tankers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Coverage</p>
                <p className="text-3xl font-bold text-blue-600">5</p>
                <p className="text-xs text-muted-foreground mt-1">Delivery Stations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Capacity</p>
                <p className="text-3xl font-bold text-green-600">140K</p>
                <p className="text-xs text-muted-foreground mt-1">Total Liters</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fleet Map & Delivery Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: '600px' }}>
              <LogisticsMapComponent />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Fleet Overview</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">In Transit:</span>
                  <span className="font-medium text-green-600">3 tankers</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium text-yellow-600">1 tanker</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Maintenance:</span>
                  <span className="font-medium text-red-600">1 tanker</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Active Deliveries</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Diesel:</span>
                  <span className="font-medium">1 delivery</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Benzene 95:</span>
                  <span className="font-medium">1 delivery</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Benzene 97:</span>
                  <span className="font-medium">1 delivery</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Features Info */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Features
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Real-time tanker tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Live delivery updates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Route optimization
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                ETA calculations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Fleet status monitoring
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Dynamic route editing
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Import icon we used above
import { MapPin } from 'lucide-react'
