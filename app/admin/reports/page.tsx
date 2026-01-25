import { createClient } from '@/lib/supabase/server'
import { ReportsTable } from '@/components/admin/reports-table'
import { validatePagination } from '@/lib/pagination'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams

  const { page, limit } = validatePagination(resolvedSearchParams?.page, resolvedSearchParams?.limit)
  const offset = (page - 1) * limit

  const { data: reports, count: totalReports } = await supabase
    .from('user_reports')
    .select('*, stations(name), profiles(email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Reports</h1>
        <p className="text-muted-foreground">Review and manage user-submitted fuel availability reports</p>
      </div>
      <ReportsTable reports={reports || []} page={page} limit={limit} total={totalReports || 0} />
    </main>
  )
}
