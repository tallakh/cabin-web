# Architecture & Services

This document provides an overview of the architecture and services used in the Cabin Booking Service project.

## Overview

The Cabin Booking Service is a full-stack web application built with **Next.js 14** (App Router) and uses a modern serverless architecture. The application is designed for managing family cabin bookings with user authentication, admin controls, and multi-language support.

## Core Technology Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **Database & Backend**: Supabase
- **Hosting**: Vercel
- **Email Service**: Resend (with Brevo as alternative option)
- **Domain Management**: Domeneshop

---

## Services Architecture

### 1. Supabase

**Purpose**: Backend-as-a-Service providing database, authentication, and file storage.

#### Database (PostgreSQL)

Supabase provides a managed PostgreSQL database with the following schema:

**Tables:**
- `cabins` - Cabin information (name, description, capacity, pricing, images)
- `bookings` - Booking requests with status (pending/approved/rejected) and payment tracking
- `user_profiles` - Extended user profiles linked to Supabase Auth users
- `auth.users` - Managed by Supabase Auth (automatic)

**Key Features:**
- **Row Level Security (RLS)**: Fine-grained access control at the database level
  - Users can only read/update their own bookings
  - Admins have full access to all resources
  - Public read access for cabins
- **Database Triggers**: Automatic profile creation on user signup
- **Indexes**: Optimized queries for bookings by date, status, and user

**Migrations:**
All database schema changes are managed through SQL migration files in `supabase/migrations/`:
- `001_initial_schema.sql` - Core tables and RLS policies
- `002_add_user_profile_trigger.sql` - Auto-create profiles
- `003_add_images_pricing_payments.sql` - Pricing and payment fields
- `004_setup_storage.sql` - Storage bucket and policies
- `005_allow_all_users_read_approved_pending_bookings.sql` - Booking visibility
- `006_add_number_of_guests_to_bookings.sql` - Guest count tracking

#### Authentication

Supabase Auth handles:
- User registration and login
- Password reset flows
- Session management with secure cookies
- Invite-only user creation (via admin interface)
- JWT token-based authentication

**Integration:**
- Server-side: `@supabase/ssr` package for Next.js App Router
- Client-side: Browser client for React components
- Middleware: Automatic session refresh on each request

**Email Delivery:**
- **Brevo SMTP** is configured in Supabase Dashboard for all authentication emails
- Handles password resets, email confirmations, and system notifications
- Configured in: Supabase Dashboard > Settings > Auth > SMTP Settings
- Provides better deliverability than default Supabase email service

**Configuration:**
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key (safe for client)
  - `SUPABASE_SERVICE_ROLE_KEY` - Admin key (server-only, never expose)

#### Storage

Supabase Storage is used for cabin image uploads:

- **Bucket**: `cabin-images` (public read, admin-only write)
- **Policies**: 
  - Public read access for all images
  - Only authenticated admins can upload/update/delete
- **File Management**: Handled via API routes (`/api/cabins/[id]/upload`)

**Storage Features:**
- Automatic CDN distribution
- Public URLs for direct image access
- File size validation (max 5MB)
- Image type validation

---

### 2. Vercel

**Purpose**: Hosting, deployment, and edge network for the Next.js application.

#### Deployment Configuration

**File**: `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["fra1"] // Frankfurt – closest to Norway
}
```

**Features:**
- **Automatic Deployments**: Deploys on every push to main branch
- **Preview Deployments**: Automatic preview URLs for pull requests
- **Edge Network**: Global CDN for fast content delivery
- **Serverless Functions**: API routes run as serverless functions
- **Environment Variables**: Secure storage of secrets and configuration

#### Deployment Regions

Currently configured for `fra1` (Frankfurt, Germany) region, which is the closest Vercel region to Norway for optimal latency. Serverless functions and API routes will execute in this region.

#### Environment Variables in Vercel

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- `NEXT_PUBLIC_SITE_URL` (production domain)
- `RESEND_API_KEY` (optional, for custom emails)
- `RESEND_FROM_EMAIL` (optional)
- `NEXT_PUBLIC_VIPPS_PHONE_NUMBER` (for payment integration)

#### Vercel URL Handling

The application automatically detects Vercel deployment URLs via `VERCEL_URL` environment variable (automatically set by Vercel) to generate correct links in emails and redirects.

---

### 3. Domeneshop

**Purpose**: Domain registration and DNS management.

#### Domain Configuration

Domeneshop is used for:
- Domain registration and renewal
- DNS record management
- Domain-to-Vercel mapping

