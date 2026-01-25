'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface LogoutButtonProps {
  locale: string
}

export default function LogoutButton({ locale }: LogoutButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {t('common.signOut')}
    </button>
  )
}
