# Internationalization Implementation Plan

## Overview

Add English and Norwegian (Bokmål) language support to the cabin booking service using `next-intl` library. The implementation will use locale-based routing with URL prefixes (e.g., `/en/dashboard`, `/no/dashboard`).

## Technology Choice

**next-intl** - Recommended for Next.js 14 App Router:
- Built specifically for App Router
- Type-safe translations
- Server and client component support
- Automatic locale detection
- Date/number formatting per locale
- Simple API

## Implementation Steps

### Phase 1: Setup and Configuration

1. **Install dependencies**
   ```bash
   npm install next-intl
   ```

2. **Create directory structure**
   ```
   messages/
     en.json
     no.json
   i18n/
     request.ts
     routing.ts
   ```

3. **Update next.config.js**
   - Add next-intl plugin
   - Configure for App Router

4. **Create i18n configuration files**
   - `i18n/routing.ts` - Define locales and routing
   - `i18n/request.ts` - Server-side configuration

### Phase 2: Restructure Routes

Move all routes under `[locale]` dynamic segment:

**Current structure:**
```
app/
  (auth)/login/page.tsx
  dashboard/page.tsx
  dashboard/bookings/page.tsx
  ...
```

**New structure:**
```
app/
  [locale]/
    (auth)/login/page.tsx
    dashboard/page.tsx
    dashboard/bookings/page.tsx
    ...
```

**Files to move:**
- All pages from `app/` to `app/[locale]/`
- Keep API routes at `app/api/` (no locale needed)

### Phase 3: Create Translation Files

**messages/en.json** - English translations
**messages/no.json** - Norwegian translations

Translation keys organized by feature:
- `common` - Shared UI (buttons, labels, etc.)
- `auth` - Authentication pages
- `dashboard` - Dashboard pages
- `bookings` - Booking-related text
- `admin` - Admin features
- `calendar` - Calendar component
- `errors` - Error messages
- `success` - Success messages

### Phase 4: Update Middleware

**middleware.ts:**
- Integrate next-intl middleware
- Combine with existing Supabase auth middleware
- Handle locale detection and routing
- Redirect root to default locale

### Phase 5: Update Components

Replace all hardcoded strings with translation keys using `useTranslations()` hook.

**Components to update:**
- `components/Calendar.tsx`
- `components/BookingCard.tsx`
- `components/NewBookingForm.tsx`
- `components/AdminBookingList.tsx`
- `components/UserList.tsx`
- `components/InviteUserForm.tsx`
- `components/CabinForm.tsx`
- All page components

### Phase 6: Language Switcher

**components/LanguageSwitcher.tsx:**
- Dropdown or button group
- Switch between English and Norwegian
- Preserve current route when switching
- Add to navigation bar

### Phase 7: Date Formatting

Update date formatting to use Norwegian locale:
- Import `nb` from `date-fns/locale`
- Use locale-aware formatting in Calendar and date displays

## Detailed File Changes

### New Files

1. **messages/en.json** - English translations
2. **messages/no.json** - Norwegian translations
3. **i18n/routing.ts** - Routing configuration
4. **i18n/request.ts** - Server configuration
5. **components/LanguageSwitcher.tsx** - Language selector

### Modified Files

1. **next.config.js** - Add next-intl plugin
2. **middleware.ts** - Integrate i18n middleware
3. **app/layout.tsx** → **app/[locale]/layout.tsx** - Add i18n provider
4. **app/page.tsx** → **app/[locale]/page.tsx** - Update redirects
5. All page components - Move to `[locale]` folder
6. All components - Replace strings with translation keys

## Translation Keys Structure

