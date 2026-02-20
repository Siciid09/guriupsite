import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase'; 
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  DocumentSnapshot
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// ==================================================================
// 1. SHARED LOGIC (RELAXED FILTERING)
// ==================================================================
export async function getHotelsDataInternal(options: {
  limitCount?: number;
  isFeatured?: boolean; 
  city?: string | null;
  id?: string | null;
}) {
  const { limitCount = 50, isFeatured = false, city, id } = options;

  try {
    // --- SCENARIO A: SINGLE ID FETCH ---
    if (id) {
      const docRef = doc(db, 'hotels', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null; 
      
      // Only block if explicitly archived/banned
      const data = docSnap.data();
      if (data?.isArchived === true || data?.status === 'banned') return null;

      return await fetchAdminAndMerge(docSnap);
    }

    // --- SCENARIO B: LIST FETCH ---
    const collectionRef = collection(db, 'hotels');
    const snapshot = await getDocs(collectionRef);
    const rawDocs = snapshot.docs;

    // Filter in Memory
    let filteredDocs = rawDocs.filter(doc => {
      const data = doc.data();
      
      // 1. ARCHIVE/BAN CHECK (The Blocklist)
      // We show everything EXCEPT banned or archived items.
      // This allows 'draft', 'pending', or missing status to still appear.
      if (data.isArchived === true) return false;
      if (data.status === 'banned') return false;
      if (data.status === 'archived') return false;

      // 2. CITY CHECK
      if (city && city !== 'All Cities') {
        const docCity = data.location?.city || data.city;
        if (docCity !== city) return false;
      }

      // 3. RECOMMENDED CHECK (STRICT PRO/PREMIUM)
      if (isFeatured) {
        // Must be explicitly Pro or Premium
        const tier = (data.planTier || data.planTierAtUpload || 'free').toLowerCase();
        if (tier !== 'pro' && tier !== 'premium') return false;
      }

      return true;
    });

    // Sort: Verified/Pro First, then Newest
    filteredDocs.sort((a, b) => {
      const tierA = (a.data().planTier || 'free').toLowerCase();
      const tierB = (b.data().planTier || 'free').toLowerCase();
      
      const isAPro = tierA === 'pro' || tierA === 'premium';
      const isBPro = tierB === 'pro' || tierB === 'premium';

      if (isAPro && !isBPro) return -1;
      if (!isAPro && isBPro) return 1;

      // Date Sort (Handle missing dates safely)
      const dateA = a.data().createdAt?.toDate ? a.data().createdAt.toDate().getTime() : 0;
      const dateB = b.data().createdAt?.toDate ? b.data().createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });

    // Apply Limit
    if (limitCount && filteredDocs.length > limitCount) {
      filteredDocs = filteredDocs.slice(0, limitCount);
    }

    // Batch Fetch Admin Data
    const adminIds = [...new Set(filteredDocs.map(d => d.data().hotelAdminId).filter(Boolean))];
    const adminMap = await fetchAdminsBatch(adminIds);

    return filteredDocs.map(hotelDoc => {
      const liveAdmin = adminMap[hotelDoc.data().hotelAdminId] || {};
      return mergeAndNormalizeHotel(hotelDoc, liveAdmin);
    });

  } catch (error) {
    console.error('Internal Data Error:', error);
    return []; 
  }
}

// --- HELPER: Batch Fetch Admins ---
async function fetchAdminsBatch(adminIds: string[]) {
  const adminMap: Record<string, any> = {};
  if (adminIds.length === 0) return adminMap;

  await Promise.all(adminIds.map(async (adminId) => {
    let snap = await getDoc(doc(db, 'hotels', adminId));
    if (!snap.exists()) {
      snap = await getDoc(doc(db, 'users', adminId));
    }
    if (snap.exists()) {
      adminMap[adminId] = snap.data();
    }
  }));
  return adminMap;
}

// --- HELPER: Single Merge ---
async function fetchAdminAndMerge(hotelDoc: DocumentSnapshot) {
  const hData = hotelDoc.data()!;
  const adminId = hData.hotelAdminId;
  let adminData = {};

  if (adminId) {
    const adminMap = await fetchAdminsBatch([adminId]);
    adminData = adminMap[adminId] || {};
  }
  return mergeAndNormalizeHotel(hotelDoc, adminData);
}

// ==================================================================
// 2. ROUTE HANDLER
// ==================================================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
  const isFeatured = searchParams.get('featured') === 'true';
  const city = searchParams.get('city');

  try {
    const data = await getHotelsDataInternal({ id, limitCount, isFeatured, city });
    if (id && !data) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

// --- DATA NORMALIZATION ---
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

  // Verification Logic
  const plan = (h.planTier || liveAdminData.planTier || h.planTierAtUpload || 'free').toLowerCase();
  const isVerified = plan === 'pro' || plan === 'premium';

  // Price Logic
  const price = Number(h.pricePerNight) || 0;
  const discount = Number(h.discountPrice) || 0;
  const hasDiscount = h.hasDiscount && discount > 0;

  // Date Logic
  let createdAt = new Date().toISOString();
  if (h.createdAt?.toDate) {
    createdAt = h.createdAt.toDate().toISOString();
  }

  return {
    id: hotelDoc.id,
    slug: h.slug || null,
    name: h.name || 'Untitled Hotel',
    pricePerNight: Number(h.pricePerNight) || 0,
    hasDiscount,
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
    featured: isVerified,
    contactPhone: isVerified ? (liveAdminData.whatsappNumber || liveAdminData.phone || liveAdminData.phoneNumber || h.phone || '') : null,
    createdAt: createdAt,
  };
}