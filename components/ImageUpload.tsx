'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'

interface ImageUploadProps {
  currentImageUrl?: string | null
  cabinId: string
  onUploadSuccess: (imageUrl: string) => void
  onDeleteSuccess: () => void
}

export default function ImageUpload({ 
  currentImageUrl, 
  cabinId, 
  onUploadSuccess,
  onDeleteSuccess 
}: ImageUploadProps) {
  const t = useTranslations()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('cabins.invalidImageType'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('cabins.imageTooLarge'))
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/cabins/${cabinId}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToUpload'))
      }

      const data = await response.json()
      onUploadSuccess(data.image_url)
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!confirm(t('cabins.deleteImageConfirm'))) {
      return
    }

    setUploading(true)
    setError(null)

    try {
      const response = await fetch(`/api/cabins/${cabinId}/upload`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('errors.failedToDelete'))
      }

      onDeleteSuccess()
    } catch (err: any) {
      setError(err.message || t('errors.generic'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t('cabins.image')} ({t('common.optional')})
      </label>
      
      {currentImageUrl && (
        <div className="relative inline-block">
          <img
            src={currentImageUrl}
            alt={t('cabins.cabinImage')}
            className="h-48 w-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleDelete}
            disabled={uploading}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50"
            title={t('common.delete')}
          >
            ×
          </button>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('cabins.imageUploadHint')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {uploading && (
        <div className="text-sm text-gray-600">
          {t('cabins.uploadingImage')}...
        </div>
      )}
    </div>
  )
}
