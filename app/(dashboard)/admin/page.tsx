import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(user.id)

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage cabins and approve booking requests
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/admin/cabins"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Manage Cabins</h2>
          <p className="text-sm text-gray-600">
            Add, edit, or remove cabins from the system
          </p>
        </Link>

        <Link
          href="/dashboard/admin/bookings"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Manage Bookings</h2>
          <p className="text-sm text-gray-600">
            Review and approve or reject booking requests
          </p>
        </Link>
      </div>
    </div>
  )
}
