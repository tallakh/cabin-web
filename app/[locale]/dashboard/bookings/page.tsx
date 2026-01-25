import { createClient } from '@/lib/supabase/server'
import { getBookings, getUserProfile, getCabins } from '@/lib/db/queries'
import BookingCard from '@/components/BookingCard'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations()
  const locale = await getLocale()

  if (!user) {
    return null
  }

  const [bookings, profile, cabins] = await Promise.all([
    getBookings(user.id),
    getUserProfile(user.id),
    getCabins(),
  ])

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('bookings.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('dashboard.viewManageBookings')}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/bookings/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('dashboard.newBooking')}
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">{t('bookings.noBookings')}</p>
          <Link
            href={`/${locale}/dashboard/bookings/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('bookings.createFirstBooking')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map(booking => (
            <BookingCard 
              key={booking.id} 
              booking={booking}
              currentUserId={user.id}
              isAdmin={profile?.is_admin || false}
              cabins={cabins}
            />
          ))}
        </div>
      )}
    </div>
  )
}
