-- ============================================================================
-- FASS (Fuel Availability Status System) - Unified Final Schema
-- Version: 2.0 - January 2026
-- Aligns with SDS V2 requirements
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: DROP AND RECREATE CORE TABLES
-- ============================================================================

-- Drop existing tables if they exist (in correct order for foreign keys)
DROP TABLE IF EXISTS public.email_notifications CASCADE;
DROP TABLE IF EXISTS public.pending_approvals CASCADE;
DROP TABLE IF EXISTS public.fuel_status_history CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.tanker_locations CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.tankers CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_reports CASCADE;
DROP TABLE IF EXISTS public.fuel_status CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.stations CASCADE;
DROP TABLE IF EXISTS public.logistics_config CASCADE;

-- ============================================================================
-- SECTION 2: CREATE PROFILES TABLE
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (role IN ('PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 'LOGISTICS', 'MANAGER', 'IT_SUPPORT')),
  phone TEXT,
  assigned_station_id UUID,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'am')),
  trust_score DECIMAL(5,2) DEFAULT 50.00 CHECK (trust_score >= 0 AND trust_score <= 100),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);

-- ============================================================================
-- SECTION 3: CREATE STATIONS TABLE
-- ============================================================================

CREATE TABLE public.stations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  operating_hours TEXT DEFAULT '6:00 AM - 10:00 PM',
  is_active BOOLEAN DEFAULT TRUE,
  manager_id UUID REFERENCES public.profiles(id),
  estimated_queue_level TEXT DEFAULT 'none' CHECK (estimated_queue_level IN ('none', 'short', 'medium', 'long', 'very_long')),
  next_delivery_eta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles after stations is created
ALTER TABLE public.profiles 
  ADD CONSTRAINT fk_profiles_station 
  FOREIGN KEY (assigned_station_id) 
  REFERENCES public.stations(id) 
  ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stations
CREATE POLICY "Stations are viewable by everyone" ON public.stations
  FOR SELECT USING (true);

CREATE POLICY "Stations are insertable by admins" ON public.stations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Stations are updatable by admins and managers" ON public.stations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
  );

-- ============================================================================
-- SECTION 4: CREATE FUEL STATUS TABLE
-- ============================================================================

CREATE TABLE public.fuel_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  is_available BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'low', 'out_of_stock')),
  price_per_liter DECIMAL(10, 2),
  queue_level TEXT DEFAULT 'none' CHECK (queue_level IN ('none', 'short', 'medium', 'long', 'very_long')),
  trust_score DECIMAL(5,2) DEFAULT 50.00,
  last_updated_by UUID REFERENCES public.profiles(id),
  approval_status TEXT DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(station_id, fuel_type)
);

-- Enable RLS
ALTER TABLE public.fuel_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_status
CREATE POLICY "Fuel status is viewable by everyone" ON public.fuel_status
  FOR SELECT USING (true);

CREATE POLICY "Staff and admins can update fuel status" ON public.fuel_status
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF', 'MANAGER'))
  );

-- ============================================================================
-- SECTION 5: CREATE USER REPORTS TABLE
-- ============================================================================

CREATE TABLE public.user_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  reported_status TEXT NOT NULL CHECK (reported_status IN ('available', 'low', 'out_of_stock')),
  reported_queue_level TEXT CHECK (reported_queue_level IN ('none', 'short', 'medium', 'long', 'very_long')),
  estimated_wait_time INTEGER,
  comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reports
CREATE POLICY "Reports are viewable by everyone" ON public.user_reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff and admins can update reports" ON public.user_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF', 'MANAGER'))
  );

-- ============================================================================
-- SECTION 6: CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 7: CREATE TANKERS TABLE (For Logistics)
-- ============================================================================

CREATE TABLE public.tankers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  capacity_liters INTEGER NOT NULL DEFAULT 20000,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_transit', 'maintenance', 'offline')),
  driver_id UUID REFERENCES public.profiles(id),
  last_location_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tankers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tankers viewable by logistics and admins" ON public.tankers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS', 'DRIVER', 'MANAGER'))
  );

