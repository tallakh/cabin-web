import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  
  const supabase = await createClient()

  // Handle OAuth callback with code
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    const redirectUrl = next || '/dashboard'
    return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
  }

  // Handle invite token verification
  if (token && type === 'invite') {
    // Verify the invite token and exchange it for a session
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'invite',
    })

    if (error) {
      // If verification fails, redirect to login with error
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'invalid_invite_token')
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has a password set
    // If the user was just created via invite, they won't have a password yet
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if user needs to set password by checking if they can sign in
      // New invited users typically don't have encrypted_password set
      // We'll redirect to set-password page and let it handle the check
      const locale = requestUrl.pathname.split('/')[1] || 'en'
      const setPasswordUrl = new URL(`/${locale}/set-password`, requestUrl.origin)
      if (next) {
        setPasswordUrl.searchParams.set('next', next)
      }
      return NextResponse.redirect(setPasswordUrl)
    }
  }

  // Default redirect
  const redirectUrl = next || '/dashboard'
  return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
}
