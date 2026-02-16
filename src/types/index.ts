// types/index.ts

// --- USER ---
export interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  role: 'user' | 'reagent' | 'hoadmin' | 'admin';
  favoriteProperties?: string[];
  favoriteHotels?: string[];
  planTier?: 'free' | 'pro' | 'premium';
}

// --- AGENT ---
export interface Agent {
  uid: string;
  id: string;
  name: string;
  displayName?: string; // Handle legacy field
  email: string;
  phoneNumber: string;
  location: string;
  address?: string;
  description?: string;
  photoURL?: string;
  role: 'agent' | 'admin';
}

// --- PROPERTY (Aligned with App's Property Model) ---
export interface Property {
  id: string;
  title: string;
  description?: string;
  type: string; // 'House', 'Apartment', 'Land', 'Commercial', etc.
  status: string; // 'available', 'rented_out', 'sold'
  isForSale: boolean;
  
  // Media
  images: string[];
  videoUrl?: string; // ✅ Added to match App

  // Price
  price: number;
  displayPrice: number; // Normalized active price
  discountPrice: number;
  hasDiscount: boolean;

  // Location
  location: {
    city: string;
    area: string;
    address?: string;
    coordinates?: { lat: number; lng: number }; // ✅ Normalized from GeoPoint
  };

  // Specs (Flattened from 'features' map to match API normalization)
  bedrooms: number;
  bathrooms: number;
  area: number; // ✅ Primary size field
  size?: number; // Legacy alias

  // Commercial / Special Specs
  shopCount?: number;
  workspaceArea?: number;
  seatingCapacity?: number;

  // Amenities
  // The API now returns a clean list of strings (e.g., ['Pool', 'Generator'])
  amenities: string[]; 

  // Agent Info
  agentId: string;
  agentName: string;
  agentPhoto?: string;
  agentPhone?: string;
  agentVerified: boolean;
  
  // Plan & Verification
  planTier: string; // 'free' | 'pro' | 'premium'
  isPro?: boolean; 
  featured: boolean;
  
  createdAt: string;
}

// --- HOTEL (Aligned with App's Hotel Model) ---
export interface Hotel {
  id: string;
  name: string;
  description?: string;
  images: string[];
  rating: number;
  featured: boolean;
  
  // Price
  pricePerNight: number;
  originalPrice: number;
  displayPrice: number;
  hasDiscount: boolean;
  discountPrice: number;

  // Location
  location: {
    city: string;
    area: string;
    address?: string;
    coordinates?: { lat: number; lng: number }; // ✅ Normalized from GeoPoint
  };

  // Amenities
  // The API returns strings like 'Wi-Fi', 'Swimming Pool', 'Air Conditioning'
  amenities: string[]; 

  // Contact & Admin
  contactPhone?: string;
  hotelAdminId: string;

  // Plan
  planTier: string;
  isPro: boolean;
  
  createdAt: string;
  
  // ✅ REMOVED: 'policies' object (Does not exist in App/Firestore)
  
  roomTypes?: Room[];
}

// --- ROOM (Aligned with Booking Models) ---
export interface Room {
  id: string;
  roomTypeName: string;
  
  maxOccupancy: string; // Display string e.g. "2 Adults"
  
  // ✅ Added numeric fields for booking logic
  adults: number;       
  children: number;     
  
  pricePerNight: number;
  hasDiscount?: boolean;
  discountPrice?: number;
  
  roomSize: string;
  numberOfRooms: number;
  images: string[];
  features: { [key: string]: boolean };
  createdAt: string;
}

// --- REVIEW ---
export interface Review {
  id: string;
  comment: string;
  rating: number;
  userName: string;
  userId: string;
  createdAt: string;
}