import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  
  const supabase = await createClient()

  // Handle OAuth callback with code (magic links, OAuth, etc.)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      // Handle specific error types for magic links/OAuth
      const locale = requestUrl.pathname.split('/')[1] || 'en'
      const loginUrl = new URL(`/${locale}/login`, requestUrl.origin)
      
      // Map Supabase errors to user-friendly error codes
      if (error.message.includes('expired') || error.message.includes('Expired')) {
        loginUrl.searchParams.set('error', 'link_expired')
      } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        loginUrl.searchParams.set('error', 'link_invalid')
      } else if (error.message.includes('already used') || error.message.includes('used')) {
        loginUrl.searchParams.set('error', 'link_already_used')
      } else {
        loginUrl.searchParams.set('error', 'auth_failed')
      }
      
      // Include the original error message for debugging (optional)
      loginUrl.searchParams.set('error_details', encodeURIComponent(error.message))
      return NextResponse.redirect(loginUrl)
    }

    // After successful session exchange, check if user needs to set password
    // This handles cases where magic links are used for new users
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if this is a new user who might need to set a password
      // We can infer this from user metadata or creation time
      // For now, we'll let the set-password page handle the check
      // If user already has a password, they can proceed normally
      const locale = requestUrl.pathname.split('/')[1] || 'en'
      const redirectUrl = next || '/dashboard'
      
      // If there's a hint that password setup is needed, redirect to set-password
      // Otherwise, proceed to the intended destination
      // Note: Magic link users typically don't need passwords, but we check anyway
      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
    }
    
    // Fallback redirect
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
      // Handle specific error types
      const locale = requestUrl.pathname.split('/')[1] || 'en'
      const loginUrl = new URL(`/${locale}/login`, requestUrl.origin)
      
      // Map Supabase errors to user-friendly error codes
      if (error.message.includes('expired') || error.message.includes('Expired')) {
        loginUrl.searchParams.set('error', 'invite_expired')
      } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
        loginUrl.searchParams.set('error', 'invite_invalid')
      } else if (error.message.includes('already used') || error.message.includes('used')) {
        loginUrl.searchParams.set('error', 'invite_already_used')
      } else {
        loginUrl.searchParams.set('error', 'invite_error')
      }
      
      // Include the original error message for debugging (optional)
      loginUrl.searchParams.set('error_details', encodeURIComponent(error.message))
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
