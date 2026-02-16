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

    // --- SINGLE PROPERTY FETCH ---
    if (id) {
      let propRef = doc(db, 'property', id);
      let propSnap = await getDoc(propRef);

      if (!propSnap.exists()) {
        propRef = doc(db, 'properties', id); // Fallback collection
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
            // Try 'agents' collection if not in 'users'
            const publicAgentSnap = await getDoc(doc(db, 'agents', agentId));
            if (publicAgentSnap.exists()) agentData = publicAgentSnap.data();
        }
      }

      return NextResponse.json(mergeAndNormalize(propSnap, agentData));
    }

    // --- LIST FETCH ---
    let collectionName = 'property';
    const collectionRef = collection(db, collectionName);
    
    // Build Query Constraints
    const constraints: any[] = [limit(limitCount)];

    // 1. Filter by Featured
    if (isFeatured) constraints.push(where('featured', '==', true));

    // 2. Filter by Mode (Buy/Rent)
    if (mode === 'buy') constraints.push(where('isForSale', '==', true));
    if (mode === 'rent') constraints.push(where('isForSale', '==', false));

    // 3. Filter by Type & City
    if (type && type !== 'Any Type') constraints.push(where('type', '==', type));
    if (city && city !== 'All Cities') constraints.push(where('location.city', '==', city));

    // Execute Query
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const rawProperties = snapshot.docs;

    // Batch Fetch Agent Data
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

    // Merge Data
    const mergedData = rawProperties.map(propDoc => {
      const pData = propDoc.data();
      // Hide archived properties
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

// --- NORMALIZATION HELPER ---
function mergeAndNormalize(propDoc: DocumentSnapshot, liveAgentData: any) {
  const p = propDoc.data() || {};
  
  // 1. Dates
  let createdAt = new Date().toISOString();
  if (p.createdAt && typeof p.createdAt.toDate === 'function') {
    createdAt = p.createdAt.toDate().toISOString();
  }

  // 2. Features & Amenities Extraction
  const feats = p.features || {};
  const amenities: string[] = [];

  // --- CORE AMENITIES ---
  if (p.isFurnished || feats.isFurnished) amenities.push('Furnished');
  if (p.hasPool || feats.hasPool) amenities.push('Pool');
  if (p.hasParking || feats.hasParking) amenities.push('Parking');
  if (p.hasGarden || feats.hasGarden) amenities.push('Garden');
  if (p.hasBalcony || feats.hasBalcony) amenities.push('Balcony');
  
  // --- UTILITIES ---
  if (feats.hasGenerator) amenities.push('Generator');
  if (feats.waterAvailable) amenities.push('Water Available');
  if (feats.hasInternet) amenities.push('Internet');
 if (feats.hasAirConditioning || feats.hasAC) amenities.push('AC'); // ✅ AC Naming 
  
  // --- SECURITY & ACCESS ---
  if (feats.hasSecurity) amenities.push('Security');
  if (feats.hasGate) amenities.push('Gate');
  if (feats.hasFence) amenities.push('Fence');
  if (feats.hasElevators) amenities.push('Elevator');
  if (feats.roadAccess == 'Paved') amenities.push('Paved Road');

  // --- COMMERCIAL / SPECIAL ---
  if (feats.hasMeetingRoom) amenities.push('Meeting Room');
  if (feats.hasShopfront) amenities.push('Shopfront');
  if (feats.hasStorage) amenities.push('Storage');
  if (feats.hasFoodCourt) amenities.push('Food Court');
  if (feats.hasGym) amenities.push('Gym');

  // 3. Pricing Logic (STRICT)
  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice) || 0;
  // Valid Discount: Must be active AND strictly less than original price
  const hasValidDiscount = (p.hasDiscount === true) && (discountPrice > 0) && (discountPrice < price);

  // 4. Plan Tier Logic (STRICT SOURCE OF TRUTH)
  // Priority: Document Snapshot (Historic) -> Live Agent (Current) -> Free
  const planTier = p.planTierAtUpload || p.planTier || liveAgentData.planTier || 'free';
  const isPro = planTier === 'pro' || planTier === 'premium';

  // 5. Verification Logic
  const isManualVerified = (liveAgentData.isVerified === true) || (p.agentVerified === true);
  const finalVerifiedStatus = isPro || isManualVerified;

  // 6. Coordinates Normalization
  let coords = null;
  if (p.location?.coordinates) {
    // If it's a Firestore GeoPoint
    if (typeof p.location.coordinates.latitude === 'number') {
        coords = { 
            lat: p.location.coordinates.latitude, 
            lng: p.location.coordinates.longitude 
        };
    } 
    // If it's a Map/Object
    else if (p.location.coordinates.lat) {
        coords = p.location.coordinates;
    }
  }

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
    
    // Media
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    videoUrl: p.videoUrl || null, // ADDED VIDEO URL
    
    // Location
    location: {
      city: p.location?.city || 'Unknown City',
      area: p.location?.area || 'Unknown Area',
      coordinates: coords,
    },

    // Specs
    bedrooms: Number(p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(p.bathrooms || feats.bathrooms || 0),
    area: Number(p.area || p.size || feats.size || 0), // Normalized size
    type: p.type || 'House',
    amenities: amenities,

    // Commercial Specifics (ADDED)
    shopCount: Number(p.shopCount || feats.shopCount || 0),
    workspaceArea: Number(p.workspaceArea || feats.workspaceArea || 0),
    seatingCapacity: Number(p.seatingCapacity || feats.seatingCapacity || 0),

    // Agent Info
    agentId: p.agentId || '',
    agentName: liveAgentData.agencyName || liveAgentData.name || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.photoURL || p.agentPhoto || null,
    agentPhone: p.contactPhone || liveAgentData.phone || liveAgentData.phoneNumber || p.agentPhone,
    
    // Status Flags
    agentVerified: finalVerifiedStatus,
    planTier: planTier,
    featured: p.featured || p.isFeatured || false,
    
    createdAt: createdAt,
  };
}