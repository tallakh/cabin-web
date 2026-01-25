'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { Cabin } from '@/types/database'

interface NewBookingFormProps {
  cabins: Cabin[]
}

export default function NewBookingForm({ cabins }: NewBookingFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    cabin_id: '',
    start_date: '',
    end_date: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.cabin_id || !formData.start_date || !formData.end_date) {
      setError(t('bookings.fillRequiredFields'))
      setLoading(false)
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError(t('bookings.endDateAfterStart'))
      setLoading(false)
      return
    }

    if (new Date(formData.start_date) < new Date().setHours(0, 0, 0, 0)) {
      setError(t('bookings.startDateNotPast'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToCreate'))
      }

      router.push(`/${locale}/dashboard/bookings`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="cabin_id" className="block text-sm font-medium text-gray-700">
            {t('bookings.cabin')} *
          </label>
          <select
            id="cabin_id"
            name="cabin_id"
            required
            value={formData.cabin_id}
            onChange={(e) => setFormData({ ...formData, cabin_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{t('bookings.selectCabin')}</option>
            {cabins.map(cabin => (
              <option key={cabin.id} value={cabin.id}>
                {cabin.name} {cabin.capacity > 1 && `(${t('bookings.capacity')}: ${cabin.capacity})`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              {t('bookings.startDate')} *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              {t('bookings.endDate')} *
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            {t('bookings.notes')} ({t('common.optional')})
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder={t('bookings.notesPlaceholder')}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('bookings.creating') : t('bookings.createBookingButton')}
          </button>
        </div>
      </form>
    </div>
  )
}
