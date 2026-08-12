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

    if (entity === 'menu_item') {
      let menuQuery = supabaseAdmin.from('restaurants').select('_id, id, menuItems');
      if (restaurantId) menuQuery = menuQuery.eq('_id', restaurantId);
      else if (hotelId) menuQuery = menuQuery.eq('hotelId', hotelId);

      const { data, error } = await menuQuery;
      if (error) return NextResponse.json([]); 
      
      const allItems = data?.flatMap(rest => {
        const items = Array.isArray(rest.menuItems) ? rest.menuItems : [];
        return items.map((item: any) => ({
          ...item,
          restaurantId: item.restaurantId || rest._id || rest.id
        }));
      }) || [];
      
      return NextResponse.json(allItems);
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

    // 🛡️ Map legacy restaurant data to support the new Dining Hub structures natively
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

    if (entity === 'menu_item') {
      const restId = dataPayload.restaurantId;
      if (!restId) return NextResponse.json({ error: 'restaurantId is required for menu items.' }, { status: 400 });

      const { data: restData, error: fetchError } = await supabaseAdmin
        .from('restaurants')
        .select('menuItems')
        .eq('_id', restId) // 🛡️ FIX: Strictly use _id
        .maybeSingle();

      if (fetchError || !restData) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

      // 🛡️ FIX: Safely parse JSONB array to prevent iteration crashes
      const currentItems = Array.isArray(restData.menuItems) ? restData.menuItems : [];
      const newItem = { 
        ...dataPayload, 
        _id: crypto.randomUUID(), 
        id: crypto.randomUUID(), 
        hotelId, 
        restaurantId: restId, // Force strict association
        isAvailable: dataPayload.isAvailable ?? true, 
        addons: dataPayload.addons || [],
        requiredChoices: dataPayload.requiredChoices || [],
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };

      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ menuItems: [...currentItems, newItem] })
        .eq('_id', restId); // 🛡️ FIX: Strictly use _id

      if (error) throw error;
      return NextResponse.json({ success: true, menuItem: newItem }, { status: 201 });
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

    if (entity === 'menu_item') {
      const { data: restaurants } = await supabaseAdmin.from('restaurants').select('_id, menuItems').eq('hotelId', hotelId); // 🛡️ FIX: Removed 'id' from select
      if (restaurants) {
         for (const rest of restaurants) {
            const items = Array.isArray(rest.menuItems) ? rest.menuItems : [];
            const itemExists = items.some((i:any) => i.id === targetId || i._id === targetId);
            if (itemExists) {
               const updatedItems = items.map((i:any) => (i.id === targetId || i._id === targetId) ? { ...i, ...updateData, updatedAt: new Date().toISOString() } : i);
               await supabaseAdmin.from('restaurants').update({ menuItems: updatedItems }).eq('_id', rest._id);
            }
         }
      }
      return NextResponse.json({ success: true, message: `Menu item updated successfully` });
    }

    const table = 'restaurants';
    const { error } = await supabaseAdmin
      .from(table)
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq('_id', targetId) // 🛡️ FIX: Strictly use _id
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

    if (entity === 'menu_item') {
      const { data: restaurants } = await supabaseAdmin.from('restaurants').select('_id, menuItems').eq('hotelId', hotelId); // 🛡️ FIX: Removed 'id' from select
      if (restaurants) {
         for (const rest of restaurants) {
            const items = Array.isArray(rest.menuItems) ? rest.menuItems : [];
            const itemExists = items.some((i:any) => i.id === id || i._id === id);
            if (itemExists) {
               const filtered = items.filter((i:any) => i.id !== id && i._id !== id);
               await supabaseAdmin.from('restaurants').update({ menuItems: filtered }).eq('_id', rest._id);
            }
         }
      }
      return NextResponse.json({ success: true, message: `Menu item deleted successfully` });
    }

    const table = 'restaurants';
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('_id', id) // 🛡️ FIX: Strictly use _id
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Permanently deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}