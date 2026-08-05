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
    .or(`id.eq.${uid},_id.eq.${uid}`) // Unified ID check
    .maybeSingle(); // Changed to maybeSingle to prevent crash
    
  return user?.role || null;
}

// =========================================================
// GATEKEEPER HELPER: VERIFY HOTEL OWNERSHIP
// =========================================================
async function verifyHotelOwnership(hotelId: string, uid: string, role: string | null): Promise<boolean> {
  if (role === 'admin') return true; 
  // 🛡️ TS NULL CHECK
  if (!supabaseAdmin) return false;

  const { data, error } = await supabaseAdmin
    .from('hotels')
    .select('hotelAdminId, ownerId')
    .or(`id.eq.${hotelId},_id.eq.${hotelId}`) // Unified ID check
    .maybeSingle();

  if (error || !data) return false;
  return data.hotelAdminId === uid || data.ownerId === uid;
}

// =========================================================
// GET: FETCH RESTAURANTS OR MENU ITEMS (Public View)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'restaurant'; 
    const id = searchParams.get('id') || searchParams.get('_id');
    const hotelId = searchParams.get('hotelId');
    const restaurantId = searchParams.get('restaurantId');
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    // ---------------------------------------------------------
    // 1. MENU ITEMS FETCH
    // ---------------------------------------------------------
    if (entity === 'menu_item') {
      if (id) {
        const { data, error } = await supabaseAdmin
          .from('menu_items')
          .select('*')
          .or(`id.eq.${id},_id.eq.${id}`) // Unified ID check
          .maybeSingle();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
        return NextResponse.json(data);
      }

      let menuQuery = supabaseAdmin.from('menu_items').select('*');

      if (restaurantId) {
        menuQuery = menuQuery.eq('restaurantId', restaurantId);
      } else if (hotelId) {
        menuQuery = menuQuery.eq('hotelId', hotelId);
      }

      const { data, error } = await menuQuery.order('category', { ascending: true }).limit(limitCount);
      if (error) throw error;
      return NextResponse.json(data);
    }

    // ---------------------------------------------------------
    // 2. RESTAURANT FETCH
    // ---------------------------------------------------------
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('restaurants')
        .select('*')
        .or(`id.eq.${id},_id.eq.${id}`) // Unified ID check
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

      return NextResponse.json(data);
    }

    let restQuery = supabaseAdmin.from('restaurants').select('*');

    if (hotelId) {
      restQuery = restQuery.eq('hotelId', hotelId);
    }

    // Exclude archived items for public requests unless requested by admin
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

// =========================================================
// POST: CREATE RESTAURANT OR MENU ITEM (Strictly Secured)
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
    const { entity = 'restaurant', hotelId, ...dataPayload } = payload;

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId is required.' }, { status: 400 });
    }

    // GATEKEEPER: Check if user owns the parent hotel
    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    // ---------------------------------------------------------
    // CREATE MENU ITEM
    // ---------------------------------------------------------
    if (entity === 'menu_item') {
      if (!dataPayload.restaurantId) {
        return NextResponse.json({ error: 'restaurantId is required for menu items.' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('menu_items')
        .insert([{
          ...dataPayload,
          hotelId,
          isAvailable: dataPayload.isAvailable ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, menuItem: data }, { status: 201 });
    }

    // ---------------------------------------------------------
    // CREATE RESTAURANT
    // ---------------------------------------------------------
    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .insert([{
        ...dataPayload,
        hotelId,
        status: dataPayload.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, restaurant: data }, { status: 201 });

  } catch (error: any) {
    console.error('Restaurants POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE RESTAURANT OR MENU ITEM (Strictly Secured)
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

    const body = await request.json();
    const { entity = 'restaurant', id, _id, hotelId, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId || !hotelId) {
      return NextResponse.json({ error: 'Both ID and hotelId are required.' }, { status: 400 });
    }

    // GATEKEEPER: Check if user owns the parent hotel
    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    const table = entity === 'menu_item' ? 'menu_items' : 'restaurants';

    const { error } = await supabaseAdmin
      .from(table)
      .update({
        ...updateData,
        updatedAt: new Date().toISOString()
      })
      .or(`id.eq.${targetId},_id.eq.${targetId}`) // Unified ID check
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `${entity === 'menu_item' ? 'Menu item' : 'Restaurant'} updated successfully` });

  } catch (error: any) {
    console.error('Restaurants PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE RESTAURANT OR MENU ITEM (Strictly Secured)
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
    const entity = searchParams.get('entity') || 'restaurant';
    const id = searchParams.get('id') || searchParams.get('_id'); // Safe param fallback
    const hotelId = searchParams.get('hotelId');

    if (!id || !hotelId) {
      return NextResponse.json({ error: 'Both ID and hotelId are required.' }, { status: 400 });
    }

    // GATEKEEPER: Check if user owns the parent hotel
    const isOwner = await verifyHotelOwnership(hotelId, uid, role);
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    const table = entity === 'menu_item' ? 'menu_items' : 'restaurants';

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`) // Unified ID check
      .eq('hotelId', hotelId);

    if (error) throw error;
    return NextResponse.json({ success: true, message: `${entity === 'menu_item' ? 'Menu item' : 'Restaurant'} permanently deleted` });

  } catch (error: any) {
    console.error('Restaurants DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}