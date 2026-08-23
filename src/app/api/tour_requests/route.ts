import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function verifyRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    return null;
  }
}

// POST: Create a new tour request securely
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 });
    
    const decodedToken = await verifyRequest(request);
    const payload = await request.json();
    
    const { propertyId, propertyName, agentId, userName, userPhone, date, time, idempotencyKey } = payload;
    
    if (!propertyId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const _id = idempotencyKey || crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from('tour_requests')
      .insert([{
        _id,
        propertyId,
        propertyName,
        agentId,
        userName,
        userPhone,
        userId: decodedToken?.uid || 'anonymous_web',
        date,
        time,
        status: 'pending',
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
         return NextResponse.json({ error: 'Duplicate request detected.' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, tour: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Agent updating the tour status
export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error' }, { status: 500 });

    const decodedToken = await verifyRequest(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });

    // Ensure the user updating it is the agent who owns the tour
    const { data: tourCheck } = await supabaseAdmin
      .from('tour_requests')
      .select('agentId')
      .eq('_id', id)
      .maybeSingle();

    // System Admins bypass this, otherwise check ownership
    const { data: user } = await supabaseAdmin.from('users').select('role').eq('_id', decodedToken.uid).maybeSingle();
    const isAdmin = user?.role === 'admin' || user?.role === 'sadmin';

    if (!isAdmin && tourCheck?.agentId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Forbidden. Not your tour request.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('tour_requests')
      .update({ status })
      .eq('_id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}