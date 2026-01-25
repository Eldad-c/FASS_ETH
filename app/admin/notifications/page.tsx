import { createClient } from '@/lib/supabase/server'
import { NotificationsManager } from '@/components/admin/notifications-manager'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, stations(name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Send and manage system notifications</p>
      </div>
      <NotificationsManager notifications={notifications || []} stations={stations || []} />
    </main>
  )
}
