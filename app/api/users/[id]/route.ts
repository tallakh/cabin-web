import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Cannot change own admin status
    if (params.id === user.id) {
      const body = await request.json()
      if (body.is_admin !== undefined && body.is_admin !== profile.is_admin) {
        return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { full_name, is_admin } = body

    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (is_admin !== undefined) updateData.is_admin = is_admin

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Cannot delete self
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 })
    }

    // Use admin client to delete user (this will cascade to user_profiles and bookings)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Service role key not configured. Cannot delete users. Please set SUPABASE_SERVICE_ROLE_KEY environment variable or delete through Supabase Dashboard.'
      }, { status: 400 })
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
