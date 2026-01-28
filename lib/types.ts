// User roles - expanded for logistics, drivers, managers, and IT support
export type UserRole = 'public' | 'staff' | 'admin' | 'driver' | 'logistics' | 'manager' | 'it_support'

// Fuel types per SDS: Diesel, Benzene 95, Benzene 97
export type FuelType = 'diesel' | 'benzene_95' | 'benzene_97'
export type AvailabilityStatus = 'available' | 'low' | 'out_of_stock'
export type QueueLevel = 'none' | 'short' | 'medium' | 'long' | 'very_long'
export type ReportStatus = 'pending' | 'verified' | 'rejected'

// Trip and delivery status
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed'
export type TankerStatus = 'available' | 'in_transit' | 'maintenance' | 'offline'

// System log levels
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

// Approval status
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// Language preference
export type LanguagePreference = 'en' | 'am'

// Profile type
export interface Profile {
  id: string
  email?: string
  full_name: string | null
  role: UserRole
  assigned_station_id: string | null
  phone?: string | null
  two_factor_enabled?: boolean
  language_preference?: LanguagePreference
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
  manager_id?: string | null
  created_at: string
  updated_at: string
}

// Fuel status type with queue level (numeric)
export interface FuelStatus {
  id: string
  station_id: string
  fuel_type: FuelType
  status: AvailabilityStatus
  price_per_liter: number | null
  queue_level: number
  is_available: boolean
  last_updated_by: string | null
  updated_at: string
  trust_score?: number | null
  approval_status?: ApprovalStatus
  submitted_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  rejection_reason?: string | null
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
  stations_with_diesel: number
  stations_with_benzene_95: number
  stations_with_benzene_97: number
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
export type DashboardType = 'public' | 'staff' | 'admin' | 'logistics' | 'driver' | 'manager' | 'it_support'

export interface DashboardAccess {
  role: UserRole
  allowedDashboards: DashboardType[]
  defaultDashboard: DashboardType
}

// Historical fuel status
export interface FuelStatusHistory {
  id: string
  station_id: string
  fuel_type: string
  is_available: boolean
  status: AvailabilityStatus
  queue_level: QueueLevel | null
  price_per_liter: number | null
  trust_score: number | null
  updated_by: string | null
  source_type: 'STAFF' | 'USER_REPORT' | 'SYSTEM'
  recorded_at: string
  created_at: string
}

// Pending approval
export interface PendingApproval {
  id: string
  fuel_status_id: string
  station_id: string
  submitted_by: string
  manager_id: string | null
  status: ApprovalStatus
  submitted_at: string
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  fuel_status?: FuelStatus
  station?: Station
  submitter?: Profile
  manager?: Profile
}

// Email notification
export interface EmailNotification {
  id: string
  user_id: string | null
  notification_id: string | null
  email_address: string
  subject: string
  body: string
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED'
  sent_at: string | null
  error_message: string | null
  created_at: string
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
    allowedDashboards: ['public', 'staff', 'admin', 'logistics', 'manager', 'it_support'],
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
  manager: {
    role: 'manager',
    allowedDashboards: ['public', 'manager'],
    defaultDashboard: 'manager',
  },
  it_support: {
    role: 'it_support',
    allowedDashboards: ['public', 'it_support'],
    defaultDashboard: 'it_support',
  },
}
