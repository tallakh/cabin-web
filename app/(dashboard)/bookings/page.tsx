import { createClient } from '@/lib/supabase/server'
import { getBookings, getUserProfile } from '@/lib/db/queries'
import BookingCard from '@/components/BookingCard'
import Link from 'next/link'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const bookings = await getBookings(user.id)

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage your booking requests
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          New Booking
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You don't have any bookings yet.</p>
          <Link
            href="/dashboard/bookings/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create your first booking
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  )
}
