-- Create fuel_reports table for user reports
CREATE TABLE IF NOT EXISTS public.fuel_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  fuel_type VARCHAR(50) NOT NULL,
  reported_status VARCHAR(50) NOT NULL,
  description TEXT,
  reporter_email TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fuel_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allow insert fuel reports" ON public.fuel_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read fuel reports" ON public.fuel_reports
  FOR SELECT USING (true);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS fuel_reports_station_id_idx ON public.fuel_reports(station_id);
CREATE INDEX IF NOT EXISTS fuel_reports_created_at_idx ON public.fuel_reports(created_at);
