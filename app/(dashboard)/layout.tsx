import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/db/queries'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import MobileNav from '@/components/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                  Cabin Booking
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Calendar
                </Link>
                <Link
                  href="/dashboard/bookings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Bookings
                </Link>
                <Link
                  href="/dashboard/bookings/new"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  New Booking
                </Link>
                {profile?.is_admin && (
                  <Link
                    href="/dashboard/admin"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-sm text-gray-700">
                {profile?.full_name || user.email}
              </span>
              <MobileNav isAdmin={profile?.is_admin || false} />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
