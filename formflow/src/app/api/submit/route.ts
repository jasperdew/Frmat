import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { formId, answers } = await request.json()

    // Valideer input
    if (!formId || !answers) {
      return NextResponse.json(
        { error: 'Form ID en antwoorden zijn verplicht' },
        { status: 400 }
      )
    }

    // Haal client IP en user agent op
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Sla submission op in Supabase
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        form_id: formId,
        answers,
        metadata: {
          user_agent: userAgent,
          ip_address: ip,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Fout bij het opslaan van de submission' },
        { status: 500 }
      )
    }

    // Haal form informatie op voor notificaties
    const { data: formData } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    // Hier zou je Edge Functions kunnen aanroepen voor notificaties
    // Voor nu loggen we alleen
    console.log('Form submitted:', {
      formId,
      submissionId: data.id,
      formTitle: formData?.title
    })

    return NextResponse.json({
      success: true,
      submissionId: data.id,
      message: 'Form succesvol verzonden'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Interne server fout' },
      { status: 500 }
    )
  }
} 