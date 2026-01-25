'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Server, 
  Database, 
  Map, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'

interface HealthData {
  status: string
  timestamp: string
  version: string
  services: {
    database: { status: string; latencyMs: number; error: string | null }
    api: { status: string }
    gebetaMaps: { status: string }
  }
  stats: {
    stations: number
    users: number
    trips: number
    reports: number
  }
}

export default function AdminSettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/system/health')
      const data = await res.json()
      setHealth(data)
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
      case 'not_configured':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'configured':
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30">Healthy</Badge>
      case 'degraded':
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">Degraded</Badge>
      case 'not_configured':
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30">Not Configured</Badge>
      default:
        return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">Error</Badge>
    }
  }

  return (
    <main className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Monitor system health and manage configurations
          </p>
        </div>
        <Button onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {health && (
        <>
          {/* Overall Status */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Overall system health as of {new Date(health.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
                {getStatusBadge(health.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{health.stats.stations}</p>
                  <p className="text-sm text-muted-foreground">Stations</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{health.stats.users}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{health.stats.trips}</p>
                  <p className="text-sm text-muted-foreground">Trips</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{health.stats.reports}</p>
                  <p className="text-sm text-muted-foreground">Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Status */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
                {getStatusIcon(health.services.database.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(health.services.database.status)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-medium">{health.services.database.latencyMs}ms</span>
                  </div>
                  {health.services.database.error && (
                    <p className="text-xs text-destructive mt-2">
                      {health.services.database.error}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  API Server
                </CardTitle>
                {getStatusIcon(health.services.api.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(health.services.api.status)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">{health.version}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Gebeta Maps
                </CardTitle>
                {getStatusIcon(health.services.gebetaMaps.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    {getStatusBadge(health.services.gebetaMaps.status)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Key</span>
                    <span className="font-medium">
                      {health.services.gebetaMaps.status === 'configured' ? 'Set' : 'Missing'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">Application</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name</span>
                      <span>TotalEnergiesEthiopia FAS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span>{health.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Environment</span>
                      <span>Production</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Integrations</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Database</span>
                      <span>Supabase PostgreSQL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maps</span>
                      <span>Gebeta Maps API</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auth</span>
                      <span>Supabase Auth (RBAC)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!health && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to fetch system health</p>
            <Button onClick={fetchHealth} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
