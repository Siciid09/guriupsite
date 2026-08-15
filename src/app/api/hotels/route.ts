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
    .or(`uid.eq.${uid},_id.eq.${uid}`) // 👈 FIXED: Replaced 'id' with 'uid'
    .maybeSingle(); 
    
  return user?.role || null;
}

// =========================================================
// BUSINESS LOGIC HELPERS
// =========================================================
function isPaidTier(plan: string): boolean {
  const tier = (plan || 'free').toLowerCase().trim();
  return ['pro', 'premium', 'agent_pro', 'agentpro', 'admin', 'sadmin'].includes(tier);
}

// Batch fetch Admins & Users to attach owner information & plan limits
async function attachAdminData(hotels: any[]) {
  // 🛡️ TS NULL CHECK
  if (!supabaseAdmin) return hotels;

  // 1. Gather unique Admin/Owner IDs
  const adminIds = [...new Set(hotels.map(h => h.hotelAdminId || h.ownerId || h.agentId).filter(Boolean))];
  const hotelIds = hotels.map(h => h._id || h.id).filter(Boolean);

  const adminMap = new Map();
  const cheapestRoomByHotel = new Map<string, number>();
  const reviewAggByHotel = new Map<string, { count: number; total: number }>();

  // 2. Fetch admin data ONLY if we have IDs
  if (adminIds.length > 0) {
    const adminIdList = adminIds.join(',');
    
    // 👈 FIXED: Replaced 'id.in' with 'uid.in' to stop the DB crash
    const [agentsRes, usersRes] = await Promise.all([
      supabaseAdmin.from('agents').select('*').or(`uid.in.(${adminIdList}),_id.in.(${adminIdList})`),
      supabaseAdmin.from('users').select('*').or(`uid.in.(${adminIdList}),_id.in.(${adminIdList})`)
    ]);
    
    (usersRes.data || []).forEach(u => adminMap.set(u._id || u.uid, u));
    (agentsRes.data || []).forEach(a => adminMap.set(a._id || a.uid, a));
  }

  // 2b. Cheapest active room price + review aggregates, batched for every hotel
  if (hotelIds.length > 0) {
    const [roomsRes, reviewsRes] = await Promise.all([
      supabaseAdmin.from('rooms').select('hotelId, pricePerNight, price, basePrice, status').in('hotelId', hotelIds),
      supabaseAdmin.from('reviews').select('hotelId, rating').in('hotelId', hotelIds)
    ]);

    (roomsRes.data || []).forEach((r: any) => {
      if (r.status === 'draft' || r.status === 'Hidden') return;
      const p = Number(r.basePrice || r.pricePerNight || r.price) || 0;
      if (p <= 0) return;
      const current = cheapestRoomByHotel.get(r.hotelId);
      if (current === undefined || p < current) cheapestRoomByHotel.set(r.hotelId, p);
    });

    (reviewsRes.data || []).forEach((rv: any) => {
      const entry = reviewAggByHotel.get(rv.hotelId) || { count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(rv.rating) || 0;
      reviewAggByHotel.set(rv.hotelId, entry);
    });
  }

  // 3. CRITICAL FIX: ALWAYS map every hotel so the frontend never crashes on undefined fields
  return hotels.map(h => {
    const adminId = h.hotelAdminId || h.ownerId || h.agentId;
    const adminData = adminId ? (adminMap.get(adminId) || {}) : {};
    const plan = (h.planTier || adminData.planTier || h.planTierAtUpload || 'free').toLowerCase();
    const isVerified = isPaidTier(plan) || h.isPro === true || h.isVerified === true;
    const rawPhone = adminData.whatsappNumber || adminData.phone || adminData.phoneNumber || h.contact?.phoneCall || '';

    const locObj = typeof h.location === 'object' && h.location !== null ? h.location : {};
    const city = locObj.city || (typeof h.location === 'string' ? h.location : '') || h.city || 'Unknown City';
    const area = locObj.area || locObj.district || h.area || h.district || 'Unknown Area';
    const address = locObj.address || h.address || `${area}, ${city}`;

    const hotelId = h._id || h.id;
    const fallbackPrice = Number(h.pricePerNight || h.price || h.displayPrice) || 0;
    const fromPrice = cheapestRoomByHotel.get(hotelId) ?? fallbackPrice;

    const reviewAgg = reviewAggByHotel.get(hotelId);
    const reviewCount = reviewAgg?.count || 0;
    const avgRating = reviewAgg && reviewAgg.count > 0 ? Number((reviewAgg.total / reviewAgg.count).toFixed(1)) : (Number(h.rating) || 4.5);

    return {
      id: h._id || h.id,
      slug: h.slug || null,
      name: h.name || h.title || 'Untitled Hotel',
      description: h.description || h.details || '',
      shortDescription: h.shortDescription || '',
      type: h.type || h.hotelType || 'Hotel',
      roomsCount: h.roomsCount || 0,
      rating: avgRating,
      reviewCount,
      pricePerNight: fromPrice,
      displayPrice: fromPrice,
      fromPrice: fromPrice,
      images: Array.isArray(h.images) && h.images.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Hotel+Image'],
      media: h.media || { logo: '', coverPhoto: '' },
      amenities: typeof h.amenities === 'object' && h.amenities !== null && !Array.isArray(h.amenities) 
                 ? Object.keys(h.amenities).filter(k => h.amenities[k]) 
                 : Array.isArray(h.amenities) ? h.amenities : [],
      location: {
        country: locObj.country || 'Somalia',
        city: city,
        area: area,
        address: address,
        landmark: locObj.landmark || '',
        gpsCoordinates: locObj.gpsCoordinates || locObj.coordinates || null,
        latDisplay: locObj.latDisplay || null,
        lngDisplay: locObj.lngDisplay || null,
      },
      contact: h.contact || {},
      policies: h.policies || {},
      cancellation: h.cancellation || {},
      payments: h.payments || {},
      guestInfo: h.guestInfo || {},
      accessibility: h.accessibility || {},
      settings: h.settings || {},
      ownerName: adminData.businessName || adminData.agencyName || adminData.name || h.ownerName || 'GuriUp Partner',
      planTier: plan,
      isPro: isVerified,
      featured: h.featured === true,
      contactPhone: isVerified ? rawPhone : null,
      createdAt: h.createdAt || h.created_at || new Date().toISOString(),
    };
  });
}

// =========================================================
// GET: FETCH & SEARCH HOTELS (Public View / Search)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('_id');
    const slug = searchParams.get('slug');
    const q = searchParams.get('q')?.toLowerCase().trim() || searchParams.get('search')?.toLowerCase().trim();
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200;
    const isFeatured = searchParams.get('featured') === 'true';
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const adminId = searchParams.get('adminId'); // 👈 ADD THIS
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
    const amenitiesParam = searchParams.get('amenities');

    // --- SCENARIO A: SINGLE HOTEL FETCH ---
    if (id || slug) {
      const identifier = id || slug;
      // 🛡️ TUNNEL FIX: Use supabaseAdmin
      const { data, error } = await supabaseAdmin
        .from('hotels')
        .select('*')
        .or(`_id.eq.${identifier},id.eq.${identifier},slug.eq.${identifier}`)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });

      const fullyMergedHotel = await attachAdminData([data]);
      return NextResponse.json({ success: true, hotel: fullyMergedHotel[0] });
    }

    // --- SCENARIO B: BULK QUERY & DEEP SEARCH ---
    // 🛡️ TUNNEL FIX: Use supabaseAdmin
    let query = supabaseAdmin.from('hotels').select('*');

    if (isFeatured) {
      query = query.or('isPro.eq.true,featured.eq.true');
    }

    // 👈 ADD THIS BLOCK: Filter by owner if the dashboard requests it
    if (adminId) {
      query = query.or(`hotelAdminId.eq.${adminId},ownerId.eq.${adminId}`);
    }

    const { data, error } = await query.limit(limitCount);
    if (error) throw error;

    let hotelsList = data || [];
    
    // GUARANTEE formatted data structure
    hotelsList = await attachAdminData(hotelsList);

    // Filter PRO/Featured if requested
    if (isFeatured) {
      hotelsList = hotelsList.filter(h => h.isPro === true || h.featured === true);
    }

    // IN-MEMORY MULTI-FIELD SEARCH & FILTERING
    let filteredHotels = hotelsList.filter(h => {
      
      // 1. Keyword search
      if (q) {
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesDesc = h.description.toLowerCase().includes(q);
        const matchesType = h.type.toLowerCase().includes(q);
        const matchesCity = h.location.city.toLowerCase().includes(q);
        const matchesArea = h.location.area.toLowerCase().includes(q);
        const matchesAddress = h.location.address.toLowerCase().includes(q);
        const matchesOwner = h.ownerName.toLowerCase().includes(q);
        const matchesPrice = h.pricePerNight.toString().includes(q);
        const matchesAmenities = h.amenities.some((a: string) => a.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesType && !matchesCity && !matchesArea && !matchesAddress && !matchesOwner && !matchesPrice && !matchesAmenities) {
          return false;
        }
      }

      // 2. City Filter
      if (city && city !== 'All Cities' && city !== 'Anywhere') {
        if (h.location.city.toLowerCase() !== city.toLowerCase()) return false;
      }

      // 3. Hotel Type Filter
      if (type && type !== 'Any Type' && type !== 'All') {
        if (h.type.toLowerCase() !== type.toLowerCase()) return false;
      }

      // 4. Price Filter
      if (minPrice !== null && h.pricePerNight < minPrice) return false;
      if (maxPrice !== null && h.pricePerNight > maxPrice) return false;

      // 5. Rating Filter
      if (minRating !== null && h.rating < minRating) return false;

      // 6. Amenities Filter
      if (amenitiesParam) {
        const requiredAmenities = amenitiesParam.split(',').map(a => a.trim().toLowerCase());
        const hotelAmenities = h.amenities.map((a: string) => a.toLowerCase());
        const hasAllAmenities = requiredAmenities.every(a => hotelAmenities.includes(a));
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    return NextResponse.json({ success: true, hotels: filteredHotels });

  } catch (error: any) {
    console.error('Hotels GET Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server Error', hotels: [] }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE HOTEL
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
    
    // 1. Generate the unique ID
    const newId = crypto.randomUUID();
    
    // 2. Assign ONLY to the column that actually exists in your DB
    payload._id = newId;
    
    // 3. CRITICAL: Delete 'id' if the frontend accidentally sent it, so Supabase doesn't crash
    delete payload.id; 

    payload.hotelAdminId = uid;
    payload.ownerId = uid;
    payload.createdAt = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('hotels')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('users')
      .update({ role: 'hoadmin', managedHotelId: data._id }) // 👈 Only using _id here too
      .or(`uid.eq.${uid},_id.eq.${uid}`);

    return NextResponse.json({ success: true, hotel: data }, { status: 201 });
  } catch (error: any) {
    console.error('Hotels POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE HOTEL
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
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });

    if (role !== 'admin') {
      const { data: check, error: checkError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .eq('_id', targetId) // 👈 FIXED: Removed id.eq to stop UUID cast crash
        .maybeSingle(); // Prevent crash if missing

      if (checkError || !check || (check.hotelAdminId !== uid && check.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    updateData.updatedAt = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('hotels')
      .update(updateData)
      .or(`_id.eq.${targetId},id.eq.${targetId}`);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Hotel updated successfully' });
  } catch (error: any) {
    console.error('Hotels PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE HOTEL
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
    const id = searchParams.get('id') || searchParams.get('_id'); // Safe param fallback

    if (!id) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });

    if (role !== 'admin') {
      const { data: check, error: checkError } = await supabaseAdmin
        .from('hotels')
        .select('hotelAdminId, ownerId')
        .or(`_id.eq.${id},id.eq.${id}`)
        .maybeSingle(); // Prevent crash if missing

      if (checkError || !check || (check.hotelAdminId !== uid && check.ownerId !== uid)) {
        return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin
      .from('hotels')
      .delete()
      .or(`_id.eq.${id},id.eq.${id}`);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Hotel permanently deleted' });
  } catch (error: any) {
    console.error('Hotels DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}