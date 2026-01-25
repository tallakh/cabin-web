import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all user profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get auth users to get last sign in info
    // Note: This requires service role key. If not available, return profiles without auth data
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let authUsers = null
    
    if (serviceRoleKey) {
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      const { data } = await adminClient.auth.admin.listUsers()
      authUsers = data
    }

    // Merge profile data with auth user data
    const usersWithAuth = profiles.map(profile => {
      const authUser = authUsers?.users.find(u => u.id === profile.id)
      return {
        ...profile,
        last_sign_in_at: authUser?.last_sign_in_at,
        created_at: authUser?.created_at || profile.created_at,
      }
    })

    return NextResponse.json(usersWithAuth)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use admin client to invite user
    // Note: For production, you should set SUPABASE_SERVICE_ROLE_KEY in environment variables
    // For now, we'll use a workaround with the regular client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      // Fallback: Use Supabase dashboard invite functionality
      // In production, you should set SUPABASE_SERVICE_ROLE_KEY
      return NextResponse.json({ 
        error: 'Service role key not configured. Please invite users through Supabase Dashboard or set SUPABASE_SERVICE_ROLE_KEY environment variable.',
        requiresServiceKey: true
      }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Get the site URL from environment variable or use request origin
    // This ensures emails contain the correct production URL, not localhost
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (!siteUrl) {
      // Try to get from Vercel environment variable
      if (process.env.VERCEL_URL) {
        siteUrl = `https://${process.env.VERCEL_URL}`
      } else {
        // Fallback: try to get from request headers
        const origin = request.headers.get('origin') || request.headers.get('host')
        if (origin) {
          siteUrl = origin.startsWith('http') ? origin : `https://${origin}`
        } else {
          siteUrl = 'http://localhost:3000'
        }
      }
    }
    
    // Determine locale from request headers or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || ''
    const locale = acceptLanguage.includes('no') ? 'no' : 'en'
    
    // Construct redirect URL to login page with locale
    const redirectTo = `${siteUrl}/${locale}/login`

    const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: full_name || email.split('@')[0],
      },
      redirectTo: redirectTo,
    })

    if (inviteError) {
      // If user already exists, that's okay - they just need to log in
      if (inviteError.message.includes('already registered')) {
        return NextResponse.json({ 
          message: 'User already exists. They can log in with their existing account.',
          user: null 
        })
      }
      throw inviteError
    }

    // Profile will be created automatically by trigger, but we can return the auth user
    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      user: invitedUser 
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
