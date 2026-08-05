import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type') || 'all'; 
    const cityFilter = searchParams.get('city');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

    let propertiesList: any[] = [];
    let hotelsList: any[] = [];
    let agentsMap: Record<string, any> = {};
    let usersMap: Record<string, any> = {};

    // --- 1. FETCH ALL AGENTS & USERS ---
    const [agentsRes, usersRes] = await Promise.all([
      supabaseAdmin.from('agents').select('*'),
      supabaseAdmin.from('users').select('*')
    ]);

    if (agentsRes.data) agentsRes.data.forEach((a: any) => { agentsMap[a.id || a._id] = a; });
    if (usersRes.data) usersRes.data.forEach((u: any) => { usersMap[u.id || u._id] = u; });

    // --- 2. FETCH PROPERTIES ---
    if (typeFilter === 'all' || typeFilter === 'property') {
      let { data: propData } = await supabaseAdmin
        .from('property')
        .select('*')
        .in('status', ['available', 'active']);

      if (propData) {
        // Safely remove archived properties in memory
        propertiesList = propData.filter((p: any) => p.isArchived !== true && p.is_archived !== true);
      }
    }

    // --- 3. FETCH HOTELS (Reverted to your working code) ---
    if (typeFilter === 'all' || typeFilter === 'hotel') {
      let { data: hotelData } = await supabaseAdmin
        .from('hotels')
        .select('*')
        .or('status.eq.active,status.is.null'); // Catches active AND newly created hotels

      if (hotelData) hotelsList = hotelData;
    }

    const markers: any[] = [];

    // --- HELPER: DEEP SCAN EXTRACT COORDINATES ---
    const extractCoords = (obj: any) => {
      if (!obj) return { lat: null, lng: null };
      
      if (obj.gpsCoordinates && typeof obj.gpsCoordinates === 'string') {
        const parts = obj.gpsCoordinates.split(',');
        if (parts.length === 2) return { lat: parseFloat(parts[0].trim()), lng: parseFloat(parts[1].trim()) };
      } 
      if (obj.coordinates && obj.coordinates.latitude) {
        return { lat: parseFloat(obj.coordinates.latitude), lng: parseFloat(obj.coordinates.longitude) };
      }
      if (obj.latDisplay && obj.lngDisplay) {
        return { lat: parseFloat(obj.latDisplay), lng: parseFloat(obj.lngDisplay) };
      }
      if (obj.lat && obj.lng) {
        return { lat: parseFloat(obj.lat), lng: parseFloat(obj.lng) };
      }
      return { lat: null, lng: null };
    };

    // --- 4. MAP PROPERTIES ---
    propertiesList.forEach((p: any) => {
      let { lat, lng } = extractCoords(p.location);
      if (lat === null && lng === null) {
        const flatCoords = extractCoords(p);
        lat = flatCoords.lat;
        lng = flatCoords.lng;
      }

      const agentId = p.agentId || p.agent_id;
      const agentRecord = agentsMap[agentId] || usersMap[agentId] || {};
      const planTier = (agentRecord.planTier || p.planTier || 'free').toLowerCase();
      const isPro = ['pro', 'premium', 'agent_pro'].includes(planTier);
      const isVerified = isPro || agentRecord.isVerified === true || p.agentVerified === true;

      if (verifiedOnly && !isVerified) return;

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        const city = p.location?.city || p.city || '';
        if (!cityFilter || cityFilter === 'all' || city.toLowerCase() === cityFilter.toLowerCase()) {
          markers.push({
            id: p.id || p._id,
            title: p.title || p.name || 'Property',
            category: 'property',
            price: p.price || 0,
            formattedPrice: `$${(p.price || 0).toLocaleString()}`,
            isForSale: p.isForSale ?? true,
            propertyType: p.type || 'Residential',
            lat,
            lng,
            city,
            area: p.location?.area || p.area || '',
            image: p.images?.[0] || 'https://placehold.co/400x300?text=Property',
            isVerified,
            planTier,
            link: `/properties/${p.slug || p.id || p._id}`
          });
        }
      }
    });

    // --- 5. MAP HOTELS ---
    hotelsList.forEach((h: any) => {
      let { lat, lng } = extractCoords(h.location);
      if (lat === null && lng === null) {
         const flatCoords = extractCoords(h);
         lat = flatCoords.lat;
         lng = flatCoords.lng;
      }

      const adminId = h.hotelAdminId || h.ownerId;
      const adminRecord = usersMap[adminId] || agentsMap[adminId] || {};
      const planTier = (adminRecord.planTier || h.planTierAtUpload || h.planTier || 'free').toLowerCase();
      const isPro = ['pro', 'premium', 'hoadmin'].includes(planTier);
      const isVerified = isPro || adminRecord.isVerified === true || h.isVerified === true;

      if (verifiedOnly && !isVerified) return;

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        const city = h.location?.city || h.city || '';
        if (!cityFilter || cityFilter === 'all' || city.toLowerCase() === cityFilter.toLowerCase()) {
          markers.push({
            id: h.id || h._id,
            title: h.name || h.title || 'Hotel',
            category: 'hotel',
            price: h.pricePerNight || h.priceRange || h.minPrice || 0,
            formattedPrice: `$${h.pricePerNight || h.priceRange || h.minPrice || 0}/night`,
            lat,
            lng,
            city,
            area: h.location?.area || h.area || '',
            image: h.images?.[0] || 'https://placehold.co/400x300?text=Hotel',
            isVerified,
            planTier,
            link: `/hotels/${h.slug || h.id || h._id}`
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      count: markers.length,
      markers
    }, { status: 200 });

  } catch (error: any) {
    console.error("Maps API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}