-- Clean up database: Remove unnecessary data and simplify schema
-- Keep only essential data for: Admin, Staff, IT Support roles

-- 1. Delete in correct order (respecting foreign keys)
DELETE FROM public.trips;
DELETE FROM public.deliveries;
DELETE FROM public.tankers;
DELETE FROM public.user_reports;
DELETE FROM public.subscriptions;
DELETE FROM public.audit_logs;
DELETE FROM public.notifications;
DELETE FROM public.system_logs;

-- 2. Remove unnecessary roles from profiles (keep only admin, staff, it_support)
DELETE FROM public.profiles WHERE role = 'DRIVER';
DELETE FROM public.profiles WHERE role = 'LOGISTICS';
DELETE FROM public.profiles WHERE role = 'MANAGER';
DELETE FROM public.profiles WHERE role = 'PUBLIC';

-- 3. Add email alert subscription table
DROP TABLE IF EXISTS public.email_alerts CASCADE;

CREATE TABLE public.email_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- 4. Add simple RLS policies for email alerts
CREATE POLICY "Email alerts public read" ON public.email_alerts
  FOR SELECT USING (true);

CREATE POLICY "Email alerts public insert" ON public.email_alerts
  FOR INSERT WITH CHECK (true);
