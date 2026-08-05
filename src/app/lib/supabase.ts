import { createClient } from '@supabase/supabase-js';

// 1. Pull your environment variables (using the exact names from your .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Future-proofing: Throw a clear error if the variables are missing so you aren't left guessing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Check your .env.local file.');
}

// ==========================================
// STANDARD CLIENT (FOR FRONTEND / .tsx FILES)
// ==========================================
// Use this everywhere in your app (fetching properties, logging in users, etc.)
// It strictly obeys your database Row Level Security (RLS) policies.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ==========================================
// ADMIN CLIENT (FOR BACKEND API ROUTES ONLY)
// ==========================================
// Use this ONLY in server-side code (like Next.js API routes or Server Actions).
// It bypasses ALL security rules, making it perfect for admin tasks or webhooks.
// ⚠️ NEVER import this specific client into a frontend React component.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;