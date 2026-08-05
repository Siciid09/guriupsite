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
      let menuQuery = supabaseAdmin.from('restaurants').select('menuItems');
      if (restaurantId) menuQuery = menuQuery.or(`id.eq.${restaurantId},_id.eq.${restaurantId}`);
      else if (hotelId) menuQuery = menuQuery.eq('hotelId', hotelId);

      const { data, error } = await menuQuery;
      if (error) return NextResponse.json([]); // Prevent 500 crash
      
      const allItems = data?.flatMap(rest => rest.menuItems || []) || [];
      return NextResponse.json(allItems);
    }

    let restQuery = supabaseAdmin.from('restaurants').select('*');
    if (hotelId) restQuery = restQuery.eq('hotelId', hotelId);
    
    if (searchParams.get('includeArchived') !== 'true') {
      restQuery = restQuery.neq('status', 'archived');
    }

    const { data, error } = await restQuery.order('createdAt', { ascending: false }).limit(limitCount);
    if (error) throw error;

    return NextResponse.json(data);
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
        .or(`id.eq.${restId},_id.eq.${restId}`)
        .maybeSingle();

      if (fetchError || !restData) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

      const currentItems = restData.menuItems || [];
      const newItem = { 
        ...dataPayload, 
        _id: crypto.randomUUID(), 
        id: crypto.randomUUID(), 
        hotelId, 
        isAvailable: dataPayload.isAvailable ?? true, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };

      const { error } = await supabaseAdmin
        .from('restaurants')
        .update({ menuItems: [...currentItems, newItem] })
        .or(`id.eq.${restId},_id.eq.${restId}`);

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
      const { data: restaurants } = await supabaseAdmin.from('restaurants').select('_id, id, menuItems').eq('hotelId', hotelId);
      if (restaurants) {
         for (const rest of restaurants) {
            const items = rest.menuItems || [];
            const itemExists = items.some((i:any) => i.id === targetId || i._id === targetId);
            if (itemExists) {
               const updatedItems = items.map((i:any) => (i.id === targetId || i._id === targetId) ? { ...i, ...updateData, updatedAt: new Date().toISOString() } : i);
               await supabaseAdmin.from('restaurants').update({ menuItems: updatedItems }).or(`id.eq.${rest.id || rest._id},_id.eq.${rest.id || rest._id}`);
            }
         }
      }
      return NextResponse.json({ success: true, message: `Menu item updated successfully` });
    }

    const table = 'restaurants';
    const { error } = await supabaseAdmin
      .from(table)
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

    if (entity === 'menu_item') {
      const { data: restaurants } = await supabaseAdmin.from('restaurants').select('_id, id, menuItems').eq('hotelId', hotelId);
      if (restaurants) {
         for (const rest of restaurants) {
            const items = rest.menuItems || [];
            const itemExists = items.some((i:any) => i.id === id || i._id === id);
            if (itemExists) {
               const filtered = items.filter((i:any) => i.id !== id && i._id !== id);
               await supabaseAdmin.from('restaurants').update({ menuItems: filtered }).or(`id.eq.${rest.id || rest._id},_id.eq.${rest.id || rest._id}`);
            }
         }
      }
      return NextResponse.json({ success: true, message: `Menu item deleted successfully` });
    }

    const table = 'restaurants';
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`)
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `Permanently deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}