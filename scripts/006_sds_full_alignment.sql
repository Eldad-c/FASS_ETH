-- FASS (Fuel Availability and Supply System) - Full SDS Alignment
-- This migration ensures the database schema matches the SDS document exactly
-- Fuel Types: Diesel, Benzene 95, Benzene 97 (per SDS Section 4.8)

-- =============================================================================
-- 1. UPDATE PROFILES TABLE TO MATCH SDS USER ROLES
-- =============================================================================
-- Per SDS: PUBLIC, STAFF, ADMIN, DRIVER, IT (IT Support)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 'LOGISTICS', 'MANAGER', 'IT_SUPPORT'));

-- Add missing columns per SDS User class
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'am'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_station_id UUID REFERENCES public.stations(id);

-- Update name to full_name if needed
UPDATE public.profiles SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;

-- =============================================================================
-- 2. UPDATE STATIONS TABLE TO MATCH SDS STATION CLASS
-- =============================================================================
-- Per SDS Section 4.7: stationID, name, address, openHours, estimatedQueueLevel, nextDeliveryETA
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS estimated_queue_level TEXT 
  CHECK (estimated_queue_level IN ('none', 'short', 'medium', 'long', 'very_long')) DEFAULT 'none';
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS next_delivery_eta TIMESTAMPTZ;
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.profiles(id);

-- Check if operating_hours exists, if not rename from open_hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stations' AND column_name = 'operating_hours'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stations' AND column_name = 'open_hours'
  ) THEN
    ALTER TABLE public.stations RENAME COLUMN open_hours TO operating_hours;
  END IF;
END $$;

-- =============================================================================
-- 3. UPDATE FUEL_STATUS TABLE TO MATCH SDS FUELSTATUS CLASS
-- =============================================================================
-- Per SDS Section 4.8: statusID, fuelType, isAvailable, lastUpdated, updatedBy
-- Fuel types: Diesel, Benzene 95, Benzene 97 only

-- First, drop the constraint so we can update data
ALTER TABLE public.fuel_status DROP CONSTRAINT IF EXISTS fuel_status_fuel_type_check;

-- Remove any Kerosene entries
DELETE FROM public.fuel_status WHERE fuel_type = 'Kerosene';

-- Normalize existing fuel type values BEFORE adding constraint
UPDATE public.fuel_status SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.fuel_status SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.fuel_status SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');

-- Delete any remaining non-standard fuel types
DELETE FROM public.fuel_status WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97');

-- Now add the fuel_type constraint
ALTER TABLE public.fuel_status ADD CONSTRAINT fuel_status_fuel_type_check 
  CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97'));

-- Add SDS-required columns
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS status TEXT 
  CHECK (status IN ('available', 'low', 'out_of_stock')) DEFAULT 'available';
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS queue_level TEXT 
  CHECK (queue_level IN ('none', 'short', 'medium', 'long', 'very_long')) DEFAULT 'none';
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS approval_status TEXT 
  CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'APPROVED';
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Rename columns for consistency (only if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_status' AND column_name = 'last_updated'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_status' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.fuel_status RENAME COLUMN last_updated TO updated_at;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_status' AND column_name = 'updated_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'fuel_status' AND column_name = 'last_updated_by'
  ) THEN
    ALTER TABLE public.fuel_status RENAME COLUMN updated_by TO last_updated_by;
  END IF;
END $$;

-- Update status based on is_available
UPDATE public.fuel_status SET status = CASE WHEN is_available = true THEN 'available' ELSE 'out_of_stock' END 
WHERE status IS NULL;

-- =============================================================================
-- 4. UPDATE USER_REPORTS TABLE TO MATCH SDS USERREPORT CLASS
-- =============================================================================
-- Per SDS Section 4.9: reportID, description, status, submitReport(), updateReportStatus()
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_status TEXT 
  CHECK (reported_status IN ('available', 'low', 'out_of_stock'));
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_queue_level TEXT 
  CHECK (reported_queue_level IN ('none', 'short', 'medium', 'long', 'very_long'));
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Update fuel_type on user_reports (normalize first)
ALTER TABLE public.user_reports DROP CONSTRAINT IF EXISTS user_reports_fuel_type_check;
UPDATE public.user_reports SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.user_reports SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.user_reports SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');
DELETE FROM public.user_reports WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97');
ALTER TABLE public.user_reports ADD CONSTRAINT user_reports_fuel_type_check 
  CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97'));

