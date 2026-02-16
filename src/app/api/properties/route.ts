import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy, 
  doc, 
  getDoc, 
  DocumentSnapshot 
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // --- 1. PARSE PARAMETERS ---
    const id = searchParams.get('id');
    const limitParam = searchParams.get('limit');
    const limitCount = limitParam ? parseInt(limitParam) : 50;
    const isFeatured = searchParams.get('featured') === 'true';
    const mode = searchParams.get('mode'); // 'buy' | 'rent'
    const type = searchParams.get('type');
    const city = searchParams.get('city');

    // --- CASE A: SINGLE PROPERTY DETAILS ---
    if (id) {
      const propRef = doc(db, 'property', id);
      const propSnap = await getDoc(propRef);

      if (!propSnap.exists()) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }

      const propertyData = propSnap.data();
      const agentId = propertyData?.agentId;
      let agentData = {};

      if (agentId) {
        // Try getting agent from 'users', fallback to 'agents'
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

    // --- CASE B: LIST PROPERTIES ---
    const collectionRef = collection(db, 'property');
    const constraints: any[] = [
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
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

    // --- DATA JOINING: FETCH AGENTS EFFICIENTLY ---
    const agentIds = [...new Set(rawProperties.map(doc => doc.data()?.agentId).filter(Boolean))];

    // Fetch agents in parallel (handle potential failures gracefully)
    const agentSnapshots = await Promise.all(
        agentIds.map(async (agentId) => {
            try {
                return await getDoc(doc(db, 'users', agentId));
            } catch (e) {
                return null;
            }
        })
    );

    const agentMap: Record<string, any> = {};
    agentSnapshots.forEach(snap => {
      if (snap && snap.exists()) {
        agentMap[snap.id] = snap.data();
      }
    });

    // --- MERGE & NORMALIZE ---
    const mergedData = rawProperties.map(propDoc => {
      try {
        const pData = propDoc.data();
        const liveAgent = agentMap[pData?.agentId] || {}; 
        return mergeAndNormalize(propDoc, liveAgent);
      } catch (err) {
        console.error("Error normalizing property:", propDoc.id, err);
        return null; // Skip bad data
      }
    }).filter(Boolean); // Remove nulls

    return NextResponse.json(mergedData);

  } catch (error: any) {
    console.error('Properties API Critical Error:', error);
    // Return the actual error message for debugging
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// --- HELPER: THE ULTIMATE NORMALIZER ---
function mergeAndNormalize(propDoc: DocumentSnapshot, liveAgentData: any) {
  const p = propDoc.data() || {};
  
  // 1. Safe Date Handling (Defensive)
  let createdAt = new Date().toISOString();
  if (p.createdAt && typeof p.createdAt.toDate === 'function') {
    createdAt = p.createdAt.toDate().toISOString();
  } else if (p.createdAt) {
     // Handle string or number timestamps if necessary
     createdAt = new Date(p.createdAt).toISOString();
  }

  // 2. Amenities (Defensive)
  const amenities: string[] = [];
  const feats = p.features || {};

  if (p.isFurnished || feats.isFurnished) amenities.push('Furnished');
  if (p.hasGarden || feats.hasGarden) amenities.push('Garden');
  if (p.hasPool || feats.hasPool) amenities.push('Swimming Pool');
  if (p.hasBalcony || feats.hasBalcony) amenities.push('Balcony');
  if (p.hasGym || feats.hasGym) amenities.push('Gym');
  if (p.hasParking || feats.hasParking) amenities.push('Parking');
  if (p.hasAirConditioning || feats.hasAirConditioning) amenities.push('AC');
  if (p.hasSecurity || feats.hasSecurity) amenities.push('Security');
  if (p.hasElevators || feats.hasElevators) amenities.push('Elevator');
  if (p.hasMeetingRoom || feats.hasMeetingRoom) amenities.push('Meeting Room');
  if (p.hasInternet || feats.hasInternet) amenities.push('Internet');
  if (p.waterAvailable || feats.waterAvailable) amenities.push('Water Available');

  // 3. Price (Defensive)
  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice) || 0;
  const hasValidDiscount = (p.hasDiscount === true) && discountPrice > 0 && discountPrice < price;

  // 4. Agent Verification (Defensive)
  const livePlan = liveAgentData.planTier || p.planTier || 'free';
  const isAgentVerified = (liveAgentData.isVerified === true) || (livePlan === 'pro') || (livePlan === 'premium') || (p.agentVerified === true);

  return {
    id: propDoc.id,
    title: p.title || 'Untitled Property',
    description: p.description || '',
    
    // Pricing
    price: price,
    discountPrice: hasValidDiscount ? discountPrice : 0,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discountPrice : price,
    isForSale: p.isForSale ?? true,
    status: p.status || 'available',

    // Visuals
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    videoUrl: p.videoUrl || null,

    // Location (Safe Access)
    location: {
      city: p.location?.city || 'Unknown City',
      area: p.location?.area || 'Unknown Area',
      address: p.location?.address || '',
      lat: p.location?.lat || null,
      lng: p.location?.lng || null,
    },

    // Specs
    bedrooms: Number(p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(p.bathrooms || feats.bathrooms || 0),
    area: Number(p.area || p.size || feats.size || 0),
    type: p.type || 'House',
    amenities: amenities,

    // Agent
    agentId: p.agentId || '',
    agentName: liveAgentData.name || liveAgentData.displayName || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.photoURL || p.agentPhoto || null,
    agentPhone: liveAgentData.phone || liveAgentData.phoneNumber || p.contactPhone || p.agentPhone,
    agentVerified: isAgentVerified,
    agentPlanTier: livePlan,

    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}