CREATE POLICY "Tankers manageable by logistics and admins" ON public.tankers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS'))
  );

-- ============================================================================
-- SECTION 8: CREATE TRIPS TABLE
-- ============================================================================

CREATE TABLE public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanker_id UUID NOT NULL REFERENCES public.tankers(id),
  origin_station_id UUID REFERENCES public.stations(id),
  destination_station_id UUID NOT NULL REFERENCES public.stations(id),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  quantity_liters INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_departure TIMESTAMPTZ,
  actual_departure TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trips viewable by relevant roles" ON public.trips
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS', 'DRIVER', 'MANAGER', 'STAFF'))
  );

CREATE POLICY "Trips manageable by logistics" ON public.trips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS'))
  );

-- ============================================================================
-- SECTION 9: CREATE DELIVERIES TABLE
-- ============================================================================

CREATE TABLE public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id),
  station_id UUID NOT NULL REFERENCES public.stations(id),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  quantity_liters INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  delivered_at TIMESTAMPTZ,
  received_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deliveries viewable by relevant roles" ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS', 'DRIVER', 'MANAGER', 'STAFF'))
  );

-- ============================================================================
-- SECTION 10: CREATE SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type TEXT CHECK (fuel_type IN ('diesel', 'benzene_95', 'benzene_97')),
  notify_on_available BOOLEAN DEFAULT TRUE,
  notify_on_low BOOLEAN DEFAULT FALSE,
  notify_on_delivery BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, station_id, fuel_type)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 11: CREATE AUDIT LOGS TABLE
-- ============================================================================

CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs viewable by admins" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'IT_SUPPORT'))
  );

-- ============================================================================
-- SECTION 12: CREATE SYSTEM LOGS TABLE (For IT Support)
-- ============================================================================

CREATE TABLE public.system_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  component TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System logs viewable by IT and admins" ON public.system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'IT_SUPPORT'))
  );

-- ============================================================================
-- SECTION 13: CREATE TANKER LOCATIONS TABLE (For Tracking)
-- ============================================================================

CREATE TABLE public.tanker_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tanker_id UUID NOT NULL REFERENCES public.tankers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tanker_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tanker locations viewable by relevant roles" ON public.tanker_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS', 'DRIVER'))
  );

-- ============================================================================
-- SECTION 14: CREATE LOGISTICS CONFIG TABLE
-- ============================================================================

CREATE TABLE public.logistics_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.logistics_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Config viewable by logistics and admins" ON public.logistics_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'LOGISTICS'))
  );

-- ============================================================================
-- SECTION 15: CREATE FUEL STATUS HISTORY TABLE
-- ============================================================================

CREATE TABLE public.fuel_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type TEXT NOT NULL,
  is_available BOOLEAN,
  status TEXT,
  queue_level TEXT,
  price_per_liter DECIMAL(10, 2),
  trust_score DECIMAL(5,2),
  updated_by UUID REFERENCES public.profiles(id),
  source_type TEXT DEFAULT 'STAFF' CHECK (source_type IN ('STAFF', 'USER_REPORT', 'SYSTEM')),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fuel_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "History viewable by staff and above" ON public.fuel_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'STAFF', 'MANAGER'))
  );

-- ============================================================================
-- SECTION 16: CREATE TRIGGER FUNCTION FOR NEW USERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'PUBLIC')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN new;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 17: CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_status_updated_at
  BEFORE UPDATE ON public.fuel_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 18: INSERT SAMPLE STATIONS (Addis Ababa TotalEnergies Stations)
-- ============================================================================

