'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { Booking, Cabin } from '@/types/database'

interface AdminBookingListProps {
  bookings: Booking[]
  cabins: Cabin[]
}

export default function AdminBookingList({ bookings: initialBookings, cabins }: AdminBookingListProps) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'no' ? nb : undefined
  const [bookings, setBookings] = useState(initialBookings)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    cabin_id: string
    start_date: string
    end_date: string
    notes: string
    status: string
  } | null>(null)

  const handleStatusChange = async (bookingId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setLoading(bookingId)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToUpdate'))
      }

      const updatedBooking = await response.json()
      setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b))
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id)
    setEditData({
      cabin_id: booking.cabin_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      notes: booking.notes || '',
      status: booking.status,
    })
  }

  const handleSaveEdit = async (bookingId: string) => {
    if (!editData) return

    setLoading(bookingId)
    setError(null)

    try {
      if (!editData.cabin_id || !editData.start_date || !editData.end_date) {
        throw new Error(t('bookings.fillRequiredFields'))
      }

      if (new Date(editData.start_date) > new Date(editData.end_date)) {
        throw new Error(t('bookings.endDateAfterStart'))
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cabin_id: editData.cabin_id,
          start_date: editData.start_date,
          end_date: editData.end_date,
          notes: editData.notes,
          status: editData.status,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToUpdate'))
      }

      const updatedBooking = await response.json()
      setBookings(bookings.map(b => b.id === bookingId ? updatedBooking : b))
      setEditingId(null)
      setEditData(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData(null)
  }

  const handleDelete = async (bookingId: string) => {
    if (!confirm(t('admin.deleteBookingConfirm'))) {
      return
    }

    setLoading(bookingId)
    setError(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToDelete'))
      }

      setBookings(bookings.filter(b => b.id !== bookingId))
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

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

  const pendingBookings = bookings.filter(b => b.status === 'pending')
  const otherBookings = bookings.filter(b => b.status !== 'pending')

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {pendingBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.pendingApproval')}</h2>
          <div className="grid gap-4">
            {pendingBookings.map(booking => {
              const isEditing = editingId === booking.id
              return (
                <div key={booking.id} className="bg-white shadow rounded-lg p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.cabin')} *
                        </label>
                        <select
                          value={editData?.cabin_id || ''}
                          onChange={(e) => setEditData({ ...editData!, cabin_id: e.target.value })}
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
                            value={editData?.start_date || ''}
                            onChange={(e) => setEditData({ ...editData!, start_date: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('bookings.endDate')} *
                          </label>
                          <input
                            type="date"
                            value={editData?.end_date || ''}
                            onChange={(e) => setEditData({ ...editData!, end_date: e.target.value })}
                            min={editData?.start_date}
                            className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.notes')} ({t('common.optional')})
                        </label>
                        <textarea
                          value={editData?.notes || ''}
                          onChange={(e) => setEditData({ ...editData!, notes: e.target.value })}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.status.status')}
                        </label>
                        <select
                          value={editData?.status || 'pending'}
                          onChange={(e) => setEditData({ ...editData!, status: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="pending">{t('bookings.status.pending')}</option>
                          <option value="approved">{t('bookings.status.approved')}</option>
                          <option value="rejected">{t('bookings.status.rejected')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(booking.id)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
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
                              <span className="font-medium">{t('common.user')}:</span> {booking.user_profiles?.full_name || booking.user_profiles?.email || t('common.unknown')}
                            </p>
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
                              {t('bookings.requested')}: {format(new Date(booking.created_at), 'MMM d, yyyy', { locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => handleStatusChange(booking.id, 'approved')}
                            disabled={loading === booking.id}
                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {t('admin.approve')}
                          </button>
                          <button
                            onClick={() => handleStatusChange(booking.id, 'rejected')}
                            disabled={loading === booking.id}
                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {t('admin.reject')}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => handleEdit(booking)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {otherBookings.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.allBookings')}</h2>
          <div className="grid gap-4">
            {otherBookings.map(booking => {
              const isEditing = editingId === booking.id
              return (
                <div key={booking.id} className="bg-white shadow rounded-lg p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.cabin')} *
                        </label>
                        <select
                          value={editData?.cabin_id || ''}
                          onChange={(e) => setEditData({ ...editData!, cabin_id: e.target.value })}
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
                            value={editData?.start_date || ''}
                            onChange={(e) => setEditData({ ...editData!, start_date: e.target.value })}
                            className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('bookings.endDate')} *
                          </label>
                          <input
                            type="date"
                            value={editData?.end_date || ''}
                            onChange={(e) => setEditData({ ...editData!, end_date: e.target.value })}
                            min={editData?.start_date}
                            className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.notes')} ({t('common.optional')})
                        </label>
                        <textarea
                          value={editData?.notes || ''}
                          onChange={(e) => setEditData({ ...editData!, notes: e.target.value })}
                          rows={3}
                          className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('bookings.status.status')}
                        </label>
                        <select
                          value={editData?.status || 'pending'}
                          onChange={(e) => setEditData({ ...editData!, status: e.target.value })}
                          className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="pending">{t('bookings.status.pending')}</option>
                          <option value="approved">{t('bookings.status.approved')}</option>
                          <option value="rejected">{t('bookings.status.rejected')}</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(booking.id)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
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
                              <span className="font-medium">{t('common.user')}:</span> {booking.user_profiles?.full_name || booking.user_profiles?.email || t('common.unknown')}
                            </p>
                            <p>
                              <span className="font-medium">{t('bookings.dates')}:</span>{' '}
                              {format(new Date(booking.start_date), 'MMM d, yyyy', { locale: dateLocale })} - {format(new Date(booking.end_date), 'MMM d, yyyy', { locale: dateLocale })}
                            </p>
                            {booking.notes && (
                              <p>
                                <span className="font-medium">{t('bookings.notes')}:</span> {booking.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value as 'pending' | 'approved' | 'rejected')}
                            disabled={loading === booking.id}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            <option value="pending">{t('bookings.status.pending')}</option>
                            <option value="approved">{t('bookings.status.approved')}</option>
                            <option value="rejected">{t('bookings.status.rejected')}</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t">
                        <button
                          onClick={() => handleEdit(booking)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          disabled={loading === booking.id}
                          className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">{t('admin.noBookings')}</p>
        </div>
      )}
    </div>
  )
}
