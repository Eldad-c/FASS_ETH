import { createClient } from '@/lib/supabase/server'
import { UsersTable } from '@/components/admin/users-table'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*, stations(id, name)')
    .order('created_at', { ascending: false })

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
      <UsersTable users={users || []} stations={stations || []} />
    </main>
  )
}
