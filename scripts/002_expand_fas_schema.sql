-- Expanded Fuel Availability System (FAS) Database Schema
-- TotalEnergiesEthiopia - Logistics, Fleet, and Enhanced Features

-- Update profiles to include more roles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 'LOGISTICS'));

-- Add queue_level to fuel_status
alter table public.fuel_status add column if not exists queue_level text 
  check (queue_level in ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')) default 'LOW';
alter table public.fuel_status add column if not exists estimated_wait_minutes integer default 0;
alter table public.fuel_status add column if not exists price_per_liter decimal(10, 2);

-- Tankers table for fleet management
create table if not exists public.tankers (
  id uuid primary key default gen_random_uuid(),
  plate_number text unique not null,
  capacity_liters integer not null,
  fuel_type text not null check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene', 'Mixed')),
  current_latitude decimal(10, 8),
  current_longitude decimal(11, 8),
  status text default 'AVAILABLE' check (status in ('AVAILABLE', 'EN_ROUTE', 'LOADING', 'DELIVERING', 'MAINTENANCE')),
  driver_id uuid references public.profiles(id),
  last_location_update timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trips table for delivery tracking
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  tanker_id uuid not null references public.tankers(id) on delete cascade,
  driver_id uuid not null references public.profiles(id),
  origin_depot text not null,
  destination_station_id uuid not null references public.stations(id),
  fuel_type text not null check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene')),
  volume_liters integer not null,
  status text default 'SCHEDULED' check (status in ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  scheduled_departure timestamptz,
  actual_departure timestamptz,
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  distance_km decimal(8, 2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deliveries table for completed fuel deliveries
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id),
  station_id uuid not null references public.stations(id),
  fuel_type text not null check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene')),
  volume_delivered integer not null,
  received_by uuid references public.profiles(id),
  delivery_timestamp timestamptz default now(),
  signature_confirmed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Subscription alerts table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  station_id uuid references public.stations(id) on delete cascade,
  fuel_type text check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene')),
  notify_on_available boolean default true,
  notify_on_low boolean default true,
  notify_on_delivery boolean default false,
  email text,
  phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- System health logs
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  log_level text not null check (log_level in ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  service text not null,
  message text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Location history for tankers
create table if not exists public.tanker_locations (
  id uuid primary key default gen_random_uuid(),
  tanker_id uuid not null references public.tankers(id) on delete cascade,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  speed_kmh decimal(5, 2),
  heading decimal(5, 2),
  recorded_at timestamptz default now()
);

-- Crowdsource reports enhancement
alter table public.user_reports add column if not exists queue_level text 
  check (queue_level in ('LOW', 'MEDIUM', 'HIGH', 'EXTREME'));
alter table public.user_reports add column if not exists verification_count integer default 0;
alter table public.user_reports add column if not exists fuel_type text 
  check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene'));

-- Enable RLS on new tables
alter table public.tankers enable row level security;
alter table public.trips enable row level security;
alter table public.deliveries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.system_logs enable row level security;
alter table public.tanker_locations enable row level security;

-- Tankers policies
create policy "Tankers viewable by logistics and admin" on public.tankers
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS', 'DRIVER'))
  );
create policy "Drivers can update own tanker location" on public.tankers
  for update using (driver_id = auth.uid());
create policy "Logistics and admin can manage tankers" on public.tankers
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS'))
  );

-- Trips policies
create policy "Trips viewable by relevant roles" on public.trips
  for select using (
    driver_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS', 'STAFF'))
  );
create policy "Drivers can update own trips" on public.trips
  for update using (driver_id = auth.uid());
create policy "Logistics and admin can manage trips" on public.trips
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS'))
  );

-- Deliveries policies
create policy "Deliveries viewable by staff, logistics, admin" on public.deliveries
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS', 'STAFF'))
  );
create policy "Staff can confirm deliveries" on public.deliveries
  for update using (
    exists (
      select 1 from public.station_staff ss
      where ss.user_id = auth.uid() and ss.station_id = deliveries.station_id
    )
  );
create policy "Logistics can insert deliveries" on public.deliveries
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS', 'DRIVER'))
  );

-- Subscriptions policies
create policy "Users can manage own subscriptions" on public.subscriptions
  for all using (user_id = auth.uid());
create policy "Anyone can create subscriptions" on public.subscriptions
  for insert with check (true);

-- System logs policies (admin only)
create policy "Admins can view system logs" on public.system_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "System can insert logs" on public.system_logs
  for insert with check (true);

-- Tanker locations policies
create policy "Logistics can view tanker locations" on public.tanker_locations
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'LOGISTICS', 'DRIVER'))
  );
create policy "Drivers can insert own tanker location" on public.tanker_locations
  for insert with check (
    exists (select 1 from public.tankers where id = tanker_id and driver_id = auth.uid())
  );

-- Insert sample tankers
insert into public.tankers (plate_number, capacity_liters, fuel_type, current_latitude, current_longitude, status) values
  ('3-AA-12345', 30000, 'Benzene 95', 9.0120, 38.7520, 'AVAILABLE'),
  ('3-AA-23456', 25000, 'Diesel', 9.0250, 38.7680, 'EN_ROUTE'),
  ('3-AA-34567', 30000, 'Benzene 97', 8.9950, 38.7400, 'DELIVERING'),
  ('3-AA-45678', 20000, 'Kerosene', 9.0080, 38.7550, 'AVAILABLE'),
  ('3-AA-56789', 35000, 'Mixed', 9.0350, 38.8100, 'LOADING')
on conflict do nothing;

-- Create function to calculate ETA
create or replace function calculate_eta(
  tanker_lat decimal,
  tanker_lng decimal,
  station_lat decimal,
  station_lng decimal
) returns interval as $$
declare
  distance_km decimal;
  avg_speed_kmh decimal := 30; -- Average speed in Addis Ababa traffic
begin
  -- Haversine formula approximation
  distance_km := 111.32 * sqrt(
    power(station_lat - tanker_lat, 2) + 
    power((station_lng - tanker_lng) * cos(radians((tanker_lat + station_lat) / 2)), 2)
  );
  return make_interval(mins := ceil(distance_km / avg_speed_kmh * 60)::integer);
end;
$$ language plpgsql;

-- Create function for notification triggers
create or replace function notify_fuel_status_change()
returns trigger as $$
begin
  -- Insert notifications for subscribers
  insert into public.notifications (user_id, title, message)
  select 
    s.user_id,
    case 
      when NEW.is_available = true then 'Fuel Available!'
      else 'Fuel Status Update'
    end,
    format('%s is now %s at %s', 
      NEW.fuel_type, 
      case when NEW.is_available then 'available' else 'unavailable' end,
      (select name from public.stations where id = NEW.station_id)
    )
  from public.subscriptions s
  where s.station_id = NEW.station_id
    and (s.fuel_type is null or s.fuel_type = NEW.fuel_type)
    and s.is_active = true
    and (
      (NEW.is_available = true and s.notify_on_available = true) or
      (NEW.is_available = false and s.notify_on_low = true)
    );
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_fuel_status_change on public.fuel_status;
create trigger on_fuel_status_change
  after update on public.fuel_status
  for each row
  when (OLD.is_available is distinct from NEW.is_available)
  execute function notify_fuel_status_change();
