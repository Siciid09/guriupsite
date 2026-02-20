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
    // Ensure we fetch enough to account for memory filtering
    const limitCount = limitParam ? parseInt(limitParam) : 100;
    const isFeatured = searchParams.get('featured') === 'true';
    const mode = searchParams.get('mode'); 
    const type = searchParams.get('type');
    const city = searchParams.get('city');

    // =========================================================
    // 1. SINGLE PROPERTY FETCH
    // =========================================================
  // =========================================================
    // 1. SINGLE PROPERTY FETCH (Dual Lookup: Slug -> ID)
    // =========================================================
    if (id) {
      let propSnap: any = null;
      let pData: any = null;

      // PRIORITY 1: Search by Slug
      const slugQuery = query(collection(db, 'property'), where('slug', '==', id), limit(1));
      const slugDocs = await getDocs(slugQuery);

      if (!slugDocs.empty) {
        propSnap = slugDocs.docs[0];
        pData = propSnap.data();
      } else {
        // PRIORITY 2: Fallback to direct ID fetch
        propSnap = await getDoc(doc(db, 'property', id));
        if (propSnap.exists()) pData = propSnap.data();
      }
      
      if (!pData) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      const isPublic = pData?.isArchived === false && ['available', 'rented_out'].includes(pData?.status);
      
      if (!isPublic) {
        return NextResponse.json({ error: 'Property is currently private' }, { status: 403 });
      }

      const agentSnap = await getDoc(doc(db, 'agents', pData.agentId));
      const agentData = agentSnap.exists() ? agentSnap.data() : {};
      
      return NextResponse.json(mergeAndNormalize(propSnap, agentData));
    }

    // =========================================================
    // 2. SEARCH LIST FETCH
    // =========================================================
    const collectionRef = collection(db, 'property');
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

    const snapshot = await getDocs(query(collectionRef, ...constraints));
    const rawProperties = snapshot.docs;

    // Batch fetch agents to verify planTier
    const agentIds = [...new Set(rawProperties.map(doc => doc.data()?.agentId).filter(Boolean))];
    const agentMap: Record<string, any> = {};

    await Promise.all(agentIds.map(async (agentId) => {
      const aSnap = await getDoc(doc(db, 'agents', agentId));
      if (aSnap.exists()) {
        agentMap[agentId] = aSnap.data();
      } else {
        const uSnap = await getDoc(doc(db, 'users', agentId));
        if (uSnap.exists()) agentMap[agentId] = uSnap.data();
      }
    }));

    let mergedData = rawProperties.map(propDoc => {
      const pData = propDoc.data();
      const liveAgent = (pData?.agentId && agentMap[pData.agentId]) ? agentMap[pData.agentId] : {}; 
      return mergeAndNormalize(propDoc, liveAgent);
    });

    // BUSINESS LOGIC: Only allow "Pro" or "Premium" in the featured list
    if (isFeatured) {
      mergedData = mergedData.filter(p => p.agentPlanTier === 'pro' || p.agentPlanTier === 'premium');
    }

    return NextResponse.json(mergedData);

  } catch (error: any) {
    console.error('Properties API Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

function mergeAndNormalize(propDoc: DocumentSnapshot, liveAgentData: any) {
  const p = propDoc.data() || {};
  
  const livePlan = (liveAgentData.planTier || p.planTier || 'free').toLowerCase();
  const isVerified = (livePlan === 'pro' || livePlan === 'premium'); 
  const isManualVerified = (liveAgentData.isVerified === true) || (p.agentVerified === true);
  const finalVerifiedStatus = isVerified || isManualVerified;

  let createdAt = new Date().toISOString();
  if (p.createdAt?.toDate) createdAt = p.createdAt.toDate().toISOString();

  const amenities: string[] = [];
  const feats = p.features || {};
  if (p.isFurnished || feats.isFurnished) amenities.push('Furnished');
  if (p.hasPool || feats.hasPool) amenities.push('Swimming Pool');
  if (p.hasParking || feats.hasParking) amenities.push('Parking');

  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice) || 0;
  const hasValidDiscount = (p.hasDiscount === true) && discountPrice > 0;

 return {
    id: propDoc.id,
    slug: p.slug || null,
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
    agentName: liveAgentData.businessName || liveAgentData.name || liveAgentData.displayName || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.logoUrl || liveAgentData.profileImageUrl || liveAgentData.photoURL || p.agentPhoto || null,
    agentPhone: finalVerifiedStatus ? (p.contactPhone || liveAgentData.whatsappNumber || liveAgentData.phone || p.agentPhone) : null,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}