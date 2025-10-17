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
  Timestamp, // Import to check instance type
  GeoPoint,   // Import to check instance type
} from 'firebase/firestore';
import type { Property, Hotel, Room, Review, Agent } from '@/types';

// UPDATED HELPER FUNCTION TO SERIALIZE FIREBASE-SPECIFIC TYPES
const transformDoc = <T>(document: any): T => {
  const data = document.data();

  // Iterate over the data keys to find and convert special Firebase types
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      // Convert Timestamp to a simple ISO date string
      data[key] = data[key].toDate().toISOString();
    }
    if (data[key] instanceof GeoPoint) {
      // Convert GeoPoint to a plain object
      data[key] = {
        latitude: data[key].latitude,
        longitude: data[key].longitude,
      };
    }
    // Handle nested objects recursively (important for 'location' field)
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


// --- PROPERTY FETCHING FUNCTIONS ---
export async function getFeaturedProperties(): Promise<Property[]> {
  const q = query(collection(db, 'property'), where('featured', '==', true), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
}

export async function getLatestProperties(): Promise<Property[]> {
  const q = query(collection(db, 'property'), orderBy('createdAt', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
}

export async function getAllProperties(): Promise<Property[]> {
  const snapshot = await getDocs(collection(db, 'property'));
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const docRef = doc(db, 'property', slug);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Property>(docSnap) : null;
}

export async function getRelatedProperties(property: Property): Promise<Property[]> {
  const q = query(collection(db, 'property'), where('location.city', '==', property.location.city), where('id', '!=', property.id), limit(4));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Property>(doc));
}

export async function getPropertyTypes(): Promise<string[]> {
  const properties = await getAllProperties();
  const types = new Set(properties.map(p => p.type));
  return Array.from(types);
}

// --- HOTEL FETCHING FUNCTIONS ---
export async function getFeaturedHotels(): Promise<Hotel[]> {
  const q = query(collection(db, 'hotels'), where('featured', '==', true), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Hotel>(doc));
}

export async function getLatestHotels(): Promise<Hotel[]> {
  const q = query(collection(db, 'hotels'), orderBy('createdAt', 'desc'), limit(5));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Hotel>(doc));
}

export async function getAllHotels(): Promise<Hotel[]> {
  const snapshot = await getDocs(collection(db, 'hotels'));
  return snapshot.docs.map(doc => transformDoc<Hotel>(doc));
}

export async function getHotelBySlug(slug: string): Promise<Hotel | null> {
  const docRef = doc(db, 'hotels', slug);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Hotel>(docSnap) : null;
}

// --- HOTEL SUB-COLLECTION FUNCTIONS ---
export async function getHotelRooms(hotelId: string): Promise<Room[]> {
  const snapshot = await getDocs(collection(db, 'hotels', hotelId, 'rooms'));
  return snapshot.docs.map(doc => transformDoc<Room>(doc));
}

export async function getHotelReviews(hotelId: string): Promise<Review[]> {
  const q = query(collection(db, 'hotels', hotelId, 'reviews'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Review>(doc));
}

// --- AGENT FETCHING FUNCTIONS ---
export async function getAgentDetails(agentId: string): Promise<Agent | null> {
  const docRef = doc(db, 'agents', agentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Agent>(docSnap) : null;
}

// ... add this function to your existing data.ts file

export async function getRelatedHotels(hotel: Hotel): Promise<Hotel[]> {
  const hotelsRef = collection(db, 'hotels');
  const q = query(
    hotelsRef,
    where('location.city', '==', hotel.location.city),
    where('id', '!=', hotel.id),
    limit(4) // Fetch 4 related hotels
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return [];
  return querySnapshot.docs.map(doc => transformDoc<Hotel>(doc));
}