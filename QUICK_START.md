# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install & Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

## 2. Supabase Setup (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in project details and wait for creation (~2 minutes)
4. Go to **SQL Editor** → Click "New Query"
5. Copy/paste the entire `supabase/migrations/001_initial_schema.sql` file
6. Click "Run" (Cmd/Ctrl + Enter)
7. Go to **Settings > API** and copy:
   - Project URL
   - anon/public key

## 3. Configure Environment

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 4. Configure Auth

In Supabase Dashboard:
- **Authentication > URL Configuration**
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/**`

## 5. Create Admin User

1. **Authentication > Users** → "Add user"
2. Create user with email/password
3. **SQL Editor** → Run:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```

## 6. Run!

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in!

## First Steps After Login

1. **Admin Dashboard** → **Manage Cabins** → **Add Cabin**
2. Create a test cabin
3. **New Booking** → Create a booking request
4. **Admin** → **Manage Bookings** → Approve it
5. View it on the **Calendar**!

---

For detailed testing instructions, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
