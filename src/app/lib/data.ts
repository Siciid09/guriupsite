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
    // Recursively check nested objects for GeoPoint
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
// PROPERTY FUNCTIONS
// =======================================================================
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

// =======================================================================
// HOTEL FUNCTIONS
// =======================================================================
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
  return docSnap.exists() ? transformDoc<Hotel>(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
}

// =======================================================================
// HOTEL SUB-COLLECTION FUNCTIONS
// =======================================================================
export async function getHotelRooms(hotelId: string): Promise<Room[]> {
  const snapshot = await getDocs(collection(db, 'hotels', hotelId, 'rooms'));
  return snapshot.docs.map(doc => transformDoc<Room>(doc));
}

export async function getHotelReviews(hotelId: string): Promise<Review[]> {
  const q = query(collection(db, 'hotels', hotelId, 'reviews'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => transformDoc<Review>(doc));
}

// =======================================================================
// AGENT FUNCTIONS
// =======================================================================
export async function getAgentDetails(agentId: string): Promise<Agent | null> {
  const docRef = doc(db, 'agents', agentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? transformDoc<Agent>(docSnap as QueryDocumentSnapshot<DocumentData>) : null;
}

// =======================================================================
// RELATED HOTELS
// =======================================================================
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
