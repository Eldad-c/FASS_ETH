'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Truck, MapPin, AlertCircle, Send, Navigation, Clock, Package, CheckCircle2, Copy, MapArrowRight } from 'lucide-react'
import { sampleTankers, sampleStations } from '@/lib/sample-data'
import { DriverMap } from '@/components/driver-map'
import { useShared } from '@/lib/shared-context'

interface RouteIssue {
  id: string
  issue: string
  timestamp: string
  resolved: boolean
}

export default function DriverPage() {
  const shared = useShared()
  const [selectedDriver, setSelectedDriver] = useState(sampleTankers[0])
  const [issueReport, setIssueReport] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [locationCopied, setLocationCopied] = useState(false)
  const [routeUpdates, setRouteUpdates] = useState<any[]>([
    {
      id: 'update-001',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      message: 'Route updated: New destination assigned',
      priority: 'high',
    },
  ])

  const currentDestination = sampleStations.find(s => s.id === 'stn-001')

  const handleReportIssue = async () => {
    if (!issueReport.trim()) return

    setSubmitting(true)
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newIssue: RouteIssue = {
      id: `issue-${Date.now()}`,
      issue: issueReport,
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    shared.addRouteIssue(newIssue)
    setIssueReport('')
    setSubmitting(false)
    setSubmitSuccess(true)
    
    setTimeout(() => setSubmitSuccess(false), 3000)
  }

  const handleShareLocation = async () => {
    const location = `https://maps.google.com/?q=${selectedDriver.latitude},${selectedDriver.longitude}`
    try {
      await navigator.clipboard.writeText(location)
      setLocationCopied(true)
      setTimeout(() => setLocationCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy location:', error)
    }
  }

  const handleOpenMaps = () => {
    if (currentDestination) {
      const url = `https://www.google.com/maps/dir/${selectedDriver.latitude},${selectedDriver.longitude}/${currentDestination.latitude},${currentDestination.longitude}`
      window.open(url, '_blank')
    }
  }

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
                <Truck className="h-6 w-6 text-blue-600" />
                Driver Portal
              </h1>
              <p className="text-sm text-muted-foreground">Real-time delivery tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-700 rounded-full text-sm">
            <Navigation className="h-4 w-4" />
            Live Route
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-12">
        {/* Map Section */}
        <Card className="overflow-hidden mb-6 h-[400px]">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live Route Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-60px)]">
            <DriverMap 
              driverLocation={{ latitude: selectedDriver.latitude, longitude: selectedDriver.longitude }}
              destination={{ 
                latitude: currentDestination?.latitude || 9.0054,
                longitude: currentDestination?.longitude || 38.7815,
                name: currentDestination?.name || 'TotalEnergies Bole'
              }}
            />
          </CardContent>
        </Card>

        {/* Driver Info & Location */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Current Trip */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tanker</p>
                  <p className="text-lg font-semibold">{selectedDriver.plate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Destination</p>
                  <p className="text-lg font-semibold">{currentDestination?.name}</p>
                  <p className="text-sm text-muted-foreground">{currentDestination?.address}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Fuel Type</p>
                    <p className="font-semibold capitalize">Diesel</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                    <p className="font-semibold">20,000L</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ETA</p>
                    <p className="font-semibold">30 mins</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={handleShareLocation}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Copy className="h-4 w-4" />
                  {locationCopied ? 'Copied!' : 'Share Location'}
                </Button>
                <Button 
                  onClick={handleOpenMaps}
                  className="w-full gap-2"
                >
                  <MapArrowRight className="h-4 w-4" />
                  Open in Maps
                </Button>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Coordinates</p>
                  <p className="text-sm font-mono">{selectedDriver.latitude.toFixed(4)}, {selectedDriver.longitude.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Route Updates & Issue Reporting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4" />
                Route Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {routeUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No route updates yet</p>
                ) : (
                  routeUpdates.map((update) => (
                    <div key={update.id} className={`p-3 border rounded-lg ${update.priority === 'high' ? 'border-red-200/50 bg-red-50/50 dark:bg-red-950/20' : 'border-border bg-muted/50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{update.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {update.priority === 'high' && (
                          <Badge className="bg-red-600">High</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Issue Reporting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Report Route Issue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Textarea
                  placeholder="Report any route issues, delays, or problems (traffic, vehicle issues, etc.)"
                  value={issueReport}
                  onChange={(e) => setIssueReport(e.target.value)}
                  className="min-h-24 resize-none"
                  disabled={submitting}
                />
                {submitSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-200">Issue reported successfully!</span>
                  </div>
                )}
                <Button 
                  onClick={handleReportIssue} 
                  className="w-full gap-2" 
                  disabled={!issueReport.trim() || submitting}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-t-primary animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Issue Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reported Issues */}
        {shared.routeIssues.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Your Reported Issues ({shared.routeIssues.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {shared.routeIssues.map((issue) => (
                  <div key={issue.id} className="p-3 border border-border rounded-lg bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm">{issue.issue}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(issue.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={issue.resolved ? 'bg-green-500/10 text-green-700' : 'bg-yellow-500/10 text-yellow-700'}>
                        {issue.resolved ? 'Resolved' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