INSERT INTO public.stations (id, name, address, latitude, longitude, phone, operating_hours) VALUES
  ('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'TotalEnergies Bole', 'Bole Road, Addis Ababa', 9.0054, 38.7636, '+251-11-661-2345', '24 Hours'),
  ('b2c3d4e5-f6a7-4901-bcde-f12345678901', 'TotalEnergies Megenagna', 'Megenagna Square, Addis Ababa', 9.0192, 38.7996, '+251-11-662-3456', '6:00 AM - 11:00 PM'),
  ('c3d4e5f6-a7b8-4012-cdef-123456789012', 'TotalEnergies Mexico', 'Mexico Square, Addis Ababa', 9.0107, 38.7469, '+251-11-663-4567', '6:00 AM - 10:00 PM'),
  ('d4e5f6a7-b8c9-4123-defa-234567890123', 'TotalEnergies CMC', 'CMC Road, Addis Ababa', 9.0298, 38.8112, '+251-11-664-5678', '6:00 AM - 10:00 PM'),
  ('e5f6a7b8-c9d0-4234-efab-345678901234', 'TotalEnergies Piassa', 'Piassa Area, Addis Ababa', 9.0357, 38.7468, '+251-11-665-6789', '24 Hours'),
  ('f6a7b8c9-d0e1-4345-fabc-456789012345', 'TotalEnergies Gerji', 'Gerji Road, Addis Ababa', 8.9963, 38.8201, '+251-11-666-7890', '6:00 AM - 10:00 PM'),
  ('a7b8c9d0-e1f2-4456-abcd-567890123456', 'TotalEnergies Kazanchis', 'Kazanchis, Addis Ababa', 9.0134, 38.7612, '+251-11-667-8901', '6:00 AM - 11:00 PM'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'TotalEnergies Sarbet', 'Sarbet Area, Addis Ababa', 9.0045, 38.7334, '+251-11-668-9012', '6:00 AM - 10:00 PM'),
  ('c9d0e1f2-a3b4-4678-cdef-789012345678', 'TotalEnergies Arat Kilo', 'Arat Kilo, Addis Ababa', 9.0378, 38.7621, '+251-11-669-0123', '6:00 AM - 10:00 PM'),
  ('d0e1f2a3-b4c5-4789-defa-890123456789', 'TotalEnergies Ayat', 'Ayat Area, Addis Ababa', 9.0489, 38.8345, '+251-11-670-1234', '6:00 AM - 10:00 PM')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 19: INSERT FUEL STATUS FOR ALL STATIONS
-- ============================================================================

-- Insert fuel status for each station and fuel type
INSERT INTO public.fuel_status (station_id, fuel_type, status, is_available, price_per_liter, queue_level, approval_status) VALUES
  -- TotalEnergies Bole
  ('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'diesel', 'available', true, 72.50, 'short', 'APPROVED'),
  ('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'benzene_95', 'available', true, 74.80, 'none', 'APPROVED'),
  ('a1b2c3d4-e5f6-4890-abcd-ef1234567890', 'benzene_97', 'low', true, 78.20, 'medium', 'APPROVED'),
  -- TotalEnergies Megenagna
  ('b2c3d4e5-f6a7-4901-bcde-f12345678901', 'diesel', 'available', true, 72.50, 'none', 'APPROVED'),
  ('b2c3d4e5-f6a7-4901-bcde-f12345678901', 'benzene_95', 'low', true, 74.80, 'long', 'APPROVED'),
  ('b2c3d4e5-f6a7-4901-bcde-f12345678901', 'benzene_97', 'available', true, 78.20, 'short', 'APPROVED'),
  -- TotalEnergies Mexico
  ('c3d4e5f6-a7b8-4012-cdef-123456789012', 'diesel', 'out_of_stock', false, 72.50, 'very_long', 'APPROVED'),
  ('c3d4e5f6-a7b8-4012-cdef-123456789012', 'benzene_95', 'available', true, 74.80, 'medium', 'APPROVED'),
  ('c3d4e5f6-a7b8-4012-cdef-123456789012', 'benzene_97', 'available', true, 78.20, 'none', 'APPROVED'),
  -- TotalEnergies CMC
  ('d4e5f6a7-b8c9-4123-defa-234567890123', 'diesel', 'available', true, 72.50, 'short', 'APPROVED'),
  ('d4e5f6a7-b8c9-4123-defa-234567890123', 'benzene_95', 'available', true, 74.80, 'none', 'APPROVED'),
  ('d4e5f6a7-b8c9-4123-defa-234567890123', 'benzene_97', 'out_of_stock', false, 78.20, 'none', 'APPROVED'),
  -- TotalEnergies Piassa
  ('e5f6a7b8-c9d0-4234-efab-345678901234', 'diesel', 'available', true, 72.50, 'none', 'APPROVED'),
  ('e5f6a7b8-c9d0-4234-efab-345678901234', 'benzene_95', 'available', true, 74.80, 'short', 'APPROVED'),
  ('e5f6a7b8-c9d0-4234-efab-345678901234', 'benzene_97', 'available', true, 78.20, 'none', 'APPROVED'),
  -- TotalEnergies Gerji
  ('f6a7b8c9-d0e1-4345-fabc-456789012345', 'diesel', 'low', true, 72.50, 'long', 'APPROVED'),
  ('f6a7b8c9-d0e1-4345-fabc-456789012345', 'benzene_95', 'available', true, 74.80, 'medium', 'APPROVED'),
  ('f6a7b8c9-d0e1-4345-fabc-456789012345', 'benzene_97', 'low', true, 78.20, 'short', 'APPROVED'),
  -- TotalEnergies Kazanchis
  ('a7b8c9d0-e1f2-4456-abcd-567890123456', 'diesel', 'available', true, 72.50, 'none', 'APPROVED'),
  ('a7b8c9d0-e1f2-4456-abcd-567890123456', 'benzene_95', 'out_of_stock', false, 74.80, 'very_long', 'APPROVED'),
  ('a7b8c9d0-e1f2-4456-abcd-567890123456', 'benzene_97', 'available', true, 78.20, 'short', 'APPROVED'),
  -- TotalEnergies Sarbet
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'diesel', 'available', true, 72.50, 'short', 'APPROVED'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'benzene_95', 'available', true, 74.80, 'none', 'APPROVED'),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'benzene_97', 'available', true, 78.20, 'none', 'APPROVED'),
  -- TotalEnergies Arat Kilo
  ('c9d0e1f2-a3b4-4678-cdef-789012345678', 'diesel', 'available', true, 72.50, 'medium', 'APPROVED'),
  ('c9d0e1f2-a3b4-4678-cdef-789012345678', 'benzene_95', 'low', true, 74.80, 'long', 'APPROVED'),
  ('c9d0e1f2-a3b4-4678-cdef-789012345678', 'benzene_97', 'available', true, 78.20, 'short', 'APPROVED'),
  -- TotalEnergies Ayat
  ('d0e1f2a3-b4c5-4789-defa-890123456789', 'diesel', 'available', true, 72.50, 'none', 'APPROVED'),
  ('d0e1f2a3-b4c5-4789-defa-890123456789', 'benzene_95', 'available', true, 74.80, 'short', 'APPROVED'),
  ('d0e1f2a3-b4c5-4789-defa-890123456789', 'benzene_97', 'available', true, 78.20, 'none', 'APPROVED')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 20: INSERT SAMPLE TANKERS
-- ============================================================================

INSERT INTO public.tankers (id, plate_number, capacity_liters, status, current_latitude, current_longitude) VALUES
  ('11a2b3c4-d5e6-4890-abcd-ef1234567890', 'AA-12345', 25000, 'available', 9.0054, 38.7636),
  ('22b3c4d5-e6f7-4901-bcde-f12345678901', 'AA-23456', 20000, 'in_transit', 9.0192, 38.7996),
  ('33c4d5e6-f7a8-4012-cdef-123456789012', 'AA-34567', 30000, 'available', 9.0107, 38.7469),
  ('44d5e6f7-a8b9-4123-defa-234567890123', 'AA-45678', 25000, 'maintenance', 9.0298, 38.8112),
  ('55e6f7a8-b9c0-4234-efab-345678901234', 'AA-56789', 20000, 'in_transit', 9.0357, 38.7468)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 21: INSERT SAMPLE TRIPS
-- ============================================================================

INSERT INTO public.trips (tanker_id, destination_station_id, fuel_type, quantity_liters, status, scheduled_departure, estimated_arrival) VALUES
  ('22b3c4d5-e6f7-4901-bcde-f12345678901', 'c3d4e5f6-a7b8-4012-cdef-123456789012', 'diesel', 15000, 'in_progress', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 hour'),
  ('55e6f7a8-b9c0-4234-efab-345678901234', 'a7b8c9d0-e1f2-4456-abcd-567890123456', 'benzene_95', 18000, 'in_progress', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours'),
  ('11a2b3c4-d5e6-4890-abcd-ef1234567890', 'f6a7b8c9-d0e1-4345-fabc-456789012345', 'diesel', 20000, 'scheduled', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- Update stations with next delivery ETA
UPDATE public.stations SET next_delivery_eta = NOW() + INTERVAL '1 hour' WHERE id = 'c3d4e5f6-a7b8-4012-cdef-123456789012';
UPDATE public.stations SET next_delivery_eta = NOW() + INTERVAL '2 hours' WHERE id = 'a7b8c9d0-e1f2-4456-abcd-567890123456';
UPDATE public.stations SET next_delivery_eta = NOW() + INTERVAL '5 hours' WHERE id = 'f6a7b8c9-d0e1-4345-fabc-456789012345';

-- ============================================================================
-- SECTION 22: INSERT SAMPLE NOTIFICATIONS
-- ============================================================================

INSERT INTO public.notifications (title, message, station_id) VALUES
  ('Fuel Shortage Alert', 'Diesel is out of stock at TotalEnergies Mexico. Delivery expected in 1 hour.', 'c3d4e5f6-a7b8-4012-cdef-123456789012'),
  ('Delivery Completed', 'TotalEnergies Bole has received a fresh delivery of Benzene 97.', 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'),
  ('Long Queue Alert', 'High demand detected at TotalEnergies Megenagna for Benzene 95. Expect 20+ minute wait.', 'b2c3d4e5-f6a7-4901-bcde-f12345678901')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 23: INSERT SAMPLE SYSTEM LOGS
-- ============================================================================

INSERT INTO public.system_logs (level, component, message, metadata) VALUES
  ('INFO', 'auth', 'System started successfully', '{"version": "2.0.0"}'::jsonb),
  ('INFO', 'fuel_status', 'Automated fuel status sync completed', '{"stations_updated": 10}'::jsonb),
  ('WARNING', 'tanker_tracking', 'GPS signal weak for tanker AA-23456', '{"tanker_id": "22b3c4d5-e6f7-4901-bcde-f12345678901"}'::jsonb),
  ('INFO', 'delivery', 'Delivery dispatched to TotalEnergies Mexico', '{"trip_id": "trip-001", "fuel_type": "diesel"}'::jsonb),
  ('INFO', 'notifications', 'Broadcast notification sent to 150 subscribers', '{"notification_type": "fuel_shortage"}'::jsonb)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SECTION 24: INSERT LOGISTICS CONFIG
-- ============================================================================

INSERT INTO public.logistics_config (key, value, description) VALUES
  ('default_eta_buffer_minutes', '30'::jsonb, 'Default buffer time added to ETA calculations'),
  ('low_fuel_threshold_percent', '20'::jsonb, 'Percentage threshold for low fuel alerts'),
  ('max_queue_time_minutes', '45'::jsonb, 'Maximum queue time before alert is triggered'),
  ('tanker_speed_kmh', '40'::jsonb, 'Average tanker speed for ETA calculations'),
  ('notification_cooldown_minutes', '60'::jsonb, 'Minimum time between duplicate notifications')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- SECTION 25: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_fuel_status_station ON public.fuel_status(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_type ON public.fuel_status(fuel_type);
CREATE INDEX IF NOT EXISTS idx_user_reports_station ON public.user_reports(station_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination_station_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tanker_locations_tanker ON public.tanker_locations(tanker_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_history_station ON public.fuel_status_history(station_id);

-- ============================================================================
-- SECTION 26: GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- DONE - Schema is now aligned with SDS V2 requirements
-- ============================================================================
