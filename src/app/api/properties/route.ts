import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  doc, 
  getDoc, 
  DocumentSnapshot 
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) + 5 : 55;
    const isFeatured = searchParams.get('featured') === 'true';
    const mode = searchParams.get('mode'); 
    const type = searchParams.get('type');
    const city = searchParams.get('city');

    // =========================================================
    // 1. SINGLE PROPERTY FETCH (WITH STRICT FILTERS)
    // =========================================================
    if (id) {
      let propRef = doc(db, 'property', id);
      let propSnap = await getDoc(propRef);

      if (!propSnap.exists()) {
        propRef = doc(db, 'properties', id);
        propSnap = await getDoc(propRef);
      }

      if (!propSnap.exists()) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      const pData = propSnap.data();

      // FIX PROBLEM A: Block drafts or archived items from appearing via direct URL
      const isPublic = pData?.isArchived === false && ['available', 'rented_out'].includes(pData?.status);
      if (!isPublic) {
         return NextResponse.json({ error: 'Property is currently private' }, { status: 403 });
      }

      const agentId = pData?.agentId;
      let agentData = {};

      if (agentId) {
        // FIX PROBLEM B: Check 'agents' collection FIRST (Business Source)
        const agentSnap = await getDoc(doc(db, 'agents', agentId));
        if (agentSnap.exists()) {
          agentData = agentSnap.data();
        } else {
            // Fallback to 'users' (Auth Source)
            const userSnap = await getDoc(doc(db, 'users', agentId));
            if (userSnap.exists()) agentData = userSnap.data();
        }
      }

      return NextResponse.json(mergeAndNormalize(propSnap, agentData));
    }

    // =========================================================
    // 2. SEARCH LIST FETCH (WITH GLOBAL FILTERS)
    // =========================================================
    const collectionRef = collection(db, 'property');
    
    // FIX PROBLEM A: Apply hard constraints to exclude Drafts/Archived
    const constraints: any[] = [
      where('isArchived', '==', false),
      where('status', 'in', ['available', 'rented_out']),
      limit(limitCount)
    ];

    if (isFeatured) constraints.push(where('featured', '==', true));
    if (mode === 'buy') constraints.push(where('isForSale', '==', true));
    if (mode === 'rent') constraints.push(where('isForSale', '==', false));
    if (type && type !== 'Any Type') constraints.push(where('type', '==', type));
    if (city && city !== 'All Cities') constraints.push(where('location.city', '==', city));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const rawProperties = snapshot.docs;

    const agentIds = [...new Set(rawProperties.map(doc => doc.data()?.agentId).filter(Boolean))];
    
    // FIX PROBLEM B: Batch fetch agents with Business-First priority
    const agentSnapshots = await Promise.all(
        agentIds.map(async (agentId) => {
            try { 
              const aSnap = await getDoc(doc(db, 'agents', agentId));
              if (aSnap.exists()) return aSnap;
              return await getDoc(doc(db, 'users', agentId)); 
            } catch (e) { return null; }
        })
    );

    const agentMap: Record<string, any> = {};
    agentSnapshots.forEach(snap => {
      if (snap && snap.exists()) {
        agentMap[snap.id] = snap.data();
      }
    });

    const mergedData = rawProperties.map(propDoc => {
      const pData = propDoc.data();
      const liveAgent = (pData?.agentId && agentMap[pData.agentId]) ? agentMap[pData.agentId] : {}; 
      return mergeAndNormalize(propDoc, liveAgent);
    });

    return NextResponse.json(mergedData);

  } catch (error: any) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

function mergeAndNormalize(propDoc: DocumentSnapshot, liveAgentData: any) {
  const p = propDoc.data() || {};
  
  let createdAt = new Date().toISOString();
  if (p.createdAt && typeof p.createdAt.toDate === 'function') {
    createdAt = p.createdAt.toDate().toISOString();
  }

  const amenities: string[] = [];
  const feats = p.features || {};
  if (p.isFurnished || feats.isFurnished) amenities.push('Furnished');
  if (p.hasPool || feats.hasPool) amenities.push('Swimming Pool');
  if (p.hasParking || feats.hasParking) amenities.push('Parking');

  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice) || 0;
  const hasValidDiscount = (p.hasDiscount === true) && discountPrice > 0;

  // VERIFICATION LOGIC: Prioritize Live Plan status over static document booleans
  const livePlan = liveAgentData.planTier || p.planTier || 'free';
  const isPlanVerified = (livePlan === 'pro' || livePlan === 'premium'); 
  const isManualVerified = (liveAgentData.isVerified === true) || (p.agentVerified === true);
  const finalVerifiedStatus = isPlanVerified || isManualVerified;

  return {
    id: propDoc.id,
    title: p.title || 'Untitled Property',
    price: price,
    discountPrice: hasValidDiscount ? discountPrice : 0,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discountPrice : price,
    isForSale: p.isForSale ?? true,
    status: p.status || 'available',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    location: {
      city: p.location?.city || 'Unknown City',
      area: p.location?.area || 'Unknown Area',
    },
    bedrooms: Number(p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(p.bathrooms || feats.bathrooms || 0),
    area: Number(p.area || p.size || feats.size || 0),
    type: p.type || 'House',
    amenities: amenities,
    agentId: p.agentId || '',
    // Business data priority
    agentName: liveAgentData.businessName || liveAgentData.name || liveAgentData.displayName || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.logoUrl || liveAgentData.profileImageUrl || liveAgentData.photoURL || p.agentPhoto || null,
    agentPhone: finalVerifiedStatus ? (p.contactPhone || liveAgentData.whatsappNumber || liveAgentData.phone || liveAgentData.phoneNumber || p.agentPhone) : null,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}