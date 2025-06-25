'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Form, Step, Field, Theme, Submission } from '@/lib/supabase'
import FileUpload from './FileUpload'
import Image from 'next/image'

interface FormWizardProps {
  form: Form
  steps: Step[]
  onSubmit: (data: Submission['answers']) => void
  theme?: Theme
}

export default function FormWizard({ form, steps, onSubmit, theme }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'onChange'
  })

  const watchedValues = watch()

  // Apply theme
  useEffect(() => {
    if (theme) {
      document.documentElement.style.setProperty('--primary-color', theme.primary_color)
      document.documentElement.style.setProperty('--secondary-color', theme.secondary_color)
      document.documentElement.style.setProperty('--background-color', theme.background_color)
      document.documentElement.style.setProperty('--text-color', theme.text_color)
      document.documentElement.style.setProperty('--font-family', theme.font_family)
    }
  }, [theme])

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const shouldShowField = (field: Field): boolean => {
    if (!field.conditions) return true
    
    return field.conditions.every(condition => {
      const fieldValue = watchedValues[condition.field_id]
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value
        case 'not_equals':
          return fieldValue !== condition.value
        case 'contains':
          return String(fieldValue).includes(String(condition.value))
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value)
        case 'less_than':
          return Number(fieldValue) < Number(condition.value)
        default:
          return true
      }
    })
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setIsTransitioning(true)
      await new Promise(resolve => setTimeout(resolve, 150))
      setCurrentStep(currentStep + 1)
      setIsTransitioning(false)
    }
  }

  const handlePrevious = async () => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      await new Promise(resolve => setTimeout(resolve, 150))
      setCurrentStep(currentStep - 1)
      setIsTransitioning(false)
    }
  }

  const handleFormSubmit = async (data: Submission['answers']) => {
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          answers: data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fout bij het versturen van het formulier')
      }

      onSubmit(data)
    } catch (error) {
      console.error('Submit error:', error)
      alert('Er is een fout opgetreden bij het versturen van het formulier. Probeer het opnieuw.')
    }
  }

  const renderField = (field: Field) => {
    if (!shouldShowField(field)) return null

    return (
      <div key={field.id} className="mb-6 animate-fadeIn">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <Controller
          name={field.id}
          control={control}
          rules={{
            required: field.required ? `${field.label} is verplicht` : false,
            min: field.validation?.min ? { value: field.validation.min, message: `Minimum waarde is ${field.validation.min}` } : undefined,
            max: field.validation?.max ? { value: field.validation.max, message: `Maximum waarde is ${field.validation.max}` } : undefined,
            pattern: field.validation?.pattern ? { value: new RegExp(field.validation.pattern), message: 'Ongeldig formaat' } : undefined,
          }}
          render={({ field: { onChange, value } }) => {
            switch (field.type) {
              case 'text':
              case 'email':
                return (
                  <input
                    type={field.type}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                )
              
              case 'textarea':
                return (
                  <textarea
                    value={value || ''}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                  />
                )
              
              case 'select':
                return (
                  <select
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Selecteer een optie</option>
                    {field.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )
              
              case 'radio':
                return (
                  <div className="space-y-3">
                    {field.options?.map((option, index) => (
                      <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                        <input
                          type="radio"
                          value={option}
                          checked={value === option}
                          onChange={onChange}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )
              
              case 'checkbox':
                return (
                  <div className="space-y-3">
                    {field.options?.map((option, index) => (
                      <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                        <input
                          type="checkbox"
                          value={option}
                          checked={Array.isArray(value) && value.includes(option)}
                          onChange={(e) => {
                            const currentValues = Array.isArray(value) ? value : []
                            if (e.target.checked) {
                              onChange([...currentValues, option])
                            } else {
                              onChange(currentValues.filter(v => v !== option))
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )
              
              case 'file':
                return (
                  <FileUpload
                    onUpload={(fileUrl) => onChange(fileUrl)}
                    accept={field.validation?.pattern || '*/*'}
                    maxSize={field.validation?.max || 10}
                    className="w-full"
                  />
                )
              
              case 'date':
                return (
                  <input
                    type="date"
                    value={value || ''}
                    onChange={onChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                )
              
              default:
                return (
                  <input
                    type="text"
                    value={value || ''}
                    onChange={onChange}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                  />
                )
            }
          }}
        />
        
        {errors[field.id] && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          {theme?.logo_url && (
            <div className="flex justify-center mb-4">
              <Image
                src={theme.logo_url}
                alt="Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-center mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-blue-100 text-center">{form.description}</p>
          )}
        </div>

        {/* Progress Bar */}
        {form.settings.show_progress_bar && (
          <div className="px-8 py-4 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="font-medium">Stap {currentStep + 1} van {steps.length}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="px-8 py-6">
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {/* Step Title */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentStepData.title}
              </h2>
              <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <div className="space-y-6">
                {currentStepData.fields.map(renderField)}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Vorige
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    type="submit"
                    disabled={!isValid}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Versturen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  >
                    Volgende
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 