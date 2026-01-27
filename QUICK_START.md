# Quick Start - TotalEnergies FASS

## 3-Minute Setup

### Step 1: Environment Variables
```bash
echo 'NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co' > .env.local
echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx' >> .env.local
```

Get from Supabase → Settings → API

### Step 2: Install & Run
```bash
npm install
npm run dev
```

### Step 3: Test
- Homepage: http://localhost:3000
- Login: http://localhost:3000/auth/login

---

## Test Accounts

Copy-paste ready:

**Admin**
```
Email: admin@totalenergies.et
Password: Admin@123456!
```

**Staff**
```
Email: staff.bole.1@totalenergies.et
Password: Staff@Bole1!
```

**IT Support**
```
Email: it.support@totalenergies.et
Password: ITSupport@Lead123!
```

More accounts in `TEST_CREDENTIALS.md`

---

## What to Test

1. **Homepage** - Email signup works
2. **Login** - Email/password auth
3. **Staff Portal** - Update fuel status
4. **Admin Console** - View stats
5. **IT Support** - System health

---

## Deploy to Vercel

```bash
git push  # Auto-deploys
```

Add env vars in Vercel dashboard → Settings → Environment Variables

---

## Still Stuck?

1. Check `DEPLOYMENT_GUIDE.md`
2. Check `TEST_CREDENTIALS.md`
3. Check Supabase logs
4. Check Vercel logs

---

**You're ready to go!** 🚀
