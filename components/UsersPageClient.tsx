'use client'

import { useState, useEffect } from 'react'
import UserList from './UserList'
import InviteUserForm from './InviteUserForm'
import { useTranslations } from 'next-intl'

interface UsersPageClientProps {
  currentUserId: string
}

export default function UsersPageClient({ currentUserId }: UsersPageClientProps) {
  const t = useTranslations()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInviteSuccess = () => {
    fetchUsers()
  }

  if (loading) {
    return <div className="text-center py-8">{t('users.loadingUsers')}</div>
  }

  return (
    <div className="space-y-6">
      <InviteUserForm onSuccess={handleInviteSuccess} />
      <UserList users={users} currentUserId={currentUserId} />
    </div>
  )
}
