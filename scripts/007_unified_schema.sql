BEGIN;

-- Drop existing triggers and functions to avoid conflicts
-- These will be recreated with the correct logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Create a custom type for user roles
-- This includes all roles from both schema versions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 
            'LOGISTICS', 'MANAGER', 'IT_SUPPORT'
        );
    END IF;
END$$;

-- Create a custom type for fuel types
-- This uses the snake_case naming convention from schema 006
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
        CREATE TYPE public.fuel_type AS ENUM (
            'benzene_95', 'benzene_97', 'diesel', 'kerosene'
        );
    END IF;
END$$;

-- Create a custom type for queue levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'queue_level') THEN
        CREATE TYPE public.queue_level AS ENUM (
            'none', 'short', 'medium', 'long', 'very_long'
        );
    END IF;
END$$;

-- Create a custom type for report statuses
-- This uses the lowercase values from schema 006
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM (
            'pending', 'verified', 'rejected'
        );
    END IF;
END$$;

-- Create the profiles table
-- This table stores public-facing user information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'PUBLIC' NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    is_banned BOOLEAN DEFAULT FALSE NOT NULL, -- Added from issue #7
    trust_score INT DEFAULT 50 NOT NULL,
    CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3)
);

-- Create the stations table
-- This table stores information about fuel stations
CREATE TABLE IF NOT EXISTS public.stations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_updated TIMESTAMPTZ
);

-- Create the fuel_status table
-- This table stores real-time information about fuel availability
CREATE TABLE IF NOT EXISTS public.fuel_status (
    id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    is_available BOOLEAN NOT NULL,
    status TEXT, -- Retaining for compatibility as per issue #1
    queue_level queue_level DEFAULT 'none' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id)
);

-- Create the user_reports table
-- This table stores reports submitted by users
CREATE TABLE IF NOT EXISTS public.user_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    reported_status TEXT NOT NULL, -- Should align with a specific enum if possible
    status report_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);


-- Create the handle_new_user function
-- This function now correctly reads `full_name` from the user metadata
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

-- Create the on_auth_user_created trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing data to match the new schema
-- This ensures that old data is compatible with the new, unified schema
UPDATE public.user_reports SET status = 'pending' WHERE status IN ('OPEN', 'IN_PROGRESS');
UPDATE public.user_reports SET status = 'verified' WHERE status = 'RESOLVED';

-- Alter existing tables to add new columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS status TEXT;

COMMIT;
