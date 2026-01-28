'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
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

  useEffect(() => {
    // Check for error parameters in URL (e.g., from direct Supabase verify redirect)
    // Also check hash parameters (Supabase redirects errors in hash)
    const errorParam = searchParams.get('error')
    const errorDetails = searchParams.get('error_description')
    
    // Check hash parameters (Supabase uses hash for errors)
    const hashParams = parseHashParams()
    const hashError = hashParams.error || hashParams.error_code
    const hashErrorDescription = hashParams.error_description
    
    // Use hash params if query params are not present
    const finalError = errorParam || hashError
    const finalErrorDetails = errorDetails || hashErrorDescription
    
    if (finalError || finalErrorDetails) {
      // Handle errors from Supabase verify endpoint
      let errorMessage = t('errors.generic')
      
      if (finalError) {
        switch (finalError) {
          case 'expired_token':
          case 'token_expired':
          case 'otp_expired':
            errorMessage = t('auth.errors.inviteExpired') || 'This invitation link has expired. Please contact an admin to request a new invitation.'
            break
          case 'invalid_token':
          case 'token_invalid':
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
          default:
            errorMessage = finalErrorDetails || t('auth.errors.inviteError')
        }
      } else if (finalErrorDetails) {
        errorMessage = finalErrorDetails
      }
      
      // Redirect to login with error
      const next = searchParams.get('next') || '/dashboard'
      router.push(`/${locale}/login?error=invite_error&error_details=${encodeURIComponent(errorMessage)}&next=${encodeURIComponent(next)}`)
      
      // Clean up URL hash
      const newUrl = new URL(window.location.href)
      newUrl.hash = ''
      window.history.replaceState({}, '', newUrl.toString())
      return
    }

    // Check if user has a session (from invite verification)
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(t('auth.sessionError') || 'Session error')
          setCheckingSession(false)
          return
        }

        if (!session) {
          // No session - redirect to login
          const next = searchParams.get('next') || '/dashboard'
          router.push(`/${locale}/login?error=no_session&next=${encodeURIComponent(next)}`)
          return
        }

        // User has session, they can set password
        setCheckingSession(false)
      } catch (err: any) {
        setError(err.message || t('errors.generic'))
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [supabase, router, locale, searchParams, t])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError(t('auth.passwordTooShort') || 'Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch') || 'Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Update the user's password
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        // If password update fails, it might be because password is already set
        // In that case, redirect to login
        if (updateError.message.includes('password') || updateError.message.includes('Password')) {
          const next = searchParams.get('next') || '/dashboard'
          router.push(`/${locale}/login?message=password_already_set&next=${encodeURIComponent(next)}`)
          return
        }
        throw updateError
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
          email: data.user.email || '',
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

      setMessage(t('auth.passwordSetSuccess') || 'Password set successfully! Redirecting...')

      // Wait a moment to ensure cookies are written
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to dashboard or next URL
      const next = searchParams.get('next') || '/dashboard'
      window.location.href = `/${locale}${next.startsWith('/') ? next : '/' + next}`
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {searchParams.get('type') === 'recovery' 
              ? (t('auth.resetPassword') || 'Reset your password')
              : t('auth.setPassword')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSetPassword}>
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
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-400 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-400 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('auth.settingPassword') || 'Setting password...') : (t('auth.setPassword') || 'Set Password')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
