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
// SECURITY HELPER: STRICT ROLE CHECK
// =========================================================
async function getUserRoleStrict(uid: string): Promise<string | null> {
  // 🛡️ TS NULL CHECK
  if (!supabaseAdmin) return null;
  
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`) // Unified ID Check
    .maybeSingle(); // Prevent crash if user is missing
    
  return user?.role || null;
}

// =========================================================
// GET: FETCH ROOMS (Public View)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const id = searchParams.get('id') || searchParams.get('_id');

    // --- SCENARIO A: SINGLE ROOM FETCH ---
    if (id) {
      const { data, error } = await supabaseAdmin // 🛡️ TUNNEL FIX
        .from('rooms')
        .select('*')
        .eq('_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      return NextResponse.json(data);
    }

    // --- SCENARIO B: FETCH ALL ROOMS (Optionally by Hotel) ---
    let query = supabaseAdmin.from('rooms').select('*'); // 🛡️ TUNNEL FIX

    if (hotelId) {
      query = query.or(`hotelId.eq.${hotelId}`);
    }

    // Await the transform at the very end to prevent TypeScript errors
    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Rooms GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE ROOM (Strictly Secured)
// =========================================================
export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
    }

    const payload = await request.json();
    const { hotelId, ...roomData } = payload;

    if (!hotelId) return NextResponse.json({ error: 'hotelId is required.' }, { status: 400 });

    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`) // Unified ID Check
        .maybeSingle(); // Prevent crash

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert([{ 
        ...roomData, 
        hotelId, 
        status: roomData.status || 'published',
        createdAt: new Date().toISOString() 
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, room: data }, { status: 201 });

  } catch (error: any) {
    console.error('Rooms POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE ROOM (Strictly Secured)
// =========================================================
export async function PATCH(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
    }

    // 1. Get ID from the URL parameters (where the frontend actually sends it)
    const { searchParams } = new URL(request.url);
    const urlId = searchParams.get('id') || searchParams.get('_id');

    const body = await request.json();
    // 2. Strip id and _id out of the body so Supabase doesn't crash, but keep hotelId
    const { hotelId, id: bodyId, _id: body_Id, ...updateData } = body; 
    
    // 3. Set roomId using the URL first, then fallback to body
    const roomId = urlId || bodyId || body_Id;

    if (!roomId || !hotelId) {
      return NextResponse.json({ error: 'Both Room ID and Hotel ID are required.' }, { status: 400 });
    }

    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`) // Unified ID Check
        .maybeSingle(); // Prevent crash

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('rooms')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq('_id', roomId)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Room updated successfully' });

  } catch (error: any) {
    console.error('Rooms PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE ROOM (Strictly Secured)
// =========================================================
export async function DELETE(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('_id');
    const hotelId = searchParams.get('hotelId');

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both Room ID and Hotel ID are required.' }, { status: 400 });
    }

    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`) // Unified ID Check
        .maybeSingle(); // Prevent crash

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('_id', id)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Room permanently deleted' });

  } catch (error: any) {
    console.error('Rooms DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}