'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { Booking, Cabin } from '@/types/database'

interface BookingCardProps {
  booking: Booking
  currentUserId?: string
  isAdmin?: boolean
  showDelete?: boolean
  cabins?: Cabin[]
}

export default function BookingCard({ booking, currentUserId, isAdmin, showDelete = true, cabins = [] }: BookingCardProps) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'no' ? nb : undefined
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    cabin_id: booking.cabin_id,
    start_date: booking.start_date,
    end_date: booking.end_date,
    notes: booking.notes || '',
  })
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const canDelete = showDelete && (isAdmin || booking.user_id === currentUserId)
  const canEdit = booking.user_id === currentUserId

  const handleEdit = () => {
    setIsEditing(true)
    setEditData({
      cabin_id: booking.cabin_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      notes: booking.notes || '',
    })
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!editData.cabin_id || !editData.start_date || !editData.end_date) {
        throw new Error(t('bookings.fillRequiredFields'))
      }

      if (new Date(editData.start_date) > new Date(editData.end_date)) {
        throw new Error(t('bookings.endDateAfterStart'))
      }

      // Check if dates changed
      const datesChanged = 
        editData.start_date !== booking.start_date || 
        editData.end_date !== booking.end_date

      // If dates changed, status should be set to pending
      const updateData: any = {
        cabin_id: editData.cabin_id,
        start_date: editData.start_date,
        end_date: editData.end_date,
        notes: editData.notes,
      }

      if (datesChanged) {
        updateData.status = 'pending'
      }

      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToUpdate'))
      }

      router.refresh()
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setEditData({
      cabin_id: booking.cabin_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      notes: booking.notes || '',
    })
  }

  const handleDelete = async () => {
    if (!confirm(t('admin.deleteBookingConfirm'))) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToDelete'))
      }

      router.refresh()
    } catch (error: any) {
      setError(error.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('bookings.cabin')} *
            </label>
            <select
              value={editData.cabin_id}
              onChange={(e) => setEditData({ ...editData, cabin_id: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {cabins.map(cabin => (
                <option key={cabin.id} value={cabin.id}>
                  {cabin.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('bookings.startDate')} *
              </label>
              <input
                type="date"
                value={editData.start_date}
                onChange={(e) => setEditData({ ...editData, start_date: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('bookings.endDate')} *
              </label>
              <input
                type="date"
                value={editData.end_date}
                onChange={(e) => setEditData({ ...editData, end_date: e.target.value })}
                min={editData.start_date}
                className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('bookings.notes')} ({t('common.optional')})
            </label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          {(editData.start_date !== booking.start_date || editData.end_date !== booking.end_date) && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm">
              {t('bookings.dateChangeRequiresApproval')}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {booking.cabins?.name || t('bookings.cabin')}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                  {t(`bookings.status.${booking.status}`)}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">{t('bookings.dates')}:</span>{' '}
                  {format(new Date(booking.start_date), 'MMM d, yyyy', { locale: dateLocale })} - {format(new Date(booking.end_date), 'MMM d, yyyy', { locale: dateLocale })}
                </p>
                {booking.notes && (
                  <p>
                    <span className="font-medium">{t('bookings.notes')}:</span> {booking.notes}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {t('bookings.created')}: {format(new Date(booking.created_at), 'MMM d, yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded hover:bg-indigo-50 disabled:opacity-50"
                >
                  {t('common.edit')}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
