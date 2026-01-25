/**
 * Zod validation schemas for API routes and forms
 */
import { z } from 'zod'

// User role validation
export const userRoleSchema = z.enum(['public', 'staff', 'admin', 'driver', 'logistics'])

// Fuel type validation
export const fuelTypeSchema = z.enum(['petrol', 'diesel', 'premium'])

// Availability status validation
export const availabilityStatusSchema = z.enum(['available', 'low', 'out_of_stock'])

// Queue level validation
export const queueLevelSchema = z.enum(['none', 'short', 'medium', 'long', 'very_long'])

// Report status validation
export const reportStatusSchema = z.enum(['pending', 'verified', 'rejected'])

// Trip status validation
export const tripStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])

// Delivery status validation
export const deliveryStatusSchema = z.enum(['pending', 'in_transit', 'delivered', 'failed'])

// Tanker status validation
export const tankerStatusSchema = z.enum(['available', 'in_transit', 'maintenance', 'offline'])

// Log level validation
export const logLevelSchema = z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL'])

// UUID validation
export const uuidSchema = z.string().uuid()

// Station creation/update
export const stationSchema = z.object({
  name: z.string().min(1, 'Station name is required').max(200),
  address: z.string().min(1, 'Address is required').max(500),
  phone: z.string().max(20).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  operating_hours: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

// Fuel status update
export const fuelStatusUpdateSchema = z.object({
  station_id: uuidSchema,
  fuel_type: fuelTypeSchema,
  status: availabilityStatusSchema,
  price_per_liter: z.number().positive().nullable().optional(),
  queue_level: queueLevelSchema.optional(),
  estimated_wait_time: z.number().int().min(0).nullable().optional(),
})

// User report creation
export const userReportSchema = z.object({
  station_id: uuidSchema,
  fuel_type: fuelTypeSchema,
  reported_status: availabilityStatusSchema,
  reported_queue_level: queueLevelSchema.optional(),
  estimated_wait_time: z.number().int().min(0).max(300).nullable().optional(),
  comment: z.string().max(1000).nullable().optional(),
})

// Trip creation
export const tripCreateSchema = z.object({
  tanker_id: uuidSchema,
  destination_station_id: uuidSchema,
  origin_station_id: uuidSchema.nullable().optional(),
  fuel_type: fuelTypeSchema,
  quantity_liters: z.number().int().positive(),
  scheduled_departure: z.string().datetime().nullable().optional(),
})

// Trip update
export const tripUpdateSchema = z.object({
  status: tripStatusSchema.optional(),
  actual_departure: z.string().datetime().nullable().optional(),
  estimated_arrival: z.string().datetime().nullable().optional(),
  actual_arrival: z.string().datetime().nullable().optional(),
})

// Delivery creation
export const deliveryCreateSchema = z.object({
  trip_id: uuidSchema,
  station_id: uuidSchema,
  fuel_type: fuelTypeSchema,
  quantity_liters: z.number().int().positive(),
  notes: z.string().max(500).nullable().optional(),
})

// Subscription creation
export const subscriptionSchema = z.object({
  station_id: uuidSchema.nullable().optional(),
  fuel_type: fuelTypeSchema.nullable().optional(),
  notify_on_available: z.boolean().default(true),
  notify_on_low: z.boolean().default(true),
  notify_on_delivery: z.boolean().default(false),
})

// Profile update
export const profileUpdateSchema = z.object({
  full_name: z.string().max(200).nullable().optional(),
  role: userRoleSchema.optional(),
  assigned_station_id: uuidSchema.nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
})

// Analytics query params
export const analyticsQuerySchema = z.object({
  type: z.enum(['overview', 'stations', 'deliveries']).default('overview'),
})

// ETA query params
export const etaQuerySchema = z.object({
  tripId: uuidSchema.optional(),
  tankerId: uuidSchema.optional(),
})

// Pagination params
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Search params
export const searchSchema = z.object({
  search: z.string().max(200).optional(),
})