#### DNS Setup

To connect a custom domain to Vercel:

1. **In Domeneshop Dashboard:**
   - Add an A record pointing to Vercel's IP (or use CNAME)
   - Or add a CNAME record pointing to your Vercel deployment URL
   - Configure subdomains as needed (e.g., `www`)

2. **In Vercel Dashboard:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Vercel will provide DNS configuration instructions
   - Follow the instructions to update DNS records in Domeneshop

3. **SSL/TLS:**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - HTTPS is enabled automatically once DNS propagates

#### Environment Variable

Set `NEXT_PUBLIC_SITE_URL` in Vercel to your custom domain (e.g., `https://cabins.example.com`) to ensure all generated links use the correct domain.

---

### 4. Email Services

The application uses two email services for different purposes:

#### Brevo (Supabase Integration)

**Purpose**: Authentication and system emails sent by Supabase Auth.

**Configuration:**
- Integrated directly in Supabase Dashboard
- Configured in **Supabase Dashboard > Settings > Auth > SMTP Settings**
- Handles all Supabase Auth emails:
  - Password reset emails
  - Email confirmation emails
  - Magic link emails
  - Invitation emails (when sent via Supabase Dashboard)

**Setup:**
1. Get Brevo SMTP credentials from Brevo dashboard
2. In Supabase Dashboard, go to **Settings > Auth > SMTP Settings**
3. Enable "Enable Custom SMTP"
4. Enter Brevo SMTP configuration:
   - Host: `smtp-relay.brevo.com`
   - Port: `587` (TLS) or `465` (SSL)
   - Username: Your Brevo SMTP username
   - Password: Your Brevo SMTP password
   - Sender email: Your verified sender address

**Benefits:**
- Higher email delivery rates than default Supabase email
- Better email reputation and deliverability
- No rate limits (subject to Brevo plan limits)
- Automatic handling of all Supabase Auth emails

#### Resend (Application Integration)

**Purpose**: Custom transactional emails sent from application code.

**Current Implementation:**
- Used in `/app/api/users/route.ts` for sending custom invitation emails
- Bypasses Supabase email rate limits for custom emails
- Custom HTML email templates with localization (Norwegian/English)

**Configuration:**
- Environment variables:
  - `RESEND_API_KEY` - API key from Resend dashboard
  - `RESEND_FROM_EMAIL` - Verified sender email address

**Features:**
- Custom branded email templates
- Multi-language support (Norwegian/English)
- Secure invitation links via Supabase Auth
- Fallback to Supabase email (via Brevo) if Resend fails

**Email Flow:**
1. Admin invites user via application interface
2. Application generates secure invitation link via Supabase Auth
3. Application sends custom branded email via Resend
4. If Resend fails, falls back to Supabase email (delivered via Brevo)

**Why Both Services?**
- **Brevo (via Supabase)**: Handles all system/auth emails automatically
- **Resend**: Provides custom branding and templates for application-initiated emails
- Together they provide comprehensive email coverage with high deliverability

---

## Application Architecture

### Frontend Structure

```
app/
├── [locale]/              # Internationalized routes (no/en)
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/          # Protected user/admin pages
│   └── page.tsx            # Home page
├── api/                    # API routes (serverless functions)
│   ├── auth/              # Auth callbacks
│   ├── bookings/          # Booking CRUD operations
│   ├── cabins/            # Cabin management
│   ├── users/              # User management
│   └── statistics/         # Analytics endpoints
└── layout.tsx              # Root layout
```

### Backend Structure

```
lib/
├── supabase/
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server-side client
│   └── middleware.ts      # Session management
├── db/
│   └── queries.ts         # Database query helpers
└── utils.ts               # Utility functions
```

### Authentication Flow

1. **Login**: User authenticates via Supabase Auth
2. **Session**: Supabase SSR middleware refreshes session on each request
3. **Authorization**: RLS policies enforce data access rules
4. **Admin Check**: Application checks `user_profiles.is_admin` for admin features

### Data Flow

```
User Request
    ↓
Next.js Middleware (i18n + auth)
    ↓
API Route / Page Component
    ↓
Supabase Client (server-side)
    ↓
PostgreSQL Database (with RLS)
    ↓
Response to User
```

### File Upload Flow

```
Admin uploads image
    ↓
API Route: /api/cabins/[id]/upload
    ↓
Validate file (type, size)
    ↓
Upload to Supabase Storage (cabin-images bucket)
    ↓
Get public URL
    ↓
Update cabin record with image_url
    ↓
Return URL to client
```

