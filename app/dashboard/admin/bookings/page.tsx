import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getBookings } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import AdminBookingList from '@/components/AdminBookingList'

export default async function AdminBookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(user.id)

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const bookings = await getBookings()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review and approve or reject booking requests
        </p>
      </div>
      <AdminBookingList bookings={bookings} />
    </div>
  )
}
