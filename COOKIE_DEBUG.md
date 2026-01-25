# Cookie Debugging Guide

If you're experiencing login issues where the session isn't persisting, follow these steps:

## 1. Check Browser Cookies

After logging in, check if Supabase cookies are being set:

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click on **Cookies** → `http://localhost:3000`
4. Look for cookies starting with `sb-` (Supabase cookies)
   - Should see: `sb-<project-ref>-auth-token`
   - Should see: `sb-<project-ref>-auth-token-code-verifier`

If these cookies are **missing**, the browser client isn't setting them properly.

## 2. Check Cookie Options

The cookies should have:
- **Domain**: `localhost` (or your domain)
- **Path**: `/`
- **HttpOnly**: Should be `false` (browser client needs to read them)
- **Secure**: `false` for localhost, `true` for HTTPS
- **SameSite**: Usually `Lax` or `None`

## 3. Test Session in Browser Console

After logging in, open browser console and run:

```javascript
// Check if session exists
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Session:', data.session)
  console.log('Error:', error)
})
```

## 4. Check Middleware Logs

Look at your terminal where `npm run dev` is running. You should see:
```
[Middleware] Path: /dashboard
[Middleware] User: <user-id> or none
[Middleware] Cookies: [list of cookie names]
```

If you see `User: none` but cookies exist, the middleware can't read them.

## 5. Common Issues

### Issue: Cookies not being set
**Solution**: Check Supabase URL configuration in dashboard
- Authentication > URL Configuration
- Site URL should be: `http://localhost:3000`
- Redirect URLs should include: `http://localhost:3000/**`

### Issue: Cookies set but middleware can't read them
**Solution**: 
- Check cookie domain/path settings
- Ensure cookies aren't being blocked by browser
- Try incognito mode to rule out extensions

### Issue: Session exists in browser but not in middleware
**Solution**: This is a cookie sync issue
- The browser client and server client need to use the same cookie names
- Check that `NEXT_PUBLIC_SUPABASE_URL` matches exactly

## 6. Quick Fix: Manual Cookie Check

Add this to your login page temporarily:

```typescript
// After login
const { data: { session } } = await supabase.auth.getSession()
console.log('Session after login:', session)
console.log('Cookies:', document.cookie)
```

This will show you if the session is established and if cookies are set.
