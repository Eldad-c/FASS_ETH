'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Truck, MapPin, AlertCircle, Send, Navigation, Clock, Package, CheckCircle2 } from 'lucide-react'
import { sampleTankers, sampleStations } from '@/lib/sample-data'
import { DriverMap } from '@/components/driver-map'

interface RouteUpdate {
  id: string
  timestamp: string
  message: string
  priority: 'low' | 'normal' | 'high'
}

interface RouteIssue {
  id: string
  issue: string
  timestamp: string
  resolved: boolean
}

export default function DriverPage() {
  const [selectedDriver, setSelectedDriver] = useState(sampleTankers[0])
  const [issueReport, setIssueReport] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [reportedIssues, setReportedIssues] = useState<RouteIssue[]>([
    {
      id: 'issue-001',
      issue: 'Traffic congestion on route to Bole station',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      resolved: false,
    },
  ])
  const [routeUpdates, setRouteUpdates] = useState<RouteUpdate[]>([
    {
      id: 'update-001',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      message: 'Route updated: New destination - TotalEnergies Sarbet',
      priority: 'high',
    },
    {
      id: 'update-002',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      message: 'Safe driving reminder: Slow down in residential areas',
      priority: 'normal',
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

    setReportedIssues([newIssue, ...reportedIssues])
    setIssueReport('')
    setSubmitting(false)
    setSubmitSuccess(true)
    
    // Clear success message after 3 seconds
    setTimeout(() => setSubmitSuccess(false), 3000)
  }

  const getTimeAgo = (timestamp: string) => {
    const diffMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    return `${Math.floor(diffMinutes / 60)}h ago`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-500/20'
      case 'normal':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20'
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
              <p className="text-sm text-muted-foreground">Live tracking & route management</p>
            </div>
          </div>
          <Badge className="bg-green-500/10 text-green-700 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            Active Delivery
          </Badge>
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
          {/* Driver Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tanker</p>
                  <p className="text-lg font-semibold">{selectedDriver.plate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 capitalize">
                    {selectedDriver.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Location</p>
                  <p className="text-sm font-medium">{selectedDriver.latitude.toFixed(4)}, {selectedDriver.longitude.toFixed(4)}</p>
                </div>
                <Button className="w-full gap-2" variant="outline">
                  <Navigation className="h-4 w-4" />
                  Share Location
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Route Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Current Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">From</p>
                    <p className="font-semibold text-sm">Distribution Center</p>
                    <p className="text-xs text-muted-foreground">Addis Ababa</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">To</p>
                    <p className="font-semibold text-sm">{currentDestination?.name}</p>
                    <p className="text-xs text-muted-foreground">{currentDestination?.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Delivery Details</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">Fuel Type</p>
                      <p className="font-semibold">Diesel</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">Quantity</p>
                      <p className="font-semibold">20,000L</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-semibold">30 min</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full gap-2">
                  <Navigation className="h-4 w-4" />
                  Open in Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues & Updates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Route Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4" />
                Report Issues
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

                {/* Reported Issues */}
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Recent Issues</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {reportedIssues.map((issue) => (
                      <div key={issue.id} className="p-2 bg-muted/50 rounded border border-border/50">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="text-xs font-medium flex-1">{issue.issue}</p>
                          <Badge variant="outline" className="text-xs">
                            {issue.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(issue.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Updates from Logistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Route Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {routeUpdates.map((update) => (
                  <div key={update.id} className={`p-3 rounded-lg border ${getPriorityColor(update.priority)}`}>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <p className="text-sm font-medium flex-1">{update.message}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {update.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{getTimeAgo(update.timestamp)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
