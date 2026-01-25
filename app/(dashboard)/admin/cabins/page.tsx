import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getCabins } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CabinCard from '@/components/CabinCard'

export default async function AdminCabinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(user.id)

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const cabins = await getCabins()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Cabins</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add, edit, or remove cabins from the system
          </p>
        </div>
        <Link
          href="/dashboard/admin/cabins/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Cabin
        </Link>
      </div>

      {cabins.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No cabins yet. Create your first cabin!</p>
          <Link
            href="/dashboard/admin/cabins/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Cabin
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cabins.map(cabin => (
            <CabinCard key={cabin.id} cabin={cabin} isAdmin={true} />
          ))}
        </div>
      )}
    </div>
  )
}