-- =============================================================================
-- 5. UPDATE TANKERS TABLE TO MATCH SDS TANKER CLASS
-- =============================================================================
-- Per SDS Section 4.13: tankerID, plateNumber, fuelCapacity, currentLatitude, currentLongitude, status
ALTER TABLE public.tankers DROP CONSTRAINT IF EXISTS tankers_fuel_type_check;

-- Update fuel type values FIRST
UPDATE public.tankers SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.tankers SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.tankers SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');
UPDATE public.tankers SET fuel_type = 'mixed' WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97', 'mixed');

-- Now add constraint
ALTER TABLE public.tankers ADD CONSTRAINT tankers_fuel_type_check 
  CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97', 'mixed'));

-- Update status constraint per SDS (normalize first)
ALTER TABLE public.tankers DROP CONSTRAINT IF EXISTS tankers_status_check;
UPDATE public.tankers SET status = 'available' WHERE status IN ('AVAILABLE', 'Available');
UPDATE public.tankers SET status = 'in_transit' WHERE status IN ('EN_ROUTE', 'LOADING', 'DELIVERING', 'In Transit');
UPDATE public.tankers SET status = 'maintenance' WHERE status IN ('MAINTENANCE', 'Maintenance');
UPDATE public.tankers SET status = 'available' WHERE status NOT IN ('available', 'in_transit', 'maintenance', 'offline');
ALTER TABLE public.tankers ADD CONSTRAINT tankers_status_check 
  CHECK (status IN ('available', 'in_transit', 'maintenance', 'offline'));

-- Rename columns for consistency (only if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tankers' AND column_name = 'speed_kmh'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tankers' AND column_name = 'speed'
  ) THEN
    ALTER TABLE public.tankers RENAME COLUMN speed_kmh TO speed;
  END IF;
END $$;

-- =============================================================================
-- 6. UPDATE TRIPS TABLE TO MATCH SDS DELIVERY CLASS
-- =============================================================================
-- Per SDS Section 4.12: deliveryID, stationID, driverID, expectedTime, notes, status
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_fuel_type_check;

-- Update fuel type values FIRST
UPDATE public.trips SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.trips SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.trips SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');
UPDATE public.trips SET fuel_type = 'diesel' WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97');

-- Now add constraint
ALTER TABLE public.trips ADD CONSTRAINT trips_fuel_type_check 
  CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97'));

-- Update status constraint per SDS (normalize first)
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
UPDATE public.trips SET status = 'scheduled' WHERE status IN ('SCHEDULED', 'Scheduled');
UPDATE public.trips SET status = 'in_progress' WHERE status IN ('IN_PROGRESS', 'In Progress');
UPDATE public.trips SET status = 'completed' WHERE status IN ('COMPLETED', 'Completed');
UPDATE public.trips SET status = 'cancelled' WHERE status IN ('CANCELLED', 'Cancelled');
UPDATE public.trips SET status = 'scheduled' WHERE status NOT IN ('scheduled', 'in_progress', 'completed', 'cancelled');
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check 
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

-- Add origin_station_id for trips from other stations
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS origin_station_id UUID REFERENCES public.stations(id);

-- Rename for consistency (only if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'volume_liters'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'quantity_liters'
  ) THEN
    ALTER TABLE public.trips RENAME COLUMN volume_liters TO quantity_liters;
  END IF;
END $$;

-- =============================================================================
-- 7. UPDATE DELIVERIES TABLE TO MATCH SDS
-- =============================================================================
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_fuel_type_check;

-- Update fuel type values FIRST
UPDATE public.deliveries SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.deliveries SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.deliveries SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');
UPDATE public.deliveries SET fuel_type = 'diesel' WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97');

-- Now add constraint
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_fuel_type_check 
  CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97'));

-- Add status field per SDS
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS status TEXT 
  CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')) DEFAULT 'pending';
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS quantity_liters INTEGER;

-- Copy volume_delivered to quantity_liters
UPDATE public.deliveries SET quantity_liters = volume_delivered WHERE quantity_liters IS NULL;

