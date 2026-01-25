export type UserRole = 'public' | 'staff' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  assigned_station_id: string | null
  created_at: string
  updated_at: string
}

export interface Station {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string | null
  operating_hours: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type FuelType = 'petrol' | 'diesel' | 'premium'
export type AvailabilityStatus = 'available' | 'low' | 'out_of_stock'

export interface FuelStatus {
  id: string
  station_id: string
  fuel_type: FuelType
  status: AvailabilityStatus
  price_per_liter: number | null
  last_updated_by: string | null
  updated_at: string
  station?: Station
}

export type ReportStatus = 'pending' | 'verified' | 'rejected'

export interface UserReport {
  id: string
  station_id: string
  user_id: string | null
  fuel_type: FuelType
  reported_status: AvailabilityStatus
  comment: string | null
  status: ReportStatus
  created_at: string
  station?: Station
  profile?: Profile
}

export interface Notification {
  id: string
  user_id: string | null
  station_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
  station?: Station
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  profile?: Profile
}

export interface StationWithFuelStatus extends Station {
  fuel_status: FuelStatus[]
}
