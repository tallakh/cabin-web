# Cabin Booking Service

A family cabin booking system built with Next.js and Supabase.

## Quick Start (Local Development)

For detailed local development instructions, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

**Quick steps:**
1. `npm install`
2. Create Supabase project at [supabase.com](https://supabase.com)
3. Run the SQL migration from `supabase/migrations/001_initial_schema.sql`
4. Create `.env.local` with your Supabase credentials
5. `npm run dev`
6. Set up admin user (see LOCAL_DEVELOPMENT.md)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Go to Authentication > Settings and configure:
   - Enable "Enable email confirmations" (for invite-only)
   - Set "Site URL" to `http://localhost:3000` for development
   - Add redirect URLs as needed
4. Go to Authentication > Providers and ensure Email is enabled
5. Copy your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Admin User

1. Go to Supabase Dashboard > Authentication > Users
2. Create a new user (or use the SQL editor to set `is_admin = true` for an existing user)
3. In the SQL Editor, run:
   ```sql
   UPDATE user_profiles SET is_admin = true WHERE email = 'your-admin-email@example.com';
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Invite-only user authentication
- Multi-cabin support
- Booking requests with admin approval
- Calendar view of availability
- Admin dashboard for managing cabins and bookings

## Deployment

### Vercel (Recommended - Free Tier)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add environment variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Update Supabase settings**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel domain to "Redirect URLs"
   - Add your Vercel domain to "Site URL"
   - Example: `https://your-project.vercel.app`

5. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Or click "Deploy" in the Vercel dashboard

### Setting up Admin User

After deployment, set up your first admin user:

1. Create a user account through the login page (or via Supabase Auth)
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE email = 'your-admin-email@example.com';
   ```

### Inviting Users

**Option 1: Through Admin Interface (Recommended)**

1. Set up service role key in `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   Get this from Supabase Dashboard > Settings > API > service_role key

2. Log in as admin and go to Admin > Manage Users
3. Use the "Invite New User" form to send invitations

**Option 2: Through Supabase Dashboard**

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Invite User"
3. Enter the email address
4. The user will receive an invitation email
5. They can set their password and log in

**Note:** The service role key is required for the admin interface to invite users. Without it, you'll need to use the Supabase Dashboard.
