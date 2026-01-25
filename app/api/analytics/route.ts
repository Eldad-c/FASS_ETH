import { createClient } from '@/lib/supabase/server'
import { handleUnknownError, verifyRole } from '@/lib/api-helpers'
import { analyticsQuerySchema } from '@/lib/validations'
import { mapDatabaseFuelToApp } from '@/lib/fuel-helpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type') || 'overview'

    // Validate query parameters
    const validationResult = analyticsQuerySchema.safeParse({ type: typeParam })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { type } = validationResult.data
    const supabase = await createClient()

    // Verify user has admin or logistics role
    const { hasAccess, error: roleError } = await verifyRole(supabase, ['admin', 'logistics'])
    if (roleError || !hasAccess) {
      return roleError || NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    switch (type) {
      case 'overview': {
        // Get city-wide fuel availability trends
        const { data: fuelStatus } = await supabase
          .from('fuel_status')
          .select('*, stations!inner(*)')
          .eq('stations.is_active', true)

        const { data: stations } = await supabase
          .from('stations')
          .select('*')
          .eq('is_active', true)

        const { data: activeTrips } = await supabase
          .from('trips')
          .select('*')
          .eq('status', 'in_progress')

        const { data: pendingReports } = await supabase
          .from('user_reports')
          .select('*')
          .eq('status', 'pending')

        // Calculate fuel availability by type
        const fuelByType = {
          petrol: { available: 0, low: 0, out_of_stock: 0 },
          diesel: { available: 0, low: 0, out_of_stock: 0 },
          premium: { available: 0, low: 0, out_of_stock: 0 },
        }

        fuelStatus?.forEach((fs) => {
          const appFuelType = mapDatabaseFuelToApp(fs.fuel_type)
          const status = fs.status as 'available' | 'low' | 'out_of_stock'
          if (appFuelType && fuelByType[appFuelType] && fuelByType[appFuelType][status] !== undefined) {
            fuelByType[appFuelType][status]++
          }
        })

        // Calculate queue distribution
        const queueDistribution = {
          none: 0,
          short: 0,
          medium: 0,
          long: 0,
          very_long: 0,
        }

        fuelStatus?.forEach((fs) => {
          const queue = fs.queue_level as keyof typeof queueDistribution
          if (queue && queueDistribution[queue] !== undefined) {
            queueDistribution[queue]++
          }
        })

        return NextResponse.json({
          timestamp: new Date().toISOString(),
          cityOverview: {
            totalStations: stations?.length || 0,
            activeDeliveries: activeTrips?.length || 0,
            pendingReports: pendingReports?.length || 0,
          },
          fuelAvailability: fuelByType,
          queueDistribution,
          availabilityPercentage: {
            petrol: Math.round(
              (fuelByType.petrol.available /
                (fuelByType.petrol.available + fuelByType.petrol.low + fuelByType.petrol.out_of_stock || 1)) *
                100
            ),
            diesel: Math.round(
              (fuelByType.diesel.available /
                (fuelByType.diesel.available + fuelByType.diesel.low + fuelByType.diesel.out_of_stock || 1)) *
                100
            ),
            premium: Math.round(
              (fuelByType.premium.available /
                (fuelByType.premium.available + fuelByType.premium.low + fuelByType.premium.out_of_stock || 1)) *
                100
            ),
          },
        })
      }

      case 'stations': {
        // Get station-by-station breakdown
        const { data: stationsData } = await supabase
          .from('stations')
          .select(`
            *,
            fuel_status (*)
          `)
          .eq('is_active', true)
          .order('name')

        const stationAnalytics = stationsData?.map((station) => {
          const fuelStatus = station.fuel_status || []
          const hasAvailable = fuelStatus.some((f: { status: string }) => f.status === 'available')
          const hasLow = fuelStatus.some((f: { status: string }) => f.status === 'low')
          const queueLevels = fuelStatus.map((f: { queue_level: string }) => f.queue_level)
          const maxQueue = queueLevels.includes('very_long')
            ? 'very_long'
            : queueLevels.includes('long')
              ? 'long'
              : queueLevels.includes('medium')
                ? 'medium'
                : queueLevels.includes('short')
                  ? 'short'
                  : 'none'

          return {
            id: station.id,
            name: station.name,
            address: station.address,
            coordinates: { lat: station.latitude, lng: station.longitude },
            overallStatus: hasAvailable ? 'available' : hasLow ? 'low' : 'out_of_stock',
            maxQueueLevel: maxQueue,
            fuelStatus: fuelStatus.map((f: { fuel_type: string; status: string; price_per_liter: number | null; queue_level: string | null }) => ({
              type: mapDatabaseFuelToApp(f.fuel_type) || f.fuel_type,
              status: f.status,
              price: f.price_per_liter,
              queue: f.queue_level,
            })),
          }
        })

        return NextResponse.json({
          timestamp: new Date().toISOString(),
          stations: stationAnalytics,
        })
      }

      case 'deliveries': {
        // Get delivery analytics
        const { data: allTrips } = await supabase
          .from('trips')
          .select(`
            *,
            tankers (*),
            stations (*)
          `)
          .order('created_at', { ascending: false })
          .limit(100)

        const tripsByStatus = {
          scheduled: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
        }

        allTrips?.forEach((trip) => {
          const status = trip.status as keyof typeof tripsByStatus
          if (tripsByStatus[status] !== undefined) {
            tripsByStatus[status]++
          }
        })

        const completedTrips = allTrips?.filter((t) => t.status === 'completed') || []
        const avgDeliveryTime =
          completedTrips.length > 0
            ? Math.round(
                completedTrips.reduce((acc, t) => {
                  // Use actual_departure or scheduled_departure as fallback
                  const departure = t.actual_departure || t.scheduled_departure
                  if (t.actual_arrival && departure) {
                    return (
                      acc +
                      (new Date(t.actual_arrival).getTime() - new Date(departure).getTime()) /
                        60000
                    )
                  }
                  return acc
                }, 0) / completedTrips.length
              )
            : 0

        return NextResponse.json({
          timestamp: new Date().toISOString(),
          deliveryStats: {
            tripsByStatus,
            totalTrips: allTrips?.length || 0,
            averageDeliveryTimeMinutes: avgDeliveryTime,
            recentTrips: allTrips?.slice(0, 10).map((t) => ({
              id: t.id,
              tanker: (t.tankers as { plate_number?: string })?.plate_number || 'Unknown',
              station: (t.stations as { name?: string })?.name || 'Unknown',
              status: t.status,
              fuelType: t.fuel_type,
              quantity: t.quantity_liters,
            })),
          },
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }
  } catch (error) {
    return handleUnknownError(error)
  }
}
