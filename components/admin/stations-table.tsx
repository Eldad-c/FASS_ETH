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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Loader2 } from 'lucide-react'
import type { StationWithFuelStatus, AvailabilityStatus } from '@/lib/types'
import { PaginationControls } from '@/components/pagination-controls'

interface StationsTableProps {
  stations: StationWithFuelStatus[]
  page: number
  limit: number
  total: number
}

const statusColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-500/15 text-green-700 border-green-500/30',
  low: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  out_of_stock: 'bg-red-500/15 text-red-700 border-red-500/30',
}

export function StationsTable({
  stations: initialStations,
  page,
  limit,
  total,
}: StationsTableProps) {
  const router = useRouter()
  const [stations, setStations] = useState(initialStations)
  const [search, setSearch] = useState('')
  const [editingStation, setEditingStation] = useState<StationWithFuelStatus | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    operating_hours: '',
  })

  useEffect(() => {
    setStations(initialStations)
  }, [initialStations])

  const filteredStations = useMemo(() => {
    const s = search.toLowerCase().trim()
    if (!s) return stations
    return stations.filter(
      (st) =>
        st.name.toLowerCase().includes(s) ||
        st.address.toLowerCase().includes(s)
    )
  }, [stations, search])

  const handleToggleActive = async (station: StationWithFuelStatus) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('stations')
      .update({ is_active: !station.is_active })
      .eq('id', station.id)

    if (!error) {
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, is_active: !s.is_active } : s))
      )
    }
  }

  const handleAddStation = async () => {
    if (!formData.name || !formData.address) return
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('stations')
      .insert({
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || 9.0054,
        longitude: parseFloat(formData.longitude) || 38.7636,
        phone: formData.phone || null,
        operating_hours: formData.operating_hours || null,
      })
      .select()
      .maybeSingle()

    if (!error && data) {
      // Create fuel status entries for the new station
      await supabase.from('fuel_status').insert([
        { station_id: data.id, fuel_type: 'petrol', status: 'available' },
        { station_id: data.id, fuel_type: 'diesel', status: 'available' },
        { station_id: data.id, fuel_type: 'premium', status: 'available' },
      ])

      router.refresh()
      setIsAddDialogOpen(false)
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        operating_hours: '',
      })
    }

    setLoading(false)
  }

  const handleEditStation = async () => {
    if (!editingStation || !formData.name || !formData.address) return
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('stations')
      .update({
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || editingStation.latitude,
        longitude: parseFloat(formData.longitude) || editingStation.longitude,
        phone: formData.phone || null,
        operating_hours: formData.operating_hours || null,
      })
      .eq('id', editingStation.id)

    if (!error) {
      setStations((prev) =>
        prev.map((s) =>
          s.id === editingStation.id
            ? {
                ...s,
                name: formData.name,
                address: formData.address,
                latitude: parseFloat(formData.latitude) || s.latitude,
                longitude: parseFloat(formData.longitude) || s.longitude,
                phone: formData.phone || null,
                operating_hours: formData.operating_hours || null,
              }
            : s
        )
      )
      setEditingStation(null)
    }

    setLoading(false)
  }

  const openEditDialog = (station: StationWithFuelStatus) => {
    setEditingStation(station)
    setFormData({
      name: station.name,
      address: station.address,
      latitude: station.latitude.toString(),
      longitude: station.longitude.toString(),
      phone: station.phone || '',
      operating_hours: station.operating_hours || '',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle>All Stations ({total})</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Station
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Station</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Station Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="TotalEnergies Bole"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Bole Road, Addis Ababa"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="9.0054"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="38.7636"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 11 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Operating Hours</Label>
                    <Input
                      id="hours"
                      value={formData.operating_hours}
                      onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                      placeholder="24/7"
                    />
                  </div>
                  <Button onClick={handleAddStation} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Station
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-label="Stations">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Fuel Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No stations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{station.address}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {station.fuel_status.map((fuel) => (
                          <Badge
                            key={fuel.id}
                            variant="outline"
                            className={`text-xs ${statusColors[fuel.status]}`}
                          >
                            {fuel.fuel_type.charAt(0).toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={station.is_active}
                        onCheckedChange={() => handleToggleActive(station)}
                        aria-label={`Toggle active for ${station.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={editingStation?.id === station.id}
                        onOpenChange={(open) => !open && setEditingStation(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(station)}
                            aria-label={`Edit station ${station.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Station</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Station Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({ ...formData, name: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Input
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) =>
                                  setFormData({ ...formData, address: e.target.value })
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-latitude">Latitude</Label>
                                <Input
                                  id="edit-latitude"
                                  type="number"
                                  step="any"
                                  value={formData.latitude}
                                  onChange={(e) =>
                                    setFormData({ ...formData, latitude: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-longitude">Longitude</Label>
                                <Input
                                  id="edit-longitude"
                                  type="number"
                                  step="any"
                                  value={formData.longitude}
                                  onChange={(e) =>
                                    setFormData({ ...formData, longitude: e.target.value })
                                  }
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Phone Number</Label>
                              <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({ ...formData, phone: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-hours">Operating Hours</Label>
                              <Input
                                id="edit-hours"
                                value={formData.operating_hours}
                                onChange={(e) =>
                                  setFormData({ ...formData, operating_hours: e.target.value })
                                }
                              />
                            </div>
                            <Button onClick={handleEditStation} disabled={loading} className="w-full">
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
