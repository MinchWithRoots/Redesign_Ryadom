// Helper to wrap Supabase calls with better error handling
export function handleSupabaseError(error: any): Error {
  if (!error) return new Error('Unknown error')

  // Network fetch errors
  if (error.message?.includes('Failed to fetch')) {
    return new Error(
      'Network error: Unable to connect to Supabase. Check your internet connection and firewall settings.'
    )
  }

  // Auth errors
  if (error.message?.includes('Invalid API Key')) {
    return new Error('Invalid Supabase API key. Check your environment variables.')
  }

  // CORS errors
  if (error.message?.includes('CORS')) {
    return new Error('CORS error: Supabase domain may be blocked by browser or firewall.')
  }

  // RLS policy errors
  if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
    return new Error(
      'Access denied: Your RLS policies may prevent this operation. Check your permissions.'
    )
  }

  // Generic Postgres/Supabase errors
  if (error.message) {
    return new Error(error.message)
  }

  return new Error('Unknown Supabase error')
}
