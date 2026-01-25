import { createClient } from '@/lib/supabase/server'
import { getCabins, getBookings, getUserProfile } from '@/lib/db/queries'
import Calendar from '@/components/Calendar'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations()

  if (!user) {
    return null
  }

  let cabins = []
  let bookings = []
  const profile = await getUserProfile(user.id)

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
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.cabinAvailability')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('dashboard.viewAvailableDates')}
        </p>
      </div>
      <Calendar 
        cabins={cabins} 
        bookings={bookings} 
        currentUserId={user.id}
        isAdmin={profile?.is_admin || false}
      />
    </div>
  )
}
