'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Fuel, 
  Users, 
  Truck,
  RefreshCw,
  Download,
  FileText,
  Loader2
} from 'lucide-react'

interface AnalyticsData {
  timestamp: string
  cityOverview: {
    totalStations: number
    activeDeliveries: number
    pendingReports: number
  }
  fuelAvailability: {
    diesel: { available: number; low: number; out_of_stock: number }
    benzene_95: { available: number; low: number; out_of_stock: number }
    benzene_97: { available: number; low: number; out_of_stock: number }
  }
  queueDistribution: {
    none: number
    short: number
    medium: number
    long: number
    very_long: number
  }
  availabilityPercentage: {
    diesel: number
    benzene_95: number
    benzene_97: number
  }
}

type ReportType = 'FUEL_TRENDS' | 'USER_ACTIVITY' | 'REPORT_STATS'

interface SavedReport {
  id: string
  report_type: string
  generated_at: string
  date_range_start: string | null
  date_range_end: string | null
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Use Case 5: Generate Reports
  const [reportType, setReportType] = useState<ReportType>('FUEL_TRENDS')
  const [dateStart, setDateStart] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [generateLoading, setGenerateLoading] = useState(false)
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analytics?type=overview')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedReports = async () => {
    try {
      const res = await fetch('/api/analytics/reports')
      if (res.ok) {
        const { reports } = await res.json()
        setSavedReports(reports || [])
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchAnalytics()
    fetchSavedReports()
  }, [])

  const generateReport = async () => {
    setGenerateLoading(true)
    setTimeoutMessage(null)
    try {
      const res = await fetch('/api/analytics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          dateRangeStart: new Date(dateStart).toISOString(),
          dateRangeEnd: new Date(dateEnd + 'T23:59:59').toISOString(),
        }),
      })
      const json = await res.json()
      if (json.timeout) {
        setTimeoutMessage(json.message || 'Report will be emailed to you')
        return
      }
      setTimeoutMessage(null)
      fetchSavedReports()
    } catch {
      setError('Failed to generate report')
    } finally {
      setGenerateLoading(false)
    }
  }

  const exportData = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fas-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <main className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'No data available'}</p>
            <Button onClick={fetchAnalytics} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            City-Wide Analytics
          </h1>
          <p className="text-muted-foreground">
            Real-time fuel availability trends across Addis Ababa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Use Case 5: Generate Report - reportType, dateRange, Generate, timeout/email */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
          <CardDescription>Select report type and date range. Long runs may be emailed.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FUEL_TRENDS">Fuel Trends</SelectItem>
                <SelectItem value="USER_ACTIVITY">User Activity</SelectItem>
                <SelectItem value="REPORT_STATS">Report Stats</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <Button onClick={generateReport} disabled={generateLoading}>
            {generateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate Report
          </Button>
          {timeoutMessage && (
            <p className="text-sm text-amber-600">{timeoutMessage}</p>
          )}
        </CardContent>
      </Card>

      {savedReports.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
            <CardDescription>Export reports (exportReport)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {savedReports.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">
                    {r.report_type} — {new Date(r.generated_at).toLocaleString()}
                  </span>
                  <a
                    href={`/api/analytics/reports/${r.id}?export=1`}
                    download
                    className="text-sm text-primary hover:underline"
                  >
                    Export
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mb-6">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </p>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stations
            </CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.cityOverview.totalStations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.cityOverview.activeDeliveries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reports
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.cityOverview.pendingReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Availability by Type */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fuel Availability by Type
            </CardTitle>
            <CardDescription>
              Distribution of availability status across all stations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(['diesel', 'benzene_95', 'benzene_97'] as const).map((fuelType) => {
              const fuel = data.fuelAvailability[fuelType]
              const total = fuel.available + fuel.low + fuel.out_of_stock || 1
              const label = fuelType === 'diesel' ? 'Diesel' : fuelType === 'benzene_95' ? 'Benzene 95' : 'Benzene 97'
              return (
                <div key={fuelType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <Badge variant="outline">
                      {data.availabilityPercentage[fuelType]}% Available
                    </Badge>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${(fuel.available / total) * 100}%` }}
                    />
                    <div
                      className="bg-yellow-500 h-full"
                      style={{ width: `${(fuel.low / total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(fuel.out_of_stock / total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Available: {fuel.available}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-yellow-500" />
                      Low: {fuel.low}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Out: {fuel.out_of_stock}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Queue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Queue Distribution
            </CardTitle>
            <CardDescription>
              Current queue levels across all fuel pumps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'none', label: 'No Queue', color: 'bg-green-500' },
              { key: 'short', label: 'Short (1-5)', color: 'bg-green-400' },
              { key: 'medium', label: 'Medium (6-15)', color: 'bg-yellow-500' },
              { key: 'long', label: 'Long (16-30)', color: 'bg-orange-500' },
              { key: 'very_long', label: 'Very Long (30+)', color: 'bg-red-500' },
            ].map(({ key, label, color }) => {
              const count = data.queueDistribution[key as keyof typeof data.queueDistribution]
              const total = Object.values(data.queueDistribution).reduce((a, b) => a + b, 0) || 1
              const percentage = Math.round((count / total) * 100)
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${color}`} />
                      {label}
                    </span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Analytics Data (JSON)</CardTitle>
          <CardDescription>
            Complete analytics payload for integration with external systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  )
}
