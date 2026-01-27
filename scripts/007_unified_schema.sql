-- Create a transaction to ensure atomicity
BEGIN;

-- Drop existing objects to prevent conflicts during recreation
-- This ensures a clean slate for the new, unified schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_fuel_status_history();

-- Define custom types for structured data
-- This improves data integrity and consistency across the database

-- User roles, including all roles from every previous schema version
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM (
        'PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 
        'LOGISTICS', 'MANAGER', 'IT_SUPPORT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fuel types using the standardized snake_case naming convention
DO $$ BEGIN
    CREATE TYPE public.fuel_type AS ENUM (
        'benzene_95', 'benzene_97', 'diesel', 'kerosene'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Queue levels for fuel stations
DO $$ BEGIN
    CREATE TYPE public.queue_level AS ENUM (
        'none', 'short', 'medium', 'long', 'very_long'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Report statuses using standardized lowercase values
DO $$ BEGIN
    CREATE TYPE public.report_status AS ENUM (
        'pending', 'verified', 'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create core application tables

-- Profiles table: Stores public user data, linked to authentication
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'PUBLIC' NOT NULL,
    is_banned BOOLEAN DEFAULT FALSE NOT NULL,
    trust_score INT DEFAULT 50 NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    two_factor_secret TEXT,
    two_factor_last_used TIMESTAMPTZ,
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3)
);

-- Stations table: Information about fuel stations
CREATE TABLE IF NOT EXISTS public.stations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_updated TIMESTAMPTZ
);

-- Fuel status table: Real-time fuel availability at stations
CREATE TABLE IF NOT EXISTS public.fuel_status (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    is_available BOOLEAN NOT NULL,
    status TEXT, -- Retained for compatibility
    queue_level queue_level DEFAULT 'none' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Fuel status history: Logs changes to fuel status for auditing
CREATE TABLE IF NOT EXISTS public.fuel_status_history (
    id BIGSERIAL PRIMARY KEY,
    fuel_status_id INT NOT NULL REFERENCES public.fuel_status(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by UUID REFERENCES public.profiles(id),
    old_is_available BOOLEAN,
    new_is_available BOOLEAN,
    old_queue_level queue_level,
    new_queue_level queue_level
);

-- User reports table: Reports from users about fuel status
CREATE TABLE IF NOT EXISTS public.user_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    reported_status TEXT NOT NULL, -- Should ideally be an enum
    status report_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Station approvals table: For manager approval of new stations
CREATE TABLE IF NOT EXISTS public.station_approvals (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status report_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- User role approvals table: For IT Support approval of role changes
CREATE TABLE IF NOT EXISTS public.user_role_approvals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requested_role user_role NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status report_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Define database functions and triggers

-- Function to create a user profile upon new user signup
-- This now correctly handles `full_name` from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

-- Trigger to execute the handle_new_user function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log fuel status changes to the history table
CREATE OR REPLACE FUNCTION public.update_fuel_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.fuel_status_history 
        (fuel_status_id, changed_by, old_is_available, new_is_available, old_queue_level, new_queue_level)
    VALUES
        (OLD.id, OLD.updated_by, OLD.is_available, NEW.is_available, OLD.queue_level, NEW.queue_level);
    RETURN NEW;
END;
$$;

-- Trigger to log fuel status updates
CREATE TRIGGER on_fuel_status_update
    AFTER UPDATE ON public.fuel_status
    FOR EACH ROW
    WHEN (OLD.is_available IS DISTINCT FROM NEW.is_available OR OLD.queue_level IS DISTINCT FROM NEW.queue_level)
    EXECUTE FUNCTION public.update_fuel_status_history();

-- Set up Row Level Security (RLS) for data protection

-- Enable RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_role_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Stations
DROP POLICY IF EXISTS "Stations are viewable by everyone." ON public.stations;
CREATE POLICY "Stations are viewable by everyone." ON public.stations FOR SELECT USING (true);

-- RLS Policies for Fuel Status
DROP POLICY IF EXISTS "Fuel status is viewable by everyone." ON public.fuel_status;
CREATE POLICY "Fuel status is viewable by everyone." ON public.fuel_status FOR SELECT USING (true);

-- RLS Policies for User Reports
DROP POLICY IF EXISTS "Users can view their own reports." ON public.user_reports;
CREATE POLICY "Users can view their own reports." ON public.user_reports FOR SELECT USING (auth.uid() = user_id);

-- Finalize the transaction
COMMIT;
