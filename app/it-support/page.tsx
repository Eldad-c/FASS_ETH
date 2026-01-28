import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, AlertTriangle, Server, Database, Cpu } from 'lucide-react'
import { ITSupportActions } from './it-support-actions'

export default async function ITSupportPage() {
  const supabase = await createClient()

  // Get system health and getMetrics (Use Case 7: Maintain System Health)
  // Use VERCEL_URL in production, or construct from environment
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  (process.env.NODE_ENV === 'production' ? null : 'http://localhost:3000')
  
  let health = null
  if (baseUrl) {
    try {
      const healthResponse = await fetch(`${baseUrl}/api/system/health`, {
        // Add cache control for server-side fetch
        cache: 'no-store',
      })
      health = healthResponse.ok ? await healthResponse.json() : null
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    }
  }

  // Get recent system logs
  const { data: recentLogs } = await supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get error logs
  const { data: errorLogs } = await supabase
    .from('system_logs')
    .select('*')
    .in('log_level', ['ERROR', 'CRITICAL'])
    .order('created_at', { ascending: false })
    .limit(20)

  const metrics = health?.metrics

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">IT Support Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health, apply patches, trigger backups (Use Case 7: Maintain System Health)
          </p>
        </div>

        {/* Apply Security Patch & Trigger Backup (Use Case 7) */}
        <ITSupportActions />

        {/* getMetrics: CPU, Memory, DB_Connections (Use Case 7) */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  load1: {typeof metrics.CPU?.load1 === 'number' ? metrics.CPU.load1.toFixed(2) : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">
                  load5: {typeof metrics.CPU?.load5 === 'number' ? metrics.CPU.load5.toFixed(2) : 'N/A'} · load15: {typeof metrics.CPU?.load15 === 'number' ? metrics.CPU.load15.toFixed(2) : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Memory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  heapUsed: {typeof metrics.Memory?.heapUsed === 'number' ? `${(metrics.Memory.heapUsed / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">
                  rss: {typeof metrics.Memory?.rss === 'number' ? `${(metrics.Memory.rss / 1024 / 1024).toFixed(1)} MB` : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  DB Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{String(metrics.DB_Connections ?? 'N/A')}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {health?.status?.toUpperCase() || 'UNKNOWN'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                health?.services?.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {health?.services?.database?.status?.toUpperCase() || 'UNKNOWN'}
              </div>
              <div className="text-xs text-muted-foreground">
                {health?.services?.database?.latencyMs || 0}ms
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Errors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {errorLogs?.filter(log => log.log_level === 'CRITICAL').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Recent Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentLogs?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Error Logs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Errors & Critical Issues</CardTitle>
            <CardDescription>System errors requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {errorLogs && errorLogs.length > 0 ? (
              <div className="space-y-2">
                {errorLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`border rounded-lg p-4 ${
                      log.log_level === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold">{log.log_level}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-1">{log.service}</div>
                    <div className="text-sm">{log.message}</div>
                    {log.metadata && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No errors found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent System Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent System Logs</CardTitle>
            <CardDescription>Latest system activity</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs && recentLogs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{log.service}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`text-xs mb-1 ${
                      log.log_level === 'ERROR' ? 'text-red-600' :
                      log.log_level === 'WARNING' ? 'text-orange-600' :
                      log.log_level === 'CRITICAL' ? 'text-red-800 font-bold' :
                      'text-muted-foreground'
                    }`}>
                      {log.log_level}
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No logs available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
