import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getCabins } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CabinCard from '@/components/CabinCard'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function AdminCabinsPage() {
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

  const cabins = await getCabins()

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.manageCabins')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('admin.addEditRemoveCabins')}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/admin/cabins/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('admin.addCabin')}
        </Link>
      </div>

      {cabins.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">{t('cabins.noCabins')}</p>
          <Link
            href={`/${locale}/dashboard/admin/cabins/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {t('cabins.addCabin')}
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
