'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ApprovalFormProps {
  approvalId: string
}

export function ApprovalForm({ approvalId }: ApprovalFormProps) {
  const router = useRouter()
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (approveAction: 'approve' | 'reject') => {
    setAction(approveAction)
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/fuel-status/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuelStatusId: approvalId, // This is the pending_approval ID
          action: approveAction,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process approval')
      }

      // Redirect back to manager dashboard
      router.push('/manager')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review & Decision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Review Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about your decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => handleSubmit('approve')}
            disabled={loading}
            className="flex-1"
            variant="default"
          >
            {loading && action === 'approve' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </>
            )}
          </Button>
          <Button
            onClick={() => handleSubmit('reject')}
            disabled={loading}
            className="flex-1"
            variant="destructive"
          >
            {loading && action === 'reject' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
