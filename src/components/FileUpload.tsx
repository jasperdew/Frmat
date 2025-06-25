'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface FileUploadProps {
  onUpload: (fileUrl: string) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export default function FileUpload({ 
  onUpload, 
  accept = '*/*', 
  maxSize = 10,
  className = '' 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Valideer bestandsgrootte
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Bestand is te groot. Maximum grootte is ${maxSize}MB.`)
      return
    }

    // Valideer bestandstype
    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const fileType = file.type
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''))
        }
        return fileType === type
      })
      
      if (!isValidType) {
        setError(`Bestandstype niet ondersteund. Toegestane types: ${accept}`)
        return
      }
    }

    try {
      setUploading(true)
      setError(null)

      // Genereer unieke bestandsnaam
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload naar Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Haal publieke URL op
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      onUpload(publicUrl)
      
    } catch (err) {
      console.error('Upload error:', err)
      setError('Fout bij het uploaden van het bestand. Probeer het opnieuw.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="file"
          onChange={handleFileUpload}
          accept={accept}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Maximum bestandsgrootte: {maxSize}MB
        {accept !== '*/*' && ` • Toegestane types: ${accept}`}
      </p>
    </div>
  )
}

// Hook voor file uploads
export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    setUploadedFiles(prev => [...prev, publicUrl])
    return publicUrl
  }

  const removeFile = (fileUrl: string) => {
    setUploadedFiles(prev => prev.filter(url => url !== fileUrl))
  }

  return {
    uploadedFiles,
    uploadFile,
    removeFile
  }
} 