-- Migration: Add Missing Features from SRS/SDS
-- Fuel Availability and Supply System (FASS)
-- Adds: Manager role, IT Support role, 2FA, approval workflow, historical tracking, etc.

-- 1. Update roles to include MANAGER and IT_SUPPORT
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
  check (role in ('PUBLIC', 'STAFF', 'ADMIN', 'DRIVER', 'LOGISTICS', 'MANAGER', 'IT_SUPPORT'));

-- 2. Add 2FA fields to profiles
alter table public.profiles add column if not exists two_factor_enabled boolean default false;
alter table public.profiles add column if not exists two_factor_secret text;
alter table public.profiles add column if not exists two_factor_backup_codes text[];

-- 3. Add approval workflow fields to fuel_status
alter table public.fuel_status add column if not exists approval_status text 
  check (approval_status in ('PENDING', 'APPROVED', 'REJECTED')) default 'APPROVED';
alter table public.fuel_status add column if not exists submitted_by uuid references public.profiles(id);
alter table public.fuel_status add column if not exists approved_by uuid references public.profiles(id);
alter table public.fuel_status add column if not exists approved_at timestamptz;
alter table public.fuel_status add column if not exists rejection_reason text;

-- 4. Create fuel_status_history table for historical tracking (last 7 days)
create table if not exists public.fuel_status_history (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  fuel_type text not null check (fuel_type in ('Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene')),
  is_available boolean not null,
  status text check (status in ('available', 'low', 'out_of_stock')),
  queue_level text check (queue_level in ('none', 'short', 'medium', 'long', 'very_long', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
  price_per_liter decimal(10, 2),
  trust_score decimal(3, 2) check (trust_score >= 0 and trust_score <= 1),
  updated_by uuid references public.profiles(id),
  source_type text check (source_type in ('STAFF', 'USER_REPORT', 'SYSTEM')) default 'STAFF',
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Create index for efficient historical queries
create index if not exists idx_fuel_status_history_station_fuel_date 
  on public.fuel_status_history(station_id, fuel_type, recorded_at desc);
create index if not exists idx_fuel_status_history_recorded_at 
  on public.fuel_status_history(recorded_at desc);

-- 5. Create pending_approvals table for manager approval workflow
create table if not exists public.pending_approvals (
  id uuid primary key default gen_random_uuid(),
  fuel_status_id uuid not null references public.fuel_status(id) on delete cascade,
  station_id uuid not null references public.stations(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  manager_id uuid references public.profiles(id),
  status text default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now()
);

-- 6. Add manager assignment to stations (for approval routing)
alter table public.stations add column if not exists manager_id uuid references public.profiles(id);

-- 7. Create email_notifications table for email notification tracking
create table if not exists public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  notification_id uuid references public.notifications(id) on delete cascade,
  email_address text not null,
  subject text not null,
  body text not null,
  status text default 'PENDING' check (status in ('PENDING', 'SENT', 'FAILED', 'BOUNCED')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- 8. Add language preference to profiles
alter table public.profiles add column if not exists language_preference text 
  check (language_preference in ('en', 'am')) default 'en';

-- 9. Enable RLS on new tables
alter table public.fuel_status_history enable row level security;
alter table public.pending_approvals enable row level security;
alter table public.email_notifications enable row level security;

-- 10. RLS Policies for fuel_status_history
create policy "Fuel status history viewable by everyone" on public.fuel_status_history
  for select using (true);
create policy "System can insert fuel status history" on public.fuel_status_history
  for insert with check (true);

-- 11. RLS Policies for pending_approvals
create policy "Staff can view own pending approvals" on public.pending_approvals
  for select using (
    submitted_by = auth.uid() or
    manager_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'MANAGER'))
  );
create policy "Managers can update pending approvals" on public.pending_approvals
  for update using (
    manager_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('ADMIN', 'MANAGER'))
  );
create policy "Staff can create pending approvals" on public.pending_approvals
  for insert with check (submitted_by = auth.uid());

-- 12. RLS Policies for email_notifications
create policy "Users can view own email notifications" on public.email_notifications
  for select using (user_id = auth.uid());
create policy "System can insert email notifications" on public.email_notifications
  for insert with check (true);

-- 13. Create function to calculate trust score dynamically
create or replace function calculate_trust_score(
  p_last_updated timestamptz,
  p_source_type text,
  p_verification_count integer default 0
) returns decimal as $$
declare
  base_score decimal := 0.5;
  recency_score decimal;
  source_score decimal;
  verification_bonus decimal;
  hours_old decimal;
begin
  -- Calculate recency score (decay over time)
  hours_old := extract(epoch from (now() - p_last_updated)) / 3600.0;
  
  if hours_old <= 1 then
    recency_score := 1.0;
  elsif hours_old <= 6 then
    recency_score := 0.9;
  elsif hours_old <= 12 then
    recency_score := 0.8;
  elsif hours_old <= 24 then
    recency_score := 0.7;
  elsif hours_old <= 48 then
    recency_score := 0.6;
  else
    recency_score := 0.5;
  end if;
  
  -- Source type weight (staff updates have higher trust)
  case p_source_type
    when 'STAFF' then source_score := 1.0;
    when 'USER_REPORT' then source_score := 0.7;
    when 'SYSTEM' then source_score := 0.9;
    else source_score := 0.5;
  end case;
  
  -- Verification bonus (multiple user reports increase trust)
  verification_bonus := least(p_verification_count * 0.05, 0.2);
  
  -- Calculate final trust score
  return round((base_score + (recency_score * 0.3) + (source_score * 0.2) + verification_bonus)::numeric, 2);
end;
$$ language plpgsql;

-- 14. Create trigger to automatically create history records
create or replace function create_fuel_status_history()
returns trigger as $$
begin
  -- Insert into history table when fuel status is updated
  insert into public.fuel_status_history (
    station_id,
    fuel_type,
    is_available,
    status,
    queue_level,
    price_per_liter,
    trust_score,
    updated_by,
    source_type,
    recorded_at
  ) values (
    NEW.station_id,
    NEW.fuel_type,
    NEW.is_available,
    NEW.status,
    NEW.queue_level,
    NEW.price_per_liter,
    NEW.trust_score,
    NEW.updated_by,
    case 
      when NEW.updated_by is not null and exists (
        select 1 from public.profiles where id = NEW.updated_by and role = 'STAFF'
      ) then 'STAFF'
      when NEW.updated_by is not null then 'USER_REPORT'
      else 'SYSTEM'
    end,
    NEW.last_updated
  );
  
  -- Clean up old history (keep only last 7 days)
  delete from public.fuel_status_history
  where recorded_at < now() - interval '7 days';
  
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_fuel_status_update_history on public.fuel_status;
create trigger on_fuel_status_update_history
  after update on public.fuel_status
  for each row
  when (
    OLD.is_available is distinct from NEW.is_available or
    OLD.status is distinct from NEW.status or
    OLD.queue_level is distinct from NEW.queue_level
  )
  execute function create_fuel_status_history();

-- 15. Create function to update trust scores automatically
create or replace function update_trust_scores()
returns void as $$
begin
  update public.fuel_status fs
  set trust_score = calculate_trust_score(
    fs.last_updated,
    case 
      when fs.updated_by is not null and exists (
        select 1 from public.profiles where id = fs.updated_by and role = 'STAFF'
      ) then 'STAFF'
      when fs.updated_by is not null then 'USER_REPORT'
      else 'SYSTEM'
    end,
    coalesce((
      select count(*) 
      from public.user_reports ur 
      where ur.station_id = fs.station_id 
        and ur.fuel_type = fs.fuel_type
        and ur.status = 'verified'
    ), 0)
  )
  where fs.last_updated is not null;
end;
$$ language plpgsql;

-- 16. Create function for delivery delay alerts
create or replace function check_delivery_delays()
returns void as $$
begin
  -- Insert notifications for delayed deliveries
  insert into public.notifications (user_id, title, message)
  select distinct
    ss.user_id,
    'Delivery Delay Alert',
    format('Delivery to %s is delayed. Expected: %s', 
      s.name,
      to_char(t.estimated_arrival, 'YYYY-MM-DD HH24:MI')
    )
  from public.trips t
  join public.stations s on s.id = t.destination_station_id
  join public.station_staff ss on ss.station_id = s.id
  where t.status = 'IN_PROGRESS'
    and t.estimated_arrival < now() + interval '1 hour'
    and t.estimated_arrival < t.actual_arrival
    and not exists (
      select 1 from public.notifications n
      where n.user_id = ss.user_id
        and n.title = 'Delivery Delay Alert'
        and n.created_at > now() - interval '1 hour'
    );
end;
$$ language plpgsql;

-- 17. Create function for low stock alerts
create or replace function check_low_stock()
returns void as $$
begin
  -- Insert notifications for low stock (when status changes to 'low' or 'out_of_stock')
  -- This is handled by the existing trigger, but we add a scheduled check
  insert into public.notifications (user_id, title, message)
  select distinct
    ss.user_id,
    'Low Stock Alert',
    format('%s is running low on %s at %s', 
      s.name,
      fs.fuel_type,
      s.name
    )
  from public.fuel_status fs
  join public.stations s on s.id = fs.station_id
  join public.station_staff ss on ss.station_id = s.id
  where fs.status in ('low', 'out_of_stock')
    and fs.last_updated > now() - interval '1 hour'
    and not exists (
      select 1 from public.notifications n
      where n.user_id = ss.user_id
        and n.title = 'Low Stock Alert'
        and n.created_at > now() - interval '1 hour'
    );
end;
$$ language plpgsql;

-- 18. Add indexes for performance
create index if not exists idx_fuel_status_approval_status 
  on public.fuel_status(approval_status) where approval_status = 'PENDING';
create index if not exists idx_pending_approvals_status 
  on public.pending_approvals(status) where status = 'PENDING';
create index if not exists idx_stations_manager_id 
  on public.stations(manager_id);
create index if not exists idx_profiles_two_factor_enabled 
  on public.profiles(two_factor_enabled) where two_factor_enabled = true;
