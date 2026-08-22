// app/api/restaurants/route.ts

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

async function getUserRoleStrict(uid: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`)
    .maybeSingle();
  return user?.role || null;
}

async function verifyHotelOwnership(hotelId: string, uid: string, role: string | null): Promise<boolean> {
  if (role === 'admin') return true; 
  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('hotelAdminId, ownerId')
    .or(`id.eq.${hotelId},_id.eq.${hotelId}`)
    .maybeSingle();

  if (error || !data) return false;
  return data.hotelAdminId === uid || data.ownerId === uid;
}

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing.' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'restaurant'; 
    const id = searchParams.get('id') || searchParams.get('_id');
    const hotelId = searchParams.get('hotelId');
    const restaurantId = searchParams.get('restaurantId');
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    // 🔥 ROUTES TO NEW menu_items TABLE
    if (entity === 'menu_item') {
      let menuQuery = supabaseAdmin.from('menu_items').select('*');
      if (restaurantId) menuQuery = menuQuery.eq('restaurantId', restaurantId);
      else if (hotelId) menuQuery = menuQuery.eq('hotelId', hotelId);

      const { data, error } = await menuQuery.order('createdAt', { ascending: false });
      if (error) return NextResponse.json([]); 
      
      return NextResponse.json(data || []);
    }

    if (entity === 'table') {
      let tableQuery = supabaseAdmin.from('restaurants').select('_id, id, tables');
      if (restaurantId) tableQuery = tableQuery.eq('_id', restaurantId);
      else if (hotelId) tableQuery = tableQuery.eq('hotelId', hotelId);

      const { data, error } = await tableQuery;
      if (error) return NextResponse.json([]); 
      
      const allTables = data?.flatMap(rest => {
        const t = Array.isArray(rest.tables) ? rest.tables : [];
        return t.map((table: any) => ({
          ...table,
          restaurantId: table.restaurantId || rest._id || rest.id
        }));
      }) || [];
      
      return NextResponse.json(allTables);
    }

    let restQuery = supabaseAdmin.from('restaurants').select('*');
    if (hotelId) restQuery = restQuery.eq('hotelId', hotelId);
    
    if (searchParams.get('includeArchived') !== 'true') {
      restQuery = restQuery.neq('status', 'archived');
    }

    const { data, error } = await restQuery.order('createdAt', { ascending: false }).limit(limitCount);
    if (error) throw error;

    const formattedRestaurants = (data || []).map(rest => ({
      ...rest,
      cuisines: rest.cuisines || (rest.cuisineType ? [rest.cuisineType] : ['International']),
      restaurantType: rest.restaurantType || 'Restaurant',
      hotelGuests: rest.hotelGuests || { dineIn: true, roomService: true, chargeToRoom: true },
      outsideGuests: rest.outsideGuests || { allowed: true, walkIns: true, reservations: true, takeaway: true, onlineOrdering: false },
      operatingHours: rest.operatingHours || {},
      reservationRules: rest.reservationRules || { maxPartySize: 10, requirement: 'Recommended', walkInsAccepted: true, noticeMinutes: 30, maxAdvanceDays: 30 },
      roomServiceDetails: rest.roomServiceDetails || { hoursType: 'Same as restaurant', guestOrdering: { orderFromGuriUp: true, chargeToRoom: true, paySeparately: false } },
      publicDiscovery: rest.publicDiscovery || { showOnGuriUp: true, allowPublicOrdering: true, allowPublicReservations: true },
      facilities: rest.facilities || [],
      galleryImages: rest.galleryImages || [],
    }));

    return NextResponse.json(formattedRestaurants);
  } catch (error: any) {
    console.error('Restaurants GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const payload = await request.json();
    const { entity = 'restaurant', hotelId, ...dataPayload } = payload;

    if (!hotelId) return NextResponse.json({ error: 'hotelId is required.' }, { status: 400 });

    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });

    // 🔥 ROUTES TO NEW menu_items TABLE
    if (entity === 'menu_item') {
      const restId = dataPayload.restaurantId;
      if (!restId) return NextResponse.json({ error: 'restaurantId is required for menu items.' }, { status: 400 });

      // Clean empty strings to null to satisfy strict SQL number columns
      const safeNumber = (val: any) => (val === "" || val === null || val === undefined) ? null : Number(val);

      const newItem = { 
        ...dataPayload, 
        price: safeNumber(dataPayload.price) || 0,
        comparePrice: safeNumber(dataPayload.comparePrice),
        prepTimeMinutes: safeNumber(dataPayload.prepTimeMinutes) || 20,
        roomServicePrice: safeNumber(dataPayload.roomServicePrice),
        minimumOrder: safeNumber(dataPayload.minimumOrder),
        _id: crypto.randomUUID(), 
        id: crypto.randomUUID(), 
        hotelId, 
        restaurantId: restId, 
        isAvailable: dataPayload.isAvailable ?? true, 
        addons: dataPayload.addons || [],
        requiredChoices: dataPayload.requiredChoices || [],
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };

      const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, menuItem: data }, { status: 201 });
    }

    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .insert([{ ...dataPayload, _id: crypto.randomUUID(), hotelId, status: dataPayload.status || 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, restaurant: data }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const body = await request.json();
    const { entity = 'restaurant', id, _id, hotelId, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId || !hotelId) return NextResponse.json({ error: 'ID and hotelId required.' }, { status: 400 });

    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });

    // 🔥 ROUTES TO NEW menu_items TABLE
    if (entity === 'menu_item') {
      const safeNumber = (val: any) => (val === "" || val === null || val === undefined) ? null : Number(val);
      
      const updateSafe = { ...updateData, updatedAt: new Date().toISOString() };
      ['price', 'comparePrice', 'prepTimeMinutes', 'roomServicePrice', 'minimumOrder'].forEach(key => {
        if (updateSafe[key] !== undefined) updateSafe[key] = safeNumber(updateSafe[key]);
      });

      const { error } = await supabaseAdmin
        .from('menu_items')
        .update(updateSafe)
        .or(`id.eq.${targetId},_id.eq.${targetId}`)
        .eq('hotelId', hotelId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Menu item updated successfully` });
    }

    const { error } = await supabaseAdmin
      .from('restaurants')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .or(`id.eq.${targetId},_id.eq.${targetId}`)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Updated successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'hoadmin') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'restaurant';
    const id = searchParams.get('id') || searchParams.get('_id'); 
    const hotelId = searchParams.get('hotelId');

    if (!id || !hotelId) return NextResponse.json({ error: 'ID and hotelId required.' }, { status: 400 });

    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });

    // 🔥 ROUTES TO NEW menu_items TABLE
    if (entity === 'menu_item') {
      const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .or(`id.eq.${id},_id.eq.${id}`)
        .eq('hotelId', hotelId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: `Menu item deleted successfully` });
    }

    const { error } = await supabaseAdmin
      .from('restaurants')
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Permanently deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}