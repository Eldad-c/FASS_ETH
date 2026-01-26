import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'

export default async function StationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get station details
  const { data: station, error: stationError } = await supabase
    .from('stations')
    .select(`
      *,
      fuel_status (*)
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (stationError || !station) {
    notFound()
  }

  // Get historical data (last 7 days)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 7)

  const { data: history } = await supabase
    .from('fuel_status_history')
    .select('*')
    .eq('station_id', params.id)
    .gte('recorded_at', cutoffDate.toISOString())
    .order('recorded_at', { ascending: false })
    .limit(100)

  // Group history by date
  const historyByDate = (history || []).reduce((acc, record) => {
    const date = new Date(record.recorded_at).toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(record)
    return acc
  }, {} as Record<string, typeof history>)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Station Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{station.name}</h1>
            <Button asChild variant="outline">
              <Link href="/report">Report Status</Link>
            </Button>
          </div>
          <div className="space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{station.address}</span>
            </div>
            {station.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{station.phone}</span>
              </div>
            )}
            {station.operating_hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{station.operating_hours}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Fuel Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Fuel Availability</CardTitle>
            <CardDescription>Real-time fuel status at this station</CardDescription>
          </CardHeader>
          <CardContent>
            {station.fuel_status && station.fuel_status.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {station.fuel_status.map((fuel: any) => {
                  const statusColor =
                    fuel.status === 'available'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : fuel.status === 'low'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'

                  return (
                    <div key={fuel.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{fuel.fuel_type}</div>
                        <Badge className={statusColor}>{fuel.status}</Badge>
                      </div>
                      {fuel.price_per_liter && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {fuel.price_per_liter} ETB/L
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mb-2">
                        Queue: {fuel.queue_level || 'Unknown'}
                      </div>
                      {fuel.trust_score && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-3 w-3" />
                          <span>Trust: {(fuel.trust_score * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {fuel.last_updated && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Updated: {new Date(fuel.last_updated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No fuel status information available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Availability (Last 7 Days) */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Availability</CardTitle>
            <CardDescription>Fuel availability trends over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(historyByDate)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .map(([date, records]) => (
                    <div key={date} className="border rounded-lg p-4">
                      <div className="font-semibold mb-3">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {records.map((record: any) => {
                          const statusIcon =
                            record.is_available || record.status === 'available' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : record.status === 'low' ? (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )

                          return (
                            <div
                              key={record.id}
                              className="flex items-center gap-2 text-sm border rounded p-2"
                            >
                              {statusIcon}
                              <div>
                                <div className="font-medium">{record.fuel_type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(record.recorded_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No historical data available for the last 7 days
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
