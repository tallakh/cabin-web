import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/db/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function AdminPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('admin.manageCabinsBookings')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href={`/${locale}/dashboard/admin/cabins`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.manageCabins')}</h2>
          <p className="text-sm text-gray-600">
            {t('admin.addEditRemoveCabins')}
          </p>
        </Link>

        <Link
          href={`/${locale}/dashboard/admin/bookings`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.manageBookings')}</h2>
          <p className="text-sm text-gray-600">
            {t('admin.reviewApproveReject')}
          </p>
        </Link>

        <Link
          href={`/${locale}/dashboard/admin/users`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('admin.manageUsers')}</h2>
          <p className="text-sm text-gray-600">
            {t('admin.inviteNewUsersManage')}
          </p>
        </Link>
      </div>
    </div>
  )
}
