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
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Edit, Loader2, AlertTriangle } from 'lucide-react'
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
  const [deactivatingStation, setDeactivatingStation] = useState<StationWithFuelStatus | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Station name is required'
    if (!formData.address) newErrors.address = 'Address is required'
    if (formData.latitude && isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = 'Invalid latitude'
    }
    if (formData.longitude && isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = 'Invalid longitude'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleToggleActive = async () => {
    if (!deactivatingStation) return

    const supabase = createClient()
    const { error } = await supabase
      .from('stations')
      .update({ is_active: !deactivatingStation.is_active })
      .eq('id', deactivatingStation.id)

    if (!error) {
      setStations((prev) =>
        prev.map((s) =>
          s.id === deactivatingStation.id ? { ...s, is_active: !s.is_active } : s
        )
      )
      setDeactivatingStation(null)
    }
  }

  const handleAddStation = async () => {
    if (!validateForm()) return
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
      await supabase.from('fuel_status').insert([
        { station_id: data.id, fuel_type: 'diesel', status: 'available' },
        { station_id: data.id, fuel_type: 'benzene_95', status: 'available' },
        { station_id: data.id, fuel_type: 'benzene_97', status: 'available' },
      ])

      router.refresh()
      setIsAddDialogOpen(false)
      setFormData({ name: '', address: '', latitude: '', longitude: '', phone: '', operating_hours: '' })
    }

    setLoading(false)
  }

  const handleEditStation = async () => {
    if (!editingStation || !validateForm()) return
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
            ? { ...s, name: formData.name, address: formData.address, latitude: parseFloat(formData.latitude) || s.latitude, longitude: parseFloat(formData.longitude) || s.longitude, phone: formData.phone || null, operating_hours: formData.operating_hours || null }
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
    setErrors({})
  }

  const openAddDialog = () => {
    setIsAddDialogOpen(true)
    setFormData({ name: '', address: '', latitude: '', longitude: '', phone: '', operating_hours: '' })
    setErrors({})
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <CardTitle>All Stations ({total})</CardTitle>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search stations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" /> Add Station</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Station</DialogTitle></DialogHeader>
                {/* Add Station Form */}
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
              {filteredStations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{station.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {station.fuel_status.map((fuel) => (
                        <Badge key={fuel.id} variant="outline" className={`text-xs ${statusColors[fuel.status]}`}>
                          {fuel.fuel_type.replace('_', ' ')} - {fuel.status.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={station.is_active}
                      onCheckedChange={() => {
                        if (station.is_active) {
                          setDeactivatingStation(station)
                        } else {
                          handleToggleActive()
                        }
                      }}
                      aria-label={`Toggle active for ${station.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Dialog open={editingStation?.id === station.id} onOpenChange={(open) => !open && setEditingStation(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(station)} aria-label={`Edit station ${station.name}`}><Edit className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Station</DialogTitle></DialogHeader>
                        {/* Edit Station Form */}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls page={page} limit={limit} total={total} />
      </CardContent>

      <Dialog open={!!deactivatingStation} onOpenChange={(open) => !open && setDeactivatingStation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" />Confirm Deactivation</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to deactivate this station? This will hide it from public view.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleToggleActive} variant="destructive">Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
