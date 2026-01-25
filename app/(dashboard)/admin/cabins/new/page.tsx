import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import CabinForm from '@/components/CabinForm'

export default async function NewCabinPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Add New Cabin</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new cabin in the system
        </p>
      </div>
      <CabinForm />
    </div>
  )
}
