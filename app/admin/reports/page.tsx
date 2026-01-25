import { createClient } from '@/lib/supabase/server'
import { ReportsTable } from '@/components/admin/reports-table'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('user_reports')
    .select('*, stations(name), profiles(email, full_name)')
    .order('created_at', { ascending: false })

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Reports</h1>
        <p className="text-muted-foreground">Review and manage user-submitted fuel availability reports</p>
      </div>
      <ReportsTable reports={reports || []} />
    </main>
  )
}
