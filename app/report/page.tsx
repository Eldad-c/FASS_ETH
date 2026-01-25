import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ReportForm } from '@/components/report-form'

export default async function ReportPage() {
  const supabase = await createClient()

  const { data: stations } = await supabase
    .from('stations')
    .select('id, name, address')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-balance">
            Report Fuel Status
          </h1>
          <p className="text-muted-foreground">
            Help other drivers by reporting the current fuel availability at a station
          </p>
        </div>

        <ReportForm stations={stations || []} />
      </main>
    </div>
  )
}