-- =============================================================================
-- 8. UPDATE SUBSCRIPTIONS TABLE
-- =============================================================================
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_fuel_type_check;

-- Update fuel type values FIRST
UPDATE public.subscriptions SET fuel_type = 'benzene_95' WHERE fuel_type IN ('Benzene 95', 'petrol', 'Petrol');
UPDATE public.subscriptions SET fuel_type = 'benzene_97' WHERE fuel_type IN ('Benzene 97', 'premium', 'Premium');
UPDATE public.subscriptions SET fuel_type = 'diesel' WHERE fuel_type IN ('Diesel', 'DIESEL');
UPDATE public.subscriptions SET fuel_type = NULL WHERE fuel_type NOT IN ('diesel', 'benzene_95', 'benzene_97');

-- Now add constraint
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_fuel_type_check 
  CHECK (fuel_type IS NULL OR fuel_type IN ('diesel', 'benzene_95', 'benzene_97'));

-- =============================================================================
-- 9. CREATE LOGISTICS ENGINE SUPPORT TABLE
-- =============================================================================
-- Per SDS Section 4.14: systemTime, calculateETA(), updateTankerLocation(), triggerArrivalAlerts()
CREATE TABLE IF NOT EXISTS public.logistics_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default logistics config
INSERT INTO public.logistics_config (key, value) VALUES
  ('average_speed_kmh', '30'::jsonb),
  ('traffic_multiplier', '1.5'::jsonb),
  ('arrival_alert_threshold_minutes', '15'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 10. CREATE FUEL STATUS HISTORY TABLE (for analytics)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.fuel_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  is_available BOOLEAN NOT NULL,
  status TEXT CHECK (status IN ('available', 'low', 'out_of_stock')),
  queue_level TEXT CHECK (queue_level IN ('none', 'short', 'medium', 'long', 'very_long')),
  price_per_liter DECIMAL(10, 2),
  trust_score DECIMAL(3, 2),
  updated_by UUID REFERENCES public.profiles(id),
  source_type TEXT CHECK (source_type IN ('STAFF', 'USER_REPORT', 'SYSTEM')) DEFAULT 'STAFF',
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fuel_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_config ENABLE ROW LEVEL SECURITY;

-- RLS policies (drop first if exists)
DROP POLICY IF EXISTS "Fuel history viewable by all" ON public.fuel_status_history;
DROP POLICY IF EXISTS "Staff can insert fuel history" ON public.fuel_status_history;
DROP POLICY IF EXISTS "Logistics config viewable by logistics and admin" ON public.logistics_config;
DROP POLICY IF EXISTS "Admins can update logistics config" ON public.logistics_config;

CREATE POLICY "Fuel history viewable by all" ON public.fuel_status_history
  FOR SELECT USING (true);
CREATE POLICY "Staff can insert fuel history" ON public.fuel_status_history
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN', 'LOGISTICS'))
  );

CREATE POLICY "Logistics config viewable by logistics and admin" ON public.logistics_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS', 'IT_SUPPORT'))
  );
CREATE POLICY "Admins can update logistics config" ON public.logistics_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- =============================================================================
-- 11. CREATE EMAIL NOTIFICATIONS TABLE (per SDS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  notification_id UUID REFERENCES public.notifications(id),
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'BOUNCED')) DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email notifications" ON public.email_notifications;
DROP POLICY IF EXISTS "System can insert email notifications" ON public.email_notifications;

CREATE POLICY "Users can view own email notifications" ON public.email_notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert email notifications" ON public.email_notifications
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 12. UPDATE SYSTEM_LOGS FOR IT SUPPORT (per SDS ITSupport class)
-- =============================================================================
-- Per SDS Section 4.6: monitorSystem(), resolveIncident()
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS component TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS incident_status TEXT 
  CHECK (incident_status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'));

-- Rename service to component if needed
UPDATE public.system_logs SET component = service WHERE component IS NULL AND service IS NOT NULL;

-- =============================================================================
-- 13. CREATE PENDING APPROVALS TABLE (for manager workflow)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_status_id UUID REFERENCES public.fuel_status(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES public.profiles(id),
  manager_id UUID REFERENCES public.profiles(id),
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pending approvals viewable by relevant users" ON public.pending_approvals;
DROP POLICY IF EXISTS "Staff can submit approvals" ON public.pending_approvals;
DROP POLICY IF EXISTS "Managers can update approvals" ON public.pending_approvals;

CREATE POLICY "Pending approvals viewable by relevant users" ON public.pending_approvals
  FOR SELECT USING (
    submitted_by = auth.uid() OR
    manager_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
  );
CREATE POLICY "Staff can submit approvals" ON public.pending_approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('STAFF', 'ADMIN'))
  );
