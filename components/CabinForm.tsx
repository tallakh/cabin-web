'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { Cabin } from '@/types/database'

interface CabinFormProps {
  cabin?: Cabin
}

export default function CabinForm({ cabin }: CabinFormProps) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: cabin?.name || '',
    description: cabin?.description || '',
    capacity: cabin?.capacity || 1,
  })

  useEffect(() => {
    if (cabin) {
      setFormData({
        name: cabin.name,
        description: cabin.description || '',
        capacity: cabin.capacity,
      })
    }
  }, [cabin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name) {
      setError(t('admin.cabinNameRequired'))
      setLoading(false)
      return
    }

    try {
      const url = cabin ? `/api/cabins/${cabin.id}` : '/api/cabins'
      const method = cabin ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToSave'))
      }

      router.push(`/${locale}/dashboard/admin/cabins`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!cabin) return

    if (!confirm(t('admin.deleteCabinConfirm'))) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/cabins/${cabin.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToDelete'))
      }

      router.push(`/${locale}/dashboard/admin/cabins`)
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('cabins.name')} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t('cabins.description')}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
            {t('cabins.capacity')} *
          </label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            required
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-between gap-4">
          <div>
            {cabin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-4">
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
              {loading ? t('admin.saving') : cabin ? t('common.update') : t('common.create')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
