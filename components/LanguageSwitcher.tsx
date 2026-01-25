'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    // Add new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`
    router.push(newPath)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={() => switchLocale('en')}
        className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded ${
          locale === 'en'
            ? 'bg-indigo-100 text-indigo-700 font-medium'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('no')}
        className={`px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded ${
          locale === 'no'
            ? 'bg-indigo-100 text-indigo-700 font-medium'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        NO
      </button>
    </div>
  )
}
