'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, Form, Step, Theme, Submission } from '@/lib/supabase'
import FormWizard from './FormWizard'

interface FormEmbedProps {
  formId: string
  theme?: Theme
  height?: string
  width?: string
}

export default function FormEmbed({ formId, theme, height = '600px', width = '100%' }: FormEmbedProps) {
  const [form, setForm] = useState<Form | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadForm = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Haal form data op
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (formError) throw formError

      // Haal steps op
      const { data: stepsData, error: stepsError } = await supabase
        .from('steps')
        .select('*')
        .eq('form_id', formId)
        .order('step_order', { ascending: true })

      if (stepsError) throw stepsError

      setForm(formData)
      setSteps(stepsData || [])
    } catch (err) {
      console.error('Error loading form:', err)
      setError('Formulier kon niet worden geladen')
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    loadForm()
  }, [loadForm])

  const handleSubmit = async (data: Submission['answers']) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          answers: data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fout bij het versturen van het formulier')
      }

      // Stuur bericht naar parent window (voor embed scenario's)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'FORM_SUBMITTED',
          formId,
          submissionId: result.submissionId,
          data
        }, '*')
      }

      return result
    } catch (error) {
      console.error('Submit error:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div 
        style={{ height, width }}
        className="flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Formulier laden...</p>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div 
        style={{ height, width }}
        className="flex items-center justify-center bg-red-50 rounded-lg"
      >
        <div className="text-center">
          <p className="text-red-600">{error || 'Formulier niet gevonden'}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height, width }} className="overflow-hidden">
      <FormWizard
        form={form}
        steps={steps}
        onSubmit={handleSubmit}
        theme={theme || form.theme}
      />
    </div>
  )
}

// Embed script voor externe websites
export const generateEmbedScript = (formId: string, options: { height?: string; width?: string; theme?: Theme } = {}) => {
  const { height = '600px', width = '100%' } = options
  
  return `
    <div id="formflow-embed-${formId}" style="width: ${width}; height: ${height};">
      <iframe 
        src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/embed/${formId}"
        width="100%" 
        height="100%" 
        frameborder="0" 
        scrolling="no"
        style="border: none; border-radius: 8px;"
      ></iframe>
    </div>
    
    <script>
      // Luister naar form submissions
      window.addEventListener('message', function(event) {
        if (event.data.type === 'FORM_SUBMITTED' && event.data.formId === '${formId}') {
          // Custom callback voor form submission
          if (window.onFormFlowSubmit) {
            window.onFormFlowSubmit(event.data);
          }
        }
      });
    </script>
  `
}

// Embed URL generator
export const generateEmbedUrl = (formId: string) => {
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/embed/${formId}`
} 