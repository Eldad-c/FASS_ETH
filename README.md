# TotalEnergies FASS (Fuel Availability Surveillance System)

## Overview

A **clean, production-ready** fuel availability tracking system for TotalEnergies stations in Addis Ababa. Staff update fuel status in real-time, admins monitor system health, and the public can subscribe to fuel alerts.

## Tech Stack

- **Frontend**: Next.js 16 (React 19) + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Authentication
- **Deployment**: Vercel

## Quick Links

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Setup & deployment instructions
- **[TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)** - Test account info
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details

## Features

### 1. Public Homepage
- Email signup for fuel alerts
- No authentication required
- Simple, clean interface

### 2. Staff Portal
- Login with email/password
- View assigned station
- Update fuel status in real-time
- Queue level tracking
- Price monitoring

### 3. Admin Console
- System overview dashboard
- Fuel availability charts
- Active stations monitoring
- User management
- Real-time metrics

### 4. IT Support Dashboard
- System health status
- Service monitoring
- Basic diagnostics

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (optional, for hosting)

### Installation

```bash
# Clone repository
git clone <repo>
cd fass

# Install dependencies
npm install

# Set environment variables
echo 'NEXT_PUBLIC_SUPABASE_URL=your_url' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key' >> .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@totalenergies.et | Admin@123456! |
| Staff | staff.bole.1@totalenergies.et | Staff@Bole1! |
| IT Support | it.support@totalenergies.et | ITSupport@Lead123! |

See [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md) for more accounts.

## Database

### Core Tables
- `stations` - 10 TotalEnergies stations in Addis Ababa
- `profiles` - Users (admin, staff, it_support roles)
- `fuel_status` - Real-time fuel availability/pricing
- `email_alerts` - Newsletter subscribers

### Setup

Database is auto-initialized. Manual setup:

```bash
# In Supabase SQL Editor, run:
psql scripts/007_unified_final_schema.sql
psql scripts/009_fix_rls_recursion.sql
psql scripts/011_cleanup_and_simplify.sql
```

## Project Structure

```
├── app/
│   ├── page.tsx              # Homepage (email signup)
│   ├── auth/
│   │   ├── login/
│   │   └── sign-up/
│   ├── staff/                # Staff portal
│   ├── admin/                # Admin console
│   └── it-support/           # IT support dashboard
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── ui/                   # Shadcn components
│   └── ...
├── lib/
│   ├── supabase/            # Supabase helpers
│   ├── types.ts
│   └── role-helpers.ts
├── scripts/                  # Database migrations
├── public/                   # Static assets
└── ...
```

## Key Features

✓ **Simple Auth** - Email/password, no 2FA  
✓ **Real-time Updates** - Live fuel status  
✓ **Role-based Access** - Admin, Staff, IT Support  
✓ **Clean Code** - Removed bloat, simplified logic  
✓ **Production Ready** - Deployable to Vercel  
✓ **Responsive Design** - Mobile-friendly UI  
✓ **Zero Contact Info** - Privacy-focused  

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add env variables
4. Auto-deploys on push

```bash
git push
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## What Was Removed

- Driver & Logistics apps (tanker tracking)
- 2FA authentication
- Multi-language support (i18n)
- Complex approval workflows
- Public user accounts
- Unnecessary contact info

## Performance

- Optimized queries with indexing
- Client-side state for fast updates
- Minimal bundle size
- Auto-caching on Vercel

## Security

- Supabase RLS enabled
- Environment variables for secrets
- HTTPS by default
- Input validation

## Troubleshooting

### Can't login?
→ Check email/password in TEST_CREDENTIALS.md

### Database errors?
→ Run migrations in Supabase SQL Editor

### Redirects to login?
→ Check user role in `profiles` table

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for more troubleshooting.

## Support

1. Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Check [TEST_CREDENTIALS.md](./TEST_CREDENTIALS.md)
3. Review Supabase logs
4. Check Vercel deployment logs

## License

Proprietary - TotalEnergies

---

**Status**: ✓ Production Ready  
**Version**: 2.0 (Simplified & Cleaned)  
**Last Updated**: 2026-01-28
