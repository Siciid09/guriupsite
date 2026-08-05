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

function isPaidTier(plan: string): boolean {
  const tier = (plan || 'free').toLowerCase().trim();
  return ['pro', 'premium', 'agent_pro', 'agentpro', 'admin', 'sadmin'].includes(tier);
}

// =========================================================
// GET: FETCH & SEARCH PROPERTIES (Public & Private Dashboard)
// =========================================================
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const q = searchParams.get('q')?.toLowerCase().trim() || searchParams.get('search')?.toLowerCase().trim();
    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : 200;
    const isFeatured = searchParams.get('featured') === 'true';
    const mode = searchParams.get('mode'); 
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const bedrooms = searchParams.get('bedrooms') ? parseInt(searchParams.get('bedrooms')!) : null;
    const bathrooms = searchParams.get('bathrooms') ? parseInt(searchParams.get('bathrooms')!) : null;
    const amenitiesParam = searchParams.get('amenities'); 
    const requestAgentId = searchParams.get('agentId'); 

    const uid = await getVerifiedUid(request);

    // 1. SINGLE PROPERTY FETCH
    if (id) {
      let pData: any = null;

      const { data: slugData } = await supabaseAdmin
        .from('property')
        .select('*')
        .eq('slug', id)
        .maybeSingle();

      if (slugData) {
        pData = slugData;
      } else {
        const { data: idData } = await supabaseAdmin
          .from('property')
          .select('*')
          .or(`id.eq.${id},_id.eq.${id}`)
          .maybeSingle();

        pData = idData;
      }

      if (!pData) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      const pAgentId = pData.agentId || pData.agent_id;
      const isArchived = pData?.isArchived === true || pData?.is_archived === true;
      const status = pData?.status || 'available';
      const isPublic = !isArchived && ['available', 'rented_out', 'active'].includes(status);
      
      if (!isPublic && uid !== pAgentId) {
        return NextResponse.json({ error: 'Property is currently private' }, { status: 403 });
      }

      let agentData: any = {};
      if (pAgentId) {
        const { data: aData } = await supabaseAdmin
          .from('agents')
          .select('*')
          .or(`_id.eq.${pAgentId},id.eq.${pAgentId}`)
          .maybeSingle();
        
        if (aData) {
          agentData = aData;
        } else {
          const { data: uData } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(`id.eq.${pAgentId},_id.eq.${pAgentId}`)
            .maybeSingle();
          if (uData) agentData = uData;
        }
      }

      return NextResponse.json({ success: true, property: mergeAndNormalize(pData, agentData) });
    }

    // 2. BULK SEARCH & FILTER QUERY
    let query = supabaseAdmin.from('property').select('*');

    if (requestAgentId) {
      query = query.eq('agentId', requestAgentId);
    } else {
      query = query.in('status', ['available', 'active', 'rented_out']);
      if (isFeatured) {
        query = query.or('featured.eq.true,isFeatured.eq.true');
      }
      if (mode === 'buy') {
        query = query.eq('isForSale', true);
      }
      if (mode === 'rent') {
        query = query.eq('isForSale', false);
      }
      if (type && type !== 'Any Type' && type !== 'All') {
        query = query.ilike('type', `%${type}%`);
      }
    }

    query = query.limit(limitCount);

    const { data: rawProperties, error: queryError } = await query;

    if (queryError) {
      console.error('Supabase Property Query Error:', queryError);
      throw new Error(queryError.message);
    }

    const propertiesList = rawProperties || [];

    const activeProperties = requestAgentId 
      ? propertiesList 
      : propertiesList.filter(p => p.isArchived !== true && p.is_archived !== true);

    const agentIds = [...new Set(activeProperties.map(p => p.agentId || p.agent_id).filter(Boolean))];
    const agentMap: Record<string, any> = {};

    if (agentIds.length > 0) {
      const { data: agentsData } = await supabaseAdmin 
        .from('agents')
        .select('*')
        .in('_id', agentIds);

      (agentsData || []).forEach(agent => {
        agentMap[agent._id || agent.id] = agent;
      });
    }

    let mergedData = activeProperties.map(pData => {
      const agentId = pData.agentId || pData.agent_id;
      const liveAgent = (agentId && agentMap[agentId]) ? agentMap[agentId] : {}; 
      return mergeAndNormalize(pData, liveAgent);
    });

    if (isFeatured && !requestAgentId) {
      mergedData = mergedData.filter(p => isPaidTier(p.agentPlanTier));
    }

    // =========================================================
    // IN-MEMORY COMPLETE FILTERING (Multi-field Deep Search)
    // =========================================================
    let filteredData = mergedData.filter(p => {
      if (q) {
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCity = p.location?.city?.toLowerCase().includes(q);
        const matchesArea = p.location?.area?.toLowerCase().includes(q);
        const matchesAgent = p.agentName?.toLowerCase().includes(q);
        const matchesType = p.type?.toLowerCase().includes(q);
        const matchesPrice = p.displayPrice?.toString().includes(q);
        const matchesAmenities = p.amenities?.some((a: string) => a.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesCity && !matchesArea && !matchesAgent && !matchesType && !matchesPrice && !matchesAmenities) {
          return false;
        }
      }

      // Deep Location Sync (matches Hargeisa searches correctly whether it's in City or Area)
      if (city && city !== 'All Cities' && city !== 'All') {
        const cLow = city.toLowerCase();
        const propCity = p.location?.city?.toLowerCase() || '';
        const propArea = p.location?.area?.toLowerCase() || '';
        if (!propCity.includes(cLow) && !propArea.includes(cLow)) return false;
      }
      if (area && area !== 'All Areas') {
        if (p.location?.area?.toLowerCase() !== area.toLowerCase()) return false;
      }
      if (minPrice !== null && p.displayPrice < minPrice) return false;
      if (maxPrice !== null && p.displayPrice > maxPrice) return false;
      if (bedrooms !== null && p.bedrooms < bedrooms) return false;
      if (bathrooms !== null && p.bathrooms < bathrooms) return false;
      if (amenitiesParam) {
        const requiredAmenities = amenitiesParam.split(',').map(a => a.trim().toLowerCase());
        const propertyAmenities = (p.amenities || []).map((a: string) => a.toLowerCase());
        const hasAllAmenities = requiredAmenities.every(a => propertyAmenities.includes(a));
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    return NextResponse.json({ success: true, properties: filteredData });

  } catch (error: any) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server Error', properties: [] }, { status: 500 });
  }
}

