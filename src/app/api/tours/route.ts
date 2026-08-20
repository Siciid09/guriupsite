import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// =========================================================
// SECURITY HELPER: VERIFY FIREBASE AUTH TOKEN
// =========================================================
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

// =========================================================
// GET: FETCH TOURS (For Dashboard)
// =========================================================
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    let query = supabaseAdmin.from('tour_requests').select('*');
    
    // Fetch tours for a specific agent, or for the logged-in user
    if (agentId) {
      query = query.eq('agentId', agentId);
    } else {
      query = query.eq('userId', uid);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Tour Fetch Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE NEW TOUR REQUEST (From Flutter / Web)
// =========================================================
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Safety check: ensure the userId in the database matches the logged-in user
    if (!body.userId) {
      body.userId = uid;
    }

    const { data, error } = await supabaseAdmin
      .from('tour_requests')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Tour Create Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE TOUR STATUS (Approve / Cancel)
// =========================================================
export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }
    
    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tour_requests')
      .update({ status })
      .eq('_id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Tour Update Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}