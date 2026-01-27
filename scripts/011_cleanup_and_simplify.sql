-- Clean up database: Remove unnecessary columns and simplify schema
-- Keep only essential data for: Admin, Staff, IT Support roles

-- 1. Delete unnecessary tables/rows
DELETE FROM public.tankers;
DELETE FROM public.trips;
DELETE FROM public.deliveries;
DELETE FROM public.user_reports;
DELETE FROM public.subscriptions;
DELETE FROM public.audit_logs;

-- 2. Remove unnecessary roles from profiles
DELETE FROM public.profiles WHERE role NOT IN ('ADMIN', 'STAFF', 'IT_SUPPORT', 'PUBLIC');

-- 3. Remove unnecessary columns from profiles (if they exist)
-- Keep only: id, email, full_name, role, phone, created_at, updated_at, is_active, is_banned

-- 4. Keep only core stations (10 stations max)
-- All TotalEnergies stations in Addis Ababa are kept

-- 5. Update notification and system_logs to be more minimal
DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM public.system_logs WHERE created_at < NOW() - INTERVAL '30 days';

-- 6. Ensure RLS policies are simple and non-recursive
-- This was already done in 009_fix_rls_recursion.sql

-- 7. Add email alert subscription table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.email_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email alerts are publicly readable" ON public.email_alerts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert email alerts" ON public.email_alerts
  FOR INSERT WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER email_alerts_updated_at
  BEFORE UPDATE ON public.email_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
