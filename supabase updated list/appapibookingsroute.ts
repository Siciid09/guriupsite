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
// GET: FETCH BOOKINGS / FOOD ORDERS (Strictly Secured)
// =========================================================
export async function GET(request: Request) {
  try {
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const hotelId = searchParams.get('hotelId');
    const type = searchParams.get('type') || 'bookings'; // 'bookings' or 'food_orders'
    
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    // --- SCENARIO A: SINGLE BOOKING FETCH ---
    if (id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('_id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

      // Gatekeeper: Must be the user who booked it OR the hotel admin
      if (data.userId !== uid) {
        const { data: hotelCheck } = await supabase.from('hotels').select('hotelAdminId, ownerId').eq('_id', data.hotelId).single();
        if (!hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
          return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }
      }

      return NextResponse.json(data);
    }

    // --- SCENARIO B: LIST FETCH (By User or By Hotel) ---
    let query = supabase.from(table).select('*');

    if (userId) {
      // Security: Users can only fetch their own bookings
      if (uid !== userId) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      query = query.eq('userId', userId);
    } else if (hotelId) {
      // Security: Only the Hotel Admin can fetch the hotel's global bookings
      const { data: hotelCheck } = await supabase.from('hotels').select('hotelAdminId, ownerId').eq('_id', hotelId).single();
      if (!hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
      query = query.eq('hotelId', hotelId);
    } else {
      return NextResponse.json({ error: 'Missing parameters. Provide userId or hotelId.' }, { status: 400 });
    }

    // Await the transform at the very end to prevent TypeScript errors
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const payload = await request.json();
    const type = payload.type || 'bookings';
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    // Clean up payload so we don't save the 'type' field to the database
    delete payload.type;

    // Security: Force the booking's userId to be the verified token's UID
    // Note: If an admin is creating a manual booking, you may bypass this if payload.source === 'admin_manual'
    // but typically you still record who created it.
    if (payload.source !== 'admin_manual') {
      payload.userId = uid; 
    }
    
    payload.status = payload.status || 'pending';
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();

    const { data, error } = await supabase
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const body = await request.json();
    const { id, _id, bookingId, hotelId, type, ...updatePayload } = body;
    const targetId = id || _id || bookingId;
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'Both Booking ID and Hotel ID are required' }, { status: 400 });
    }

    // Gatekeeper: Only the hotel admin can approve/reject/modify a booking status
    const { data: hotelCheck, error: hotelError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .eq('_id', hotelId)
      .single();

    if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    updatePayload.updatedAt = new Date().toISOString();

    // Execute Update (Double filtering by hotelId to prevent cross-contamination)
    const { error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('_id', targetId)
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hotelId = searchParams.get('hotelId');
    const type = searchParams.get('type') || 'bookings';
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both Booking ID and Hotel ID are required.' }, { status: 400 });
    }

    // Gatekeeper: Verify Ownership
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
      .from(table)
      .delete()
      .eq('_id', id)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Record permanently deleted' });

  } catch (error: any) {
    console.error('Bookings DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}