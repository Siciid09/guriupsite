import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  orderBy,
  Timestamp,
  GeoPoint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Property, Hotel, Room, Review, Agent } from '@/types';

// =======================================================================
// 1. DATA TRANSFORMER (Standardizes Firebase Data)
// =======================================================================
const transformDoc = <T>(document: QueryDocumentSnapshot<DocumentData>): T => {
  const data = document.data();
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
    if (data[key] instanceof GeoPoint) {
      data[key] = { latitude: data[key].latitude, longitude: data[key].longitude };
    }
    // Handle nested GeoPoints (common in location objects)
    if (typeof data[key] === 'object' && data[key] !== null) {
      for (const nestedKey in data[key]) {
        if (data[key][nestedKey] instanceof GeoPoint) {
          data[key][nestedKey] = {
            latitude: data[key][nestedKey].latitude,
            longitude: data[key][nestedKey].longitude,
          };
        }
      }
    }
  }
  return { id: document.id, ...data } as T;
};

// =======================================================================
// 2. AGENT MERGING (Business Logic Source of Truth)
// =======================================================================
async function mergeAgentsWithProperties(properties: any[]) {
  const agentIds = [...new Set(properties.map(p => p.agentId).filter(Boolean))];
  
  const agentSnapshots = await Promise.all(
    agentIds.map(async (id) => {
      // PRIORITY 1: Check 'agents' collection (Live Business Profile)
      const agentSnap = await getDoc(doc(db, 'agents', id as string));
      if (agentSnap.exists()) return { id, data: agentSnap.data() };

      // PRIORITY 2: Fallback to 'users' collection (Auth/Login Data)
      const userSnap = await getDoc(doc(db, 'users', id as string));
      if (userSnap.exists()) return { id, data: userSnap.data() };
      
      return null;
    })
  );

  const agentMap = new Map();
  agentSnapshots.forEach(item => { if (item) agentMap.set(item.id, item.data); });

  return properties.map(p => {
    const agentData = agentMap.get(p.agentId) || {};
    
    // VERIFICATION LOGIC: Matches mobile 'listing_card.dart'
    // A user is verified if they have a Paid Plan OR are manually verified
    const plan = agentData.planTier || p.planTier || 'free';
    const isVerified = (plan === 'pro' || plan === 'premium') || (agentData.isVerified === true) || (p.agentVerified === true);

    return {
      ...p,
      // Prioritize business name, fall back to user name
      agentName: agentData.businessName || agentData.name || agentData.displayName || p.agentName || 'GuriUp Agent',
      agentVerified: isVerified,
      planTier: plan,
      // PRIVACY LOCK: Phone is null if not verified/paid
      agentPhone: isVerified ? (agentData.whatsappNumber || agentData.phone || p.agentPhone) : null,
      agentImage: agentData.logoUrl || agentData.photoUrl || p.agentImage || null
    };
  });
}

// =======================================================================
// 3. PROPERTY QUERIES (Safe Filtering)
// =======================================================================

// REPLACE THIS FUNCTION IN app-lib-data.ts

export async function getFeaturedProperties(): Promise<Property[]> {
  // 1. RELAXED QUERY: Only ask for 'featured'. 
  // We fetch 20 items (increased from 10) to ensure we have enough left after filtering for Pro agents.
  const q = query(
    collection(db, 'property'), 
    where('featured', '==', true), 
    limit(20) 
  );
  
  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => transformDoc<Property>(doc));

  // 2. SMART FILTER: Handle "Missing" fields gracefully
  const activeData = rawData.filter(p => {
    // Hide if explicitly archived (but show if field is missing)
    if (p.isArchived === true) return false;

    // Hide if explicitly draft or sold
    if (p.status === 'draft' || p.status === 'sold') return false;

    // Show if available, rented, OR if status is missing/undefined
    return true;
  });

  // 3. MERGE AGENTS to get the 'planTier'
  const mergedData = await mergeAgentsWithProperties(activeData);

  // 4. STRICT FILTER: Only show properties where agent is 'pro' or 'premium'
  return mergedData
    .filter(p => p.planTier === 'pro' || p.planTier === 'premium')
    .slice(0, 3); // Only show the top 3
}

// REPLACE THIS FUNCTION IN app-lib-data.ts

export async function getLatestProperties(): Promise<Property[]> {
  // RELAXED QUERY: We removed "isArchived" from the database query
  // to prevent hiding old data that is missing this field.
  const q = query(
    collection(db, 'property'),
    where('status', 'in', ['available', 'rented_out']), // Keep this to fix the 10% mismatch
    orderBy('createdAt', 'desc'),
    limit(12) // Fetch a few extra just in case
  );

  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => transformDoc<Property>(doc));

  // SAFE FILTER: Filter archived items here in case the DB field is missing
  const filteredData = rawData
    .filter(p => p.isArchived !== true) // This handles 'false' AND 'undefined'
    .slice(0, 6);

  return await mergeAgentsWithProperties(filteredData);
}