---

## Security Architecture

### Authentication Security

- **JWT Tokens**: Secure, signed tokens managed by Supabase
- **HTTP-Only Cookies**: Session tokens stored securely
- **CSRF Protection**: Built into Next.js and Supabase
- **Password Hashing**: Handled by Supabase Auth (bcrypt)

### Authorization Security

- **Row Level Security (RLS)**: Database-level access control
- **Service Role Key**: Only used server-side, never exposed to client
- **Admin Checks**: Both at database (RLS) and application level

### Data Security

- **Environment Variables**: Secrets stored in Vercel, never in code
- **HTTPS Only**: All production traffic encrypted
- **Input Validation**: File type/size checks, SQL injection prevention via parameterized queries

---

## Internationalization (i18n)

**Service**: next-intl

**Supported Locales:**
- Norwegian (`no`) - Default
- English (`en`)

**Implementation:**
- Locale-based routing: `/no/dashboard`, `/en/dashboard`
- Translation files in `messages/` directory
- Automatic locale detection from browser
- Locale preserved in authentication redirects

---

## Environment Variables Reference

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional (for full functionality)

```env
# Admin operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Production URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Custom email service (Resend)
# Note: Brevo is configured in Supabase Dashboard, not via env vars
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@your-domain.com

# Payment integration
NEXT_PUBLIC_VIPPS_PHONE_NUMBER=12345678
```

**Note on Email Configuration:**
- **Brevo**: Configured in Supabase Dashboard (Settings > Auth > SMTP Settings)
- **Resend**: Configured via environment variables (for custom application emails)

---

## Service Dependencies

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Next.js    │
│  (Hosting)  │     │  (App)      │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │  Supabase    │
       │            │  (Backend)  │
       │            └──────┬──────┘
       │                   │
       │                   ├──▶ PostgreSQL (Database)
       │                   ├──▶ Auth ──────┐
       │                   │                │
       │                   └──▶ Storage    │
       │                        (Files)     │
       │                                   │
       │                                   ▼
       │                            ┌─────────────┐
       │                            │   Brevo     │
       │                            │  (Email)    │
       │                            └─────────────┘
       │
       ▼
┌─────────────┐
│ Domeneshop  │
│  (Domain)   │
└─────────────┘

       │
       ▼
┌─────────────┐
│   Resend    │
│   (Email)   │
└─────────────┘
```

**Email Flow:**
- **Brevo** ← Supabase Auth (system emails: password resets, confirmations)
- **Resend** ← Next.js App (custom emails: branded invitations)

---

## Monitoring & Maintenance

### Supabase Dashboard
- Monitor database performance
- View authentication logs
- Check storage usage
- Review API usage and limits

### Vercel Dashboard
- Deployment history
- Function execution logs
- Performance metrics
- Error tracking

### Database Maintenance
- Run migrations via Supabase SQL Editor
- Backup database regularly (Supabase handles automatic backups)
- Monitor RLS policy effectiveness

---

## Cost Considerations

### Free Tier Limits

**Supabase (Free Tier):**
- 500 MB database
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

**Vercel (Free Tier):**
- Unlimited personal projects
- 100 GB bandwidth
- Serverless function execution time limits

**Brevo (Free Tier):**
- 300 emails/day
- Unlimited contacts
- Basic email templates
- SMTP access included

**Resend (Free Tier):**
- 3,000 emails/month
- 100 emails/day

**Domeneshop:**
- Domain registration fees (annual)
- DNS management (usually included)

---

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check Supabase redirect URLs in dashboard
2. **Email not sending**: 
   - For system emails (password resets, etc.): Verify Brevo SMTP configuration in Supabase Dashboard
   - For custom emails: Verify Resend API key and from email address
3. **Image upload fails**: Check Supabase Storage bucket permissions
4. **Domain not resolving**: Verify DNS records in Domeneshop match Vercel requirements
5. **Brevo emails not delivering**: Check SMTP settings in Supabase Dashboard > Settings > Auth > SMTP Settings

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Future Enhancements

Potential service integrations:
- **Payment Processing**: Vipps integration (partially implemented)
- **Analytics**: Vercel Analytics or Google Analytics
- **Error Tracking**: Sentry or similar
- **Email Alternatives**: Brevo integration for additional email capabilities
- **Backup Service**: Automated database backups beyond Supabase defaults

---

## Additional Documentation

- [README.md](./README.md) - Quick start and setup
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local development guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [QUICK_START.md](./QUICK_START.md) - Fast setup instructions
