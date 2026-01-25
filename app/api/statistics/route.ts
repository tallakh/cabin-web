import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBookingStatistics, getAvailableYears } from '@/lib/db/queries'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get year from query parameter, default to current year
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    // Validate year
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    // Get statistics and available years
    const [statistics, availableYears] = await Promise.all([
      getBookingStatistics(year),
      getAvailableYears(),
    ])

    return NextResponse.json({
      statistics,
      selectedYear: year,
      availableYears,
    })
  } catch (error: any) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch statistics' }, { status: 500 })
  }
}
