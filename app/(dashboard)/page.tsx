import { createClient } from '@/lib/supabase/server'
import { getCabins, getBookings } from '@/lib/db/queries'
import Calendar from '@/components/Calendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  let cabins = []
  let bookings = []

  try {
    cabins = await getCabins()
  } catch (error) {
    console.error('Error fetching cabins:', error)
  }

  try {
    bookings = await getBookings()
  } catch (error) {
    console.error('Error fetching bookings:', error)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cabin Availability</h1>
        <p className="mt-2 text-sm text-gray-600">
          View available dates for all cabins. Approved bookings are shown on the calendar.
        </p>
      </div>
      <Calendar cabins={cabins} bookings={bookings} />
    </div>
  )
}
