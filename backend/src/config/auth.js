import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Check for Supabase configuration
const SUPABASE_CONFIGURED = process.env.SUPABASE_URL && 
                           process.env.SUPABASE_URL !== 'your-supabase-project-url' &&
                           process.env.SUPABASE_SERVICE_ROLE_KEY &&
                           process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-supabase-service-role-key';

if (!SUPABASE_CONFIGURED) {
  console.warn('Supabase not configured - using local authentication fallback');
}

export const supabase = SUPABASE_CONFIGURED
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

// Supabase client for client-side operations
export const supabaseClient = SUPABASE_CONFIGURED && process.env.SUPABASE_ANON_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
  : null;

// Helper function to safely get Supabase client
export function getSupabase() {
  if (!supabase) {
    throw new Error('Authentication service not configured');
  }
  return supabase;
}

// Generate UUID for local auth fallback
export function generateUserId() {
  return uuidv4();
}
