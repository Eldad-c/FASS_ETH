# TotalEnergies FASS - Deployment Guide

## Quick Start

This is a **clean, production-ready** Fuel Availability Surveillance System (FASS) for TotalEnergies.

### What's Included

- **Main Website**: Email newsletter signup for fuel alerts
- **Staff Portal**: Manage fuel status at assigned stations
- **Admin Console**: System overview and fuel status monitoring
- **IT Support Dashboard**: Basic system health monitoring
- **Simple Authentication**: Email/password login, direct dashboard routing
- **Database**: Supabase PostgreSQL with 10 TotalEnergies stations

### What Was Removed

- Driver & Logistics apps (tanker tracking, fleet management)
- 2FA authentication
- Multi-language support (i18n)
- Unnecessary contact information
- Public user dashboards
- Complex approval workflows

---

## Prerequisites

- Node.js 18+
- Supabase account (https://supabase.com)
- Vercel account (for deployment)

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd fass
npm install
```

### 2. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get these from your Supabase project → Settings → API

### 3. Database Setup

The database is **already initialized**. If you need to reset:

1. Go to Supabase → SQL Editor
2. Run migration scripts in order:
   - `007_unified_final_schema.sql` - Core schema
   - `009_fix_rls_recursion.sql` - Fix policies
   - `011_cleanup_and_simplify.sql` - Final cleanup

### 4. Create Test Accounts

Use Supabase Authentication to create users or invite them:

1. Supabase Dashboard → Authentication → Users
2. Invite users with these emails (see TEST_CREDENTIALS.md for passwords)

---

## Test Accounts

### Admin Access
- **Email**: admin@totalenergies.et
- **Password**: Admin@123456!
- **URL**: https://yourapp.com/auth/login → redirects to `/admin`

### Staff Access
- **Email**: staff.bole.1@totalenergies.et
- **Password**: Staff@Bole1!
- **URL**: https://yourapp.com/auth/login → redirects to `/staff`

### IT Support Access
- **Email**: it.support@totalenergies.et
- **Password**: ITSupport@Lead123!
- **URL**: https://yourapp.com/auth/login → redirects to `/it-support`

See `TEST_CREDENTIALS.md` for complete user list.

---

## Features Overview

### Main Page (`/`)
- Email signup form for fuel alert notifications
- No authentication required
- Stores emails in `email_alerts` table

### Staff Portal (`/staff`)
- Select station
- View fuel availability by type
- Update fuel status (Available, Low, Out of Stock)
- Track queue levels
- Auto-logout button

### Admin Console (`/admin`)
- System overview with key metrics
- Fuel availability breakdown (charts)
- Active stations count
- User management overview
- Real-time status indicators

### IT Support (`/it-support`)
- System health monitoring
- Station and user statistics
- Service status display
- Health indicators

---

## Deployment to Vercel

### Step 1: Connect GitHub
1. Push your code to GitHub
2. Vercel.com → Dashboard → New Project
3. Import your repository

### Step 2: Add Environment Variables
In Vercel project settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Step 3: Deploy
```bash
git push  # Vercel auto-deploys
```

Your app will be live at `https://your-project.vercel.app`

---

## Database Schema

### Core Tables
- `stations` - TotalEnergies stations
- `profiles` - User accounts (admin, staff, it_support)
- `fuel_status` - Current fuel availability/pricing
- `email_alerts` - Newsletter subscribers

### Removed Tables
- `tankers`, `trips`, `deliveries` - Driver/Logistics features
- `subscriptions`, `user_reports` - User dashboard features
- `audit_logs`, `notifications`, `system_logs` - Logging (kept for future)

---

## API Endpoints

### Authentication
- `POST /app/auth/sign-up` - Register new account
- `POST /app/auth/login` - Login with email/password
- `POST /app/api/auth/logout` - Logout

### Public
- `POST /app/api/email-alerts` - Subscribe email for alerts

### Protected (Staff/Admin/IT)
- `GET /app/api/fuel-status` - Get fuel status
- `POST /app/api/fuel-status/update` - Update fuel status

---

## Troubleshooting

### Can't login?
- Check if user exists in Supabase → Authentication
- Verify email/password in TEST_CREDENTIALS.md
- Check environment variables are set

### Database errors?
- Verify Supabase connection in `.env.local`
- Check if migrations were run
- Supabase → SQL Editor → Run migrations manually

### Redirects to login page?
- User role may not be recognized
- Check `profiles` table → `role` column values
- Must be one of: `ADMIN`, `STAFF`, `IT_SUPPORT`

---

## Performance Tips

- Staff portal uses client-side state for fast updates
- Admin console caches stats on initial load
- Database queries optimized with indexes
- No unnecessary data fetches

---

## Security Notes

- All passwords should be strong (12+ chars, mixed case)
- Use Supabase RLS for row-level security
- Enable HTTPS in production (Vercel default)
- API keys are public (anon key), be careful with custom endpoints

---

## Support

For issues:
1. Check DEPLOYMENT_GUIDE.md (this file)
2. Review TEST_CREDENTIALS.md
3. Check Supabase logs: Dashboard → Logs
4. Vercel logs: Project → Deployments → Function Logs

---

## What to Deploy

```
✓ /app - All pages and routes
✓ /components - UI components
✓ /lib - Utilities and helpers
✓ /public - Assets
✓ /scripts - Database migrations
✓ package.json & package-lock.json
✓ next.config.mjs
✓ tailwind.config.ts
✓ tsconfig.json
✓ .env.local (NOT in git - add to Vercel)
```

---

**Status**: READY FOR PRODUCTION
**Last Updated**: 2026-01-28
**Version**: 2.0 (Simplified & Cleaned)
