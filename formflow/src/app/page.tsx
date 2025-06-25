'use client'

import { useState } from 'react'
import FormWizard from '@/components/FormWizard'
import { Form, Step, Theme } from '@/lib/supabase'

// Demo data voor testing
const demoTheme: Theme = {
  primary_color: '#3B82F6',
  secondary_color: '#1E40AF',
  background_color: '#F8FAFC',
  text_color: '#1F2937',
  font_family: 'Inter, sans-serif',
  logo_url: 'https://via.placeholder.com/120x40/3B82F6/FFFFFF?text=FormFlow'
}

const demoForm: Form = {
  id: 'demo-form',
  title: 'Klanttevredenheid Enquête',
  description: 'Help ons om onze service te verbeteren door deze korte enquête in te vullen.',
  theme: demoTheme,
  settings: {
    allow_multiple_submissions: false,
    show_progress_bar: true,
    auto_save: true
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'demo-user'
}

const demoSteps: Step[] = [
  {
    id: 'step-1',
    form_id: 'demo-form',
    title: 'Persoonlijke Informatie',
    step_order: 1,
    fields: [
      {
        id: 'name',
        step_id: 'step-1',
        type: 'text',
        label: 'Volledige naam',
        placeholder: 'Voer uw volledige naam in',
        required: true,
        validation: { min: 2 }
      },
      {
        id: 'email',
        step_id: 'step-1',
        type: 'email',
        label: 'E-mailadres',
        placeholder: 'uw.email@voorbeeld.nl',
        required: true,
        validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
      },
      {
        id: 'age',
        step_id: 'step-1',
        type: 'number',
        label: 'Leeftijd',
        placeholder: 'Uw leeftijd',
        required: false,
        validation: { min: 18, max: 100 }
      }
    ]
  },
  {
    id: 'step-2',
    form_id: 'demo-form',
    title: 'Service Beoordeling',
    step_order: 2,
    fields: [
      {
        id: 'service_rating',
        step_id: 'step-2',
        type: 'radio',
        label: 'Hoe tevreden bent u met onze service?',
        required: true,
        options: ['Zeer ontevreden', 'Ontevreden', 'Neutraal', 'Tevreden', 'Zeer tevreden']
      },
      {
        id: 'recommend',
        step_id: 'step-2',
        type: 'radio',
        label: 'Zou u ons aanbevelen aan anderen?',
        required: true,
        options: ['Ja', 'Nee', 'Misschien'],
        conditions: [
          {
            field_id: 'service_rating',
            operator: 'equals',
            value: 'Zeer ontevreden',
            action: 'hide'
          }
        ]
      }
    ]
  },
  {
    id: 'step-3',
    form_id: 'demo-form',
    title: 'Feedback',
    step_order: 3,
    fields: [
      {
        id: 'feedback',
        step_id: 'step-3',
        type: 'textarea',
        label: 'Heeft u nog andere opmerkingen of suggesties?',
        placeholder: 'Deel uw gedachten met ons...',
        required: false
      },
      {
        id: 'contact_preference',
        step_id: 'step-3',
        type: 'select',
        label: 'Hoe wilt u gecontacteerd worden voor follow-up?',
        required: false,
        options: ['E-mail', 'Telefoon', 'Geen contact gewenst']
      }
    ]
  }
]

export default function Home() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bedankt voor uw deelname!</h1>
            <p className="text-gray-600">
              Uw antwoorden zijn succesvol verzonden. We waarderen uw feedback.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Opnieuw invullen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FormFlow Demo</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ervaar de kracht van moderne form building met multi-step forms, conditional logic en real-time validatie.
          </p>
        </div>
        <FormWizard
          form={demoForm}
          steps={demoSteps}
          onSubmit={handleSubmit}
          theme={demoTheme}
        />
      </div>
    </div>
  )
}
