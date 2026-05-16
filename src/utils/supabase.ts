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

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/web'
    }
  }
})

// Debug: Log credentials status
if (typeof window !== 'undefined') {
  const urlStatus = supabaseUrl ? (supabaseUrl.startsWith('http') ? '✅ Configured' : '❌ Invalid URL') : '❌ Missing'
  const keyStatus = supabaseKey ? (supabaseKey.length > 10 ? '✅ Configured' : '❌ Invalid Key') : '❌ Missing'

  console.log('🔌 Supabase Configuration:', {
    url: urlStatus,
    key: keyStatus,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 30) : 'none'
  })

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase will not work with missing credentials. All requests will fail.')
  }
}
