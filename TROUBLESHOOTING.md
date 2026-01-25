# Troubleshooting Guide

## Login Issues

### "Nothing happens when I log in"

**Possible causes and solutions:**

1. **Check browser console for errors**
   - Open browser DevTools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Look for any red error messages
   - Common issues:
     - CORS errors → Check Supabase URL configuration
     - Network errors → Check if Supabase is accessible
     - Authentication errors → Check credentials

2. **Check if user profile exists**
   - Go to Supabase Dashboard > Table Editor > user_profiles
   - Check if a row exists for your user ID
   - If not, run this SQL in SQL Editor:
     ```sql
     INSERT INTO user_profiles (id, email, full_name, is_admin)
     SELECT id, email, split_part(email, '@', 1), false
     FROM auth.users
     WHERE id NOT IN (SELECT id FROM user_profiles);
     ```

3. **Verify environment variables**
   - Check `.env.local` file exists
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Restart dev server after changing `.env.local`:
     ```bash
     # Stop server (Ctrl+C) and restart
     npm run dev
     ```

4. **Check Supabase Auth settings**
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Verify Site URL includes `http://localhost:3000`
   - Verify Redirect URLs includes `http://localhost:3000/**`

5. **Check RLS policies**
   - Make sure you ran the migration SQL
   - Verify policies exist: Dashboard > Authentication > Policies
   - Check if user_profiles table has proper policies

6. **Try clearing browser data**
   - Clear cookies for localhost
   - Try incognito/private browsing mode
   - Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

7. **Check network tab**
   - Open DevTools > Network tab
   - Try logging in
   - Look for failed requests (red status codes)
   - Check request/response details

### "Invalid login credentials"

- Verify email and password are correct
- Check Supabase Dashboard > Authentication > Users
- If user doesn't exist, create one via Dashboard
- If password is wrong, reset it in Dashboard

### "User profile not found" or RLS errors

- Run the user profile trigger migration: `002_add_user_profile_trigger.sql`
- Or manually create profile (see #2 above)

### Redirect loops

- Check middleware isn't blocking access
- Verify `/dashboard` route exists and is accessible
- Check browser console for redirect errors

## Database Issues

### "Relation does not exist"

- Run the migration SQL file: `001_initial_schema.sql`
- Check Supabase Dashboard > Table Editor to verify tables exist

### "Permission denied" or RLS errors

- Verify RLS policies were created
- Check if user has proper permissions
- Verify user_profiles table has correct policies

## Development Server Issues

### "Port 3000 already in use"

```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or use a different port:
PORT=3001 npm run dev
```

### "Module not found" errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build errors

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Common Fixes

### Reset everything and start fresh

1. **Clear database** (in Supabase SQL Editor):
   ```sql
   TRUNCATE TABLE bookings CASCADE;
   TRUNCATE TABLE cabins CASCADE;
   TRUNCATE TABLE user_profiles CASCADE;
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   ```

3. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Check Supabase Connection

Test your Supabase connection:

```bash
# In browser console on your app
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
supabase.auth.getUser().then(console.log)
```

## Still Having Issues?

1. Check Supabase logs: Dashboard > Logs
2. Check Next.js terminal output for errors
3. Check browser console for JavaScript errors
4. Verify all environment variables are set correctly
5. Make sure you're using the latest migration files
