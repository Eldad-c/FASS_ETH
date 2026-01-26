'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { UserReport, AvailabilityStatus, ReportStatus } from '@/lib/types'
import { PaginationControls } from '@/components/pagination-controls'

interface ReportsTableProps {
  reports: (UserReport & {
    stations?: { name: string } | null
    profiles?: { email: string; full_name: string | null } | null
  })[]
  page: number
  limit: number
  total: number
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  out_of_stock: 'bg-red-500/15 text-red-700 border-red-500/30',
}

const reportStatusColors: Record<ReportStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  verified: 'bg-green-500/15 text-green-700 border-green-500/30',
  rejected: 'bg-red-500/15 text-red-700 border-red-500/30',
}

export function ReportsTable({ reports: initialReports, page, limit, total }: ReportsTableProps) {
  const [reports, setReports] = useState(initialReports)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    setReports(initialReports)
  }, [initialReports])

  const filteredReports = useMemo(() => {
    const s = search.toLowerCase().trim()
    return reports.filter((r) => {
      const matchesSearch =
        !s ||
        r.stations?.name?.toLowerCase().includes(s) ||
        r.profiles?.email?.toLowerCase().includes(s)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [reports, search, statusFilter])

  const handleAction = async (reportId: string, action: ReportStatus) => {
    setProcessing(reportId)
    const supabase = createClient()

    const { error } = await supabase
      .from('user_reports')
      .update({ status: action })
      .eq('id', reportId)

    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: action } : r)))
    }

    setProcessing(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle>All Reports ({total})</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ReportStatus | 'all')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-label="User reports">
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Reported Status</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.stations?.name || 'Unknown'}</TableCell>
                    <TableCell>{report.fuel_type === 'diesel' ? 'Diesel' : report.fuel_type === 'benzene_95' ? 'Benzene 95' : report.fuel_type === 'benzene_97' ? 'Benzene 97' : report.fuel_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[report.reported_status]}>
                        {report.reported_status.replaceAll('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {report.comment || '-'}
                    </TableCell>
                    <TableCell>{report.profiles?.email || 'Anonymous'}</TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={reportStatusColors[report.status]}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleAction(report.id, 'verified')}
                            disabled={processing === report.id}
                            aria-label="Verify report"
                          >
                            {processing === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction(report.id, 'rejected')}
                            disabled={processing === report.id}
                            aria-label="Reject report"
                          >
                            {processing === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4">
          <PaginationControls page={page} limit={limit} total={total} />
        </div>
      </CardContent>
    </Card>
  )
}
