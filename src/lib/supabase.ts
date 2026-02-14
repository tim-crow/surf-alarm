import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edbdbpnkphybctejcvxl.supabase.co'
const supabaseKey = 'sb_publishable_UHa37BjtbnJDYfoustjVAg_mU2zi0ay'

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
