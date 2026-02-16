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
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
  const isFeatured = searchParams.get('featured') === 'true';
  const city = searchParams.get('city');

  try {
    // --- SINGLE HOTEL FETCH ---
    if (id) {
      const docRef = doc(db, 'hotels', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      const hotelData = docSnap.data();
      const adminId = hotelData.hotelAdminId;
      let adminData = {};

      if (adminId) {
        const adminSnap = await getDoc(doc(db, 'users', adminId));
        if (adminSnap.exists()) adminData = adminSnap.data();
      }

      return NextResponse.json(mergeAndNormalizeHotel(docSnap, adminData));
    }

    // --- LIST FETCH ---
    const collectionRef = collection(db, 'hotels');
    const constraints: any[] = [orderBy('createdAt', 'desc'), limit(limitCount)];

    if (isFeatured) constraints.push(where('featured', '==', true));
    if (city && city !== 'All Cities') constraints.push(where('location.city', '==', city));

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const rawHotels = snapshot.docs;

    // Batch Fetch Admin Data
    const adminIds = [...new Set(rawHotels.map(doc => doc.data().hotelAdminId).filter(Boolean))];
    const adminSnapshots = await Promise.all(adminIds.map(id => getDoc(doc(db, 'users', id))));

    const adminMap: Record<string, any> = {};
    adminSnapshots.forEach(snap => {
      if (snap.exists()) adminMap[snap.id] = snap.data();
    });

    const mergedData = rawHotels.map(hotelDoc => {
      const hData = hotelDoc.data();
      const liveAdmin = adminMap[hData.hotelAdminId] || {};
      return mergeAndNormalizeHotel(hotelDoc, liveAdmin);
    });

    return NextResponse.json(mergedData);

  } catch (error) {
    console.error('Hotels API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// --- NORMALIZATION HELPER ---
function mergeAndNormalizeHotel(hotelDoc: DocumentSnapshot, liveAdminData: any) {
  const h = hotelDoc.data()!;

  // 1. Amenities Normalization (Matches UI Constants)
  let amenitiesList: string[] = [];
  const rawAm = h.amenities || {};
  
  // Handle Map-based amenities (Standard App Format)
  if (typeof rawAm === 'object' && !Array.isArray(rawAm)) {
    if (rawAm.hasWifi) amenitiesList.push('Wi-Fi'); // Matches UI 'Wi-Fi'
    if (rawAm.hasPool) amenitiesList.push('Swimming Pool'); // Matches UI 'Swimming Pool'
    if (rawAm.hasGym) amenitiesList.push('Gym');
    if (rawAm.hasRestaurant) amenitiesList.push('Restaurant');
    if (rawAm.hasParking) amenitiesList.push('Parking');
    // Check both keys for AC
    if (rawAm.hasAC || rawAm.hasAirConditioning) amenitiesList.push('Air Conditioning');
  } 
  // Handle Legacy Array
  else if (Array.isArray(rawAm)) {
    amenitiesList = rawAm; 
  }

  // 2. Plan Tier Logic (STRICT)
  // Prioritize document snapshot to prevent subscription expiry breaking old listings
  const plan = h.planTierAtUpload || h.planTier || liveAdminData.planTier || 'free';
  const isPro = plan === 'pro' || plan === 'premium';

  // 3. Pricing & Discount Logic
  const price = Number(h.pricePerNight) || 0;
  const discount = Number(h.discountPrice) || 0;
  // Valid Discount: Must be active AND strictly less than original price
  const hasValidDiscount = (h.hasDiscount === true) && (discount > 0) && (discount < price);

  // 4. Coordinates Normalization
  let coords = null;
  if (h.location?.coordinates) {
    if (typeof h.location.coordinates.latitude === 'number') {
        coords = { 
            lat: h.location.coordinates.latitude, 
            lng: h.location.coordinates.longitude 
        };
    }
  }

  // 5. Date Normalization
  let createdAt = new Date().toISOString();
  if (h.createdAt?.toDate) {
    createdAt = h.createdAt.toDate().toISOString();
  }

  return {
    id: hotelDoc.id,
    name: h.name || 'Untitled Hotel',
    description: h.description || '',
    
    // Pricing
    pricePerNight: hasValidDiscount ? discount : price,
    originalPrice: price,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discount : price,
    
    // Media
    images: h.images?.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Image'],
    rating: Number(h.rating) || 0,
    
    // Location
    location: {
      city: h.location?.city || h.city || 'Unknown City',
      area: h.location?.area || h.area || 'Unknown Area',
      coordinates: coords,
    },
    
    // Metadata
    amenities: amenitiesList,
    planTier: plan,
    isPro: isPro,
    featured: h.featured || false,
    
    // Contact
    contactPhone: liveAdminData.phone || liveAdminData.phoneNumber || h.phone || '',
    hotelAdminId: h.hotelAdminId || '',
    
    createdAt: createdAt,
  };
}