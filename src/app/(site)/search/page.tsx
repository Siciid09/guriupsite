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
  Loader2
} from 'lucide-react';

// --- UPDATED TYPES TO MATCH APP MODELS ---

interface LocationData {
  city?: string;
  area?: string;
  address?: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: LocationData | string;
  city?: string; // Support for top-level app data
  area?: string; // Support for top-level app data
  bedrooms?: number;
  bathrooms?: number;
  size?: number; // Normalized from 'area' or 'size'
  status: string;
  isForSale: boolean;
  type: string;
  planTier?: string;
  agentVerified?: boolean;
  featured?: boolean;
}

interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: LocationData | string;
  city?: string; // Support for top-level app data
  area?: string; // Support for top-level app data
  rating: number;
  planTier?: string;
  isPro?: boolean;
  amenities: string[]; 
}

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

  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [mode, setMode] = useState<'buy' | 'rent' | 'hotel'>('buy');
  
  const cityParam = searchParams.get('city') || 'All Cities';
  const typeParam = searchParams.get('type') || searchParams.get('roomType') || 'Any Type';

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const rawMode = searchParams.get('mode');
        const validModes = ['buy', 'rent', 'hotel'];
        const currentMode = validModes.includes(rawMode || '') ? (rawMode as 'buy' | 'rent' | 'hotel') : 'buy';
        setMode(currentMode);

        const priceParam = searchParams.get('price');
        const collectionName = currentMode === 'hotel' ? 'hotels' : 'property';
        const collectionRef = collection(db, collectionName);
        const constraints = [];

        // 1. ARCHIVED FILTER (Safety Match)
        constraints.push(where('isArchived', '==', false));

        // 2. SMART CITY QUERY
        // Note: Firestore doesn't support OR across fields easily. 
        // We query by location.city as primary, but normalization handles the rest.
        if (cityParam !== 'All Cities') {
           constraints.push(where('location.city', '==', cityParam)); 
        }

        // 3. PROPERTY SPECIFIC FILTERS
        if (currentMode !== 'hotel') {
            constraints.push(where('isForSale', '==', currentMode === 'buy'));
            if (typeParam !== 'Any Type') {
                constraints.push(where('type', '==', typeParam));
            }
        } 

        // 4. SMART PRICE PARSING (Aligns with App Slider/FilterModel)
        if (priceParam && priceParam !== 'Any Price') {
            let min = 0;
            let max = 5000000; // Aligned with realistic App max

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

        constraints.push(limit(40));
        const q = query(collectionRef, ...constraints);
        const snapshot = await getDocs(q);
        
        const results = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // SMART AMENITIES PARSER (Handles Map vs Array)
            let amenitiesArray: string[] = [];
            const rawAm = data.amenities || data.features || {};
            if (Array.isArray(rawAm)) {
                amenitiesArray = rawAm;
            } else if (typeof rawAm === 'object') {
                if (rawAm.hasWifi || rawAm.hasInternet) amenitiesArray.push('Wi-Fi');
                if (rawAm.hasPool) amenitiesArray.push('Pool');
                if (rawAm.hasGym) amenitiesArray.push('Gym');
                if (rawAm.hasParking) amenitiesArray.push('Parking');
                if (rawAm.hasAC || rawAm.hasAirConditioning) amenitiesArray.push('AC');
            }

            // SMART DATA NORMALIZATION
            return { 
                id: doc.id, 
                ...data,
                // Handle different field names for size
                size: Number(data.area || data.size || data.features?.size || 0),
                price: Number(data.price) || 0,
                pricePerNight: Number(data.pricePerNight) || 0,
                // Ensure PlanTier logic matches the app's 'pro' check
                isPro: data.planTier === 'pro',
                amenities: amenitiesArray 
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
  }, [searchParams, cityParam, typeParam]);

  // --- SMART HELPERS ---
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  const getLocationString = (item: any) => {
    // Check nested first, then top-level (App fallback)
    const city = item.location?.city || item.city || 'Unknown City';
    const area = item.location?.area || item.area || '';
    return area ? `${area}, ${city}` : city;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-6 mb-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-500 hover:text-[#0065eb] transition-colors font-bold text-sm mb-6 group">
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
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">{typeParam}</span>
                <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                    {loading ? '...' : (mode === 'hotel' ? `${hotels.length} Results` : `${properties.length} Results`)}
                </span>
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6">
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map((i) => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden h-[400px] animate-pulse">
                        <div className="h-[250px] bg-slate-200"></div>
                        <div className="p-6 space-y-3"><div className="h-6 w-2/3 bg-slate-200 rounded-full"></div></div>
                    </div>
                ))}
            </div>
        ) : (
            <>
                {((mode === 'hotel' && hotels.length === 0) || (mode !== 'hotel' && properties.length === 0)) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300"><FilterX size={48} /></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No Results Found</h3>
                        <p className="text-slate-500 max-w-md mb-8">Try adjusting your filters or city to find more listings.</p>
                        <button onClick={() => router.push('/')} className="px-8 py-3 bg-[#0065eb] text-white rounded-xl font-bold hover:bg-[#0052c1] transition-all shadow-lg shadow-blue-500/30">Clear Search</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {mode === 'hotel' ? hotels.map((hotel) => (
                        <HotelCard key={hotel.id} hotel={hotel} getLocation={getLocationString} formatPrice={formatPrice} />
                    )) : properties.map((property) => (
                        <PropertyCard key={property.id} property={property} getLocation={getLocationString} formatPrice={formatPrice} />
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS FOR CLEANER CODE ---

const HotelCard = ({ hotel, getLocation, formatPrice }: any) => {
  const isVerified = hotel.planTier === 'pro' || hotel.isPro;
  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer">
        <Link href={`/hotels/${hotel.id}`} className="absolute inset-0 z-10"></Link>
        <div className="h-[240px] relative overflow-hidden m-2 rounded-[1.5rem] bg-slate-100">
            <Image src={hotel.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} alt={hotel.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1">
                <Star size={12} className="text-orange-500 fill-orange-500"/><span className="text-xs font-black text-slate-900">{hotel.rating || 'New'}</span>
            </div>
            {isVerified && <div className="absolute bottom-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg">Verified</div>}
        </div>
        <div className="p-5 pt-2 flex flex-col flex-grow">
            <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#0065eb] transition-colors">{hotel.name}</h3>
            <p className="text-slate-400 text-xs font-bold mb-4 flex items-center gap-1"><MapPin size={12}/> {getLocation(hotel)}</p>
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                <div><span className="text-2xl font-black text-slate-900">{formatPrice(hotel.pricePerNight)}</span><span className="text-xs font-bold text-slate-400">/night</span></div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-all"><Loader2 size={18}/></div>
            </div>
        </div>
    </div>
  );
};

const PropertyCard = ({ property, getLocation, formatPrice }: any) => {
    const isVerified = property.planTier === 'pro' || property.agentVerified;
    const statusColor = property.status === 'rented_out' ? 'bg-red-500' : (property.isForSale ? 'bg-[#0065eb]' : 'bg-slate-900');
    return (
        <div className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col cursor-pointer">
            <Link href={`/properties/${property.id}`} className="absolute inset-0 z-10"></Link>
            <div className="h-[240px] relative overflow-hidden m-2 rounded-[1.5rem] bg-slate-100">
                <Image src={property.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} alt={property.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className={`absolute top-3 left-3 ${statusColor} text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg`}>{property.isForSale ? 'For Sale' : 'For Rent'}</div>
                {isVerified && <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg">Verified</div>}
            </div>
            <div className="p-5 pt-2 flex flex-col flex-grow">
                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-[#0065eb] transition-colors line-clamp-1">{property.title}</h3>
                <p className="text-slate-400 text-xs font-bold mb-5 flex items-center gap-1"><MapPin size={12}/> {getLocation(property)}</p>
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"><Bed size={14}/><span className="text-xs font-bold">{property.bedrooms || 0}</span></div>
                    <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"><Bath size={14}/><span className="text-xs font-bold">{property.bathrooms || 0}</span></div>
             <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"><Maximize size={14}/><span className="text-xs font-bold">{property.size}</span></div>
               </div>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                    <div><span className="text-2xl font-black text-slate-900">{formatPrice(property.price)}</span>{!property.isForSale && <span className="text-xs font-bold text-slate-400">/mo</span>}</div>
                    <button className="px-5 py-2 border border-slate-200 text-slate-900 text-xs font-black uppercase rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">Details</button>
                </div>
            </div>
        </div>
    );
};