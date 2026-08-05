import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin'; // Adjust path to your admin init
import { supabaseAdmin } from '@/app/lib/supabase'; // Use the Service Role client

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Extract Firebase Auth Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // 2. Verify Token via Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!supabaseAdmin) {
       return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    // 3. Fetch User Profile from Supabase (Bypassing RLS)
    let { data: userProfile, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    // 4. Fallback: Check legacy _id column if standard id fails
    if (!userProfile) {
      const { data: fallbackProfile, error: fallbackError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('_id', uid)
        .maybeSingle();
        
      userProfile = fallbackProfile;
      error = fallbackError;
    }

    if (error || !userProfile) {
      console.error('Supabase fetch error/not found for UID:', uid);
      // If no profile is found, return 404 so the frontend knows to route to /setup
      return NextResponse.json({ error: 'User profile not found in Supabase' }, { status: 404 });
    }

    // 5. Return the secure user profile to the client
    return NextResponse.json({ user: userProfile }, { status: 200 });

  } catch (error: any) {
    console.error('Auth verification error:', error.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}