export async function getAllProperties(): Promise<Property[]> {
  const q = query(
    collection(db, 'property'), 
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => transformDoc<Property>(doc));

  const filteredData = rawData
    .filter(p => p.isArchived !== true && (p.status === 'available' || p.status === 'rented_out' || !p.status));

  return await mergeAgentsWithProperties(filteredData);
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const docRef = doc(db, 'property', slug);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  
  // Strict Privacy Guard for Direct Access
  // If explicitly archived, return null.
  if (data.isArchived === true) return null;
  // If status exists and is draft, return null. (If status missing, allow it).
  if (data.status && !['available', 'rented_out'].includes(data.status)) return null;

  const transformed = transformDoc<Property>(docSnap as QueryDocumentSnapshot<DocumentData>);
  const [merged] = await mergeAgentsWithProperties([transformed]);
  return merged;
}

// =======================================================================
// 4. HOTEL QUERIES (Safe & Automated)
// =======================================================================

export async function getFeaturedHotels(): Promise<Hotel[]> {
  // Fetch generic list first
  const q = query(collection(db, 'hotels'), limit(20));
  const snapshot = await getDocs(q);
  
  const rawData = snapshot.docs.map(doc => transformDoc<Hotel>(doc));

  // JS Filter: Auto-feature if Plan is Pro/Premium OR if manually featured
  const filteredData = rawData
    .filter(h => (h.planTier === 'pro' || h.planTier === 'premium' || h.featured === true) && h.isArchived !== true)
    .map(h => ({ ...h, isPro: true })) // Visual badge helper
    .slice(0, 4);

  return filteredData;
}

export async function getLatestHotels(): Promise<Hotel[]> {
  const q = query(collection(db, 'hotels'), orderBy('createdAt', 'desc'), limit(10));
  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => transformDoc<Hotel>(doc));
  
  // Simple filter for archive
  return rawData
    .filter(h => h.isArchived !== true)
    .slice(0, 4);
}

// =======================================================================
// 5. HELPER FUNCTIONS
// =======================================================================

export async function getAgentDetails(agentId: string): Promise<Agent | null> {
  // 1. Check Agents
  const agentRef = doc(db, 'agents', agentId);
  const agentSnap = await getDoc(agentRef);
  if (agentSnap.exists()) return transformDoc<Agent>(agentSnap as QueryDocumentSnapshot<DocumentData>);

  // 2. Check Users
  const userRef = doc(db, 'users', agentId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? transformDoc<Agent>(userSnap as QueryDocumentSnapshot<DocumentData>) : null;
}

export async function getRelatedProperties(property: Property): Promise<Property[]> {
  const q = query(
    collection(db, 'property'),
    where('location.city', '==', property.location.city),
    where('id', '!=', property.id),
    limit(10)
  );
  
  const snapshot = await getDocs(q);
  const rawData = snapshot.docs.map(doc => transformDoc<Property>(doc));

  const filteredData = rawData
    .filter(p => p.isArchived !== true)
    .slice(0, 4);

  return await mergeAgentsWithProperties(filteredData);
}

export async function getPropertyTypes(): Promise<string[]> {
  const properties = await getAllProperties();
  const types = new Set(properties.map(p => p.type));
  return Array.from(types);
}

export async function getAllHotels(): Promise<Hotel[]> {
  const snapshot = await getDocs(collection(db, 'hotels'));
  return snapshot.docs.map(doc => transformDoc<Hotel>(doc));
}

export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  const docRef = doc(db, 'hotels', slug);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Hotel>(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
}

export async function getHotelRooms(hotelId: string): Promise<Room[]> {
  const snapshot = await getDocs(collection(db, 'hotels', hotelId, 'rooms'));
  return snapshot.docs.map(doc => transformDoc<Room>(doc));
}

export async function getHotelReviews(hotelId: string): Promise<Review[]> {
  const q = query(collection(db, 'hotels', hotelId, 'reviews'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Review>(doc));
}

export async function getRelatedHotels(hotel: Hotel): Promise<Hotel[]> {
  const hotelsRef = collection(db, 'hotels');
  const q = query(
    hotelsRef,
    where('location.city', '==', hotel.location.city),
    where('id', '!=', hotel.id),
    limit(4)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return [];
  return querySnapshot.docs.map(doc => transformDoc<Hotel>(doc));
}