```json
{
  "common": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading..."
  },
  "auth": {
    "title": "Cabin Booking Service",
    "signInToAccount": "Sign in to your account",
    "emailAddress": "Email address",
    "password": "Password",
    "signingIn": "Signing in...",
    "inviteOnly": "This is an invite-only service. Contact an admin to get access."
  },
  "dashboard": {
    "calendar": "Calendar",
    "myBookings": "My Bookings",
    "newBooking": "New Booking",
    "admin": "Admin",
    "cabinAvailability": "Cabin Availability",
    "viewAvailableDates": "View available dates for all cabins. Approved and pending bookings are shown on the calendar."
  },
  "bookings": {
    "createBooking": "Create Booking",
    "requestBooking": "Request a booking for one of the available cabins",
    "cabin": "Cabin",
    "startDate": "Start Date",
    "endDate": "End Date",
    "notes": "Notes",
    "optional": "optional",
    "status": {
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected"
    }
  },
  "admin": {
    "manageUsers": "Manage Users",
    "manageCabins": "Manage Cabins",
    "manageBookings": "Manage Bookings",
    "inviteNewUser": "Invite New User",
    "approve": "Approve",
    "reject": "Reject"
  },
  "calendar": {
    "legend": "Legend",
    "approved": "Approved",
    "pending": "Pending"
  },
  "errors": {
    "unauthorized": "Unauthorized",
    "forbidden": "Forbidden",
    "notFound": "Not found",
    "generic": "An error occurred"
  }
}
```

## Norwegian Translations (Sample)

```json
{
  "common": {
    "signIn": "Logg inn",
    "signOut": "Logg ut",
    "cancel": "Avbryt",
    "save": "Lagre",
    "delete": "Slett",
    "edit": "Rediger",
    "loading": "Laster..."
  },
  "auth": {
    "title": "Hytte Bookingsystem",
    "signInToAccount": "Logg inn på din konto",
    "emailAddress": "E-postadresse",
    "password": "Passord",
    "signingIn": "Logger inn...",
    "inviteOnly": "Dette er en invitasjonsbasert tjeneste. Kontakt en administrator for å få tilgang."
  },
  "dashboard": {
    "calendar": "Kalender",
    "myBookings": "Mine Bookinger",
    "newBooking": "Ny Booking",
    "admin": "Administrator",
    "cabinAvailability": "Hytte Tilgjengelighet",
    "viewAvailableDates": "Se tilgjengelige datoer for alle hytter. Godkjente og ventende bookinger vises på kalenderen."
  }
}
```

## Implementation Considerations

### URL Structure

- English: `/en/dashboard`, `/en/dashboard/bookings`
- Norwegian: `/no/dashboard`, `/no/dashboard/bookings`
- Root `/` redirects to `/en` (default locale)
- Can configure to make English default without prefix

### Locale Detection

1. URL parameter (primary)
2. Cookie preference (if set)
3. Browser Accept-Language header
4. Default to English

### Date Formatting

- Use `date-fns` with locale support
- Norwegian: `import { nb } from 'date-fns/locale'`
- Format dates: `format(date, 'd MMMM yyyy', { locale: locale === 'no' ? nb : undefined })`

### Language Switcher Placement

- Top right of navigation bar
- Simple dropdown: "English" / "Norsk"
- Preserves current route when switching

### Database Content

- User-entered data (cabin names, booking notes) remains in original language
- Only UI text is translated
- Consider future: allow users to enter data in their preferred language

## Migration Strategy

1. Install next-intl
2. Create basic translation files (English first, then Norwegian)
3. Set up routing structure
4. Move files incrementally
5. Update components to use translations
6. Test both languages
7. Add language switcher
8. Polish and complete all translations

## Testing Checklist

- [ ] Language switcher works correctly
- [ ] All pages display in English
- [ ] All pages display in Norwegian
- [ ] Dates format correctly for Norwegian locale
- [ ] Navigation preserves locale
- [ ] Forms work in both languages
- [ ] Error messages are translated
- [ ] Default locale detection works
- [ ] URL routing works correctly
- [ ] Authentication flow works with locale
- [ ] API routes still work (no locale in path)
