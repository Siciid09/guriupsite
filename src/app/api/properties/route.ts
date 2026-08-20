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
  if (!supabaseAdmin) return null;
  
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`uid.eq.${uid},_id.eq.${uid}`) // Safe from UUID crashes
    .maybeSingle(); 
    
  return user?.role || null;
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
      const status = pData?.status?.toLowerCase() || 'available';
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
      query = query.in('status', ['available', 'active', 'rented_out']); // DB statuses are now forced lowercase
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

    const role = await getUserRoleStrict(uid);
    if (role !== 'admin' && role !== 'sadmin' && role !== 'reagent') {
      return NextResponse.json({ error: 'Forbidden. Only Admins and Agents can post properties.' }, { status: 403 });
    }

    const propertyData = await request.json();
    propertyData.agentId = uid;

    // DESTRUCTURE: Pull out fields that Postgres expects in strict lowercase or nested formats
    const { 
      transactionType, 
      rentalDetails, 
      saleDetails, 
      virtualTourUrl, 
      floorPlanUrl, 
      ...safeDbData 
    } = propertyData;

    // FIX 1: Prevent "Available" vs "available" mismatch hiding properties
    if (safeDbData.status) {
      safeDbData.status = safeDbData.status.toLowerCase();
    }
    
    // FIX 2: Ensure the 'type' column is always populated for search filters
    if (safeDbData.category) {
      safeDbData.type = safeDbData.category; 
    }
    
    // FIX 3: Safety net to ensure isForSale is always strictly tied to transactionType
    if (transactionType !== undefined) {
      safeDbData.isForSale = transactionType === 'Sale';
    }

    const { data, error } = await supabaseAdmin
      .from('property')
      .insert([
        {
          ...safeDbData,
          // MAP TO EXACT LOWERCASE COLUMN NAMES from your database schema
          transactiontype: transactionType,
          rentaldetails: rentalDetails,
          saledetails: saleDetails,
          virtualtoururl: virtualTourUrl,
          floorplanurl: floorPlanUrl,
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
    
    // DESTRUCTURE: Extract ID and fields requiring exact lowercase mapping
    const { 
      id, 
      _id, 
      transactionType, 
      rentalDetails, 
      saleDetails, 
      virtualTourUrl, 
      floorPlanUrl, 
      ...updateData 
    } = body; 
    
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const role = await getUserRoleStrict(uid);
    const isAdmin = role === 'admin' || role === 'sadmin';

    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('property')
      .select('agentId')
      .eq('_id', targetId) 
      .single();

    if (checkError || !checkData) {
       return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (!isAdmin && checkData.agentId !== uid) {
       return NextResponse.json({ error: 'Forbidden. You do not own this property.' }, { status: 403 });
    }

    // FIX 1: Enforce lowercase status on update
    if (updateData.status) {
      updateData.status = updateData.status.toLowerCase();
    }
    
    // FIX 2: Keep type and category synchronized
    if (updateData.category) {
      updateData.type = updateData.category;
    }

    // FIX 3: Keep isForSale synchronized
    if (transactionType !== undefined) {
      updateData.isForSale = transactionType === 'Sale';
    }

    const { data, error } = await supabaseAdmin
      .from('property')
      .update({ 
        ...updateData, 
        // MAP TO LOWERCASE COLUMNS (only update them if they exist in the payload)
        transactiontype: transactionType !== undefined ? transactionType : undefined,
        rentaldetails: rentalDetails !== undefined ? rentalDetails : undefined,
        saledetails: saleDetails !== undefined ? saleDetails : undefined,
        virtualtoururl: virtualTourUrl !== undefined ? virtualTourUrl : undefined,
        floorplanurl: floorPlanUrl !== undefined ? floorPlanUrl : undefined,
        updatedAt: new Date().toISOString() 
      })
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

    const role = await getUserRoleStrict(uid);
    const isAdmin = role === 'admin' || role === 'sadmin';

    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('property')
      .select('agentId')
      .eq('_id', id)
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

  let amenities: string[] = [];
  if (Array.isArray(p.amenities)) {
    amenities = [...p.amenities];
  } else if (p.amenities && typeof p.amenities === 'object') {
    amenities = [
      ...(p.amenities.general || []), 
      ...(p.amenities.utilities || []), 
      ...(p.amenities.security || []),
      ...(p.amenities.parking || []),
      ...(p.amenities.kitchen || [])
    ];
  }

  const feats = p.features || {};
  const details = p.details || {};
  
  if ((p.isFurnished || feats.isFurnished || details.furnishing === 'Furnished') && !amenities.includes('Furnished')) amenities.push('Furnished');
  if ((p.hasPool || feats.hasPool) && !amenities.includes('Swimming Pool')) amenities.push('Swimming Pool');
  if ((p.hasParking || feats.hasParking || details.parkingSpaces > 0) && !amenities.includes('Parking')) amenities.push('Parking');

  const price = Number(p.price) || 0;
  const discountObj = p.discount || {};
  const discountPrice = Number(discountObj.originalPrice || p.discountPrice || p.discount_price) || 0;
  const hasValidDiscount = (discountObj.enabled === true || p.hasDiscount === true || p.has_discount === true) && discountPrice > 0;

  const locationObj = typeof p.location === 'object' && p.location !== null ? p.location : {};
  const contactObj = p.contact || {};
  
  // COMBINE READS: Look for both camelCase (legacy) and lowercase (new) database formats
  const rentalDetailsObj = p.rentalDetails || p.rentaldetails || {};
  const saleDetailsObj = p.saleDetails || p.saledetails || {};
  const transactionType = p.transactionType || p.transactiontype || (p.isForSale ? 'Sale' : 'Rent');

  return {
    id: p._id || p.id,
    slug: p.slug || null,
    title: p.title || p.name || 'Untitled Property',
    description: p.description || p.bio || p.details?.description || p.details || '',
    price: price,
    currency: p.currency || 'USD', 
    negotiable: p.negotiable || saleDetailsObj.negotiable || false, 
    discountPrice: hasValidDiscount ? discountPrice : 0,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discountPrice : price,
    isForSale: p.isForSale ?? p.is_for_sale ?? (transactionType === 'Sale'),
    status: p.status?.toLowerCase() || 'available', // Guarantee frontend receives lowercase
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    
    videoUrl: p.videoUrl || p.videourl || '', 
    virtualTourUrl: p.virtualTourUrl || p.virtualtoururl || '', 
    floorPlanUrl: p.floorPlanUrl || p.floorplanurl || '',
    
    location: {
      city: locationObj.city || p.city || 'Unknown City',
      area: locationObj.area || p.area || 'Unknown Area',
      gpsCoordinates: locationObj.gpsCoordinates || locationObj.coordinates || null,
      visibility: locationObj.visibility || 'Exact', 
    },
    
    bedrooms: Number(details.bedrooms || p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(details.bathrooms || p.bathrooms || feats.bathrooms || 0),
    area: Number(details.size || p.area || p.size || feats.size || 0),
    type: p.category || p.type || p.propertyType || 'House', // Guaranteed to be populated 
    
    tenantId: p.tenantId || rentalDetailsObj.tenantId || '',
    tenantName: p.tenantName || rentalDetailsObj.tenantName || '',
    tenantPhone: p.tenantPhone || rentalDetailsObj.tenantPhone || '',
    
    details: details,
    rentalDetails: rentalDetailsObj,
    saleDetails: saleDetailsObj,
    highlights: p.highlights || [],
    transactionType: transactionType,
    
    amenities: amenities,
    agentId: p.agentId || p.agent_id || '',
    agentName: contactObj.person || liveAgentData.agencyName || liveAgentData.businessName || liveAgentData.ownerName || liveAgentData.name || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.logoUrl || p.agentPhoto || null,
    agentPhone: finalVerifiedStatus ? (contactObj.phone || contactObj.whatsapp || p.contactPhone || liveAgentData.whatsappNumber || liveAgentData.phone || p.agentPhone) : null,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    
    featured: p.featured || p.isFeatured || false,
    boosted: p.boosted || false,
    createdAt: createdAt,
  };
}