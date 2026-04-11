import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Supabase credentials not found!\n' +
    'Please add these to your .env.local file:\n' +
    'VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY_HERE\n' +
    'See SUPABASE_MIGRATION.md for detailed instructions.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

// Debug: Log credentials status
if (typeof window !== 'undefined') {
  console.log('🔌 Supabase Configuration:', {
    url: supabaseUrl ? '✅ Configured' : '❌ Missing',
    key: supabaseKey ? '✅ Configured' : '❌ Missing',
  })
}
