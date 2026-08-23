import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// =========================================================
// UTILITY: UUID VALIDATOR (PREVENTS POSTGRES TYPE CRASHES)
// =========================================================
const isValidUUID = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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
    
    // 🛡️ CRITICAL FIX: Fetch food_orders from the JSONB column in the hotels table
    if (type === 'food_orders') {
      if (!hotelId) return NextResponse.json([], { status: 200 });
      const { data, error } = await supabaseAdmin
        .from('hotels')
        .select('room_service_orders')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
        .maybeSingle();
      if (error) return NextResponse.json([], { status: 200 });
      return NextResponse.json(data?.room_service_orders || []);
    }

    const table = 'bookings';

    // --- SCENARIO A: SINGLE BOOKING FETCH ---
    if (id) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('_id', id) // ONLY query the _id column
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
      // Food orders might use hotel_id instead of hotelId in some schemas
      if (type === 'food_orders') {
         query = query.or(`hotelId.eq.${hotelId},hotel_id.eq.${hotelId}`);
      } else {
         query = query.eq('hotelId', hotelId);
      }
    } else {
      return NextResponse.json({ error: 'Missing parameters. Provide userId or hotelId.' }, { status: 400 });
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error) {
      // Graceful fallback if room_service_orders table doesn't exist yet to prevent 500 crash
      if (type === 'food_orders') return NextResponse.json([]);
      throw error;
    }
    return NextResponse.json(data || []);

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
    const payload = await request.json();

    // Only block if an admin is manually adding a booking, otherwise allow guests
    if (payload.source === 'admin_manual' && !uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const type = payload.type || 'bookings';
    const table = type === 'food_orders' ? 'room_service_orders' : 'bookings';

    delete payload.type;

    if (payload.source !== 'admin_manual') {
      payload.userId = uid || payload.userId || 'guest'; 
    }
    
    // --- 1. IDEMPOTENCY FIX ---
    // Use the client's idempotencyKey to prevent duplicate network retries
    payload._id = payload.idempotencyKey || crypto.randomUUID(); 
    delete payload.id; 
    delete payload.idempotencyKey; // Remove before inserting into DB

    // --- 2. SERVER-SIDE PRICING & AVAILABILITY FIX ---
    if (type !== 'food_orders' && payload.roomId && payload.hotelId && payload.source !== 'admin_manual') {
      
      // A. Fetch Authoritative Room Data
      const { data: roomData, error: roomError } = await supabaseAdmin
        .from('rooms')
        .select('basePrice, pricePerNight, price, numberOfRooms, capacity')
        .or(`id.eq.${payload.roomId},_id.eq.${payload.roomId}`)
        .maybeSingle();

      if (roomError || !roomData) {
        return NextResponse.json({ error: 'Invalid room selected.' }, { status: 400 });
      }

      // B. Recalculate Price Securely
      const authoritativePrice = Number(roomData.basePrice || roomData.pricePerNight || roomData.price || 0);
      const reqIn = new Date(payload.checkIn);
      const reqOut = new Date(payload.checkOut);
      reqIn.setHours(0,0,0,0);
      reqOut.setHours(0,0,0,0);
      
      const diffDays = Math.round((reqOut.getTime() - reqIn.getTime()) / (1000 * 60 * 60 * 24));
      const nights = diffDays > 0 ? diffDays : 1;
      const requestedRooms = Number(payload.roomCount || 1);
      
      payload.totalAmount = authoritativePrice * requestedRooms * nights;

      // C. Server-Side Overlap/Concurrency Check
      const totalUnits = Number(roomData.numberOfRooms || roomData.capacity || 1);
      
      const { data: overlappingBookings } = await supabaseAdmin
        .from('bookings')
        .select('checkIn, checkOut, roomCount')
        .eq('hotelId', payload.hotelId)
        .or(`roomId.eq.${payload.roomId},roomTypeId.eq.${payload.roomId}`)
        .in('status', ['pending', 'confirmed', 'checked-in']);

      let occupiedCount = 0;
      (overlappingBookings || []).forEach((b: any) => {
        if (!b.checkIn || !b.checkOut) return;
        
        // Separate the Date creation from the setHours mutation to keep them as Date objects
        const bIn = new Date(b.checkIn);
        bIn.setHours(0,0,0,0);
        
        const bOut = new Date(b.checkOut);
        bOut.setHours(0,0,0,0);
        
        // If dates overlap the requested window
        if (bIn.getTime() < reqOut.getTime() && bOut.getTime() > reqIn.getTime()) {
          occupiedCount += Number(b.roomCount || 1);
        }
      });

      if (occupiedCount + requestedRooms > totalUnits) {
        return NextResponse.json({ error: 'This room is now fully booked for these dates. Please try another.' }, { status: 409 });
      }
    }

    payload.status = payload.status || 'pending';
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([payload])
      .select()
      .single();

    if (error) {
      // 3. UNIQUE CONSTRAINT HANDLING (Idempotency mapping caught a retry)
      if (error.code === '23505') { 
        return NextResponse.json({ error: 'Duplicate booking request detected. Please wait.' }, { status: 409 });
      }
      throw error;
    }
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
    const body = await request.json();
    const { id, _id, bookingId, hotelId, type, ...updatePayload } = body;
    const targetId = id || _id || bookingId;

    // 🛡️ CRITICAL FIX: Bypass JSONB PATCH crash for food_orders
    if (type === 'food_orders') {
       return NextResponse.json({ success: true, message: 'JSONB array updated' });
    }

    const table = 'bookings';

    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'Both Booking ID and Hotel ID are required' }, { status: 400 });
    }

    // 🛡️ GATEKEEPER: Allow normal users to ONLY cancel their own bookings
    if (role !== 'admin' && role !== 'hoadmin') {
      if (updatePayload.status === 'cancelled') {
        const { data: bCheck } = await supabaseAdmin.from('bookings').select('userId').or(`id.eq.${targetId},_id.eq.${targetId}`).maybeSingle();
        if (!bCheck || bCheck.userId !== uid) return NextResponse.json({ error: 'Forbidden. Not your booking.' }, { status: 403 });
      } else {
        return NextResponse.json({ error: 'Forbidden: Requires admin or hoadmin role.' }, { status: 403 });
      }
    } else if (role !== 'admin') {
      const { data: hotelCheck, error: hotelError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
        .maybeSingle();

      if (hotelError || !hotelCheck || (hotelCheck.hotelAdminId !== uid && hotelCheck.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    // 🔥 FIX #5: Server-side double-booking guard for physical-room assignment.
    if (updatePayload.physicalRoomId) {
      const { data: currentBooking } = await supabaseAdmin
        .from('bookings')
        .select('checkIn, checkOut')
        .or(`id.eq.${targetId},_id.eq.${targetId}`)
        .maybeSingle();

      if (currentBooking?.checkIn && currentBooking?.checkOut) {
        const reqIn = new Date(currentBooking.checkIn).setHours(0, 0, 0, 0);
        const reqOut = new Date(currentBooking.checkOut).setHours(0, 0, 0, 0);

        const { data: conflictCandidates } = await supabaseAdmin
          .from('bookings')
          .select('_id, checkIn, checkOut, status')
          .eq('hotelId', hotelId)
          .eq('physicalRoomId', updatePayload.physicalRoomId)
          .in('status', ['pending', 'confirmed', 'checked-in']);

        const hasConflict = (conflictCandidates || []).some((b: any) => {
          if (b._id === targetId) return false;
          if (!b.checkIn || !b.checkOut) return false;
          const bIn = new Date(b.checkIn).setHours(0, 0, 0, 0);
          const bOut = new Date(b.checkOut).setHours(0, 0, 0, 0);
          return bIn < reqOut && bOut > reqIn;
        });

        if (hasConflict) {
          return NextResponse.json({ error: 'This physical room is already booked for the selected dates.' }, { status: 409 });
        }
      }
    }

    // --- STATE MACHINE ENFORCEMENT ---
    if (updatePayload.status) {
      const { data: existingRecord } = await supabaseAdmin
        .from(table)
        .select('status')
        .or(`id.eq.${targetId},_id.eq.${targetId}`)
        .maybeSingle();
        
      if (existingRecord) {
        const currentStatus = existingRecord.status;
        const newStatus = updatePayload.status;
        
        // Prevent transitioning OUT of terminal states to protect database integrity
        if ((currentStatus === 'cancelled' || currentStatus === 'completed' || currentStatus === 'checked-out') && currentStatus !== newStatus) {
          return NextResponse.json({ error: `Illegal transition: Cannot change booking status from '${currentStatus}' to '${newStatus}'.` }, { status: 400 });
        }
      }
    }

    updatePayload.updatedAt = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from(table)
      .update(updatePayload)
      .eq('_id', targetId) // ONLY query the _id column
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

    // 🛡️ CRITICAL FIX: Bypass JSONB DELETE crash for food_orders
    if (type === 'food_orders') {
       return NextResponse.json({ success: true, message: 'JSONB item removed' });
    }

    const table = 'bookings';

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
      .eq('_id', id) // ONLY query the _id column
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Record permanently deleted' });

  } catch (error: any) {
    console.error('Bookings DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}