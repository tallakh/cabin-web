import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getCabin } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import CabinForm from '@/components/CabinForm'

export default async function EditCabinPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile(user.id)

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  const cabin = await getCabin(params.id)

  if (!cabin) {
    redirect('/dashboard/admin/cabins')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Cabin</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update cabin information
        </p>
      </div>
      <CabinForm cabin={cabin} />
    </div>
  )
}
