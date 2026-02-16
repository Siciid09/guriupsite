// No longer need to import these here, as we are using serializable types
// import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: string; // CHANGED from Timestamp
  role: 'user' | 'reagent' | 'hoadmin' | 'admin';
  favoriteProperties?: string[];
  favoriteHotels?: string[];
  planTier?: 'free' | 'pro' | 'premium'; // Added to match Signup fix
}

export interface Agent {
  phone: any;
  id: any;
  name: any;
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  location: string;
  address?: string;
  description?: string;
  photoURL?: string;
  role: 'agent' | 'admin';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'House' | 'Apartment' | 'Land' | 'Commercial';
  images: string[];
  searchKeywords: string[];
  createdAt: string; // CHANGED from Timestamp
  updatedAt: string; // CHANGED from Timestamp
  status: 'available' | 'rented_out' | 'sold';
  agentId: string;
  agentName: string;
  price: number;
  isForSale: boolean;
  hasDiscount?: boolean;
  discountPrice?: number;
  featured: boolean;
  
  // --- ADDED THIS FIELD ---
  // Matches the App's logic for "Pro" badges
  planTier: 'free' | 'pro' | 'premium'; 
  // ------------------------

  location: {
    address: string;
    city: string;
    area: string;
    gpsCoordinates: string;
  };
  features: {
    size: number;
    bedrooms: number;
    bathrooms: number;
    isFurnished: boolean;
    hasGate: boolean;
    hasPool: boolean;
    hasParking: boolean;
    roadAccess: boolean;
  };
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  images: string[];
  rating: number;
  featured: boolean;
  createdAt: string; // CHANGED from Timestamp
  updatedAt: string; // CHANGED from Timestamp
  hotelAdminId: string;
  pricePerNight: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  location: {
    address: string;
    city: string;
    area: string;
    // CHANGED from GeoPoint
    coordinates: { latitude: number; longitude: number };
  };
  contact: {
    phone: string;
    email: string;
  };
  amenities: {
    hasWifi: boolean;
    hasPool: boolean;
    hasGym: boolean;
    hasRestaurant: boolean;
    hasParking: boolean;
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
  roomTypes: {
    name: string;
    price: number;
    details: string;
  }[];
}

export interface Room {
  id: string;
  roomTypeName: string;
  maxOccupancy: string;
  pricePerNight: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  roomSize: string;
  numberOfRooms: number;
  images: string[];
  features: { [key: string]: boolean };
  createdAt: string; // CHANGED from Timestamp
}

export interface Review {
  id: string;
  comment: string;
  rating: number;
  userName: string;
  userId: string;
  createdAt: string; // CHANGED from Timestamp
}