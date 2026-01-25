'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface PaymentButtonProps {
  bookingId: string
  amount: number
  phoneNumber: string
  onPaymentInitiated: () => void
}

export default function PaymentButton({ 
  bookingId, 
  amount, 
  phoneNumber,
  onPaymentInitiated 
}: PaymentButtonProps) {
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)

  // Generate Vipps URL
  const amountInOre = Math.round(amount * 100)
  const vippsUrl = `vipps://pay?phone=${phoneNumber}&amount=${amountInOre}&text=Booking%20${bookingId.slice(0, 8)}`

  const handlePayNow = async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to open Vipps app (deep link)
      // On mobile with Vipps installed, this will open the app
      // On desktop, show instructions
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // Try deep link on mobile
        window.location.href = vippsUrl
        // Show instructions as fallback after a short delay
        setTimeout(() => {
          setShowInstructions(true)
          setLoading(false)
        }, 2000)
      } else {
        // On desktop, show instructions directly
        setShowInstructions(true)
        setLoading(false)
      }
      
      // Don't mark as paid yet - user needs to confirm payment was successful
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
      setShowInstructions(true) // Show instructions on error too
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async () => {
    setLoading(true)
    setError(null)

    try {
      const amountInOre = Math.round(amount * 100)
      const vippsUrl = `vipps://pay?phone=${phoneNumber}&amount=${amountInOre}&text=Booking%20${bookingId.slice(0, 8)}`
      
      // Update booking payment status to 'paid' when user confirms
      const response = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vipps_url: vippsUrl,
          vipps_transaction_id: bookingId, // Using booking ID as transaction ID for tracking
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToInitiatePayment'))
      }

      // Mark as paid and refresh
      onPaymentInitiated()
      setShowInstructions(false) // Hide instructions after marking as paid
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handlePayNow}
        disabled={loading || !amount || amount <= 0}
        className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t('bookings.payment.processing') : t('bookings.payment.payNow')}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {showInstructions && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-blue-900 mb-3">{t('bookings.payment.instructions')}</p>
          
          <div className="space-y-3 text-blue-800">
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="mb-2">
                <span className="font-medium">{t('bookings.payment.sendTo')}:</span>
              </p>
              <p className="text-2xl font-bold text-blue-900 mb-3">{phoneNumber}</p>
            </div>
            
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="mb-2">
                <span className="font-medium">{t('bookings.payment.amount')}:</span>
              </p>
              <p className="text-2xl font-bold text-blue-900 mb-3">{amount.toFixed(2)} kr</p>
            </div>
            
            <div className="p-3 bg-white rounded border border-blue-200">
              <p className="mb-2">
                <span className="font-medium">{t('bookings.payment.reference')}:</span>
              </p>
              <p className="text-lg font-semibold text-blue-900">Booking {bookingId.slice(0, 8)}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              {t('bookings.payment.howToPay')}
            </p>
            <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
              <li>{t('bookings.payment.step1')}</li>
              <li>{t('bookings.payment.step2')}</li>
              <li>{t('bookings.payment.step3')}</li>
              <li>{t('bookings.payment.step4')}</li>
            </ol>
          </div>
          
          {/* Mark as Paid button */}
          <div className="mt-4 pt-3 border-t border-blue-200">
            <button
              onClick={handleMarkAsPaid}
              disabled={loading}
              className="w-full px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('bookings.payment.processing') : t('bookings.payment.markAsPaid')}
            </button>
            <p className="mt-2 text-xs text-blue-700 text-center">
              {t('bookings.payment.markAsPaidNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
