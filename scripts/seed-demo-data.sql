-- Seed Demo Data for FASS ETH System

-- Demo Profiles (Users)
INSERT INTO profiles (id, email, full_name, role, assigned_station_id, created_at, updated_at) VALUES
('demo-admin', 'admin@demo.com', 'Admin User', 'admin', NULL, NOW(), NOW()),
('demo-staff-1', 'staff1@demo.com', 'John Kebede', 'staff', NULL, NOW(), NOW()),
('demo-staff-2', 'staff2@demo.com', 'Amara Mengistu', 'staff', NULL, NOW(), NOW()),
('demo-logistics', 'logistics@demo.com', 'Logistics Manager', 'logistics', NULL, NOW(), NOW()),
('demo-driver-1', 'driver1@demo.com', 'Abebe Assefa', 'driver', NULL, NOW(), NOW()),
('demo-driver-2', 'driver2@demo.com', 'Tadesse Kebede', 'driver', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Demo Stations
INSERT INTO stations (name, address, latitude, longitude, manager_id, phone, operating_hours, is_active, created_at, updated_at) VALUES
('TotalEnergies Bole', '123 Bole Road, Addis Ababa', 9.0065, 38.7874, 'demo-admin', '+251-11-416-1234', '24/7', true, NOW(), NOW()),
('TotalEnergies Piazza', '456 Piazza, Addis Ababa', 9.0326, 38.7469, 'demo-admin', '+251-11-462-5678', '6:00-22:00', true, NOW(), NOW()),
('TotalEnergies Kazanchis', '789 Kazanchis, Addis Ababa', 8.9999, 38.7822, 'demo-admin', '+251-11-553-9012', '24/7', true, NOW(), NOW()),
('TotalEnergies CMC', '321 CMC, Addis Ababa', 9.0150, 38.7650, 'demo-admin', '+251-11-371-3456', '5:00-23:00', true, NOW(), NOW()),
('TotalEnergies Gulele', '654 Gulele, Addis Ababa', 9.0500, 38.7500, 'demo-admin', '+251-11-462-7890', '24/7', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Assign staff to stations
UPDATE profiles SET assigned_station_id = (SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1) 
WHERE id = 'demo-staff-1';
UPDATE profiles SET assigned_station_id = (SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1) 
WHERE id = 'demo-staff-2';

-- Demo Fuel Status
INSERT INTO fuel_status (station_id, fuel_type, status, queue_level, price_per_liter, estimated_replenishment, last_updated_by, created_at, updated_at) VALUES
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'diesel', 'available', 'short', 85.50, NOW() + INTERVAL '2 hours', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_95', 'available', 'medium', 92.00, NOW() + INTERVAL '4 hours', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_97', 'low', 'long', 98.50, NOW() + INTERVAL '6 hours', 'demo-staff-1', NOW(), NOW()),

((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'diesel', 'low', 'medium', 85.50, NOW() + INTERVAL '1 hour', 'demo-staff-2', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'benzene_95', 'available', 'short', 92.00, NOW() + INTERVAL '3 hours', 'demo-staff-2', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'benzene_97', 'available', 'none', 98.50, NOW() + INTERVAL '5 hours', 'demo-staff-2', NOW(), NOW()),

((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'diesel', 'out_of_stock', 'very_long', 85.50, NOW() + INTERVAL '30 minutes', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'benzene_95', 'low', 'long', 92.00, NOW() + INTERVAL '2 hours', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'benzene_97', 'available', 'medium', 98.50, NOW() + INTERVAL '4 hours', 'demo-staff-1', NOW(), NOW()),

((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'diesel', 'available', 'short', 85.50, NOW() + INTERVAL '8 hours', 'demo-staff-2', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'benzene_95', 'available', 'none', 92.00, NOW() + INTERVAL '7 hours', 'demo-staff-2', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'benzene_97', 'low', 'medium', 98.50, NOW() + INTERVAL '5 hours', 'demo-staff-2', NOW(), NOW()),

((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'diesel', 'available', 'none', 85.50, NOW() + INTERVAL '10 hours', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'benzene_95', 'available', 'short', 92.00, NOW() + INTERVAL '9 hours', 'demo-staff-1', NOW(), NOW()),
((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'benzene_97', 'available', 'short', 98.50, NOW() + INTERVAL '8 hours', 'demo-staff-1', NOW(), NOW())
ON CONFLICT (station_id, fuel_type) DO NOTHING;

-- Demo User Reports
INSERT INTO user_reports (station_id, fuel_type, reported_status, queue_level, notes, submitted_by, status, created_at, updated_at) VALUES
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'diesel', 'available', 'short', 'Queue forming, expect delays', 'demo-staff-1', 'open', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'benzene_95', 'low', 'long', 'Stock running low, delivery expected soon', 'demo-staff-2', 'open', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'diesel', 'out_of_stock', 'very_long', 'Critical shortage, no stock available', 'demo-staff-1', 'pending', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_97', 'low', 'medium', 'Grade 97 running low', 'demo-staff-1', 'open', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes')
ON CONFLICT DO NOTHING;

-- Demo Tankers
INSERT INTO tankers (plate_number, capacity_liters, fuel_type, status, driver_id, current_latitude, current_longitude, last_location_update, created_at, updated_at) VALUES
('AA-1234-ET', 30000, 'diesel', 'available', 'demo-driver-1', 9.0200, 38.7700, NOW(), NOW(), NOW()),
('AA-5678-ET', 30000, 'benzene_95', 'available', 'demo-driver-2', 9.0100, 38.7600, NOW(), NOW(), NOW()),
('AA-9012-ET', 25000, 'benzene_97', 'in_transit', 'demo-driver-1', 9.0150, 38.7650, NOW(), NOW(), NOW()),
('AA-3456-ET', 30000, 'diesel', 'available', NULL, 9.0000, 38.7800, NOW(), NOW(), NOW()),
('AA-7890-ET', 30000, 'benzene_95', 'maintenance', NULL, 9.0300, 38.7500, NOW(), NOW(), NOW())
ON CONFLICT (plate_number) DO NOTHING;

-- Demo Trips
INSERT INTO trips (tanker_id, origin_station_id, destination_station_id, fuel_type, quantity_liters, status, scheduled_departure, actual_departure, estimated_arrival, actual_arrival, created_by, created_at, updated_at) VALUES
((SELECT id FROM tankers WHERE plate_number = 'AA-1234-ET' LIMIT 1), NULL, (SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'diesel', 20000, 'scheduled', NOW() + INTERVAL '1 hour', NULL, NOW() + INTERVAL '2 hours', NULL, 'demo-logistics', NOW(), NOW()),
((SELECT id FROM tankers WHERE plate_number = 'AA-5678-ET' LIMIT 1), NULL, (SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'benzene_95', 25000, 'scheduled', NOW() + INTERVAL '2 hours', NULL, NOW() + INTERVAL '3 hours', NULL, 'demo-logistics', NOW(), NOW()),
((SELECT id FROM tankers WHERE plate_number = 'AA-9012-ET' LIMIT 1), NULL, (SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_97', 22000, 'in_progress', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', NULL, 'demo-logistics', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
((SELECT id FROM tankers WHERE plate_number = 'AA-3456-ET' LIMIT 1), NULL, (SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'diesel', 28000, 'scheduled', NOW() + INTERVAL '4 hours', NULL, NOW() + INTERVAL '5 hours', NULL, 'demo-logistics', NOW(), NOW()),
((SELECT id FROM tankers WHERE plate_number = 'AA-1234-ET' LIMIT 1), NULL, (SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'diesel', 18000, 'completed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'demo-logistics', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Demo Deliveries
INSERT INTO deliveries (trip_id, station_id, fuel_type, volume_delivered, delivery_timestamp, received_by, signature_confirmed, notes, status, created_at, updated_at) VALUES
((SELECT id FROM trips WHERE status = 'completed' LIMIT 1), (SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'diesel', 18000, NOW() - INTERVAL '1 hour', 'demo-staff-1', true, 'Delivery completed successfully', 'DELIVERED', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_status_station ON fuel_status(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_updated ON fuel_status(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_tanker ON trips(tanker_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_station ON deliveries(station_id);
