import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lehlqkfmguphpxlqbzng.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGxxa2ZtZ3VwaHB4bHFiem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA3NDQsImV4cCI6MjA3MzYwNjc0NH0.e30FMXlX64smj-TBijeQWIn3SHvKZyXMKDrlkCx4Ysg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: { column: string; eq: any }
) => {
  const subscription = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table,
        ...(filter && { filter: `${filter.column}=eq.${filter.eq}` })
      }, 
      callback
    )
    .subscribe()

  return subscription
}

// Unsubscribe helper
export const unsubscribe = (subscription: any) => {
  if (subscription) {
    subscription.unsubscribe()
  }
}
