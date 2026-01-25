'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { BookingStats } from '@/lib/db/queries'

interface StatisticsTableProps {
  initialStatistics: BookingStats[]
  initialYear: number
  availableYears: number[]
}

export default function StatisticsTable({ 
  initialStatistics, 
  initialYear, 
  availableYears 
}: StatisticsTableProps) {
  const t = useTranslations()
  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [statistics, setStatistics] = useState(initialStatistics)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedYear === initialYear) {
      // Use initial data if still on initial year
      return
    }

    // Fetch new data when year changes
    const fetchStatistics = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/statistics?year=${selectedYear}`)
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('errors.generic'))
        }

        const data = await response.json()
        setStatistics(data.statistics)
      } catch (err: any) {
        setError(err.message || t('errors.generic'))
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [selectedYear, initialYear, t])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
            {t('statistics.selectYear')}:
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{t('statistics.loading')}</p>
        </div>
      ) : statistics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {t('statistics.noDataForYear', { year: selectedYear })}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('statistics.cabin')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('statistics.user')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('statistics.totalNights')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('statistics.bookingCount')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statistics.map((stat, index) => (
                  <tr key={`${stat.cabin_id}-${stat.user_id}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stat.cabin_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stat.user_name}</div>
                      <div className="text-sm text-gray-500">{stat.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {stat.total_nights}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {stat.booking_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
