import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import CabinForm from '@/components/CabinForm'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function NewCabinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations()
  const locale = await getLocale()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const profile = await getUserProfile(user.id)

  if (!profile?.is_admin) {
    redirect(`/${locale}/dashboard`)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.newCabin')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('admin.addEditRemoveCabins')}
        </p>
      </div>
      <CabinForm />
    </div>
  )
}