CREATE POLICY "Managers can update approvals" ON public.pending_approvals
  FOR UPDATE USING (
    manager_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
  );

-- =============================================================================
-- 14. INSERT SAMPLE DATA WITH CORRECT FUEL TYPES
-- =============================================================================

-- Clear and re-insert fuel status with correct types
DELETE FROM public.fuel_status;

INSERT INTO public.fuel_status (station_id, fuel_type, is_available, status, queue_level, price_per_liter, trust_score)
SELECT 
  s.id, 
  ft.fuel_type,
  CASE WHEN random() > 0.2 THEN true ELSE false END,
  CASE 
    WHEN random() > 0.7 THEN 'available'
    WHEN random() > 0.4 THEN 'low'
    ELSE 'out_of_stock'
  END,
  (ARRAY['none', 'short', 'medium', 'long', 'very_long'])[floor(random() * 5 + 1)],
  CASE ft.fuel_type
    WHEN 'diesel' THEN 74.50
    WHEN 'benzene_95' THEN 72.30
    WHEN 'benzene_97' THEN 76.80
  END,
  round((0.7 + random() * 0.3)::numeric, 2)
FROM public.stations s
CROSS JOIN (VALUES ('diesel'), ('benzene_95'), ('benzene_97')) AS ft(fuel_type)
ON CONFLICT (station_id, fuel_type) DO UPDATE SET
  is_available = EXCLUDED.is_available,
  status = EXCLUDED.status,
  queue_level = EXCLUDED.queue_level,
  price_per_liter = EXCLUDED.price_per_liter;

-- Update tankers with correct fuel types
UPDATE public.tankers SET fuel_type = 'benzene_95' WHERE plate_number = '3-AA-12345';
UPDATE public.tankers SET fuel_type = 'diesel' WHERE plate_number = '3-AA-23456';
UPDATE public.tankers SET fuel_type = 'benzene_97' WHERE plate_number = '3-AA-34567';
UPDATE public.tankers SET fuel_type = 'mixed' WHERE plate_number = '3-AA-45678';
UPDATE public.tankers SET fuel_type = 'mixed' WHERE plate_number = '3-AA-56789';

-- =============================================================================
-- 15. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_fuel_status_station ON public.fuel_status(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_type ON public.fuel_status(fuel_type);
CREATE INDEX IF NOT EXISTS idx_trips_tanker ON public.trips(tanker_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination_station_id);
CREATE INDEX IF NOT EXISTS idx_tanker_locations_tanker ON public.tanker_locations(tanker_id);
CREATE INDEX IF NOT EXISTS idx_tanker_locations_time ON public.tanker_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_station ON public.deliveries(station_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_station ON public.user_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_history_station ON public.fuel_status_history(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_history_time ON public.fuel_status_history(recorded_at DESC);

-- =============================================================================
-- 16. TRIGGER TO LOG FUEL STATUS CHANGES
-- =============================================================================
CREATE OR REPLACE FUNCTION log_fuel_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.fuel_status_history (
    station_id, fuel_type, is_available, status, queue_level, 
    price_per_liter, trust_score, updated_by, source_type
  ) VALUES (
    NEW.station_id, NEW.fuel_type, NEW.is_available, NEW.status, NEW.queue_level,
    NEW.price_per_liter, NEW.trust_score, NEW.last_updated_by, 'STAFF'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fuel_status_history_trigger ON public.fuel_status;
CREATE TRIGGER fuel_status_history_trigger
  AFTER INSERT OR UPDATE ON public.fuel_status
  FOR EACH ROW
  EXECUTE FUNCTION log_fuel_status_change();
