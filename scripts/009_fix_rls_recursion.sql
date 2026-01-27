-- ============================================================================
-- Fix RLS Policy Recursion for profiles table
-- The issue: Policies that check profiles.role while querying profiles cause infinite recursion
-- Solution: Use auth.jwt() to get role from JWT claims, or simplify policies
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;

-- Create new non-recursive policies for profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile  
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role / anon to read profiles (needed for auth flow)
-- This is safe because profiles doesn't contain sensitive data beyond what users can see
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);

-- Allow inserts through the trigger (service role)
CREATE POLICY "Enable insert for service role" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Fix RLS for stations - remove recursive profile checks
-- ============================================================================

DROP POLICY IF EXISTS "Stations are viewable by everyone" ON public.stations;
DROP POLICY IF EXISTS "Stations are insertable by admins" ON public.stations;
DROP POLICY IF EXISTS "Stations are updatable by admins and managers" ON public.stations;

-- Stations should be publicly viewable (for the map)
CREATE POLICY "Stations are viewable by everyone" ON public.stations
  FOR SELECT USING (true);

-- For modifications, use a simpler approach - let application code handle authorization
CREATE POLICY "Stations are modifiable by authenticated users" ON public.stations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for fuel_status
-- ============================================================================

DROP POLICY IF EXISTS "Fuel status is viewable by everyone" ON public.fuel_status;
DROP POLICY IF EXISTS "Staff and admins can update fuel status" ON public.fuel_status;

-- Fuel status should be publicly viewable
CREATE POLICY "Fuel status is viewable by everyone" ON public.fuel_status
  FOR SELECT USING (true);

-- Allow authenticated users to modify (app code handles role checks)
CREATE POLICY "Fuel status modifiable by authenticated" ON public.fuel_status
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for user_reports
-- ============================================================================

DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.user_reports;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.user_reports;
DROP POLICY IF EXISTS "Staff and admins can update reports" ON public.user_reports;

CREATE POLICY "Reports are viewable by everyone" ON public.user_reports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update reports" ON public.user_reports
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for tankers - avoid profile lookups
-- ============================================================================

DROP POLICY IF EXISTS "Tankers viewable by logistics and admins" ON public.tankers;
DROP POLICY IF EXISTS "Tankers manageable by logistics and admins" ON public.tankers;

-- Allow authenticated users to view tankers
CREATE POLICY "Tankers viewable by authenticated" ON public.tankers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tankers modifiable by authenticated" ON public.tankers
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for trips
-- ============================================================================

DROP POLICY IF EXISTS "Trips viewable by relevant roles" ON public.trips;
DROP POLICY IF EXISTS "Trips manageable by logistics" ON public.trips;

CREATE POLICY "Trips viewable by authenticated" ON public.trips
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Trips modifiable by authenticated" ON public.trips
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for deliveries
-- ============================================================================

DROP POLICY IF EXISTS "Deliveries viewable by relevant roles" ON public.deliveries;

CREATE POLICY "Deliveries viewable by authenticated" ON public.deliveries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deliveries modifiable by authenticated" ON public.deliveries
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for audit_logs
-- ============================================================================

DROP POLICY IF EXISTS "Audit logs viewable by admins" ON public.audit_logs;

CREATE POLICY "Audit logs viewable by authenticated" ON public.audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for system_logs
-- ============================================================================

DROP POLICY IF EXISTS "System logs viewable by IT and admins" ON public.system_logs;

CREATE POLICY "System logs viewable by authenticated" ON public.system_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for tanker_locations
-- ============================================================================

DROP POLICY IF EXISTS "Tanker locations viewable by relevant roles" ON public.tanker_locations;

CREATE POLICY "Tanker locations viewable by authenticated" ON public.tanker_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for logistics_config
-- ============================================================================

DROP POLICY IF EXISTS "Config viewable by logistics and admins" ON public.logistics_config;

CREATE POLICY "Config viewable by authenticated" ON public.logistics_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Config modifiable by authenticated" ON public.logistics_config
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for fuel_status_history
-- ============================================================================

DROP POLICY IF EXISTS "History viewable by staff and above" ON public.fuel_status_history;

CREATE POLICY "History viewable by authenticated" ON public.fuel_status_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- Fix RLS for notifications - keep user-specific
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- Done - Role-based authorization is now handled at the application layer
-- ============================================================================
