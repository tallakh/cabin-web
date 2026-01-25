import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import StatisticsTable from '@/components/StatisticsTable'
import { getBookingStatistics, getAvailableYears, type BookingStats } from '@/lib/db/queries'

export default async function StatisticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations()
  const locale = await getLocale()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get current year as default
  const currentYear = new Date().getFullYear()

  // Fetch initial statistics data
  let statistics: BookingStats[] = []
  let availableYears: number[] = [currentYear]

  try {
    const [stats, years] = await Promise.all([
      getBookingStatistics(currentYear),
      getAvailableYears(),
    ])
    statistics = stats
    availableYears = years
  } catch (error) {
    console.error('Error fetching statistics:', error)
    // Continue with empty data - client will handle fetching
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('statistics.title')}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('statistics.description')}
        </p>
      </div>
      <StatisticsTable 
        initialStatistics={statistics}
        initialYear={currentYear}
        availableYears={availableYears}
      />
    </div>
  )
}
