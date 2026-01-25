// User roles - expanded for logistics and drivers
export type UserRole = 'public' | 'staff' | 'admin' | 'driver' | 'logistics'

// Fuel types and availability status
export type FuelType = 'petrol' | 'diesel' | 'premium'
export type AvailabilityStatus = 'available' | 'low' | 'out_of_stock'
export type QueueLevel = 'none' | 'short' | 'medium' | 'long' | 'very_long'
export type ReportStatus = 'pending' | 'verified' | 'rejected'

// Trip and delivery status
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed'
export type TankerStatus = 'available' | 'in_transit' | 'maintenance' | 'offline'

// System log levels
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

// Profile type
export interface Profile {
  id: string
  email?: string
  full_name: string | null
  role: UserRole
  assigned_station_id: string | null
  phone?: string | null
  created_at: string
  updated_at: string
}

// Station type
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

// Fuel status type with queue level
export interface FuelStatus {
  id: string
  station_id: string
  fuel_type: FuelType
  status: AvailabilityStatus
  price_per_liter: number | null
  queue_level: QueueLevel
  last_updated_by: string | null
  updated_at: string
  station?: Station
}

// Station with fuel status
export interface StationWithFuelStatus extends Station {
  fuel_status: FuelStatus[]
}

// User report type for crowdsourced reporting
export interface UserReport {
  id: string
  station_id: string
  user_id: string | null
  fuel_type: FuelType
  reported_status: AvailabilityStatus
  reported_queue_level?: QueueLevel | null
  queue_level?: QueueLevel | null  // legacy alias
  estimated_wait_time?: number | null
  comment: string | null
  status: ReportStatus
  created_at: string
  verified_by?: string | null
  verified_at?: string | null
  station?: Station
  profile?: Profile
}

// Notification type
export interface Notification {
  id: string
  user_id: string | null
  station_id: string | null
  title: string
  message: string
  is_read: boolean
  created_at: string
  created_by?: string | null
  station?: Station
}

// Audit log type
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

// Tanker type for fleet management
export interface Tanker {
  id: string
  plate_number: string
  capacity_liters: number
  current_latitude: number | null
  current_longitude: number | null
  status: TankerStatus
  driver_id: string | null
  last_location_update: string | null
  created_at: string
  driver?: Profile
}

// Trip type for delivery tracking
export interface Trip {
  id: string
  tanker_id: string
  origin_station_id: string | null
  destination_station_id: string
  fuel_type: FuelType
  quantity_liters: number
  status: TripStatus
  scheduled_departure: string | null
  actual_departure: string | null
  estimated_arrival: string | null
  actual_arrival: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  tanker?: Tanker
  origin_station?: Station
  destination_station?: Station
}

// Delivery type
export interface Delivery {
  id: string
  trip_id: string
  station_id: string
  fuel_type: FuelType
  quantity_liters: number
  status: DeliveryStatus
  delivered_at: string | null
  received_by: string | null
  notes: string | null
  created_at: string
  trip?: Trip
  station?: Station
}

// Subscription type for alerts
export interface Subscription {
  id: string
  user_id: string
  station_id: string | null
  fuel_type: FuelType | null
  notify_on_available: boolean
  notify_on_low: boolean
  notify_on_delivery: boolean
  is_active: boolean
  created_at: string
  station?: Station
}

// System log type for IT support
export interface SystemLog {
  id: string
  level: LogLevel
  component: string
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// Tanker location history for tracking
export interface TankerLocation {
  id: string
  tanker_id: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  recorded_at: string
}

// Analytics types for admin dashboard
export interface FuelAnalytics {
  total_stations: number
  stations_with_petrol: number
  stations_with_diesel: number
  stations_with_premium: number
  stations_out_of_stock: number
  average_queue_level: string
}

export interface DeliveryAnalytics {
  total_deliveries: number
  pending_deliveries: number
  in_transit_deliveries: number
  completed_deliveries: number
  total_liters_delivered: number
}

// Dashboard types for role-based access
export type DashboardType = 'public' | 'staff' | 'admin' | 'logistics' | 'driver'

export interface DashboardAccess {
  role: UserRole
  allowedDashboards: DashboardType[]
  defaultDashboard: DashboardType
}

export const ROLE_DASHBOARD_ACCESS: Record<UserRole, DashboardAccess> = {
  public: {
    role: 'public',
    allowedDashboards: ['public'],
    defaultDashboard: 'public',
  },
  staff: {
    role: 'staff',
    allowedDashboards: ['public', 'staff'],
    defaultDashboard: 'staff',
  },
  admin: {
    role: 'admin',
    allowedDashboards: ['public', 'staff', 'admin', 'logistics'],
    defaultDashboard: 'admin',
  },
  logistics: {
    role: 'logistics',
    allowedDashboards: ['public', 'logistics'],
    defaultDashboard: 'logistics',
  },
  driver: {
    role: 'driver',
    allowedDashboards: ['public', 'driver'],
    defaultDashboard: 'driver',
  },
}
