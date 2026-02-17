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
  businessName?: string; // ✅ Added to match Business Profile logic
  email: string;
  phone?: string;       // ✅ Normalized
  phoneNumber?: string; // Legacy support
  whatsappNumber?: string; // ✅ Added for Contact Button
  location: string;
  address?: string;
  description?: string;
  photoUrl?: string;    // ✅ Normalized
  logoUrl?: string;     // ✅ Added for Business Logo
  photoURL?: string;    // Legacy
  role: 'agent' | 'admin';
  planTier?: 'free' | 'pro' | 'premium';
  isVerified?: boolean;
}

// --- PROPERTY (Aligned with App's Property Model) ---
export interface Property {
  id: string;
  title: string;
  description?: string;
  type: string; // 'House', 'Apartment', 'Land', 'Commercial', etc.
  status: string; // 'available', 'rented_out', 'sold', 'draft'
  isForSale: boolean;
  isArchived?: boolean; // ✅ CRITICAL: Required for Privacy Filtering
  
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
    coordinates?: { latitude: number; longitude: number }; // ✅ Normalized from GeoPoint
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
  amenities: string[]; 

  // Agent Info
  agentId: string;
  agentName: string;
  agentPhoto?: string;
  agentImage?: string; // ✅ Added for consistency
  agentPhone?: string | null; // ✅ Nullable for locked phones
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
  status?: string; // ✅ Added for Availability check
  isArchived?: boolean; // ✅ CRITICAL: Required for Privacy Filtering
  
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
    coordinates?: { latitude: number; longitude: number };
  };

  // Amenities
  amenities: string[]; 

  // Contact & Admin
  contactPhone?: string | null; // ✅ Nullable for locked phones
  hotelAdminId: string;

  // Plan
  planTier: string;
  isPro: boolean;
  
  createdAt: string;
  
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