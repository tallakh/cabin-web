import { getCabins } from '@/lib/db/queries'
import NewBookingForm from '@/components/NewBookingForm'

export default async function NewBookingPage() {
  const cabins = await getCabins()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Booking</h1>
        <p className="mt-2 text-sm text-gray-600">
          Request a booking for one of the available cabins
        </p>
      </div>
      <NewBookingForm cabins={cabins} />
    </div>
  )
}
