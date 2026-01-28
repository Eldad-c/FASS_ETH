'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Truck, MapPin } from 'lucide-react'
import LogisticsMapComponent from '@/components/logistics-map'

export default function LogisticsPage() {
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
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-700 rounded-full text-sm">
            <Truck className="h-4 w-4" />
            Live Tracking
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-12">
        {/* Map Section */}
        <Card className="overflow-hidden h-[600px]">
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
      </main>
    </div>
  )
}
