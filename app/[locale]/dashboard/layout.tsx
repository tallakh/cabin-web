import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/db/queries'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import MobileNav from '@/components/MobileNav'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getLocale } from 'next-intl/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  let profile: any = null
  
  try {
    profile = await getUserProfile(user.id)
  } catch (err) {
    console.error('Error fetching profile in layout:', err)
    // Continue without profile - user can still use the app
  }
  
  // If profile doesn't exist, create it
  if (!profile) {
    try {
      const supabase = await createClient()
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          is_admin: false,
        })
        .select()
        .single()
      
      if (!error && newProfile) {
        profile = newProfile
      } else if (error) {
        console.error('Error creating profile in layout:', error)
      }
    } catch (err) {
      console.error('Exception creating profile in layout:', err)
      // Continue without profile - user can still use the app
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm relative">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0 flex items-center">
                <Link href={`/${locale}/dashboard`} className="text-lg sm:text-xl font-bold text-indigo-600 truncate">
                  {locale === 'no' ? 'Steens hytter' : 'Steens cabins'}
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-4 lg:space-x-8">
                <Link
                  href={`/${locale}/dashboard`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {locale === 'no' ? 'Kalender' : 'Calendar'}
                </Link>
                <Link
                  href={`/${locale}/dashboard/bookings`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {locale === 'no' ? 'Mine Bookinger' : 'My Bookings'}
                </Link>
                <Link
                  href={`/${locale}/dashboard/bookings/new`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {locale === 'no' ? 'Ny Booking' : 'New Booking'}
                </Link>
                <Link
                  href={`/${locale}/dashboard/statistics`}
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  {locale === 'no' ? 'Statistikk' : 'Statistics'}
                </Link>
                {profile?.is_admin && (
                  <Link
                    href={`/${locale}/dashboard/admin`}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {locale === 'no' ? 'Administrator' : 'Admin'}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <span className="hidden lg:block text-sm text-gray-700 truncate max-w-[120px]">
                {profile?.full_name || user.email}
              </span>
              <MobileNav isAdmin={profile?.is_admin || false} locale={locale} />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-2 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
