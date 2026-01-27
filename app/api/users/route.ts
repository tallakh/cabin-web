import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

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
    
    // Create user account without sending Supabase email (to avoid rate limits)
    // We'll send a custom invitation email using Resend instead
    const userFullName = full_name || email.split('@')[0]
    
    // Generate a secure token for password reset/invitation
    // We'll use Supabase's generateLink to create a secure invitation link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${siteUrl}/${locale}/set-password`,
        data: {
          full_name: userFullName,
        }
      }
    })

    if (linkError) {
      // If user already exists, that's okay - they just need to log in
      if (linkError.message.includes('already registered') || linkError.message.includes('User already registered')) {
        return NextResponse.json({ 
          message: 'User already exists. They can log in with their existing account.',
          user: null 
        })
      }
      throw linkError
    }

    // Send custom invitation email using Resend (bypasses Supabase email rate limits)
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey)
        const invitationLink = linkData.properties.action_link
        
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: email,
          subject: locale === 'no' 
            ? 'Invitasjon til Hytte Booking' 
            : 'Invitation to Cabin Booking',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">
                    ${locale === 'no' ? 'Invitasjon til Hytte Booking' : 'Invitation to Cabin Booking'}
                  </h1>
                </div>
                <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    ${locale === 'no' 
                      ? `Hei ${userFullName},` 
                      : `Hello ${userFullName},`}
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    ${locale === 'no'
                      ? 'Du har blitt invitert til å bruke Hytte Booking-tjenesten. Klikk på lenken under for å sette opp ditt passord og komme i gang.'
                      : 'You have been invited to use the Cabin Booking service. Click the link below to set up your password and get started.'}
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${invitationLink}" 
                       style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      ${locale === 'no' ? 'Sett opp passord' : 'Set up password'}
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                    ${locale === 'no'
                      ? 'Hvis knappen ikke fungerer, kan du kopiere og lime inn denne lenken i nettleseren din:'
                      : 'If the button doesn\'t work, you can copy and paste this link into your browser:'}
                  </p>
                  <p style="font-size: 12px; color: #9ca3af; word-break: break-all; margin-top: 10px;">
                    ${invitationLink}
                  </p>
                </div>
              </body>
            </html>
          `,
        })
      } catch (emailError: any) {
        // If Resend fails, fall back to Supabase email (might hit rate limit)
        console.error('Failed to send email via Resend:', emailError)
        // Continue with Supabase invitation as fallback
        const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: userFullName,
          },
          redirectTo: `${siteUrl}/${locale}/set-password`,
        })

        if (inviteError) {
          if (inviteError.message.includes('already registered')) {
            return NextResponse.json({ 
              message: 'User already exists. They can log in with their existing account.',
              user: null 
            })
          }
          throw inviteError
        }

        return NextResponse.json({ 
          message: 'Invitation sent successfully (via Supabase)',
          user: invitedUser 
        }, { status: 201 })
      }
    } else {
      // No Resend API key - use Supabase email (may hit rate limits)
      const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: userFullName,
        },
        redirectTo: `${siteUrl}/${locale}/login`,
      })

      if (inviteError) {
        if (inviteError.message.includes('already registered')) {
          return NextResponse.json({ 
            message: 'User already exists. They can log in with their existing account.',
            user: null 
          })
        }
        throw inviteError
      }

      return NextResponse.json({ 
        message: 'Invitation sent successfully',
        user: invitedUser 
      }, { status: 201 })
    }

    // Create the user account using the generated link
    // The user account is created when they click the link
    // For now, we'll create it immediately so it appears in the system
    const { data: invitedUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email,
      email_confirm: false, // User will confirm via the invitation link
      user_metadata: {
        full_name: userFullName,
      },
    })

    if (createError) {
      if (createError.message.includes('already registered') || createError.message.includes('User already registered')) {
        return NextResponse.json({ 
          message: 'User already exists. They can log in with their existing account.',
          user: null 
        })
      }
      throw createError
    }

    // Profile will be created automatically by trigger
    return NextResponse.json({ 
      message: resendApiKey 
        ? 'Invitation sent successfully (via Resend)' 
        : 'Invitation sent successfully',
      user: invitedUser 
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
