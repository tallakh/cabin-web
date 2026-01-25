import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    let query = supabase
      .from('bookings')
      .select('*, cabins(*)')
      .order('created_at', { ascending: false })

    // If not admin, only show user's own bookings
    if (!profile?.is_admin) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) throw error

    // Fetch user profiles separately and attach them
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((b: any) => b.user_id))]
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds)
      
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      
      const bookingsWithProfiles = data.map((booking: any) => ({
        ...booking,
        user_profiles: profileMap.get(booking.user_id) || null
      }))
      
      return NextResponse.json(bookingsWithProfiles)
    }

    return NextResponse.json(data || [])
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

    const body = await request.json()
    const { cabin_id, start_date, end_date, notes } = body

    if (!cabin_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate dates
    const start = new Date(start_date)
    const end = new Date(end_date)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (start < today) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 })
    }

    if (end < start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping approved bookings
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('cabin_id', cabin_id)
      .eq('status', 'approved')

    if (existingBookings && existingBookings.length > 0) {
      // Check for actual overlap
      const hasOverlap = existingBookings.some(booking => {
        const bookingStart = new Date(booking.start_date)
        const bookingEnd = new Date(booking.end_date)
        // Reset time to compare dates only
        bookingStart.setHours(0, 0, 0, 0)
        bookingEnd.setHours(0, 0, 0, 0)
        return (start <= bookingEnd && end >= bookingStart)
      })

      if (hasOverlap) {
        return NextResponse.json({ error: 'Cabin is already booked for these dates' }, { status: 400 })
      }
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        cabin_id,
        user_id: user.id,
        start_date,
        end_date,
        notes: notes || null,
        status: 'pending',
      })
      .select('*, cabins(*)')
      .single()

    if (error) throw error

    // Fetch user profile separately
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const bookingWithProfile = {
      ...booking,
      user_profiles: profile || null
    }

    return NextResponse.json(bookingWithProfile, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
