# FASS ETH - Fuel Availability and Supply System for Ethiopia

## Demo Setup Guide

This application is fully functional WITHOUT authentication. All dashboards are directly accessible with demo data pre-populated.

### Key Features Removed for Demo
- ✅ Authentication/Login removed - all pages directly accessible
- ✅ Language switcher removed from header
- ✅ Subscribe to alerts button removed
- ✅ Analytics and Audit Logs sections removed from admin
- ✅ Sample seed data provided for all modules

---

## Seeding Demo Data

To populate the system with demo data, run the SQL seed script:

```sql
-- Execute this in your Supabase SQL editor or database client
-- File: scripts/seed-demo-data.sql

-- Creates:
-- - 6 Demo Users (Admin, Staff, Logistics Manager, 2 Drivers)
-- - 5 Demo Stations across Addis Ababa
-- - Fuel status data for all fuel types
-- - Sample user reports and issues
-- - 5 Demo Tankers with different statuses
-- - Trip management data (scheduled, in-progress, completed)
-- - Delivery records
```

### Demo Accounts

| Role | Email | Name |
|------|-------|------|
| Admin | admin@demo.com | Admin User |
| Staff | staff1@demo.com | John Kebede |
| Staff | staff2@demo.com | Amara Mengistu |
| Logistics | logistics@demo.com | Logistics Manager |
| Driver | driver1@demo.com | Abebe Assefa |
| Driver | driver2@demo.com | Tadesse Kebede |

---

## Module Overview

### A. Home / Map View (`/`)
- **Purpose**: Real-time fuel availability map and station locator
- **Demo Data**: All 5 demo stations with live fuel status
- **Features**: 
  - Interactive map with station markers
  - Color-coded fuel availability (Green=Available, Yellow=Low, Red=Out of Stock)
  - Queue level indicators
  - Find directions to stations

### B. Admin Console (`/admin`)
- **Removed**: Analytics and Audit Logs sections
- **Available**:
  - Dashboard overview
  - Station management (Add, edit, view all stations)
  - User management (View and manage users)
  - Reports management (View submitted issues)
  - Notifications center
  - System settings

### C. Staff Portal (`/staff`)
- **Demo User**: Auto-logged as John Kebede
- **Features**:
  - Station fuel status dashboard
  - Report fuel shortages/issues
  - View incoming deliveries
  - Monitor queue levels
  - Create status updates (auto-routed to managers for approval)

### D. Logistics Hub (`/logistics`)
- **Demo User**: Auto-logged as Logistics Manager
- **Features**:
  - Fleet management - view all tankers
  - Trip management - schedule and track deliveries
  - Live delivery tracking with map
  - ETA calculations
  - Dispatch control
  - Delivery queue management

**Trip Management Endpoints**:
- `/logistics/trips` - Schedule new trips, manage existing ones
- `/logistics/fleet` - View fleet status and tanker details
- `/logistics/dispatch` - Dispatch control center
- `/logistics/tracking` - Live tracking dashboard

### E. Driver App (`/driver`)
- **Demo Driver**: Auto-logged as Abebe Assefa
- **Features**:
  - Active delivery tracking
  - Navigation to destination
  - Scheduled trips queue
  - Real-time location updates (GPS)
  - Trip completion workflow
  - Tanker information display

---

## Sample Data Overview

### Stations (5 locations)
```
1. TotalEnergies Bole - 9.0065, 38.7874
   - Diesel: Available (Short Queue)
   - Benzene 95: Available (Medium Queue)
   - Benzene 97: Low (Long Queue)

2. TotalEnergies Piazza - 9.0326, 38.7469
   - Diesel: Low (Medium Queue)
   - Benzene 95: Available (Short Queue)
   - Benzene 97: Available (No Queue)

3. TotalEnergies Kazanchis - 8.9999, 38.7822
   - Diesel: Out of Stock (Very Long Queue)
   - Benzene 95: Low (Long Queue)
   - Benzene 97: Available (Medium Queue)

4. TotalEnergies CMC - 9.0150, 38.7650
   - Diesel: Available (Short Queue)
   - Benzene 95: Available (No Queue)
   - Benzene 97: Low (Medium Queue)

5. TotalEnergies Gulele - 9.0500, 38.7500
   - All fuels: Available (Low queue levels)
```

### Tankers (5 vehicles)
```
AA-1234-ET - 30,000L Diesel (Available)
AA-5678-ET - 30,000L Benzene 95 (Available)
AA-9012-ET - 25,000L Benzene 97 (In Transit → Bole Station)
AA-3456-ET - 30,000L Diesel (Available)
AA-7890-ET - 30,000L Benzene 95 (Maintenance)
```

### Trips (5 scheduled/active)
```
1. AA-1234-ET → Piazza, 20,000L Diesel (Scheduled - 1hr)
2. AA-5678-ET → Kazanchis, 25,000L Benzene 95 (Scheduled - 2hrs)
3. AA-9012-ET → Bole, 22,000L Benzene 97 (In Progress - ETA 30min)
4. AA-3456-ET → CMC, 28,000L Diesel (Scheduled - 4hrs)
5. AA-1234-ET → Gulele, 18,000L Diesel (Completed ✓)
```

### Reports (4 active)
```
1. Bole - Diesel shortage forming long queues
2. Piazza - Benzene 95 low, expect delays
3. Kazanchis - CRITICAL: No diesel stock available
4. Bole - Benzene 97 running low
```

---

## Direct Access URLs

**No authentication needed - open any of these directly:**

| Module | URL |
|--------|-----|
| Home/Map | `http://localhost:3000/` |
| Admin Console | `http://localhost:3000/admin` |
| Staff Portal | `http://localhost:3000/staff` |
| Logistics Hub | `http://localhost:3000/logistics` |
| Trip Management | `http://localhost:3000/logistics/trips` |
| Fleet Management | `http://localhost:3000/logistics/fleet` |
| Live Tracking | `http://localhost:3000/logistics/tracking` |
| Dispatch Control | `http://localhost:3000/logistics/dispatch` |
| Driver App | `http://localhost:3000/driver` |
| Report Issue | `http://localhost:3000/report` |

---

## Database Schema

Key tables:
- `profiles` - Users (admin, staff, logistics, drivers)
- `stations` - Fuel stations
- `fuel_status` - Real-time fuel availability per station
- `user_reports` - Issues/shortages reported by staff
- `tankers` - Fleet vehicles
- `trips` - Scheduled/completed deliveries
- `deliveries` - Delivery records
- `tanker_locations` - GPS tracking history

---

## Testing the System

1. **View Real-time Map**: Go to `/` to see all stations
2. **Check Staff Portal**: Visit `/staff` to see fuel status and reports
3. **Manage Trips**: Go to `/logistics/trips` to schedule deliveries
4. **Track Driver**: Visit `/driver` to see active delivery
5. **Admin Overview**: Open `/admin` to see system stats

---

## Architecture

- **Frontend**: Next.js 16 with TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Database**: Real-time via Supabase subscriptions
- **Maps**: Leaflet + OpenStreetMap
- **UI**: Shadcn/ui + Tailwind CSS
- **No Auth**: All routes directly accessible

---

## Notes

- GPS tracking is optional (uses browser geolocation)
- All timestamps are local to the current session
- Directions open in Google Maps
- System supports 3 fuel types: Diesel, Benzene 95, Benzene 97
- Queue levels: None → Short → Medium → Long → Very Long
