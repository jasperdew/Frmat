'use client'

import { useState, useEffect } from 'react'
import { supabase, Form, Submission } from '@/lib/supabase'

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalForms: 0,
    totalSubmissions: 0,
    recentSubmissions: 0
  })

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setForms(data || [])
      
      // Calculate stats
      const totalSubmissions = data?.reduce((acc, form) => acc + (form.submissions_count || 0), 0) || 0
      setStats({
        totalForms: data?.length || 0,
        totalSubmissions,
        recentSubmissions: 0 // Will be calculated when submissions are loaded
      })
    } catch (error) {
      console.error('Error loading forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async (formId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
      setSelectedForm(formId)
      
      // Update recent submissions count (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentCount = data?.filter(s => new Date(s.created_at) > weekAgo).length || 0
      setStats(prev => ({ ...prev, recentSubmissions: recentCount }))
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const downloadSubmissions = (formId: string) => {
    const formSubmissions = submissions.filter(s => s.form_id === formId)
    const csvContent = convertToCSV(formSubmissions)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${formId}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (submissions: Submission[]) => {
    if (submissions.length === 0) return ''
    
    const headers = ['ID', 'Form ID', 'Antwoorden', 'IP Adres', 'User Agent', 'Datum']
    const rows = submissions.map(s => [
      s.id,
      s.form_id,
      JSON.stringify(s.answers),
      s.metadata.ip_address,
      s.metadata.user_agent,
      new Date(s.created_at).toLocaleString("nl-NL")
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-xl text-gray-600">Beheer uw formulieren en bekijk inzendingen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Formulieren</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalForms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Inzendingen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recente Inzendingen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentSubmissions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forms Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Formulieren</h2>
              <button
                onClick={() => alert('Form builder functionaliteit komt binnenkort!')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
              >
                + Nieuw
              </button>
            </div>
            
            {forms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-2">Nog geen formulieren aangemaakt</p>
                <p className="text-sm text-gray-400">Maak je eerste formulier aan om te beginnen</p>
              </div>
            ) : (
              <div className="space-y-4">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      selectedForm === form.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => loadSubmissions(form.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{form.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Aangemaakt op {new Date(form.created_at).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            alert('Form builder functionaliteit komt binnenkort!')
                          }}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadSubmissions(form.id)
                          }}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Inzendingen</h2>
            
            {selectedForm ? (
              submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Geen inzendingen voor dit formulier</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-gray-500">
                          {new Date(submission.created_at).toLocaleString("nl-NL")}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {submission.metadata.ip_address}
                        </span>
                      </div>
                      <div className="text-sm">
                        <strong className="text-gray-900">Antwoorden:</strong>
                        <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto border">
                          {JSON.stringify(submission.answers, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                  </svg>
                </div>
                <p className="text-gray-500">Selecteer een formulier om inzendingen te bekijken</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Snelle Acties</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => alert('Form builder functionaliteit komt binnenkort!')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Nieuw Formulier</p>
                <p className="text-sm text-gray-500">Maak een nieuw formulier aan</p>
              </div>
            </button>

            <button
              onClick={() => alert('Embed functionaliteit komt binnenkort!')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Embed Code</p>
                <p className="text-sm text-gray-500">Krijg embed code voor je website</p>
              </div>
            </button>

            <button
              onClick={() => alert('Thema editor functionaliteit komt binnenkort!')}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-200">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 7l3-3m0 0h-3m3 0v3" />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">Thema&apos;s</p>
                <p className="text-sm text-gray-500">Pas de styling aan</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 