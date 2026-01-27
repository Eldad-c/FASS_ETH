'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
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
  DialogFooter,
  DialogClose,
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
import { Search, Edit, Loader2, UserX, UserCheck } from 'lucide-react'
import type { Profile, UserRole } from '@/lib/types'
import { PaginationControls } from '@/components/pagination-controls'

interface UsersTableProps {
  users: (Profile & { stations?: { id: string; name: string } | null; is_banned?: boolean })[]
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
  manager: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
  it_support: 'bg-gray-500/15 text-gray-700 border-gray-500/30 dark:text-gray-400',
}

export function UsersTable({ users: initialUsers, stations, page, limit, total }: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<(typeof users)[0] | null>(null)
  const [banningUser, setBanningUser] = useState<(typeof users)[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    role: '' as UserRole | '',
    assigned_station_id: '',
  })

  const currentFilter = searchParams.get('filter') || 'all'

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

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', value)
    }
    params.set('page', '1') // Reset to first page
    router.push(`${pathname}?${params.toString()}`)
  }

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

  const handleBanToggle = async () => {
    if (!banningUser) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !banningUser.is_banned })
      .eq('id', banningUser.id)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === banningUser.id ? { ...u, is_banned: !u.is_banned } : u
        )
      )
      setBanningUser(null)
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
          <div className="flex gap-2">
            <Select value={currentFilter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
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
                <TableHead>Status</TableHead>
                <TableHead>Assigned Station</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
                    <TableCell>
                      <Badge
                        variant={user.is_banned ? 'destructive' : 'outline'}
                      >
                        {user.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.stations?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
                              {/* ... Edit form ... */}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog
                          open={banningUser?.id === user.id}
                          onOpenChange={(open) => !open && setBanningUser(null)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setBanningUser(user)}
                            aria-label={`${user.is_banned ? 'Unban' : 'Ban'} user ${user.email}`}
                          >
                            {user.is_banned ? (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <UserX className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Action</DialogTitle>
                            </DialogHeader>
                            <p>
                              Are you sure you want to {banningUser?.is_banned ? 'unban' : 'ban'} this user?
                            </p>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button onClick={handleBanToggle} disabled={loading} variant={banningUser?.is_banned ? 'default' : 'destructive'}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {banningUser?.is_banned ? 'Unban User' : 'Ban User'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
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
