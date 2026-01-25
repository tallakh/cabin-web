import { getCabins } from '@/lib/db/queries'
import NewBookingForm from '@/components/NewBookingForm'
import { getTranslations } from 'next-intl/server'

export default async function NewBookingPage() {
  const cabins = await getCabins()
  const t = await getTranslations()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('bookings.newBooking')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('bookings.requestBooking')}
        </p>
      </div>
      <NewBookingForm cabins={cabins} />
    </div>
  )
}
