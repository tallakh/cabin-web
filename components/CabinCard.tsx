'use client'

import type { Cabin } from '@/types/database'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface CabinCardProps {
  cabin: Cabin
  isAdmin?: boolean
}

export default function CabinCard({ cabin, isAdmin }: CabinCardProps) {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {cabin.image_url && (
        <img
          src={cabin.image_url}
          alt={cabin.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{cabin.name}</h3>
            {cabin.description && (
              <p className="text-sm text-gray-600 mt-1">{cabin.description}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1 mb-4">
          <p>
            <span className="font-medium">{t('bookings.capacity')}:</span> {cabin.capacity}
          </p>
          {cabin.nightly_fee > 0 && (
            <p>
              <span className="font-medium">{t('cabins.nightlyFee')}:</span> {cabin.nightly_fee.toFixed(2)} kr {t('bookings.payment.perNight')}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Link
              href={`/${locale}/dashboard/admin/cabins/${cabin.id}`}
              className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t('common.edit')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
