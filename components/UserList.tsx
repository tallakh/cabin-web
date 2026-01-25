'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { UserProfile } from '@/types/database'

interface UserWithAuth extends UserProfile {
  last_sign_in_at?: string
}

interface UserListProps {
  users: UserWithAuth[]
  currentUserId: string
}

export default function UserList({ users: initialUsers, currentUserId }: UserListProps) {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'no' ? nb : undefined
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ full_name: string; is_admin: boolean } | null>(null)

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(t('admin.deleteUserConfirm', { name: userName }))) {
      return
    }

    setLoading(userId)
    setError(null)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToDeleteUser'))
      }

      setUsers(users.filter(u => u.id !== userId))
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

  const handleEdit = (user: UserWithAuth) => {
    setEditingId(user.id)
    setEditData({
      full_name: user.full_name,
      is_admin: user.is_admin,
    })
  }

  const handleSave = async (userId: string) => {
    if (!editData) return

    setLoading(userId)
    setError(null)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToUpdateUser'))
      }

      const updatedUser = await response.json()
      setUsers(users.map(u => u.id === userId ? updatedUser : u))
      setEditingId(null)
      setEditData(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData(null)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.user')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.role')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.lastSignIn')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('admin.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => {
              const isEditing = editingId === user.id
              const isCurrentUser = user.id === currentUserId

              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData?.full_name || ''}
                        onChange={(e) => setEditData({ ...editData!, full_name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData?.is_admin || false}
                          onChange={(e) => setEditData({ ...editData!, is_admin: e.target.checked })}
                          disabled={isCurrentUser}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{t('common.admin')}</span>
                      </label>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_admin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_admin ? t('common.admin') : t('common.user')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in_at 
                      ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy', { locale: dateLocale })
                      : t('admin.never')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(user.id)}
                          disabled={loading === user.id}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          {t('common.save')}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t('common.edit')}
                        </button>
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleDelete(user.id, user.full_name)}
                            disabled={loading === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {loading === user.id ? t('admin.deleting') : t('common.delete')}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
