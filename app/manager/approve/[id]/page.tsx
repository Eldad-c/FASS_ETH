import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ApprovalForm } from '@/components/manager/approval-form'

export default async function ApprovalReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get pending approval details
  const { data: approval, error: approvalError } = await supabase
    .from('pending_approvals')
    .select(`
      *,
      fuel_status:fuel_status_id (*),
      station:stations (*),
      submitter:profiles!pending_approvals_submitted_by_fkey (name, email, role)
    `)
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .single()

  if (approvalError || !approval) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Update</h1>
          <p className="text-muted-foreground">
            Review and approve or reject the fuel status update
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Update Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Station</Label>
              <p className="font-semibold">{approval.station?.name}</p>
              <p className="text-sm text-muted-foreground">{approval.station?.address}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Fuel Type</Label>
              <p className="font-semibold">{approval.fuel_status?.fuel_type}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge className="ml-2">
                {approval.fuel_status?.status || 'Unknown'}
              </Badge>
            </div>
            {approval.fuel_status?.queue_level && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Queue Level</Label>
                <p className="font-semibold">{approval.fuel_status.queue_level}</p>
              </div>
            )}
            {approval.fuel_status?.price_per_liter && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Price per Liter</Label>
                <p className="font-semibold">{approval.fuel_status.price_per_liter} ETB</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Submitted By</Label>
              <p className="font-semibold">{approval.submitter?.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{approval.submitter?.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Submitted At</Label>
              <p className="text-sm">
                {new Date(approval.submitted_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <ApprovalForm approvalId={params.id} />
      </div>
    </div>
  )
}
