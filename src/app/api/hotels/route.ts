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
    // =========================================================
    // 1. SINGLE HOTEL FETCH (WITH PRIVACY GUARD)
    // =========================================================
    if (id) {
      const docRef = doc(db, 'hotels', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      const hData = docSnap.data();

      // FIX: Block direct access to Archived or Inactive hotels
      const isPublic = hData?.isArchived === false && hData?.status === 'available';
      if (!isPublic) {
         return NextResponse.json({ error: 'This hotel is currently unavailable' }, { status: 403 });
      }

      const adminId = hData.hotelAdminId;
      let adminData = {};

      if (adminId) {
        // Business-First priority
        const businessSnap = await getDoc(doc(db, 'hotels', adminId));
        if (businessSnap.exists()) {
          adminData = businessSnap.data();
        } else {
          const userSnap = await getDoc(doc(db, 'users', adminId));
          if (userSnap.exists()) adminData = userSnap.data();
        }
      }

      return NextResponse.json(mergeAndNormalizeHotel(docSnap, adminData));
    }

    // =========================================================
    // 2. HOTEL LIST FETCH (NOW WITH FULL PRIVACY FILTERS)
    // =========================================================
    const collectionRef = collection(db, 'hotels');
    
    // FIX: Archive & Status filters added to match mobile strictness
    const constraints: any[] = [
      where('isArchived', '==', false),
      where('status', '==', 'available'),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    ];

    // Auto-Featured based on Paid Tiers
    if (isFeatured) {
      constraints.push(where('planTier', 'in', ['pro', 'premium']));
    }
    
    if (city && city !== 'All Cities') {
      constraints.push(where('location.city', '==', city));
    }

    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const rawHotels = snapshot.docs;

    const adminIds = [...new Set(rawHotels.map(doc => doc.data().hotelAdminId).filter(Boolean))];
    
    // Batch fetch admin/business data
    const adminSnapshots = await Promise.all(adminIds.map(async (adminId) => {
      const bSnap = await getDoc(doc(db, 'hotels', adminId));
      if (bSnap.exists()) return bSnap;
      return await getDoc(doc(db, 'users', adminId));
    }));

    const adminMap: Record<string, any> = {};
    adminSnapshots.forEach(snap => {
      if (snap.exists()) adminMap[snap.id] = snap.data();
    });

    const mergedData = rawHotels.map(hotelDoc => {
      const liveAdmin = adminMap[hotelDoc.data().hotelAdminId] || {};
      return mergeAndNormalizeHotel(hotelDoc, liveAdmin);
    });

    return NextResponse.json(mergedData);

  } catch (error) {
    console.error('Hotels API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function mergeAndNormalizeHotel(hotelDoc: DocumentSnapshot, liveAdminData: any) {
  const h = hotelDoc.data()!;

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
    if (rawAm.hasAC) amenitiesList.push('Air Conditioning');
  }

  // Verification Alignment
  const plan = liveAdminData.planTier || h.planTier || 'free';
  const isVerified = plan === 'pro' || plan === 'premium';

  const price = Number(h.pricePerNight) || 0;
  const discount = Number(h.discountPrice) || 0;
  const hasDiscount = h.hasDiscount && discount > 0;

  let createdAt = new Date().toISOString();
  if (h.createdAt?.toDate) {
    createdAt = h.createdAt.toDate().toISOString();
  }

  return {
    id: hotelDoc.id,
    name: h.name || 'Untitled Hotel',
    pricePerNight: hasDiscount ? discount : price,
    originalPrice: price,
    hasDiscount: hasDiscount,
    displayPrice: hasDiscount ? discount : price,
    images: h.images?.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Image'],
    rating: Number(h.rating) || 0,
    location: {
      city: h.location?.city || h.city || 'Unknown City',
      area: h.location?.area || h.area || 'Unknown Area',
    },
    amenities: amenitiesList,
    planTier: plan,
    isPro: isVerified,
    featured: isVerified || h.featured || false,
    // Locked Features
    contactPhone: isVerified ? (liveAdminData.whatsappNumber || liveAdminData.phone || liveAdminData.phoneNumber || h.phone || '') : null,
    createdAt: createdAt,
  };
}