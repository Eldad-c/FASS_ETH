# FASS ETH - Fuel Availability Status System
## Deployment & Setup Guide

### Project Overview
FASS ETH is a real-time fuel availability tracking system for TotalEnergies Ethiopia stations. The app includes a public homepage, staff portal for updates, and admin dashboard for monitoring.

### Architecture
- **Frontend**: Next.js 16 (App Router) + React 19
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Deployment**: Vercel

### Pages
1. **Home** (`/`) - Public fuel availability & reporting
2. **Staff Portal** (`/staff`) - Real-time fuel status updates
3. **Admin Dashboard** (`/admin`) - System monitoring & reports

### Core Features
- Real-time fuel status updates with queue levels
- Public fuel reporting system
- Staff portal with modal-based editing
- Admin dashboard with fuel statistics
- Live report verification
- Real-time data synchronization

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Database Setup
Run migrations in Supabase:
```sql
-- See scripts/ folder for all migrations
scripts/001_create_tables.sql through scripts/012_create_fuel_reports.sql
```

### Local Development
```bash
npm install
npm run dev
```
Visit http://localhost:3000

### Deployment to Vercel
1. Push code to GitHub (Eldad-c/FASS_ETH_DEMO)
2. Go to vercel.com and import the repository
3. Add environment variables in Vercel Settings
4. Deploy!

### Download ZIP
**From v0:**
1. Click three dots (⋯) in top-right of code block
2. Select "Download ZIP"

**From GitHub:**
1. Go to github.com/Eldad-c/FASS_ETH_DEMO
2. Click Code → Download ZIP

### Project Stats
- **Pages**: 3 functional pages
- **Components**: 7 core components
- **API Routes**: 2 essential routes
- **Database Tables**: 5 tables (stations, fuel_status, fuel_reports, profiles, audit_logs)
- **File Count**: ~60 lean, focused files
- **Bundle Size**: Optimized for performance

### Troubleshooting
- **Port 3000 in use**: `lsof -i :3000` then `kill -9 <PID>`
- **Module not found**: `npm install` and restart dev server
- **Database connection**: Check SUPABASE_URL and keys in environment variables

### Support
For issues or questions, check the GitHub repository or create an issue.
