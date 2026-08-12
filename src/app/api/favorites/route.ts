import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function getVerifiedUid(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

// GET: the logged-in user's favorite hotel IDs (dashboard reads from here)
export async function GET(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const uid = await getVerifiedUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('user_favorites')
    .select('hotelId')
    .eq('uid', uid);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, favorites: (data || []).map((f: any) => f.hotelId) });
}

// POST: add a favorite
export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const uid = await getVerifiedUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId } = await request.json();
  if (!hotelId) return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('user_favorites')
    .upsert({ uid, hotelId, createdAt: new Date().toISOString() }, { onConflict: 'uid,hotelId' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: remove a favorite
export async function DELETE(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 });
  const uid = await getVerifiedUid(request);
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId } = await request.json();
  if (!hotelId) return NextResponse.json({ error: 'hotelId is required' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('user_favorites')
    .delete()
    .eq('uid', uid)
    .eq('hotelId', hotelId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}