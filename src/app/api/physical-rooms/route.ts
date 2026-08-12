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
  if (!supabaseAdmin) return null;
  
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`) 
    .maybeSingle(); 
    
  return user?.role || null;
}

// =========================================================
// GET: FETCH PHYSICAL ROOMS
// =========================================================
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('_id');
    const hotelId = searchParams.get('hotelId');
    const roomTypeId = searchParams.get('roomTypeId');

    // --- SCENARIO A: SINGLE PHYSICAL ROOM FETCH ---
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('physical_rooms')
        .select('*')
        .or(`_id.eq.${id}`) 
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Physical room not found' }, { status: 404 });

      return NextResponse.json(data);
    }

    // --- SCENARIO B: FETCH ALL PHYSICAL ROOMS (By Hotel or Room Type) ---
    let query = supabaseAdmin.from('physical_rooms').select('*');

    if (hotelId) query = query.eq('hotelId', hotelId);
    if (roomTypeId) query = query.eq('roomTypeId', roomTypeId);

    const { data, error } = await query.order('roomNumber', { ascending: true });
    
    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Physical Rooms GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE PHYSICAL ROOM (Strictly Secured)
// =========================================================
export async function POST(request: Request) {
  try {
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

    // Verify Hotel Ownership
    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
        .maybeSingle();

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    // Generate a unique ID for the SQL database
    const newId = crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from('physical_rooms')
      .insert([{ 
        ...roomData, 
        _id: newId,
        hotelId, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, room: data, message: 'Physical room created.' }, { status: 201 });

  } catch (error: any) {
    console.error('Physical Rooms POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE PHYSICAL ROOM (Strictly Secured)
// =========================================================
// =========================================================
// PATCH: UPDATE PHYSICAL ROOM (Strictly Secured)
// =========================================================
export async function PATCH(request: Request) {
  try {
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
    const body = await request.json();
    
    // 🔥 THE FIX: Extract `id` and `_id` out so they don't end up in updateData
    const { hotelId, id: bodyId, _id: body_Id, ...updateData } = body;

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both Physical Room ID and Hotel ID are required.' }, { status: 400 });
    }

    // Verify Hotel Ownership
    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
        .maybeSingle();

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('physical_rooms')
      .update({ ...updateData, updatedAt: new Date().toISOString() }) // updateData is now clean!
      .eq('_id', id)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Physical room updated successfully' });

  } catch (error: any) {
    console.error('Physical Rooms PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE PHYSICAL ROOM (Strictly Secured)
// =========================================================
export async function DELETE(request: Request) {
  try {
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
      return NextResponse.json({ error: 'Both Physical Room ID and Hotel ID are required.' }, { status: 400 });
    }

    // Verify Hotel Ownership
    if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
        .maybeSingle();

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('physical_rooms')
      .delete()
      .eq('_id', id)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Physical room permanently deleted' });

  } catch (error: any) {
    console.error('Physical Rooms DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}