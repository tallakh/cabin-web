# Local Development Guide

This guide will help you set up and test the cabin booking service locally.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works fine)

## Step 1: Install Dependencies

If you haven't already, install all dependencies:

```bash
npm install
```

## Step 2: Set Up Supabase

You have two options:

### Option A: Use Supabase Cloud (Recommended for Quick Start)

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and sign up/login
   - Click "New Project"
   - Choose an organization, name your project, set a database password
   - Select a region close to you
   - Wait for the project to be created (takes ~2 minutes)

2. **Run the database migration**
   - In your Supabase dashboard, go to **SQL Editor**
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

3. **Configure Authentication**
   - Go to **Authentication > URL Configuration**
   - Set **Site URL** to: `http://localhost:3000`
   - Add to **Redirect URLs**: `http://localhost:3000/**`
   - Go to **Authentication > Settings**
   - For invite-only: Keep "Enable email confirmations" enabled
   - For easier testing: You can temporarily disable email confirmations
   - Go to **Authentication > Providers** and ensure **Email** is enabled

4. **Get your API keys**
   - Go to **Settings > API**
   - Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy the **anon/public key** (starts with `eyJ...`)

### Option B: Use Supabase Local (Advanced)

If you prefer running Supabase locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db reset
```

Then use the local URL and keys provided by the CLI.

## Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 4: Start the Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

## Step 5: Set Up Your First Admin User

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard > **Authentication > Users**
2. Click **"Add user"** > **"Create new user"**
3. Enter an email and password (e.g., `admin@example.com`)
4. Click **"Create user"**
5. Go to **SQL Editor** and run:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE email = 'admin@example.com';
   ```

### Method 2: Via Sign Up (If email confirmations disabled)

1. Go to `http://localhost:3000/login`
2. You'll need to create a sign-up flow or temporarily disable email confirmations
3. After creating the user, set them as admin using the SQL above

## Step 6: Test the Application

### Test User Flow

1. **Login as Admin**
   - Go to `http://localhost:3000`
   - You should be redirected to `/login`
   - Log in with your admin credentials

2. **Create a Cabin (Admin)**
   - Click **"Admin"** in the navigation
   - Click **"Manage Cabins"**
   - Click **"Add Cabin"**
   - Fill in:
     - Name: "Mountain View Cabin"
     - Description: "Beautiful cabin with mountain views"
     - Capacity: 4
   - Click **"Create"**

3. **Create a Booking (User)**
   - Click **"New Booking"** in the navigation
   - Select a cabin
   - Choose start and end dates (must be in the future)
   - Add optional notes
   - Click **"Create Booking"**
   - You should see it appear in "My Bookings" with status "Pending"

4. **Approve a Booking (Admin)**
   - Click **"Admin"** > **"Manage Bookings"**
   - You should see the pending booking
   - Click **"Approve"** or **"Reject"**
   - The status will update immediately

5. **View Calendar**
   - Go to the main dashboard
   - You should see a calendar with approved bookings highlighted
   - Navigate between months using the arrow buttons

### Test Regular User Flow

1. **Create a Regular User**
   - In Supabase Dashboard > Authentication > Users
   - Click **"Invite User"** or **"Add user"**
   - Enter email: `user@example.com`
   - Set a password
   - The user will receive an invitation email (or you can set password directly)

2. **Login as Regular User**
   - Log out as admin
   - Log in as the regular user
   - You should NOT see the "Admin" link
   - You can view calendar, create bookings, and see your own bookings

3. **Test Booking Restrictions**
   - Try to create a booking with dates in the past (should fail)
   - Try to create overlapping bookings (should fail)
   - Create a valid booking and verify it shows as "Pending"

## Troubleshooting

### "Unauthorized" or "Forbidden" Errors

- Check that your `.env.local` file has the correct Supabase URL and key
- Verify the user profile exists in the `user_profiles` table
- Check that RLS policies are set up correctly (run the migration again)

### Can't Log In

- Check Supabase Authentication settings
- Verify email confirmations are configured correctly
- Check browser console for errors
- Try creating a new user in Supabase dashboard

### Database Errors

- Make sure you ran the migration SQL file
- Check Supabase logs: Dashboard > Logs > Postgres Logs
- Verify all tables exist: Dashboard > Table Editor

### Calendar Not Showing Bookings

- Make sure bookings have status "approved"
- Check that dates are valid (not in the past)
- Verify the cabin exists and is linked correctly

## Development Tips

### View Database Tables

- Go to Supabase Dashboard > **Table Editor**
- You can view and edit data directly here

### Check Logs

- **Application logs**: Check your terminal where `npm run dev` is running
- **Database logs**: Supabase Dashboard > Logs > Postgres Logs
- **Auth logs**: Supabase Dashboard > Logs > Auth Logs

### Reset Database

If you need to start fresh:

1. In Supabase SQL Editor, run:
   ```sql
   TRUNCATE TABLE bookings CASCADE;
   TRUNCATE TABLE cabins CASCADE;
   TRUNCATE TABLE user_profiles CASCADE;
   ```

2. Or delete and recreate your Supabase project

### Test Different Scenarios

- Create multiple cabins
- Create overlapping booking requests (should be rejected)
- Test admin vs regular user permissions
- Test date validations
- Test booking status changes

## Next Steps

Once everything is working locally:

1. Test all features thoroughly
2. Create a few test cabins and bookings
3. Test with multiple users
4. When ready, follow the deployment guide in `README.md`

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```
