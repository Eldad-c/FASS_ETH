import { createClient } from '@/lib/supabase/server'
import { StationsTable } from '@/components/admin/stations-table'
import { validatePagination } from '@/lib/pagination'

export default async function StationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams

  const { page, limit } = validatePagination(resolvedSearchParams?.page, resolvedSearchParams?.limit)
  const offset = (page - 1) * limit

  const { data: stations, count: totalStations } = await supabase
    .from('stations')
    .select('*, fuel_status(*)', { count: 'exact' })
    .order('name')
    .range(offset, offset + limit - 1)

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stations Management</h1>
        <p className="text-muted-foreground">Manage fuel stations and their availability status</p>
      </div>
      <StationsTable
        stations={stations || []}
        page={page}
        limit={limit}
        total={totalStations || 0}
      />
    </main>
  )
}