// =========================================================
// POST: CREATE NEW PROPERTY
// =========================================================
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    // 🚨 FIX: Removed 'isAgent' from the select query to prevent PGRST204 errors
    const { data: user } = await supabaseAdmin.from('users').select('role').or(`id.eq.${uid},_id.eq.${uid}`).single();
    
    // Check if the user role is an admin or reagent
    if (user?.role !== 'admin' && user?.role !== 'sadmin' && user?.role !== 'reagent') {
      return NextResponse.json({ error: 'Forbidden. Only Admins and Agents can post properties.' }, { status: 403 });
    }

    const propertyData = await request.json();
    propertyData.agentId = uid;

    const { data, error } = await supabaseAdmin
      .from('property')
      .insert([
        {
          ...propertyData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, property: data }, { status: 201 });
  } catch (error: any) {
    console.error('Property Create Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE EXISTING PROPERTY
// =========================================================
export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, _id, ...updateData } = body; 
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // 🚨 FIX: Safely retrieve the role without checking non-existent columns
    const { data: userRecord } = await supabaseAdmin.from('users').select('role').or(`id.eq.${uid},_id.eq.${uid}`).single();
    const isAdmin = userRecord?.role === 'admin' || userRecord?.role === 'sadmin';

    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('property')
      .select('agentId')
      .or(`id.eq.${targetId},_id.eq.${targetId}`)
      .single();

    if (checkError || !checkData) {
       return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (!isAdmin && checkData.agentId !== uid) {
       return NextResponse.json({ error: 'Forbidden. You do not own this property.' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('property')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .or(`id.eq.${targetId},_id.eq.${targetId}`)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, property: data });
  } catch (error: any) {
    console.error('Property Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE PROPERTY
// =========================================================
export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('_id');

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // 🚨 FIX: Safely retrieve the role
    const { data: userRecord } = await supabaseAdmin.from('users').select('role').or(`id.eq.${uid},_id.eq.${uid}`).single();
    const isAdmin = userRecord?.role === 'admin' || userRecord?.role === 'sadmin';

    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('property')
      .select('agentId')
      .or(`id.eq.${id},_id.eq.${id}`)
      .single();

    if (checkError || !checkData) {
       return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (!isAdmin && checkData.agentId !== uid) {
       return NextResponse.json({ error: 'Forbidden. You do not own this property.' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('property')
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Property deleted permanently' });
  } catch (error: any) {
    console.error('Property Delete Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// HELPER: NORMALIZE PROPERTY OUTPUT
// =========================================================
function mergeAndNormalize(p: any, liveAgentData: any) {
  const livePlan = (liveAgentData.planTier || p.planTier || p.plan_tier || 'free').toLowerCase();
  const isVerified = isPaidTier(livePlan); 
  const isManualVerified = (liveAgentData.isVerified === true) || (p.agentVerified === true);
  const finalVerifiedStatus = isVerified || isManualVerified;

  let createdAt = p.createdAt || p.created_at || new Date().toISOString();
  if (typeof createdAt === 'object' && (createdAt as any).toDate) {
    createdAt = (createdAt as any).toDate().toISOString();
  }

  const amenities: string[] = Array.isArray(p.amenities) ? [...p.amenities] : [];
  const feats = p.features || {};
  if ((p.isFurnished || feats.isFurnished) && !amenities.includes('Furnished')) amenities.push('Furnished');
  if ((p.hasPool || feats.hasPool) && !amenities.includes('Swimming Pool')) amenities.push('Swimming Pool');
  if ((p.hasParking || feats.hasParking) && !amenities.includes('Parking')) amenities.push('Parking');

  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice || p.discount_price) || 0;
  const hasValidDiscount = (p.hasDiscount === true || p.has_discount === true) && discountPrice > 0;

  const locationObj = typeof p.location === 'object' && p.location !== null ? p.location : {};

  return {
    id: p._id || p.id,
    slug: p.slug || null,
    title: p.title || p.name || 'Untitled Property',
    description: p.description || p.bio || p.details || '',
    price: price,
    discountPrice: hasValidDiscount ? discountPrice : 0,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discountPrice : price,
    isForSale: p.isForSale ?? p.is_for_sale ?? true,
    status: p.status || 'available',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    location: {
      city: locationObj.city || p.city || 'Unknown City',
      area: locationObj.area || p.area || 'Unknown Area',
      gpsCoordinates: locationObj.gpsCoordinates || locationObj.coordinates || null,
    },
    bedrooms: Number(p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(p.bathrooms || feats.bathrooms || 0),
    area: Number(p.area || p.size || feats.size || 0),
    type: p.type || p.propertyType || 'House',
    amenities: amenities,
    agentId: p.agentId || p.agent_id || '',
    agentName: liveAgentData.agencyName || liveAgentData.businessName || liveAgentData.ownerName || liveAgentData.name || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.logoUrl || p.agentPhoto || null,
    agentPhone: finalVerifiedStatus ? (p.contactPhone || liveAgentData.whatsappNumber || liveAgentData.phone || p.agentPhone) : null,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}