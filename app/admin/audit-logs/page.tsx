import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClipboardList } from 'lucide-react'

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, profiles(email, full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const actionColors: Record<string, string> = {
    INSERT: 'bg-green-500/15 text-green-700 border-green-500/30',
    UPDATE: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
    DELETE: 'bg-red-500/15 text-red-700 border-red-500/30',
  }

  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all system changes and activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {(log.profiles as { email: string; full_name: string | null })?.email || 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionColors[log.action] || ''}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                      <TableCell className="max-w-[300px]">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground hover:text-foreground">
                            View changes
                          </summary>
                          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                            {log.new_values ? (
                              <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                            ) : (
                              <span className="text-muted-foreground">No data</span>
                            )}
                          </div>
                        </details>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No audit logs recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
