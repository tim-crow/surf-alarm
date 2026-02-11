import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lyotyndavhbvqpjfikzz.supabase.co'
const supabaseKey = 'sb_publishable_o4Q0FnHprp-x4SnDifVhog_QWcyflp0'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UserPreferences {
  id?: string
  email: string
  name: string
  beach_id: number
  beach_name: string
  min_swell: number
  max_swell: number
  min_tide: number
  max_tide: number
  offshore_max_wind: number
  cross_shore_max_wind: number
  onshore_max_wind: number
  start_hour: number
  end_hour: number
  is_active: boolean
  trial_ends_at: string
  created_at?: string
}
