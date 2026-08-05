// --- USER ---
export interface User {
  id: string; // ✅ Added standard Supabase ID
  uid?: string; // Kept as optional for legacy mobile app support
  name: string;
  email: string;
  phoneNumber?: string;
  createdAt: string; // Supabase handles this perfectly as an ISO string
  role: 'user' | 'reagent' | 'hoadmin' | 'admin';
  favoriteProperties?: string[];
  favoriteHotels?: string[];
  planTier?: 'free' | 'pro' | 'premium';
}

// --- AGENT ---
export interface Agent {
  id: string;
  uid?: string; 
  name: string;
  displayName?: string; 
  businessName?: string; 
  email: string;
  phone?: string;       
  phoneNumber?: string; 
  whatsappNumber?: string; 
  location: string;
  address?: string;
  description?: string;
  photoUrl?: string;    
  logoUrl?: string;     
  photoURL?: string;    
  role: 'agent' | 'admin';
  planTier?: 'free' | 'pro' | 'premium';
  isVerified?: boolean;
}

// --- PROPERTY ---
export interface Property {
  id: string;
  title: string;
  description?: string;
  type: string; 
  status: string; 
  isForSale: boolean;
  isArchived?: boolean; 
  
  images: string[];
  videoUrl?: string; 

  price: number;
  displayPrice: number; 
  discountPrice: number;
  hasDiscount: boolean;

  location: {
    city: string;
    area: string;
    address?: string;
    coordinates?: { latitude: number; longitude: number };
  };

  bedrooms: number;
  bathrooms: number;
  area: number; 
  size?: number; 

  shopCount?: number;
  workspaceArea?: number;
  seatingCapacity?: number;

  amenities: string[]; 

  agentId: string;
  agentName: string;
  agentPhoto?: string;
  agentImage?: string; 
  agentPhone?: string | null; 
  agentVerified: boolean;
  
  planTier: string; 
  isPro?: boolean; 
  featured: boolean;
  
  createdAt: string;
}

// --- HOTEL ---
export interface Hotel {
  id: string;
  slug?: string; // Good to have for URL routing
  name: string;
  description?: string;
  images: string[];
  rating: number;
  featured: boolean;
  status?: string; 
  isArchived?: boolean; 
  phone?: string; // ✅ Fixed from 'any' to 'string'
  
  pricePerNight: number;
  originalPrice: number;
  displayPrice: number;
  hasDiscount: boolean;
  discountPrice: number;

  location: {
    city: string;
    area: string;
    address?: string;
    coordinates?: { latitude: number; longitude: number };
    latDisplay?: number; // Kept from your UI integration
    lngDisplay?: number;
  };

  amenities: string[]; 

  contactPhone?: string | null; 
  hotelAdminId: string;

  planTier: string;
  isPro: boolean;
  
  createdAt: string;
  
  roomTypes?: Room[];
}

// --- ROOM ---
export interface Room {
  id: string;
  roomTypeName: string;
  maxOccupancy: string; 
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