import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import UsersPageClient from '@/components/UsersPageClient'

export default async function AdminUsersPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="mt-2 text-sm text-gray-600">
          Invite new users and manage existing user accounts
        </p>
      </div>

      <UsersPageClient currentUserId={user.id} />
    </div>
  )
}
