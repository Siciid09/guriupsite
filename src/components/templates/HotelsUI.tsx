'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Calendar, Users, Search, 
  CheckCircle, Star, ArrowRight, ShieldCheck, 
  Wifi, Coffee, Award, SlidersHorizontal, X, Share2, Heart
} from 'lucide-react';

// --- TYPES ---
interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: any; // Can be string or object { city: string, area: string }
  rating: number;
  planTier?: string;
  isPro?: boolean;
  amenities?: string[]; // Added to support filtering
}

interface HotelsUIProps {
  featuredHotels: Hotel[]; // Ideally pre-fetched "Pro" hotels
  allHotels: Hotel[];
}

// --- FILTER CONSTANTS (Matching Flutter App) ---
const AMENITIES_LIST = [
  'Wi-Fi', 'Swimming Pool', 'Gym', 'Restaurant', 
  'Parking', 'Room Service', 'Spa', 'Bar', '24/7 Front Desk'
];

const HotelsUI = ({ featuredHotels, allHotels }: HotelsUIProps) => {
  // --- STATE ---
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>(allHotels);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Search States
  const [searchDestination, setSearchDestination] = useState('');
  
  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([50, 2000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // --- LOGIC: SORTING & FILTERING ---
  
  // 1. Sort Logic: Prioritize Pro/Premium (Flutter Parity)
  const sortHotels = (hotels: Hotel[]) => {
    return [...hotels].sort((a, b) => {
      const isAPro = a.isPro || a.planTier === 'pro' || a.planTier === 'premium';
      const isBPro = b.isPro || b.planTier === 'pro' || b.planTier === 'premium';
      if (isAPro && !isBPro) return -1;
      if (!isAPro && isBPro) return 1;
      return 0;
    });
  };

  // 2. Filter Logic
  useEffect(() => {
    let result = allHotels;

    // Filter by Text (City or Name)
    if (searchDestination) {
      const term = searchDestination.toLowerCase();
      result = result.filter(h => {
        const locString = typeof h.location === 'string' 
          ? h.location 
          : `${h.location?.city} ${h.location?.area}`;
        return h.name.toLowerCase().includes(term) || locString.toLowerCase().includes(term);
      });
    }

    // Filter by Price
    result = result.filter(h => 
      h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]
    );

    // Filter by Rating
    result = result.filter(h => h.rating >= minRating);

    // Filter by Amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(h => 
        selectedAmenities.every(amenity => 
          h.amenities?.includes(amenity) // Assumes h.amenities exists
        )
      );
    }

    // Apply Sorting (Pro First)
    setFilteredHotels(sortHotels(result));
  }, [allHotels, searchDestination, priceRange, minRating, selectedAmenities]);


  // --- HELPERS ---
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const getLocationString = (location: any) => {
    if (typeof location === 'string') return location;
    return `${location?.area || ''}, ${location?.city || ''}`;
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleShare = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    const url = `${window.location.origin}/hotels/${id}`;
    navigator.clipboard.writeText(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="font-sans text-slate-900 bg-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hero-bg {
          background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000');
          background-size: cover; background-position: center;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* --- TOAST NOTIFICATION --- */}
      <div className={`fixed top-5 right-5 z-50 bg-black text-white px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-400"/>
          <span className="font-bold text-sm">Link copied to clipboard!</span>
        </div>
      </div>

      {/* --- FILTER MODAL (Overlay) --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            {/* Price Filter */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">Price Range</h3>
              <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}+</span>
              </div>
              <input 
                type="range" 
                min="0" max="2000" step="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-[#0065eb] h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Rating Filter */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">Star Rating</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setMinRating(star === minRating ? 0 : star)}
                    className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-1 transition-all
                      ${minRating === star ? 'bg-[#0065eb] border-[#0065eb] text-white' : 'border-gray-200 text-slate-600 hover:border-[#0065eb]'}`}
                  >
                    {star} <Star size={12} className={minRating === star ? 'fill-white' : 'fill-slate-600'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities Filter */}
            <div className="mb-10">
              <h3 className="font-bold text-lg mb-4">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all
                      ${selectedAmenities.includes(amenity) 
                        ? 'bg-[#0065eb] border-[#0065eb] text-white' 
                        : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'}`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setPriceRange([50, 2000]);
                  setSelectedAmenities([]);
                  setMinRating(0);
                }}
                className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-900"
              >
                Reset
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="flex-[2] py-4 bg-[#0065eb] text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-[#0052c1]"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-end pb-20 px-6">
        <div className="absolute inset-0 hero-bg">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto w-full">
          <div className="mb-8">
            <span className="bg-[#0065eb] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
              Hospitality Redefined
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Wake up in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Paradise.
              </span>
            </h1>
          </div>

          {/* SEARCH & FILTER CAPSULE */}
          <div className="bg-white p-3 rounded-[2rem] shadow-2xl max-w-4xl">
            <div className="flex flex-col md:flex-row gap-2">
              
              {/* Destination Input */}
              <div className="flex-1 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-[1.5rem] px-6 py-4 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Destination</label>
                    <input 
                      type="text" 
                      value={searchDestination}
                      onChange={(e) => setSearchDestination(e.target.value)}
                      placeholder="City or Hotel Name" 
                      className="w-full bg-transparent font-bold text-slate-900 outline-none placeholder:text-gray-300" 
                    />
                  </div>
                </div>
              </div>

              {/* Filter Trigger */}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-[1.5rem] px-8 py-4 flex items-center gap-3 font-bold text-slate-700 transition-all"
              >
                <SlidersHorizontal size={20} />
                <span>Filters</span>
                {(selectedAmenities.length > 0 || minRating > 0) && (
                  <span className="bg-[#0065eb] w-2 h-2 rounded-full"></span>
                )}
              </button>

              {/* Search Button */}
              <button className="bg-[#0065eb] text-white px-8 rounded-[1.5rem] font-bold text-sm hover:bg-[#0052c1] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 py-4 md:py-0">
                <Search size={20} />
                <span className="md:hidden">Search Hotels</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= RECOMMENDED / PRO HOTELS ================= */}
      {/* This section specifically pulls from props or the filtered list where isPro is true */}
      <section className="py-24 bg-[#fafbfc] relative z-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Recommended Stays</h2>
              <p className="text-gray-500 font-medium">Verified partners with exclusive benefits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Filter 'featuredHotels' to ensure they are actually Pro, or fallback to top 3 filtered */}
            {sortHotels(featuredHotels.length > 0 ? featuredHotels : allHotels).slice(0, 3).map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} onShare={handleShare} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= ALL LISTINGS (FILTERED) ================= */}
      <section className="py-24 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-black text-slate-900">Explore All Stays</h2>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">
              {filteredHotels.length} results
            </span>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredHotels.map((hotel) => (
                 <HotelListCard key={hotel.id} hotel={hotel} onShare={handleShare} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem]">
              <div className="mb-4 inline-block p-4 bg-white rounded-full shadow-sm">
                <Search size={32} className="text-gray-300"/>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No hotels found</h3>
              <p className="text-gray-500">Try adjusting your filters or search destination.</p>
              <button 
                onClick={() => {
                  setPriceRange([50, 2000]);
                  setSelectedAmenities([]);
                  setMinRating(0);
                  setSearchDestination('');
                }}
                className="mt-6 text-[#0065eb] font-bold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

// --- SUB-COMPONENT: FEATURED CARD ---
const HotelCard = ({ hotel, onShare }: { hotel: Hotel, onShare: any }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const getLocationString = (location: any) => {
    if (typeof location === 'string') return location;
    return `${location?.area || ''}, ${location?.city || ''}`;
  };

  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative">
       {/* Share Button (Absolute) */}
       <button 
        onClick={(e) => onShare(e, hotel.id)}
        className="absolute top-4 right-4 z-20 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 p-2.5 rounded-full transition-all"
      >
        <Share2 size={18} />
      </button>

      <Link href={`/hotels/${hotel.id}`} className="block">
        <div className="h-72 overflow-hidden relative">
          <Image 
            src={hotel.images[0] || 'https://placehold.co/600x400'} 
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black text-slate-900">{hotel.rating.toFixed(1)}</span>
          </div>
          {(hotel.isPro || hotel.planTier === 'premium' || hotel.planTier === 'pro') && (
            <div className="absolute bottom-4 left-4 bg-[#0065eb] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <ShieldCheck size={12} /> Partner
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-[#0065eb] transition-colors">{hotel.name}</h3>
          <p className="text-gray-400 text-xs font-bold mb-6 flex items-center gap-1">
            <MapPin size={12} /> {getLocationString(hotel.location)}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <div>
              <span className="text-2xl font-black text-slate-900">{formatPrice(hotel.pricePerNight)}</span>
              <span className="text-gray-400 text-xs font-bold ml-1">/ night</span>
            </div>
            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold group-hover:bg-[#0065eb] transition-colors">
              Book Now
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// --- SUB-COMPONENT: LIST CARD ---
const HotelListCard = ({ hotel, onShare }: { hotel: Hotel, onShare: any }) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const getLocationString = (location: any) => {
    if (typeof location === 'string') return location;
    return `${location?.area || ''}, ${location?.city || ''}`;
  };

  return (
    <div className="group relative">
      <Link href={`/hotels/${hotel.id}`} className="block">
        <div className="h-64 rounded-[2rem] overflow-hidden relative mb-4">
          <Image 
            src={hotel.images[0] || 'https://placehold.co/600x400'} 
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
          
          {/* Share Button on Hover */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              onShare(e, hotel.id);
            }}
            className="absolute top-3 right-3 bg-white/30 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
          >
            <Share2 size={16} />
          </button>
        </div>
        
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#0065eb] transition-colors line-clamp-1">{hotel.name}</h3>
            <span className="flex items-center text-xs font-bold text-slate-900 gap-1 bg-gray-100 px-2 py-1 rounded-md">
              <Star size={10} className="fill-black" /> {hotel.rating}
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium mt-1 mb-3">{getLocationString(hotel.location)}</p>
          
          <div className="flex items-center justify-between">
            <p className="text-slate-900 font-black">{formatPrice(hotel.pricePerNight)} <span className="text-gray-400 font-normal text-xs">/ night</span></p>
            <span className="text-[#0065eb] text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Book <ArrowRight size={12}/>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HotelsUI;