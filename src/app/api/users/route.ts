import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

// Helper function to verify the Firebase ID Token
async function verifyRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split('Bearer ')[1];
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// GET /api/users?uid=XYZ
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const decodedToken = await verifyRequest(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

    // 🛡️ TUNNEL FIX: Use supabaseAdmin to bypass RLS
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error || !user) {
      // Fallback to legacy _id if needed
      const { data: altUser } = await supabaseAdmin.from('users').select('*').eq('_id', uid).maybeSingle();
      if (!altUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json({ user: altUser }, { status: 200 });
    }
    
    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/users (Update Profile, Favorites, or Admin Ban Status)
export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const decodedToken = await verifyRequest(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });

    const { uid, name, phone, favorites, isBanned } = await request.json();
    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

    // Verify user role in Supabase for authorization checks
    const { data: requester } = await supabaseAdmin.from('users').select('role').eq('id', decodedToken.uid).single();
    const isAdmin = requester?.role === 'admin' || requester?.role === 'sadmin';

    if (decodedToken.uid !== uid && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You cannot modify another user.' }, { status: 403 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (favorites !== undefined) updateData.favorites = favorites;
    
    // CRITICAL: Restrict ban/unban power strictly to Admins
    if (isBanned !== undefined) {
      if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Only administrators can modify ban status.' }, { status: 403 });
      updateData.isBanned = isBanned;
      updateData.status = isBanned ? 'banned' : 'active';
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No valid fields provided for update.' }, { status: 200 });
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', uid);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}