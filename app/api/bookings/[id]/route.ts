import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*, cabins(*)')
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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
    const { status, start_date, end_date, notes, cabin_id, payment_status } = body

    // Check if dates are being changed
    const datesChanged = (start_date && start_date !== existingBooking.start_date) || 
                        (end_date && end_date !== existingBooking.end_date)

    // Only admins can change status, cabin, and payment_status directly
    if (status && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change booking status' }, { status: 403 })
    }
    if (cabin_id && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change booking cabin' }, { status: 403 })
    }
    if (payment_status && !isAdmin) {
      return NextResponse.json({ error: 'Only admins can change payment status' }, { status: 403 })
    }

    const updateData: any = {}
    
    // If user (non-admin) changes dates, automatically set status to pending
    if (isOwner && !isAdmin && datesChanged) {
      updateData.status = 'pending'
      updateData.payment_status = 'unpaid'
      updateData.payment_amount = null
    } else if (status && isAdmin) {
      updateData.status = status
      
      // Calculate payment amount when approving booking
      if (status === 'approved') {
        const finalStartDate = start_date || existingBooking.start_date
        const finalEndDate = end_date || existingBooking.end_date
        const finalCabinId = cabin_id || existingBooking.cabin_id
        
        // Get cabin to get nightly_fee
        const { data: cabinData } = await supabase
          .from('cabins')
          .select('nightly_fee')
          .eq('id', finalCabinId)
          .single()
        
        if (cabinData && cabinData.nightly_fee > 0) {
          const start = new Date(finalStartDate)
          const end = new Date(finalEndDate)
          const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const totalAmount = nights * parseFloat(cabinData.nightly_fee.toString())
          
          updateData.payment_amount = totalAmount
          // Only set to unpaid if not already paid
          if (!existingBooking.payment_status || existingBooking.payment_status === 'unpaid') {
            updateData.payment_status = 'unpaid'
          }
        }
      }
    }
    
    if (cabin_id && isAdmin) updateData.cabin_id = cabin_id
    if (start_date) updateData.start_date = start_date
    if (end_date) updateData.end_date = end_date
    if (notes !== undefined) updateData.notes = notes
    if (payment_status && isAdmin) updateData.payment_status = payment_status

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
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
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
