'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  orderBy
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Wifi, 
  Utensils, 
  Star,
  ArrowLeft,
  FilterX,
  Loader2,
  ShieldCheck,
  Award
} from 'lucide-react';

// --- TYPES ---

interface LocationData {
  city?: string;
  area?: string;
  address?: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  images: string[];
  location: LocationData | string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  isForSale: boolean;
  type: string;
  planTier?: 'free' | 'pro' | 'premium';
  agentVerified?: boolean;
  featured?: boolean;
  agentId?: string;
}

interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: LocationData | string;
  rating: number;
  planTier?: 'free' | 'pro' | 'premium';
  isPro?: boolean;
  amenities: string[]; 
}

// Wrapper for Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb]" size={40}/></div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [mode, setMode] = useState<'buy' | 'rent' | 'hotel'>('buy');
  
  // Search Metadata
  const cityParam = searchParams.get('city') || 'All Cities';
  const typeParam = searchParams.get('type') || searchParams.get('roomType') || 'Any Type';

  // --- FETCH DATA ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setProperties([]);
      setHotels([]);

      try {
        // 1. Parse Params safely
        const rawMode = searchParams.get('mode');
        const validModes = ['buy', 'rent', 'hotel'];
        const currentMode = validModes.includes(rawMode || '') ? (rawMode as 'buy' | 'rent' | 'hotel') : 'buy';
        
        setMode(currentMode);
        const priceParam = searchParams.get('price');

        // 2. Determine Collection & Constraints
        const collectionName = currentMode === 'hotel' ? 'hotels' : 'property';
        const collectionRef = collection(db, collectionName);
        const constraints = [];

        // CRITICAL FIX: Exclude Archived Items
        if (currentMode !== 'hotel') {
            constraints.push(where('isArchived', '==', false));
            // Only show active statuses
            constraints.push(where('status', 'in', ['available', 'rented_out'])); 
        }

        // -- Filter: City --
        if (cityParam !== 'All Cities') {
           constraints.push(where('location.city', '==', cityParam)); 
        }

        // -- Logic for Properties --
        if (currentMode !== 'hotel') {
            // Buy vs Rent Logic
            if (currentMode === 'buy') {
                constraints.push(where('isForSale', '==', true));
            } else {
                constraints.push(where('isForSale', '==', false)); 
            }

            // Type Filter
            if (typeParam !== 'Any Type') {
                constraints.push(where('type', '==', typeParam));
            }
        } 

        // -- Filter: Price --
        if (priceParam && priceParam !== 'Any Price') {
            let min = 0;
            let max = 100000000;

            if (priceParam.includes('+')) {
                const num = parseInt(priceParam.replace(/\D/g, ''));
                min = priceParam.toLowerCase().includes('k') ? num * 1000 : num;
            } else if (priceParam.includes('-')) {
                const parts = priceParam.split('-');
                const minRaw = parts[0].replace(/\D/g, '');
                const maxRaw = parts[1].replace(/\D/g, '');
                min = parseInt(minRaw) * (parts[0].toLowerCase().includes('k') ? 1000 : 1);
                max = parseInt(maxRaw) * (parts[1].toLowerCase().includes('k') ? 1000 : 1);
            }

            const priceField = currentMode === 'hotel' ? 'pricePerNight' : 'price';
            constraints.push(where(priceField, '>=', min));
            constraints.push(where(priceField, '<=', max));
        }

        // Sort by creation date (newest first) if possible
        // Note: Firestore requires composite indexes for complex sorts with filters. 
        // If index is missing, remove 'orderBy' or create it in Firebase Console.
        // constraints.push(orderBy('createdAt', 'desc')); 

        constraints.push(limit(50));

        // 3. Execute Query
        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const results = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // --- HOTEL PARSING ---
            if (currentMode === 'hotel') {
                 let amenitiesArray: string[] = [];
                 if (Array.isArray(data.amenities)) {
                     amenitiesArray = data.amenities;
                 } else if (typeof data.amenities === 'object' && data.amenities !== null) {
                     if (data.amenities.hasWifi) amenitiesArray.push('Wi-Fi');
                     if (data.amenities.hasPool) amenitiesArray.push('Pool');
                     if (data.amenities.hasGym) amenitiesArray.push('Gym');
                     if (data.amenities.hasRestaurant) amenitiesArray.push('Restaurant');
                     if (data.amenities.hasParking) amenitiesArray.push('Parking');
                 }

                 return {
                    id: doc.id,
                    ...data,
                    pricePerNight: Number(data.pricePerNight) || 0,
                    amenities: amenitiesArray
                 };
            }

            // --- PROPERTY PARSING (FIXED 0 DATA ISSUE) ---
            // Explicitly check root level AND 'features' object
            const beds = data.bedrooms ?? data.features?.bedrooms ?? 0;
            const baths = data.bathrooms ?? data.features?.bathrooms ?? 0;
            const size = data.size ?? data.area ?? data.features?.area ?? data.features?.size ?? 0;
            
            const price = Number(data.price) || 0;
            const discountPrice = Number(data.discountPrice) || 0;

            return { 
                id: doc.id, 
                ...data,
                title: data.title || 'Untitled Property',
                price: price,
                discountPrice: discountPrice,
                hasDiscount: (data.hasDiscount === true) && discountPrice > 0,
                location: data.location || 'Unknown Location',
                bedrooms: Number(beds),
                bathrooms: Number(baths),
                area: Number(size),
                status: data.status || 'available',
                isForSale: data.isForSale ?? true,
                images: data.images || [],
                planTier: data.planTier,
                agentVerified: data.agentVerified
            };
        });

        if (currentMode === 'hotel') {
            setHotels(results as unknown as Hotel[]);
        } else {
            setProperties(results as unknown as Property[]);
        }

      } catch (error) {
        console.error("Search Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  // --- HELPERS ---
  const formatPrice = (price: number) => {
    if (isNaN(price)) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const getLocationString = (location: LocationData | string) => {
    if (typeof location === 'string') return location;
    if (!location) return 'Unknown Location';
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    return parts.length > 0 ? parts.join(', ') : (location.address || 'Unknown Location');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
      
      {/* --- HEADER --- */}
      <div className="max-w-[1600px] mx-auto px-6 mb-10">
        <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#0065eb] transition-colors font-bold text-sm mb-6 group"
        >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/> Back to Home
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <span className="text-[#0065eb] font-black uppercase tracking-widest text-xs mb-2 block">Search Results</span>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                    {mode === 'hotel' ? 'Hotels' : (mode === 'rent' ? 'Properties for Rent' : 'Properties for Sale')} 
                    <span className="text-slate-300 font-medium ml-2">in</span> {cityParam}
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                    {typeParam}
                </span>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                    {loading ? '...' : (mode === 'hotel' ? `${hotels.length} Results` : `${properties.length} Results`)}
                </span>
            </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="max-w-[1600px] mx-auto px-6">
        
        {loading ? (
            // SKELETON LOADING
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4,5,6,7,8].map((i) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden h-[400px] animate-pulse">
                        <div className="h-[250px] bg-slate-200"></div>
                        <div className="p-6 space-y-3">
                            <div className="h-6 w-2/3 bg-slate-200 rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <>
                {/* --- EMPTY STATE --- */}
                {((mode === 'hotel' && hotels.length === 0) || (mode !== 'hotel' && properties.length === 0)) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                            <FilterX size={48} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No Results Found</h3>
                        <p className="text-slate-500 max-w-md mb-8">We couldn't find any properties matching your exact filters.</p>
                        <button 
                            onClick={() => router.push('/')}
                            className="px-8 py-3 bg-[#0065eb] text-white rounded-xl font-bold hover:bg-[#0052c1] transition-all shadow-lg shadow-blue-500/30"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

                {/* --- RESULTS GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    
                    {/* CASE 1: HOTELS */}
                    {mode === 'hotel' && hotels.map((hotel) => {
                        const isVerified = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
                        return (
                            <div key={hotel.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer">
                                <Link href={`/hotels/${hotel.id}`} className="absolute inset-0 z-0"></Link>
                                
                                {/* Image Area */}
                                <div className="h-[260px] relative overflow-hidden m-2 rounded-[1.5rem] bg-slate-100">
                                    <Image 
                                        src={hotel.images?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                                        alt={hotel.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Star size={12} className="text-orange-500 fill-orange-500"/>
                                        <span className="text-xs font-black text-slate-900">{hotel.rating || 'New'}</span>
                                    </div>
                                    {isVerified && (
                                        <div className="absolute bottom-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                            Verified Hotel
                                        </div>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="p-5 pt-2 flex flex-col flex-grow relative pointer-events-none">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#0065eb] transition-colors">{hotel.name}</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold mb-4 flex items-center gap-1">
                                        <MapPin size={12}/> {getLocationString(hotel.location)}
                                    </p>
                                    <div className="flex gap-2 mb-6">
                                        {hotel.amenities.includes('Wi-Fi') && <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Wifi size={14}/></span>}
                                        {hotel.amenities.includes('Pool') && <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Maximize size={14}/></span>}
                                    </div>
                                    <div className="mt-auto flex items-center justify-between pointer-events-auto pt-4 border-t border-slate-50">
                                        <div>
                                            <span className="text-2xl font-black text-slate-900">{formatPrice(hotel.pricePerNight)}</span>
                                            <span className="text-xs font-bold text-slate-400">/night</span>
                                        </div>
                                        <Link href={`/hotels/${hotel.id}`} className="px-6 py-2.5 bg-[#0065eb] text-white text-xs font-black uppercase rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-blue-500/20">
                                            Book
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* CASE 2: PROPERTIES */}
                    {mode !== 'hotel' && properties.map((property) => {
                        // Logic: Check Plan Tier strictly
                        const isVerified = property.planTier === 'pro' || property.planTier === 'premium' || property.agentVerified;
                        const statusLabel = property.status === 'rented_out' ? 'Rented' : (property.isForSale ? 'For Sale' : 'For Rent');
                        const statusColor = property.status === 'rented_out' ? 'bg-red-500' : (property.isForSale ? 'bg-[#0065eb]' : 'bg-slate-900');
                        
                        // Price Display (Discount Logic)
                        const finalPrice = (property.hasDiscount && (property.discountPrice || 0) > 0) ? property.discountPrice : property.price;

                        return (
                            <div key={property.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer">
                                <Link href={`/properties/${property.id}`} className="absolute inset-0 z-0"></Link>
                                
                                {/* Image Area */}
                                <div className="h-[260px] relative overflow-hidden m-2 rounded-[1.5rem] bg-slate-100">
                                    <Image 
                                        src={property.images?.[0] || 'https://placehold.co/600x400?text=No+Image'}
                                        alt={property.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className={`absolute top-3 left-3 ${statusColor} text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg`}>
                                        {statusLabel}
                                    </div>
                                    
                                    {/* Verification & Feature Badges */}
                                    <div className="absolute bottom-3 right-3 flex flex-col gap-1 items-end">
                                        {property.featured && (
                                            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                                <Award size={10} /> Featured
                                            </div>
                                        )}
                                        {isVerified && (
                                            <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                                <ShieldCheck size={10} /> Verified
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="p-5 pt-2 flex flex-col flex-grow relative pointer-events-none">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#0065eb] transition-colors line-clamp-1">{property.title}</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold mb-5 flex items-center gap-1">
                                        <MapPin size={12}/> {getLocationString(property.location)}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                            <Bed size={16} className="text-[#0065eb]"/>
                                            <span className="text-xs font-bold">{property.bedrooms || 0} <span className="hidden sm:inline">Beds</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                            <Bath size={16} className="text-[#0065eb]"/>
                                            <span className="text-xs font-bold">{property.bathrooms || 0} <span className="hidden sm:inline">Baths</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
                                            <Maximize size={16} className="text-[#0065eb]"/>
                                            <span className="text-xs font-bold">{property.area || 0} <span className="hidden sm:inline">m²</span></span>
                                        </div>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between pointer-events-auto pt-4 border-t border-slate-50">
                                        <div>
                                            <span className="text-2xl font-black text-slate-900">{formatPrice(finalPrice || 0)}</span>
                                            {!property.isForSale && <span className="text-xs font-bold text-slate-400">/mo</span>}
                                            {/* Discount Tag */}
                                            {property.hasDiscount && (
                                                <span className="ml-2 text-xs text-red-400 line-through font-bold">
                                                    {formatPrice(property.price)}
                                                </span>
                                            )}
                                        </div>
                                        <Link href={`/properties/${property.id}`} className="px-6 py-2.5 border border-slate-200 text-slate-900 text-xs font-black uppercase rounded-xl hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors">
                                            Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        )}
      </div>
    </div>
  );
}