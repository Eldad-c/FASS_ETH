'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Search, Edit, Loader2 } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'
import { PaginationControls } from '@/components/pagination-controls'

interface UsersTableProps {
  users: (Profile & { stations?: { id: string; name: string } | null })[]
  stations: { id: string; name: string }[]
  page: number
  limit: number
  total: number
}

const roleColors: Record<UserRole, string> = {
  public: 'bg-muted text-muted-foreground',
  staff: 'bg-blue-500/15 text-blue-700 border-blue-700 dark:text-blue-400 border-blue-500/30',
  admin: 'bg-primary/15 text-primary border-primary/30',
  driver: 'bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-400',
  logistics: 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400',
}

export function UsersTable({ users: initialUsers, stations, page, limit, total }: UsersTableProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    role: '' as UserRole | '',
    assigned_station_id: '',
  })

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const filteredUsers = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return users
    return users.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s)
    )
  }, [users, search])

  const handleUpdateUser = async () => {
    if (!editingUser) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name || null,
        role: formData.role || editingUser.role,
        assigned_station_id: formData.assigned_station_id || null,
      })
      .eq('id', editingUser.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                full_name: formData.full_name || null,
                role: formData.role || u.role,
                assigned_station_id: formData.assigned_station_id || null,
                stations: formData.assigned_station_id
                  ? stations.find((s) => s.id === formData.assigned_station_id) || null
                  : null,
              }
            : u
        )
      )
      setEditingUser(null)
      router.refresh()
    }

    setLoading(false)
  }

  const openEditDialog = (user: (typeof users)[0]) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name || '',
      role: (user.role?.toLowerCase() as UserRole) || 'public',
      assigned_station_id: user.assigned_station_id || '',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle>All Users ({total})</CardTitle>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-label="Users">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Station</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          roleColors[user.role?.toLowerCase() as UserRole] || roleColors.public
                        }
                      >
                        {user.role?.toLowerCase() || 'public'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.stations?.name || '-'}</TableCell>
                    <TableCell>
                      <Dialog
                        open={editingUser?.id === user.id}
                        onOpenChange={(open) => !open && setEditingUser(null)}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          aria-label={`Edit user ${user.email}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input value={editingUser?.email || ''} disabled />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Full Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.full_name}
                                onChange={(e) =>
                                  setFormData({ ...formData, full_name: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">Role</Label>
                              <Select
                                value={formData.role}
                                onValueChange={(v) =>
                                  setFormData({ ...formData, role: v as UserRole })
                                }
                              >
                                <SelectTrigger id="edit-role">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="public">Public</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="logistics">Logistics</SelectItem>
                                  <SelectItem value="driver">Driver</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {formData.role === 'staff' && (
                              <div className="space-y-2">
                                <Label htmlFor="edit-station">Assigned Station</Label>
                                <Select
                                  value={formData.assigned_station_id}
                                  onValueChange={(v) =>
                                    setFormData({ ...formData, assigned_station_id: v })
                                  }
                                >
                                  <SelectTrigger id="edit-station">
                                    <SelectValue placeholder="Select a station" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stations.map((station) => (
                                      <SelectItem key={station.id} value={station.id}>
                                        {station.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <Button onClick={handleUpdateUser} disabled={loading} className="w-full">
                              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                              Save Changes
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
