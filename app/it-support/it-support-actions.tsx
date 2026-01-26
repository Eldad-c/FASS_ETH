'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, HardDrive, Loader2 } from 'lucide-react'

/**
 * Use Case 7: Maintain System Health
 * - applySecurityPatch(patchID)
 * - triggerBackup()
 */
export function ITSupportActions() {
  const [patchID, setPatchID] = useState('')
  const [patchLoading, setPatchLoading] = useState(false)
  const [patchDone, setPatchDone] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupDone, setBackupDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyPatch = async () => {
    if (!patchID.trim()) return
    setPatchLoading(true)
    setError(null)
    setPatchDone(false)
    try {
      const res = await fetch('/api/system/patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patchID: patchID.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to apply patch')
      setPatchDone(true)
      setPatchID('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply patch')
    } finally {
      setPatchLoading(false)
    }
  }

  const triggerBackup = async () => {
    setBackupLoading(true)
    setError(null)
    setBackupDone(false)
    try {
      const res = await fetch('/api/system/backup', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to trigger backup')
      setBackupDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to trigger backup')
    } finally {
      setBackupLoading(false)
    }
  }

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle>Maintenance Actions</CardTitle>
        <CardDescription>Apply security patches and trigger system backups (Use Case 7)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="patchID">Patch ID</Label>
          <div className="flex gap-2">
            <Input
              id="patchID"
              value={patchID}
              onChange={(e) => setPatchID(e.target.value)}
              placeholder="e.g. SEC-2025-001"
              disabled={patchLoading}
            />
            <Button onClick={applyPatch} disabled={patchLoading || !patchID.trim()}>
              {patchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
              Apply Patch
            </Button>
          </div>
          {patchDone && <p className="text-sm text-green-600">Patch applied successfully.</p>}
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={triggerBackup} disabled={backupLoading}>
            {backupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <HardDrive className="h-4 w-4 mr-2" />}
            Trigger Backup
          </Button>
          {backupDone && <p className="text-sm text-green-600 ml-2">Backup completed.</p>}
        </div>
      </CardContent>
      {error && <p className="px-6 pb-4 text-sm text-destructive">{error}</p>}
    </Card>
  )
}
