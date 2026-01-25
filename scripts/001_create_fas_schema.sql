-- Fuel Availability System (FAS) Database Schema
-- TotalEnergies Ethiopia

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null check (role in ('PUBLIC', 'STAFF', 'ADMIN')) default 'PUBLIC',
  phone_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Stations table
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  open_hours text default '6:00 AM - 10:00 PM',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Station Staff assignment table
create table if not exists public.station_staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  station_id uuid not null references public.stations(id) on delete cascade,
  employee_id text,
  created_at timestamptz default now(),
  unique(user_id, station_id)
);

-- Fuel Status table
create table if not exists public.fuel_status (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  fuel_type text not null check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene')),
  is_available boolean default true,
  last_updated timestamptz default now(),
  updated_by uuid references public.profiles(id),
  expected_delivery timestamptz,
  notes text,
  trust_score decimal(3, 2) default 1.00 check (trust_score >= 0 and trust_score <= 1),
  unique(station_id, fuel_type)
);

-- User Reports table (for reporting inaccuracies)
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  station_id uuid not null references public.stations(id) on delete cascade,
  report_type text not null check (report_type in ('NO_FUEL', 'INCORRECT_INFO', 'OTHER')),
  description text,
  status text default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
  ip_address text,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Audit Log table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.stations enable row level security;
alter table public.station_staff enable row level security;
alter table public.fuel_status enable row level security;
alter table public.user_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Stations policies (publicly viewable, admin editable)
create policy "Stations are viewable by everyone" on public.stations
  for select using (true);
create policy "Admins can insert stations" on public.stations
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "Admins can update stations" on public.stations
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "Admins can delete stations" on public.stations
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );

-- Station Staff policies
create policy "Station staff viewable by staff and admins" on public.station_staff
  for select using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "Admins can manage station staff" on public.station_staff
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );

-- Fuel Status policies
create policy "Fuel status viewable by everyone" on public.fuel_status
  for select using (true);
create policy "Staff can update their station fuel status" on public.fuel_status
  for update using (
    exists (
      select 1 from public.station_staff ss
      join public.profiles p on p.id = ss.user_id
      where ss.user_id = auth.uid()
      and ss.station_id = fuel_status.station_id
      and p.role in ('STAFF', 'ADMIN')
    )
  );
create policy "Staff can insert fuel status for their station" on public.fuel_status
  for insert with check (
    exists (
      select 1 from public.station_staff ss
      join public.profiles p on p.id = ss.user_id
      where ss.user_id = auth.uid()
      and ss.station_id = fuel_status.station_id
      and p.role in ('STAFF', 'ADMIN')
    ) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "Admins can manage all fuel status" on public.fuel_status
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );

-- User Reports policies
create policy "Anyone can create reports" on public.user_reports
  for insert with check (true);
create policy "Users can view own reports" on public.user_reports
  for select using (
    user_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('STAFF', 'ADMIN'))
  );
create policy "Staff and admins can update reports" on public.user_reports
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('STAFF', 'ADMIN'))
  );

-- Notifications policies
create policy "Users can view own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications
  for update using (user_id = auth.uid());
create policy "System can insert notifications" on public.notifications
  for insert with check (true);

-- Audit logs policies (admin only)
create policy "Admins can view audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
  );
create policy "System can insert audit logs" on public.audit_logs
  for insert with check (true);

-- Create profile trigger for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'PUBLIC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Insert sample stations in Addis Ababa
insert into public.stations (name, address, phone, latitude, longitude, open_hours) values
  ('TotalEnergies 4 Kilo', '4 Kilo, Addis Ababa', '+251 11 123 4567', 9.0350, 38.7636, '6:00 AM - 10:00 PM'),
  ('TotalEnergies Colson Street', 'Colson Street, Addis Ababa', '+251 11 234 5678', 9.0107, 38.7612, '6:00 AM - 10:00 PM'),
  ('TotalEnergies Harambe', 'Harambe, Addis Ababa', '+251 11 345 6789', 9.0054, 38.7468, '6:00 AM - 10:00 PM'),
  ('TotalEnergies Bole', 'Bole Road, Addis Ababa', '+251 11 456 7890', 8.9806, 38.7578, '24 Hours'),
  ('TotalEnergies Mexico', 'Mexico Square, Addis Ababa', '+251 11 567 8901', 9.0126, 38.7395, '6:00 AM - 11:00 PM'),
  ('TotalEnergies Megenagna', 'Megenagna, Addis Ababa', '+251 11 678 9012', 9.0217, 38.8001, '6:00 AM - 10:00 PM'),
  ('TotalEnergies Sarbet', 'Sarbet, Addis Ababa', '+251 11 789 0123', 8.9958, 38.7284, '6:00 AM - 10:00 PM'),
  ('TotalEnergies CMC', 'CMC Road, Addis Ababa', '+251 11 890 1234', 9.0392, 38.8234, '6:00 AM - 10:00 PM')
on conflict do nothing;

-- Insert sample fuel status for all stations
insert into public.fuel_status (station_id, fuel_type, is_available, trust_score)
select s.id, ft.fuel_type, 
  case when random() > 0.3 then true else false end,
  round((0.7 + random() * 0.3)::numeric, 2)
from public.stations s
cross join (values ('Benzene 95'), ('Benzene 97'), ('Diesel'), ('Kerosene')) as ft(fuel_type)
on conflict (station_id, fuel_type) do nothing;
