-- Seed Sample Data for Fuel Availability System
-- This script adds realistic sample stations and fuel data for Addis Ababa

-- First, let's update the schema to support the app's expected format
-- Drop and recreate fuel_status with new structure

-- Add new columns if they don't exist
ALTER TABLE public.fuel_status ADD COLUMN IF NOT EXISTS status text 
  CHECK (status IN ('available', 'low', 'out_of_stock')) DEFAULT 'available';

-- Update the fuel_type constraint to support simpler names
ALTER TABLE public.fuel_status DROP CONSTRAINT IF EXISTS fuel_status_fuel_type_check;
ALTER TABLE public.fuel_status ADD CONSTRAINT fuel_status_fuel_type_check 
  CHECK (fuel_type IN ('petrol', 'diesel', 'premium', 'Benzene 95', 'Benzene 97', 'Diesel', 'Kerosene'));

-- Update queue_level to match app types
ALTER TABLE public.fuel_status DROP CONSTRAINT IF EXISTS fuel_status_queue_level_check;
ALTER TABLE public.fuel_status ADD CONSTRAINT fuel_status_queue_level_check 
  CHECK (queue_level IN ('none', 'short', 'medium', 'long', 'very_long', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME'));

-- Add operating_hours column to stations if missing
ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS operating_hours text;

-- Update existing stations to have operating_hours
UPDATE public.stations SET operating_hours = open_hours WHERE operating_hours IS NULL;

-- Delete existing sample data to avoid conflicts
DELETE FROM public.fuel_status;
DELETE FROM public.stations;

-- Insert sample TotalEnergies stations across Addis Ababa with realistic data
INSERT INTO public.stations (id, name, address, phone, latitude, longitude, operating_hours, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'TotalEnergies Bole', 'Bole Road, Near Bole International Airport', '+251 11 661 2345', 8.9806, 38.7995, '24 Hours', true),
  ('22222222-2222-2222-2222-222222222222', 'TotalEnergies Megenagna', 'Megenagna Junction, Ring Road', '+251 11 662 3456', 9.0217, 38.8001, '6:00 AM - 10:00 PM', true),
  ('33333333-3333-3333-3333-333333333333', 'TotalEnergies Mexico', 'Mexico Square, Churchill Avenue', '+251 11 515 4567', 9.0126, 38.7395, '6:00 AM - 11:00 PM', true),
  ('44444444-4444-4444-4444-444444444444', 'TotalEnergies 4 Kilo', '4 Kilo, Near Addis Ababa University', '+251 11 123 5678', 9.0350, 38.7636, '6:00 AM - 10:00 PM', true),
  ('55555555-5555-5555-5555-555555555555', 'TotalEnergies Sarbet', 'Sarbet Area, Lideta Sub-city', '+251 11 551 6789', 8.9958, 38.7284, '6:00 AM - 10:00 PM', true),
  ('66666666-6666-6666-6666-666666666666', 'TotalEnergies CMC', 'CMC Road, Near St. Michael Church', '+251 11 646 7890', 9.0392, 38.8234, '6:00 AM - 10:00 PM', true),
  ('77777777-7777-7777-7777-777777777777', 'TotalEnergies Piassa', 'Piassa, De Gaulle Square', '+251 11 111 8901', 9.0312, 38.7503, '6:00 AM - 9:00 PM', true),
  ('88888888-8888-8888-8888-888888888888', 'TotalEnergies Kazanchis', 'Kazanchis, Near ECA', '+251 11 551 9012', 9.0107, 38.7612, '24 Hours', true),
  ('99999999-9999-9999-9999-999999999999', 'TotalEnergies Gerji', 'Gerji Area, Behind Imperial Hotel', '+251 11 662 0123', 9.0054, 38.8150, '6:00 AM - 10:00 PM', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TotalEnergies Lafto', 'Lafto Sub-city, Main Road', '+251 11 442 1234', 8.9650, 38.7350, '6:00 AM - 10:00 PM', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TotalEnergies Summit', 'Summit Area, Near Bisrate Gabriel', '+251 11 467 2345', 9.0100, 38.7100, '6:00 AM - 10:00 PM', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'TotalEnergies Ayat', 'Ayat Condominiums, Ring Road', '+251 11 646 3456', 9.0450, 38.8350, '6:00 AM - 10:00 PM', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  operating_hours = EXCLUDED.operating_hours,
  is_active = EXCLUDED.is_active;

-- Insert fuel status for all stations with varied availability
-- TotalEnergies Bole - Good stock, short queues (24hr station, well-supplied)
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('11111111-1111-1111-1111-111111111111', 'petrol', 'available', 'short', 65.50, true),
  ('11111111-1111-1111-1111-111111111111', 'diesel', 'available', 'none', 63.00, true),
  ('11111111-1111-1111-1111-111111111111', 'premium', 'available', 'none', 72.00, true);

-- TotalEnergies Megenagna - Busy junction, medium queues
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('22222222-2222-2222-2222-222222222222', 'petrol', 'available', 'medium', 65.50, true),
  ('22222222-2222-2222-2222-222222222222', 'diesel', 'low', 'long', 63.00, true),
  ('22222222-2222-2222-2222-222222222222', 'premium', 'out_of_stock', 'none', 72.00, false);

-- TotalEnergies Mexico - Central location, varied stock
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('33333333-3333-3333-3333-333333333333', 'petrol', 'low', 'long', 65.50, true),
  ('33333333-3333-3333-3333-333333333333', 'diesel', 'available', 'medium', 63.00, true),
  ('33333333-3333-3333-3333-333333333333', 'premium', 'available', 'short', 72.00, true);

-- TotalEnergies 4 Kilo - University area, high demand
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('44444444-4444-4444-4444-444444444444', 'petrol', 'available', 'medium', 65.50, true),
  ('44444444-4444-4444-4444-444444444444', 'diesel', 'available', 'short', 63.00, true),
  ('44444444-4444-4444-4444-444444444444', 'premium', 'low', 'medium', 72.00, true);

-- TotalEnergies Sarbet - Industrial area, diesel demand
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('55555555-5555-5555-5555-555555555555', 'petrol', 'out_of_stock', 'none', 65.50, false),
  ('55555555-5555-5555-5555-555555555555', 'diesel', 'available', 'very_long', 63.00, true),
  ('55555555-5555-5555-5555-555555555555', 'premium', 'out_of_stock', 'none', 72.00, false);

-- TotalEnergies CMC - Residential area, moderate demand
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('66666666-6666-6666-6666-666666666666', 'petrol', 'available', 'short', 65.50, true),
  ('66666666-6666-6666-6666-666666666666', 'diesel', 'available', 'none', 63.00, true),
  ('66666666-6666-6666-6666-666666666666', 'premium', 'available', 'none', 72.00, true);

-- TotalEnergies Piassa - Historic center, limited hours
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('77777777-7777-7777-7777-777777777777', 'petrol', 'low', 'medium', 65.50, true),
  ('77777777-7777-7777-7777-777777777777', 'diesel', 'low', 'short', 63.00, true),
  ('77777777-7777-7777-7777-777777777777', 'premium', 'out_of_stock', 'none', 72.00, false);

-- TotalEnergies Kazanchis - Business district, 24hr
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('88888888-8888-8888-8888-888888888888', 'petrol', 'available', 'long', 65.50, true),
  ('88888888-8888-8888-8888-888888888888', 'diesel', 'available', 'medium', 63.00, true),
  ('88888888-8888-8888-8888-888888888888', 'premium', 'available', 'short', 72.00, true);

-- TotalEnergies Gerji - Growing residential area
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('99999999-9999-9999-9999-999999999999', 'petrol', 'available', 'none', 65.50, true),
  ('99999999-9999-9999-9999-999999999999', 'diesel', 'low', 'short', 63.00, true),
  ('99999999-9999-9999-9999-999999999999', 'premium', 'available', 'none', 72.00, true);

-- TotalEnergies Lafto - Southern area
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'petrol', 'available', 'medium', 65.50, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'diesel', 'out_of_stock', 'none', 63.00, false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'premium', 'low', 'short', 72.00, true);

-- TotalEnergies Summit - Western area
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'petrol', 'low', 'very_long', 65.50, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'diesel', 'available', 'long', 63.00, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'premium', 'available', 'medium', 72.00, true);

-- TotalEnergies Ayat - Eastern suburbs
INSERT INTO public.fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, is_available) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'petrol', 'available', 'short', 65.50, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'diesel', 'available', 'none', 63.00, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'premium', 'out_of_stock', 'none', 72.00, false);
