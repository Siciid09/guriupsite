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

      const propertyData = propSnap.data();
      const agentId = propertyData?.agentId;
      let agentData = {};

      if (agentId) {
        const agentSnap = await getDoc(doc(db, 'users', agentId));
        if (agentSnap.exists()) {
          agentData = agentSnap.data();
        } else {
            const publicAgentSnap = await getDoc(doc(db, 'agents', agentId));
            if (publicAgentSnap.exists()) agentData = publicAgentSnap.data();
        }
      }

      return NextResponse.json(mergeAndNormalize(propSnap, agentData));
    }

    let collectionName = 'property';
    const collectionRef = collection(db, collectionName);
    const constraints: any[] = [limit(limitCount)];

    if (isFeatured) constraints.push(where('featured', '==', true));
    if (mode === 'buy') constraints.push(where('isForSale', '==', true));
    if (mode === 'rent') constraints.push(where('isForSale', '==', false));
    if (type && type !== 'Any Type') constraints.push(where('type', '==', type));
    if (city && city !== 'All Cities') constraints.push(where('location.city', '==', city));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const rawProperties = snapshot.docs;

    const agentIds = [...new Set(rawProperties.map(doc => doc.data()?.agentId).filter(Boolean))];
    const agentSnapshots = await Promise.all(
        agentIds.map(async (agentId) => {
            try { return await getDoc(doc(db, 'users', agentId)); } catch (e) { return null; }
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
      // Only hide if explicitly marked as true; preserves missing fields
      if (pData?.isArchived === true) return null;

      const liveAgent = (pData?.agentId && agentMap[pData.agentId]) ? agentMap[pData.agentId] : {}; 
      return mergeAndNormalize(propDoc, liveAgent);
    }).filter(Boolean);

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

  // FIXED: Logic strictly matches Flutter 'planTier == pro'
  const livePlan = liveAgentData.planTier || p.planTier || 'free';
  const isPlanVerified = (livePlan === 'pro'); 
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
    agentName: liveAgentData.name || liveAgentData.displayName || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.photoURL || p.agentPhoto || null,
    // FIXED: Phone priority matches App contactPhone
    agentPhone: p.contactPhone || liveAgentData.phone || liveAgentData.phoneNumber || p.agentPhone,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}