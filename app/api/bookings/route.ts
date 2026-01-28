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
    const { cabin_id, start_date, end_date, notes, number_of_guests } = body

    if (!cabin_id || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate number_of_guests
    const guests = number_of_guests ? parseInt(number_of_guests, 10) : 1
    if (isNaN(guests) || guests < 1) {
      return NextResponse.json({ error: 'Number of guests must be at least 1' }, { status: 400 })
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

    // Allow same-day bookings (end_date can equal start_date)
    if (end < start) {
      return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 })
    }

    // Get cabin to check capacity
    const { data: cabin, error: cabinError } = await supabase
      .from('cabins')
      .select('capacity')
      .eq('id', cabin_id)
      .single()

    if (cabinError || !cabin) {
      return NextResponse.json({ error: 'Cabin not found' }, { status: 404 })
    }

    // Check capacity by summing guests from overlapping approved bookings
    const { data: approvedBookings } = await supabase
      .from('bookings')
      .select('start_date, end_date, number_of_guests')
      .eq('cabin_id', cabin_id)
      .eq('status', 'approved')

    if (approvedBookings && approvedBookings.length > 0) {
      // Find overlapping approved bookings and sum their guests
      const overlappingGuests = approvedBookings
        .filter(booking => {
          const bookingStart = new Date(booking.start_date)
          const bookingEnd = new Date(booking.end_date)
          bookingStart.setHours(0, 0, 0, 0)
          bookingEnd.setHours(23, 59, 59, 999)
          return (start <= bookingEnd && end >= bookingStart)
        })
        .reduce((sum, booking) => sum + (booking.number_of_guests || 1), 0)

      // Check if adding this booking would exceed capacity
      const totalGuests = overlappingGuests + guests
      if (totalGuests > cabin.capacity) {
        return NextResponse.json({ 
          error: `Cabin capacity exceeded. Available space: ${cabin.capacity - overlappingGuests} guests, requested: ${guests} guests` 
        }, { status: 400 })
      }
    } else {
      // No existing bookings, just check if guests exceed capacity
      if (guests > cabin.capacity) {
        return NextResponse.json({ 
          error: `Number of guests (${guests}) exceeds cabin capacity (${cabin.capacity})` 
        }, { status: 400 })
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
        number_of_guests: guests,
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
