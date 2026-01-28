'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const t = useTranslations()
  const locale = useLocale()

  // Helper function to parse hash parameters
  const parseHashParams = () => {
    const hash = window.location.hash.substring(1) // Remove the '#'
    if (!hash) return {}
    
    const params: Record<string, string> = {}
    hash.split('&').forEach(param => {
      const [key, value] = param.split('=')
      if (key && value) {
        params[key] = decodeURIComponent(value)
      }
    })
    return params
  }

  // Check for magic link authentication (access_token in hash)
  // Also check for error messages from URL parameters (e.g., from auth callback)
  useEffect(() => {
    // Handle magic link authentication (implicit flow with access_token in hash)
    const hashParams = parseHashParams()
    const accessToken = hashParams.access_token
    const refreshToken = hashParams.refresh_token
    const tokenType = hashParams.token_type || 'bearer'
    const expiresIn = hashParams.expires_in
    const expiresAt = hashParams.expires_at
    
    if (accessToken && hashParams.type === 'magiclink') {
      // Magic link authentication - establish session
      const handleMagicLinkAuth = async () => {
        try {
          setLoading(true)
          setError(null)
          setMessage(null)
          
          // Create session from tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (error) {
            setError(error.message || t('auth.errors.authFailed'))
            setLoading(false)
            // Clean up hash
            const newUrl = new URL(window.location.href)
            newUrl.hash = ''
            window.history.replaceState({}, '', newUrl.toString())
            return
          }

          if (!data.session) {
            setError(t('auth.sessionNotEstablished'))
            setLoading(false)
            // Clean up hash
            const newUrl = new URL(window.location.href)
            newUrl.hash = ''
            window.history.replaceState({}, '', newUrl.toString())
            return
          }

          // Check if user profile exists, create if not
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase.from('user_profiles').insert({
              id: data.user.id,
              email: data.user.email || '',
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
              is_admin: false,
            })

            if (insertError) {
              // Don't throw - profile might be created by trigger or might already exist
            }
          }

          // Clean up hash
          const newUrl = new URL(window.location.href)
          newUrl.hash = ''
          window.history.replaceState({}, '', newUrl.toString())

          // Wait a moment to ensure cookies are written
          await new Promise(resolve => setTimeout(resolve, 200))

          // Redirect to dashboard
          window.location.href = `/${locale}/dashboard`
        } catch (err: any) {
          setError(err.message || t('errors.generic'))
          // Clean up hash
          const newUrl = new URL(window.location.href)
          newUrl.hash = ''
          window.history.replaceState({}, '', newUrl.toString())
        }
      }

      handleMagicLinkAuth()
      return // Don't process errors if we're handling magic link auth
    }

    // Check for error messages from URL parameters (e.g., from auth callback)
    // Also check hash parameters (Supabase redirects errors in hash)
    // Check query parameters first
    const errorParam = searchParams.get('error')
    const errorDetails = searchParams.get('error_details')
    const messageParam = searchParams.get('message')
    
    // Check hash parameters (Supabase uses hash for errors)
    // Only check for errors if we're not handling magic link auth
    const hashError = hashParams.error || hashParams.error_code
    const hashErrorDescription = hashParams.error_description
    
    // Use hash params if query params are not present
    const finalError = errorParam || hashError
    const finalErrorDetails = errorDetails || hashErrorDescription
    
    if (finalError) {
      // Map error codes to user-friendly messages
      let errorMessage = t('errors.generic')
      
      switch (finalError) {
        case 'invite_expired':
        case 'otp_expired':
          errorMessage = t('auth.errors.inviteExpired') || 'This invitation link has expired. Please contact an admin to request a new invitation.'
          break
        case 'invite_invalid':
        case 'access_denied':
          // Check if it's specifically an expired OTP
          if (hashParams.error_code === 'otp_expired' || finalErrorDetails?.toLowerCase().includes('expired')) {
            errorMessage = t('auth.errors.inviteExpired') || 'This invitation link has expired. Please contact an admin to request a new invitation.'
          } else if (finalErrorDetails?.toLowerCase().includes('invalid')) {
            errorMessage = t('auth.errors.inviteInvalid') || 'This invitation link is invalid. Please contact an admin to request a new invitation.'
          } else {
            errorMessage = t('auth.errors.inviteInvalid') || 'This invitation link is invalid. Please contact an admin to request a new invitation.'
          }
          break
        case 'invite_already_used':
          errorMessage = t('auth.errors.inviteAlreadyUsed') || 'This invitation link has already been used. Please log in with your account.'
          break
        case 'invite_error':
          errorMessage = t('auth.errors.inviteError') || 'There was an error verifying your invitation. Please contact an admin.'
          break
        case 'link_expired':
          errorMessage = t('auth.errors.linkExpired') || 'This authentication link has expired. Please request a new one.'
          break
        case 'link_invalid':
          errorMessage = t('auth.errors.linkInvalid') || 'This authentication link is invalid. Please request a new one.'
          break
        case 'link_already_used':
          errorMessage = t('auth.errors.linkAlreadyUsed') || 'This authentication link has already been used.'
          break
        case 'auth_failed':
          errorMessage = t('auth.errors.authFailed') || 'Authentication failed. Please try again.'
          break
        case 'no_session':
          errorMessage = t('auth.errors.noSession') || 'No active session found. Please try the invitation link again.'
          break
        default:
          // Use error details if available, otherwise use generic message
          if (finalErrorDetails) {
            errorMessage = finalErrorDetails
          }
      }
      
      setError(errorMessage)
      
      // Clean up URL by removing error parameters (both query and hash)
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('error')
      newUrl.searchParams.delete('error_details')
      newUrl.hash = '' // Remove hash completely
      window.history.replaceState({}, '', newUrl.toString())
    }
    
    if (messageParam) {
      let messageText = ''
      switch (messageParam) {
        case 'password_already_set':
          messageText = t('auth.messages.passwordAlreadySet') || 'Password is already set. Please log in with your password.'
          break
        default:
          messageText = messageParam
      }
      setMessage(messageText)
      
      // Clean up URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('message')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, t, supabase, locale])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error(t('auth.noUserData'))
      }

      // Check if user profile exists, create if not
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          is_admin: false,
        })

        if (insertError) {
          // Don't throw - profile might be created by trigger or might already exist
        }
      }

      // Verify session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (!session) {
        throw new Error(t('auth.sessionNotEstablished'))
      }

      // Wait a moment to ensure cookies are written
      await new Promise(resolve => setTimeout(resolve, 200))

      // Use a full page reload to ensure cookies are sent with the next request
      window.location.href = `/${locale}/dashboard`
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.signInToAccount')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              {message}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.emailAddress')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-400 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.emailAddress')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-400 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signingIn') : t('common.signIn')}
            </button>
          </div>
          <p className="text-center text-sm text-gray-600">
            {t('auth.inviteOnly')}
          </p>
        </form>
      </div>
    </div>
  )
}
