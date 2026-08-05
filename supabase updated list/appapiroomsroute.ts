import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
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
// GET: FETCH ROOMS (Public View)
// =========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const id = searchParams.get('id');

    // --- SCENARIO A: SINGLE ROOM FETCH ---
    if (id) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

      return NextResponse.json(data);
    }

    // --- SCENARIO B: FETCH ALL ROOMS (Optionally by Hotel) ---
    let query = supabase.from('rooms').select('*');

    if (hotelId) {
      query = query.eq('hotelId', hotelId);
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const payload = await request.json();
    const { hotelId, ...roomData } = payload;

    if (!hotelId) return NextResponse.json({ error: 'hotelId is required.' }, { status: 400 });

    // GATEKEEPER: Verify that the user actually owns the hotel they are adding a room to
    const { data: hotelCheck, error: hotelError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .eq('_id', hotelId)
      .single();

    if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    // Insert Room
    const { data, error } = await supabase
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const body = await request.json();
    const { id, _id, hotelId, ...updateData } = body;
    const roomId = id || _id;

    if (!roomId || !hotelId) {
      return NextResponse.json({ error: 'Both Room ID and Hotel ID are required.' }, { status: 400 });
    }

    // GATEKEEPER: Verify Ownership of the Parent Hotel
    const { data: hotelCheck, error: hotelError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .eq('_id', hotelId)
      .single();

    if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    // Execute Update (Double filtering by hotelId to prevent cross-contamination)
    const { error } = await supabase
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hotelId = searchParams.get('hotelId');

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both Room ID and Hotel ID are required.' }, { status: 400 });
    }

    // GATEKEEPER: Verify Ownership
    const { data: hotelCheck, error: hotelError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .eq('_id', hotelId)
      .single();

    if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    // Execute Delete
    const { error } = await supabase
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