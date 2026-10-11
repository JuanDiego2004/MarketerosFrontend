import { createClient } from '@supabase/supabase-js'

const urlSupabase = import.meta.env.VITE_SUPABASE_URL
const claveSupabase = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const clienteSupabase = createClient(urlSupabase, claveSupabase)
