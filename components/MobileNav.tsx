'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface MobileNavProps {
  isAdmin: boolean
  locale: string
}

export default function MobileNav({ isAdmin, locale }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()

  const navItems = [
    { href: `/${locale}/dashboard`, label: t('dashboard.calendar') },
    { href: `/${locale}/dashboard/bookings`, label: t('dashboard.myBookings') },
    { href: `/${locale}/dashboard/bookings/new`, label: t('dashboard.newBooking') },
    { href: `/${locale}/dashboard/statistics`, label: t('statistics.title') },
  ]

  if (isAdmin) {
    navItems.push({ href: `/${locale}/dashboard/admin`, label: t('dashboard.admin') })
  }

  return (
    <>
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          aria-label="Toggle menu"
        >
          <svg
            className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-14 inset-x-0 bg-white shadow-lg z-50 md:hidden max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  {t('common.language') || 'Language'}: 
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
                        window.location.href = `/en${pathWithoutLocale}`
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        locale === 'en'
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
                        window.location.href = `/no${pathWithoutLocale}`
                      }}
                      className={`px-3 py-1 rounded text-sm ${
                        locale === 'no'
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Norsk
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
