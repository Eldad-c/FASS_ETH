import { createClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/admin/users-table'
import { validatePagination } from '@/lib/pagination'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string; filter?: string }>
}) {
  const supabase = await createClient()
  const resolvedSearchParams = await searchParams

  const { page, limit } = validatePagination(
    resolvedSearchParams?.page,
    resolvedSearchParams?.limit
  )
  const offset = (page - 1) * limit

  const filter = resolvedSearchParams?.filter?.toLowerCase()

  const query = supabase
    .from('profiles')
    .select('*, stations(id, name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filter === 'banned') {
    query.eq('is_banned', true)
  } else if (filter === 'active') {
    query.eq('is_banned', false)
  }

  const { data: users, count: totalUsers } = await query

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and role assignments</p>
      </div>
      <UsersTable
        users={users || []}
        stations={stations || []}
        page={page}
        limit={limit}
        total={totalUsers || 0}
      />
    </main>
  )
}
