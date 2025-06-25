import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Form {
  id: string
  title: string
  description?: string
  theme: Theme
  settings: FormSettings
  created_at: string
  updated_at: string
  user_id: string
}

export interface Step {
  id: string
  form_id: string
  title: string
  step_order: number
  fields: Field[]
  conditions?: Condition[]
}

export interface Field {
  id: string
  step_id: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'date'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: Validation
  conditions?: Condition[]
}

export interface Condition {
  field_id: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: string | number | boolean
  action: 'show' | 'hide' | 'jump_to_step'
  target?: string
}

export interface Validation {
  min?: number
  max?: number
  pattern?: string
  custom?: string
}

export interface Theme {
  primary_color: string
  secondary_color: string
  background_color: string
  text_color: string
  font_family: string
  logo_url?: string
}

export interface FormSettings {
  allow_multiple_submissions: boolean
  show_progress_bar: boolean
  auto_save: boolean
  redirect_url?: string
}

export interface Submission {
  id: string
  form_id: string
  answers: Record<string, string | number | boolean | string[] | number[] | null>
  metadata: {
    user_agent: string
    ip_address: string
    timestamp: string
  }
  created_at: string
} 