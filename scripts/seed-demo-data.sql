-- Seed Demo Data for FASS ETH System  
-- This script populates demo data for testing and demonstration

-- Demo Stations (5 stations across Addis Ababa with varied locations)
INSERT INTO stations (name, address, latitude, longitude, is_active) VALUES
('TotalEnergies Bole', '123 Bole Road, Addis Ababa', 9.0065, 38.7874, true),
('TotalEnergies Piazza', '456 Piazza, Addis Ababa', 9.0326, 38.7469, true),
('TotalEnergies Kazanchis', '789 Kazanchis, Addis Ababa', 8.9999, 38.7822, true),
('TotalEnergies CMC', '321 CMC, Addis Ababa', 9.0150, 38.7650, true),
('TotalEnergies Gulele', '654 Gulele, Addis Ababa', 9.0500, 38.7500, true)
ON CONFLICT DO NOTHING;

-- Demo Fuel Status - 15 records (3 fuel types per station, showing varied availability and queues)
INSERT INTO fuel_status (station_id, fuel_type, is_available, status, queue_level) VALUES
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'diesel', true, 'available', 'short'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_95', true, 'available', 'medium'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Bole' LIMIT 1), 'benzene_97', false, 'low', 'long'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'diesel', false, 'low', 'medium'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'benzene_95', true, 'available', 'short'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Piazza' LIMIT 1), 'benzene_97', true, 'available', 'none'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'diesel', false, 'out_of_stock', 'very_long'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'benzene_95', false, 'low', 'long'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Kazanchis' LIMIT 1), 'benzene_97', true, 'available', 'medium'),
((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'diesel', true, 'available', 'short'),
((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'benzene_95', true, 'available', 'none'),
((SELECT id FROM stations WHERE name = 'TotalEnergies CMC' LIMIT 1), 'benzene_97', false, 'low', 'medium'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'diesel', true, 'available', 'none'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'benzene_95', true, 'available', 'short'),
((SELECT id FROM stations WHERE name = 'TotalEnergies Gulele' LIMIT 1), 'benzene_97', true, 'available', 'short')
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_status_station ON fuel_status(station_id);
CREATE INDEX IF NOT EXISTS idx_fuel_status_updated ON fuel_status(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_tanker ON trips(tanker_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination_station_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_station ON deliveries(station_id);
