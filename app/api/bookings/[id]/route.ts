import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, cabins(*)')
      .eq('id', params.id)
      .single()

    if (error) throw error

    // Check if user has access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (data.user_id !== user.id && !profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user profile separately
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user_id)
      .single()

    const bookingWithProfile = {
      ...data,
      user_profiles: userProfile || null
    }

    return NextResponse.json(bookingWithProfile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

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

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get existing booking
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = existingBooking.user_id === user.id
    const isAdmin = profile.is_admin

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, start_date, end_date, notes, cabin_id } = body

    // Check if dates are being changed
    const datesChanged = (start_date && start_date !== existingBooking.start_date) || 
                        (end_date && end_date !== existingBooking.end_date)

    // Only admins can change status and cabin directly
    if (status && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change booking status' }, { status: 403 })
    }
    if (cabin_id && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change booking cabin' }, { status: 403 })
    }

    const updateData: any = {}
    
    // If user (non-admin) changes dates, automatically set status to pending
    if (isOwner && !isAdmin && datesChanged) {
      updateData.status = 'pending'
    } else if (status && isAdmin) {
      updateData.status = status
    }
    
    if (cabin_id && isAdmin) updateData.cabin_id = cabin_id
    if (start_date) updateData.start_date = start_date
    if (end_date) updateData.end_date = end_date
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', params.id)
      .select('*, cabins(*)')
      .single()

    if (error) throw error

    // Fetch user profile separately
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user_id)
      .single()

    const bookingWithProfile = {
      ...data,
      user_profiles: userProfile || null
    }

    return NextResponse.json(bookingWithProfile)
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

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get existing booking
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check permissions
    const isOwner = existingBooking.user_id === user.id
    const isAdmin = profile.is_admin

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Admins and booking creators can delete any booking (approved or pending)

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
