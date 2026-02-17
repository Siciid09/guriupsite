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
// HELPER FUNCTION TO TRANSFORM FIRESTORE DOCUMENTS
// =======================================================================
const transformDoc = <T>(document: QueryDocumentSnapshot<DocumentData>): T => {
  const data = document.data();

  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate().toISOString();
    }
    if (data[key] instanceof GeoPoint) {
      data[key] = {
        latitude: data[key].latitude,
        longitude: data[key].longitude,
      };
    }
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

  return {
    id: document.id,
    ...data,
  } as T;
};

// =======================================================================
// AGENT MERGING HELPER (The logic you requested)
// =======================================================================
async function mergeAgentsWithProperties(properties: any[]) {
  const agentIds = [...new Set(properties.map(p => p.agentId).filter(Boolean))];
  
  const agentSnapshots = await Promise.all(
    agentIds.map(async (id) => {
      // Check 'users' collection first (where planTier lives)
      const userSnap = await getDoc(doc(db, 'users', id as string));
      if (userSnap.exists()) return { id, data: userSnap.data() };
      
      // Fallback to 'agents' collection
      const agentSnap = await getDoc(doc(db, 'agents', id as string));
      if (agentSnap.exists()) return { id, data: agentSnap.data() };
      
      return null;
    })
  );

  const agentMap = new Map();
  agentSnapshots.forEach(item => {
    if (item) agentMap.set(item.id, item.data);
  });

  return properties.map(p => {
    const agentData = agentMap.get(p.agentId) || {};
    
    // Normalize logic for HomeUI cards
    const plan = agentData.planTier || p.planTier || 'free';
    const isVerified = (plan === 'pro' || plan === 'premium') || (agentData.isVerified === true) || (p.agentVerified === true);

    return {
      ...p,
      agentName: agentData.name || agentData.displayName || p.agentName || 'GuriUp Agent',
      agentVerified: isVerified,
      planTier: plan,
    };
  });
}

// =======================================================================
// PROPERTY FUNCTIONS (Updated with Agent Merging)
// =======================================================================
export async function getFeaturedProperties(): Promise<Property[]> {
  const q = query(collection(db, 'property'), where('featured', '==', true), limit(3));
  const snapshot = await getDocs(q);
  const transformed = snapshot.docs.map(doc => transformDoc<Property>(doc));
  return await mergeAgentsWithProperties(transformed);
}

export async function getLatestProperties(): Promise<Property[]> {
  const q = query(collection(db, 'property'), orderBy('createdAt', 'desc'), limit(6));
  const snapshot = await getDocs(q);
  const transformed = snapshot.docs.map(doc => transformDoc<Property>(doc));
  return await mergeAgentsWithProperties(transformed);
}

// ... Keep your other functions (getPropertyBySlug, etc.) exactly as they are ...

// =======================================================================
// HOTEL FUNCTIONS (Updated with Verification Logic)
// =======================================================================
export async function getFeaturedHotels(): Promise<Hotel[]> {
  const q = query(collection(db, 'hotels'), where('featured', '==', true), limit(4));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const hotel = transformDoc<Hotel>(doc);
    // Add logic to check if hotel is Pro
    return { ...hotel, isPro: hotel.planTier === 'pro' || hotel.planTier === 'premium' };
  });
}

export async function getLatestHotels(): Promise<Hotel[]> {
  const q = query(collection(db, 'hotels'), orderBy('createdAt', 'desc'), limit(4));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const hotel = transformDoc<Hotel>(doc);
    return { ...hotel, isPro: hotel.planTier === 'pro' || hotel.planTier === 'premium' };
  });
}

// ... Keep everything else the same ...
export async function getAllProperties(): Promise<Property[]> {
  const snapshot = await getDocs(collection(db, 'property'));
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const docRef = doc(db, 'property', slug);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Property>(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
}

export async function getRelatedProperties(property: Property): Promise<Property[]> {
  const q = query(
    collection(db, 'property'),
    where('location.city', '==', property.location.city),
    where('id', '!=', property.id),
    limit(4)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
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

export async function getAgentDetails(agentId: string): Promise<Agent | null> {
  const docRef = doc(db, 'agents', agentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Agent>(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
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