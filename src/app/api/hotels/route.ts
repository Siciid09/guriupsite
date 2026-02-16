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

  // --- 1. PARSE PARAMETERS ---
  const id = searchParams.get('id');
  const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
  const isFeatured = searchParams.get('featured') === 'true';
  const city = searchParams.get('city');

  try {
    // --- CASE A: SINGLE HOTEL DETAILS ---
    if (id) {
      const docRef = doc(db, 'hotels', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Fetch the Hotel Admin (User) to check for PRO status
      const hotelData = docSnap.data();
      const adminId = hotelData.hotelAdminId;
      let adminData = {};

      if (adminId) {
        const adminSnap = await getDoc(doc(db, 'users', adminId));
        if (adminSnap.exists()) adminData = adminSnap.data();
      }

      return NextResponse.json(mergeAndNormalizeHotel(docSnap, adminData));
    }

    // --- CASE B: LIST HOTELS ---
    const collectionRef = collection(db, 'hotels');
    const constraints: any[] = [
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];

    if (isFeatured) constraints.push(where('featured', '==', true));
    if (city && city !== 'All Cities') constraints.push(where('location.city', '==', city));

    // Execute Query
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    
    const rawHotels = snapshot.docs;

    // --- DATA JOINING: FETCH ADMINS ---
    const adminIds = [...new Set(rawHotels.map(doc => doc.data().hotelAdminId).filter(Boolean))];

    const adminPromises = adminIds.map(id => getDoc(doc(db, 'users', id)));
    const adminSnapshots = await Promise.all(adminPromises);

    const adminMap: Record<string, any> = {};
    adminSnapshots.forEach(snap => {
      if (snap.exists()) adminMap[snap.id] = snap.data();
    });

    // --- MERGE & NORMALIZE ---
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

// --- HELPER: HOTEL NORMALIZER ---
function mergeAndNormalizeHotel(hotelDoc: DocumentSnapshot, liveAdminData: any) {
  const h = hotelDoc.data()!;

  // 1. Amenities Normalization
  // Handles legacy Map (boolean) vs new List (string)
  let amenitiesList: string[] = [];
  const rawAm = h.amenities;

  if (Array.isArray(rawAm)) {
    amenitiesList = rawAm; 
  } else if (typeof rawAm === 'object' && rawAm !== null) {
    if (rawAm.hasWifi) amenitiesList.push('Wi-Fi');
    if (rawAm.hasPool) amenitiesList.push('Swimming Pool');
    if (rawAm.hasGym) amenitiesList.push('Gym');
    if (rawAm.hasRestaurant) amenitiesList.push('Restaurant');
    if (rawAm.hasParking) amenitiesList.push('Parking');
    if (rawAm.hasAC || rawAm.hasAirConditioning) amenitiesList.push('Air Conditioning');
    if (rawAm.hasBar) amenitiesList.push('Bar');
    if (rawAm.hasSpa) amenitiesList.push('Spa');
  }

  // 2. Plan/Pro Logic (The "Live" Check)
  // The User's plan determines if the hotel is "Pro"
  const plan = liveAdminData.planTier || h.planTier || h.planTierAtUpload || 'free';
  const isPro = plan === 'pro' || plan === 'premium';

  // 3. Price Logic
  const price = Number(h.pricePerNight) || 0;
  const discount = Number(h.discountPrice) || 0;
  const hasDiscount = h.hasDiscount && discount > 0 && discount < price;

  // 4. Date
  let createdAt = new Date().toISOString();
  if (h.createdAt?.toDate) {
    createdAt = h.createdAt.toDate().toISOString();
  }

  return {
    id: hotelDoc.id,
    name: h.name || 'Untitled Hotel',
    description: h.description || '',
    
    // Pricing
    pricePerNight: hasDiscount ? discount : price,
    originalPrice: price,
    hasDiscount: hasDiscount,
    displayPrice: hasDiscount ? discount : price,

    // Visuals
    images: h.images?.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Image'],
    rating: Number(h.rating) || 0,

    // Location
    location: {
      city: h.location?.city || h.city || 'Unknown City',
      area: h.location?.area || h.area || 'Unknown Area',
      lat: h.location?.coordinates?._lat || null,
      lng: h.location?.coordinates?._long || null,
    },

    // Features
    amenities: amenitiesList,
    
    // Logic
    planTier: plan,
    isPro: isPro,
    featured: h.featured || false,
    
    // Admin Info
    hotelAdminId: h.hotelAdminId || '',
    contactPhone: liveAdminData.phone || liveAdminData.phoneNumber || h.phone || '',
    
    createdAt: createdAt,
  };
}