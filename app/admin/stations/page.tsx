import { createClient } from '@/lib/supabase/server'
import { StationsTable } from '@/components/admin/stations-table'

export default async function StationsPage() {
  const supabase = await createClient()

  const { data: stations } = await supabase
    .from('stations')
    .select('*, fuel_status(*)')
    .order('name')

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stations Management</h1>
        <p className="text-muted-foreground">Manage fuel stations and their availability status</p>
      </div>
      <StationsTable stations={stations || []} />
    </main>
  )
}
