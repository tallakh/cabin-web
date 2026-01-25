import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
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

    // Get booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, cabins(*)')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user owns the booking
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if booking is approved
    if (booking.status !== 'approved') {
      return NextResponse.json({ error: 'Booking must be approved before payment' }, { status: 400 })
    }

    const body = await request.json()
    const { vipps_transaction_id } = body

    // Update payment status to paid
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        vipps_transaction_id: vipps_transaction_id || id,
        paid_at: new Date().toISOString(),
      })
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
