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
    .or(`id.eq.${uid},_id.eq.${uid}`)
    .maybeSingle(); // Changed to maybeSingle to prevent crash if not found
    
  return user?.role || null;
}

// =========================================================
// GET: FETCH BOOKINGS / FOOD ORDERS (Strictly Secured)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    const isAdmin = role === 'admin';

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const hotelId = searchParams.get('hotelId');
    const type = searchParams.get('type') || 'bookings';
    
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    // --- SCENARIO A: SINGLE BOOKING FETCH ---
    if (id) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .or(`id.eq.${id},_id.eq.${id}`) // Unified schema check
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

      // Gatekeeper: Must be admin, the user who booked it, OR the hotel admin
      if (!isAdmin && data.userId !== uid) {
        const { data: hotelCheck } = await supabaseAdmin
          .from('hotels')
          .select('hotelAdminId, ownerId')
          .or(`id.eq.${data.hotelId},_id.eq.${data.hotelId}`)
          .maybeSingle();
          
        if (!hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
          return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }
      }

      return NextResponse.json(data);
    }

    // --- SCENARIO B: LIST FETCH (By User or By Hotel) ---
    let query = supabaseAdmin.from(table).select('*');

    if (userId) {
      // Security: Users can only fetch their own bookings (unless system admin)
      if (!isAdmin && uid !== userId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      query = query.eq('userId', userId);
    } else if (hotelId) {
      // Security: Only the Hotel Admin (or system admin) can fetch the hotel's global bookings
      if (!isAdmin) {
        const { data: hotelCheck } = await supabaseAdmin
          .from('hotels')
          .select('hotelAdminId, ownerId')
          .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
          .maybeSingle();
          
        if (!hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
          return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
        }
      }
      query = query.eq('hotelId', hotelId);
    } else {
      return NextResponse.json({ error: 'Missing parameters. Provide userId or hotelId.' }, { status: 400 });
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Bookings GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE BOOKING / FOOD ORDER (Secured)
// =========================================================
export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const payload = await request.json();
    const type = payload.type || 'bookings';
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    delete payload.type;

    // Standard logged-in users are permitted to create bookings.
    if (payload.source !== 'admin_manual') {
      payload.userId = uid; 
    }
    
    payload.status = payload.status || 'pending';
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, booking: data }, { status: 201 });

  } catch (error: any) {
    console.error('Bookings POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE STATUS OR PAYMENT (Strictly Secured)
// =========================================================
export async function PATCH(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, _id, bookingId, hotelId, type, ...updatePayload } = body;
    const targetId = id || _id || bookingId;
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'Both Booking ID and Hotel ID are required' }, { status: 400 });
    }

    // Gatekeeper: Hoadmins can only modify bookings for their own hotel
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

    updatePayload.updatedAt = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .or(`id.eq.${targetId},_id.eq.${targetId}`)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Record updated successfully' });

  } catch (error: any) {
    console.error('Bookings PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE BOOKING (Strictly Secured)
// =========================================================
export async function DELETE(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') {
      return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('_id');
    const hotelId = searchParams.get('hotelId');
    const type = searchParams.get('type') || 'bookings';
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both Booking ID and Hotel ID are required.' }, { status: 400 });
    }

    // Gatekeeper: Hoadmins can only delete bookings for their own hotel
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
      .from(table)
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Record permanently deleted' });

  } catch (error: any) {
    console.error('Bookings DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}