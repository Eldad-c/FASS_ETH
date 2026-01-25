'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Bell, Plus, Loader2, Trash2 } from 'lucide-react'
import type { Notification } from '@/lib/types'

interface NotificationsManagerProps {
  notifications: (Notification & { stations?: { name: string } | null })[]
  stations: { id: string; name: string }[]
}

export function NotificationsManager({
  notifications: initialNotifications,
  stations,
}: NotificationsManagerProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    station_id: '',
  })

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) return
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title: formData.title,
        message: formData.message,
        station_id: formData.station_id || null,
      })
      .select('*, stations(name)')
      .single()

    if (!error && data) {
      setNotifications((prev) => [data as typeof prev[0], ...prev])
      setIsAddDialogOpen(false)
      setFormData({ title: '', message: '', station_id: '' })
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()

    const { error } = await supabase.from('notifications').delete().eq('id', id)

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Send Notification</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Notification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Fuel shortage alert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter notification message..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station">Station (Optional)</Label>
                    <Select
                      value={formData.station_id}
                      onValueChange={(v) => setFormData({ ...formData, station_id: v })}
                    >
                      <SelectTrigger id="station">
                        <SelectValue placeholder="All stations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stations</SelectItem>
                        {stations.map((station) => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSendNotification}
                    disabled={loading || !formData.title || !formData.message}
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Notification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{notification.title}</h3>
                      {notification.stations && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {notification.stations.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(notification.id)}
                    disabled={deleting === notification.id}
                  >
                    {deleting === notification.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
