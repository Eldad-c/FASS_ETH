-- Migration 005: SDS/SRS Alignment
-- Use Case 4 (UserReport REJECTED, reported_*), Use Case 5 (AnalyticsReport),
-- Use Case 7 (IT_SUPPORT system_logs), notifications.station_id, deliveries.status,
-- profiles.assigned_station_id

-- 1. UserReport: add REJECTED to status (User Report Lifecycle), and reported_* columns if missing
ALTER TABLE public.user_reports DROP CONSTRAINT IF EXISTS user_reports_status_check;
ALTER TABLE public.user_reports ADD CONSTRAINT user_reports_status_check
  CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'pending', 'verified', 'rejected'));

ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_status text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS reported_queue_level text;
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS estimated_wait_time integer;

-- 2. AnalyticsReport table (Use Case 5: Generate Reports)
CREATE TABLE IF NOT EXISTS public.analytics_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('FUEL_TRENDS', 'USER_ACTIVITY', 'REPORT_STATS')),
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES public.profiles(id),
  data jsonb NOT NULL,
  date_range_start timestamptz,
  date_range_end timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage analytics_reports" ON public.analytics_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'IT_SUPPORT'))
  );

-- 3. notifications: add station_id for Tanker Approaching (Use Case 6)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS station_id uuid REFERENCES public.stations(id);

-- 4. system_logs: IT_SUPPORT can view (Use Case 7)
DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins and IT Support can view system logs" ON public.system_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'IT_SUPPORT'))
  );

-- 5. profiles: assigned_station_id for staff
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_station_id uuid REFERENCES public.stations(id);

-- 6. deliveries: add status for driver confirm (Use Case 6)
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'));

-- 7. Tanker approaching alerts: prevent duplicate (ETA < 30 min) per trip/station
CREATE TABLE IF NOT EXISTS public.tanker_approaching_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  station_id uuid NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, station_id)
);
ALTER TABLE public.tanker_approaching_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can manage tanker_approaching_alerts" ON public.tanker_approaching_alerts
  FOR ALL USING (true);
