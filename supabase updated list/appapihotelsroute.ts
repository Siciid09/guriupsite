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
// BUSINESS LOGIC HELPERS
// =========================================================
function isPaidTier(plan: string): boolean {
  const tier = (plan || 'free').toLowerCase().trim();
  return ['pro', 'premium', 'agent_pro', 'agentpro', 'admin', 'sadmin'].includes(tier);
}

// Batch fetch Admins & Users to attach owner information & plan limits
async function attachAdminData(hotels: any[]) {
  const adminIds = [...new Set(hotels.map(h => h.hotelAdminId || h.ownerId || h.agentId).filter(Boolean))];
  
  if (adminIds.length === 0) return hotels;

  const [agentsRes, usersRes] = await Promise.all([
    supabase.from('agents').select('*').in('_id', adminIds),
    supabase.from('users').select('*').in('_id', adminIds)
  ]);

  const adminMap = new Map();
  (usersRes.data || []).forEach(u => adminMap.set(u._id || u.id, u));
  (agentsRes.data || []).forEach(a => adminMap.set(a._id || a.id, a));

  return hotels.map(h => {
    const adminId = h.hotelAdminId || h.ownerId || h.agentId;
    const adminData = adminMap.get(adminId) || {};
    const plan = (h.planTier || adminData.planTier || h.planTierAtUpload || 'free').toLowerCase();
    
    const isVerified = isPaidTier(plan) || h.isPro === true || h.isVerified === true;
    const rawPhone = adminData.whatsappNumber || adminData.phone || adminData.phoneNumber || h.phone || h.contactPhone || '';

    const locObj = typeof h.location === 'object' && h.location !== null ? h.location : {};
    const city = locObj.city || (typeof h.location === 'string' ? h.location : '') || h.city || 'Unknown City';
    const area = locObj.area || locObj.district || h.area || h.district || 'Unknown Area';
    const address = locObj.address || h.address || `${area}, ${city}`;

    const price = Number(h.pricePerNight || h.price || h.displayPrice) || 0;

    return {
      id: h._id || h.id,
      slug: h.slug || null,
      name: h.name || h.title || 'Untitled Hotel',
      description: h.description || h.details || h.bio || '',
      type: h.type || h.hotelType || 'Luxury Hotel',
      rating: Number(h.rating) || 4.5,
      pricePerNight: price,
      displayPrice: price,
      images: Array.isArray(h.images) && h.images.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Hotel+Image'],
      amenities: Array.isArray(h.amenities) ? h.amenities : [],
      location: {
        city: city,
        area: area,
        address: address,
        gpsCoordinates: locObj.gpsCoordinates || locObj.coordinates || null,
      },
      ownerName: adminData.businessName || adminData.agencyName || adminData.name || h.ownerName || 'GuriUp Partner',
      planTier: plan,
      isPro: isVerified,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const q = searchParams.get('q')?.toLowerCase().trim() || searchParams.get('search')?.toLowerCase().trim();
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200;
    const isFeatured = searchParams.get('featured') === 'true';
    const city = searchParams.get('city');
    const type = searchParams.get('type');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
    const amenitiesParam = searchParams.get('amenities');

    // --- SCENARIO A: SINGLE HOTEL FETCH ---
    if (id || slug) {
      const identifier = id || slug;
      const { data, error } = await supabase
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
    let query = supabase.from('hotels').select('*');

    if (isFeatured) {
      query = query.or('isPro.eq.true,featured.eq.true');
    }

    const { data, error } = await query.limit(limitCount);
    if (error) throw error;

    let hotelsList = data || [];
    hotelsList = await attachAdminData(hotelsList);

    // Filter PRO/Featured if requested
    if (isFeatured) {
      hotelsList = hotelsList.filter(h => h.isPro === true);
    }

    // IN-MEMORY MULTI-FIELD SEARCH & FILTERING
    let filteredHotels = hotelsList.filter(h => {
      // 1. Keyword search (Name, Description, Type, City, Area, Address, Owner Name, Amenities)
      if (q) {
        const matchesName = h.name?.toLowerCase().includes(q);
        const matchesDesc = h.description?.toLowerCase().includes(q);
        const matchesType = h.type?.toLowerCase().includes(q);
        const matchesCity = h.location?.city?.toLowerCase().includes(q);
        const matchesArea = h.location?.area?.toLowerCase().includes(q);
        const matchesAddress = h.location?.address?.toLowerCase().includes(q);
        const matchesOwner = h.ownerName?.toLowerCase().includes(q);
        const matchesPrice = h.pricePerNight?.toString().includes(q);
        const matchesAmenities = h.amenities?.some((a: string) => a.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesType && !matchesCity && !matchesArea && !matchesAddress && !matchesOwner && !matchesPrice && !matchesAmenities) {
          return false;
        }
      }

      // 2. City Filter
      if (city && city !== 'All Cities' && city !== 'Anywhere') {
        if (h.location?.city?.toLowerCase() !== city.toLowerCase()) return false;
      }

      // 3. Hotel Type
      if (type && type !== 'Any Type' && type !== 'All') {
        if (h.type?.toLowerCase() !== type.toLowerCase()) return false;
      }

      // 4. Price Filter
      if (minPrice !== null && h.pricePerNight < minPrice) return false;
      if (maxPrice !== null && h.pricePerNight > maxPrice) return false;

      // 5. Rating Filter
      if (minRating !== null && h.rating < minRating) return false;

      // 6. Amenities Filter
      if (amenitiesParam) {
        const requiredAmenities = amenitiesParam.split(',').map(a => a.trim().toLowerCase());
        const hotelAmenities = (h.amenities || []).map((a: string) => a.toLowerCase());
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const payload = await request.json();
    
    payload.hotelAdminId = uid;
    payload.ownerId = uid;
    payload.createdAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('hotels')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('users')
      .update({ role: 'hoadmin', managedHotelId: data._id || data.id })
      .eq('_id', uid);

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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });

    const { data: check, error: checkError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .or(`_id.eq.${targetId},id.eq.${targetId}`)
      .single();

    if (checkError || !check || (check.hotelAdminId !== uid && check.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    updateData.updatedAt = new Date().toISOString();

    const { error } = await supabase
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
    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized. Invalid Token.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });

    const { data: check, error: checkError } = await supabase
      .from('hotels')
      .select('hotelAdminId, ownerId')
      .or(`_id.eq.${id},id.eq.${id}`)
      .single();

    if (checkError || !check || (check.hotelAdminId !== uid && check.ownerId !== uid)) {
      return NextResponse.json({ error: 'Forbidden. You do not own this hotel.' }, { status: 403 });
    }

    const { error } = await supabase
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