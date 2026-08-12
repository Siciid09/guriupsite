'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LocationSelectorModal, { LocationResult } from '@/components/LocationSelectorModal';
import { 
  MapPin, Users, Search, 
  CheckCircle, Star, ArrowRight, ShieldCheck, 
  Wifi, Coffee, Award, SlidersHorizontal, X, Share2, 
  Utensils, Car, Dumbbell, Wind, ChevronDown, Sparkles, 
  Heart, Briefcase, AlertCircle, Tv, Waves, Shield, 
  Bed, PhoneCall, Zap, Clock, BatteryCharging, Compass, ExternalLink,
  ChevronLeft, ChevronRight,
  Camera, RotateCcw
} from 'lucide-react';
import MapUI from './mapui';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import Cities from './cities';

// --- CARD AUTO & MANUAL IMAGE SLIDESHOW COMPONENT ---
const CardImageSlider = ({ images = [], alt = '' }: { images: string[]; alt: string }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/600x400'];

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % safeImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [safeImages.length, currentIdx]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % safeImages.length);
  };

  return (
    <>
      <img
        src={safeImages[currentIdx]}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {safeImages.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <button
              onClick={handlePrev}
              className="w-6 h-6 bg-white/50 hover:bg-white rounded-full flex items-center justify-center text-slate-800 backdrop-blur-sm transition-colors shadow-sm pointer-events-auto"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={handleNext}
              className="w-6 h-6 bg-white/50 hover:bg-white rounded-full flex items-center justify-center text-slate-800 backdrop-blur-sm transition-colors shadow-sm pointer-events-auto"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-md z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 pointer-events-none">
            <Camera size={10} /> {currentIdx + 1} / {safeImages.length}
          </div>
        </>
      )}
    </>
  );
};

// =======================================================================
//  TYPES & CONSTANTS
// =======================================================================
interface Hotel {
  id?: string;
  _id?: string;
  slug?: string;
  name: string;
  title?: string;
  description?: string;
  pricePerNight?: number;
  price?: number;
  displayPrice?: number;
  images: string[];
  location: any;
  rating: number;
  reviewCount?: number;
  planTier?: string;
  isPro?: boolean;
  amenities?: string[];
  type?: string; 
  ownerName?: string;
  contactPhone?: string | null;
}

interface HotelsUIProps {
  featuredHotels: Hotel[];
  allHotels: Hotel[];
}

const FAVORITES_STORAGE_KEY = 'guriup_favorites';

const AMENITIES_LIST = [
  'Wi-Fi', 'Swimming Pool', 'Gym', 'Restaurant', 
  'Parking', 'Air Conditioning', 'Free Breakfast',
  'Airport Shuttle', 'Spa & Wellness', 'Bar & Lounge',
  'Beachfront', '24/7 Room Service', 'Pet Friendly',
  'Conference Facilities', 'Laundry Service', 'EV Charging',
  'Ocean View', 'Backup Generator'
];

const HOTEL_TYPES = [
  'Business Hotel', 'Airport Hotel', 'Boutique Hotel', 
  'Luxury Hotel', 'Budget/Economy Hotel', 'Extended Stay Hotel', 
  'Resort Hotel', 'Suite Hotel', 'Heritage/Historic Hotel', 
  'Conference/Convention Hotel', 'Casino Hotel', 'Eco-Hotel', '5 Star'
];

const getAmenityIcon = (amenity: string) => {
  const a = amenity.toLowerCase();
  if (a.includes('wi-fi') || a.includes('internet')) return <Wifi size={14} />;
  if (a.includes('pool') || a.includes('swimming')) return <Wind size={14} />;
  if (a.includes('gym') || a.includes('fitness')) return <Dumbbell size={14} />;
  if (a.includes('restaurant') || a.includes('dining')) return <Utensils size={14} />;
  if (a.includes('parking')) return <Car size={14} />;
  if (a.includes('coffee') || a.includes('breakfast')) return <Coffee size={14} />;
  if (a.includes('air') || a.includes('ac')) return <Sparkles size={14} />;
  if (a.includes('shuttle')) return <Car size={14} />;
  if (a.includes('spa')) return <Sparkles size={14} />;
  if (a.includes('generator') || a.includes('power')) return <Zap size={14} />;
  return <CheckCircle size={14} />;
};

const truncateWords = (text: string, maxWords: number = 15) => {
  if (!text) return 'Experience ultimate comfort and world-class hospitality during your stay.';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
};

// =======================================================================
//  MAIN COMPONENT
// =======================================================================
export default function HotelsUI({ featuredHotels = [], allHotels = [] }: HotelsUIProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(() => {
    const cityParam = searchParams.get('city');
    return cityParam ? { city: cityParam } : null;
  });

  // Listen to URL changes to update filter instantly
  useEffect(() => {
    const cityParam = searchParams.get('city');
    if (cityParam) setSelectedLocation({ city: cityParam });
  }, [searchParams]);

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // Pagination for Recommended Stays (Featured)
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const featuredItemsPerPage = 6;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) setIsTypeDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load favorites from localStorage immediately — works instantly, even for guests
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch (err) {
      console.error('Failed to read local favorites', err);
    }
  }, []);

  // If logged in, merge with DB favorites — this is the source your dashboard should query
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/favorites', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const dbFavorites: string[] = data.favorites || [];
        setFavorites(prev => {
          const merged = Array.from(new Set([...prev, ...dbFavorites]));
          try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(merged)); } catch {}
          return merged;
        });
      } catch (err) {
        console.error('Failed to sync favorites from server', err);
      }
    })();
  }, [user]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchType('');
    setSelectedLocation(null);
    setPriceRange([0, 2000]);
    setSelectedAmenities([]);
    setMinRating(0);
  };

  const applyFilters = (hotels: Hotel[]) => {
    return hotels.filter(h => {
      const hName = (h.name || h.title || '').toLowerCase();
      const hDesc = (h.description || '').toLowerCase();
      const hType = (h.type || '').toLowerCase();
      const hOwner = (h.ownerName || '').toLowerCase();
      const price = h.pricePerNight || h.price || h.displayPrice || 0;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const locCity = typeof h.location === 'string' ? h.location : h.location?.city;
        const locArea = typeof h.location === 'object' ? h.location?.area : '';
        const locAddr = typeof h.location === 'object' ? h.location?.address : '';

        const matchesName = hName.includes(q);
        const matchesDesc = hDesc.includes(q);
        const matchesType = hType.includes(q);
        const matchesCity = (locCity || '').toLowerCase().includes(q);
        const matchesArea = (locArea || '').toLowerCase().includes(q);
        const matchesAddress = (locAddr || '').toLowerCase().includes(q);
        const matchesOwner = hOwner.includes(q);
        const matchesPrice = price.toString().includes(q);
        const matchesAmenities = h.amenities?.some(a => a.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesType && !matchesCity && !matchesArea && !matchesAddress && !matchesOwner && !matchesPrice && !matchesAmenities) {
          return false;
        }
      }

      if (selectedLocation?.city) {
        const targetCity = selectedLocation.city.toLowerCase();
        const targetDistrict = selectedLocation.district?.toLowerCase();
        
        const locIsString = typeof h.location === 'string';
        const cityMatch = locIsString 
          ? (h.location || '').toLowerCase().includes(targetCity)
          : (h.location?.city || '').toLowerCase() === targetCity;
          
        if (!cityMatch) return false;

        if (targetDistrict) {
          const districtMatch = locIsString
            ? (h.location || '').toLowerCase().includes(targetDistrict)
            : (h.location?.area || '').toLowerCase() === targetDistrict;
          if (!districtMatch) return false;
        }
      }

      if (searchType) {
        const typeMatch = hType === searchType.toLowerCase();
        const nameMatch = hName.includes(searchType.toLowerCase());
        if (!typeMatch && !nameMatch) return false;
      }

      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (minRating > 0 && (h.rating || 0) < minRating) return false;

      if (selectedAmenities.length > 0) {
        if (!selectedAmenities.every(a => h.amenities?.includes(a))) return false;
      }

      return true;
    });
  };

  const sortHotels = (hotels: Hotel[]) => {
    return [...hotels].sort((a, b) => {
      const isAPro = a.isPro || a.planTier === 'pro' || a.planTier === 'premium';
      const isBPro = b.isPro || b.planTier === 'pro' || b.planTier === 'premium';
      if (isAPro && !isBPro) return -1;
      if (!isAPro && isBPro) return 1;
      return 0;
    });
  };

  const filteredFeaturedHotels = useMemo(() => sortHotels(applyFilters(featuredHotels)), [featuredHotels, searchQuery, selectedLocation, searchType, priceRange, minRating, selectedAmenities]);
  const filteredAllHotels = useMemo(() => sortHotels(applyFilters(allHotels)), [allHotels, searchQuery, selectedLocation, searchType, priceRange, minRating, selectedAmenities]);

  // Featured Pagination Logic
  const maxFeaturedIdx = Math.max(0, filteredFeaturedHotels.length - featuredItemsPerPage);
  const currentFeatured = filteredFeaturedHotels.slice(featuredIdx, featuredIdx + featuredItemsPerPage);
  const nextFeatured = () => setFeaturedIdx(prev => Math.min(prev + featuredItemsPerPage, maxFeaturedIdx));
  const prevFeatured = () => setFeaturedIdx(prev => Math.max(prev - featuredItemsPerPage, 0));

  const handleShare = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const url = `${window.location.origin}/hotels/${id}`;
    navigator.clipboard.writeText(url);
    triggerToast('Link copied to clipboard!');
  };

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    const isFav = favorites.includes(id);
    const updated = isFav ? favorites.filter(favId => favId !== id) : [...favorites, id];

    // 1. Instant UI + localStorage (works offline / guest)
    setFavorites(updated);
    try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated)); } catch {}
    triggerToast(isFav ? 'Removed from favorites' : 'Added to favorites');

    // 2. Persist to DB so the dashboard can read it
    if (user) {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/favorites', {
          method: isFav ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ hotelId: id })
        });
      } catch (err) {
        console.error('Failed to sync favorite to server', err);
      }
    }
  };

  const triggerToast = (msg: string) => {
    setShowToast({ show: true, message: msg });
    setTimeout(() => setShowToast({ show: false, message: '' }), 3000);
  };

  return (
    <div className="font-sans text-slate-900 bg-[#FAFBFC] overflow-x-hidden min-h-screen">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hero-bg {
          background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000');
          background-size: cover; background-position: center;
        }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,1); }
        .title-underline { position: relative; display: inline-block; }
        .title-underline::after {
            content: ''; display: block; width: 60px; height: 6px; 
            background: #0065eb; margin-top: 8px; border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-scroll {
          animation: marquee-scroll 40s linear infinite;
        }
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      <div className={`fixed top-5 right-5 z-[99999] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl transition-all duration-300 ${showToast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <CheckCircle size={18} className="text-green-400"/> {showToast.message}
        </div>
      </div>

      {/* FLOATING VIEW MAP / LIST TOGGLE BUTTON */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999]">
        <button 
          onClick={() => setViewMode(prev => prev === 'list' ? 'map' : 'list')}
          className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 backdrop-blur-xl border border-white/20 transition-all transform hover:scale-105 active:scale-95 group"
        >
          {viewMode === 'list' ? (
            <>
              <Compass size={18} className="text-[#0065eb] group-hover:rotate-45 transition-transform" /> View Map
            </>
          ) : (
            <>
              <SlidersHorizontal size={18} className="text-[#0065eb]" /> View List
            </>
          )}
        </button>
      </div>

      {/* ================= EXPANDED MODERN FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-2xl font-black flex items-center gap-2"><SlidersHorizontal size={24} className="text-[#0065eb]"/> Advanced Hotel Search</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
              {/* PRICE RANGE */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Price Per Night</h3>
                <div className="flex justify-between text-lg font-black mb-2 text-[#0065eb]"><span>${priceRange[0]}</span><span>${priceRange[1]}+</span></div>
                <input type="range" min="0" max="2000" step="50" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-[#0065eb] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
              </div>

              {/* STAR RATING */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Minimum Rating</h3>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5, 5].map(rating => (
                    <button key={`rating-${rating}`} onClick={() => setMinRating(rating)} className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${minRating === rating ? 'bg-[#0065eb] text-white border-[#0065eb] shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                      <Star size={12} className={minRating === rating ? 'fill-white' : 'fill-amber-400 text-amber-400'} />
                      {rating === 0 ? 'Any' : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* HOTEL TYPES */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Property Type</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSearchType('')} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${searchType === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>All Types</button>
                  {HOTEL_TYPES.map(type => (
                    <button key={type} onClick={() => setSearchType(searchType === type ? '' : type)} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${searchType === type ? 'bg-[#0065eb] text-white border-[#0065eb]' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{type}</button>
                  ))}
                </div>
              </div>

              {/* COMPLETE AMENITIES */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Hotel Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((a) => (
                    <button key={a} onClick={() => setSelectedAmenities(prev => prev.includes(a) ? prev.filter(item => item !== a) : [...prev, a])} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${selectedAmenities.includes(a) ? 'bg-[#0065eb] border-[#0065eb] text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      {getAmenityIcon(a)} {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
               <button onClick={handleResetFilters} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Reset All</button>
               <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black shadow-lg transition-colors flex items-center justify-center gap-2">Show {filteredAllHotels.length} Results</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONDITIONAL VIEW: MAP OR LIST ================= */}
      {viewMode === 'map' ? (
        <div className="w-full h-screen pt-[80px]">
          <MapUI />
        </div>
      ) : (
        <>
          {/* ================= HERO SECTION ================= */}
          <section className="relative md:h-[45vh] min-h-[580px] md:min-h-[420px] flex flex-col justify-center items-center text-center px-4 pb-12 md:pb-0">
            <div className="absolute inset-0 hero-bg"><div className="absolute inset-0 bg-black/80"></div></div>
            <div className="relative z-40 max-w-[1400px] mx-auto w-full flex flex-col items-center pt-5 mt-8 md:mt-0">
              <div className="mb-3 px-3 py-1 rounded-full bg-blue-900/40 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-400" />
                <span className="text-white text-[10px] md:text-xs font-black uppercase tracking-[0.1em]">Hospitality Redefined</span>
              </div>
              <h1 className="text-white text-[7.5vw] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-3 tracking-tight leading-[1.0] whitespace-nowrap">Find Your <span className="text-[#0065eb]">Perfect Stay</span></h1>
              <p className="text-gray-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-8 max-w-[800px]">Luxury hotels, resorts & suites across the Horn of Africa.</p>

              {/* Reset Filters Quick Action */}
              <div className="w-full max-w-5xl mx-auto flex justify-end mb-2 relative z-[9999]">
                <button onClick={handleResetFilters} className="text-[11px] font-bold text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  <RotateCcw size={12} /> Reset Filters
                </button>
              </div>

              {/* === MODERN UNIFIED SEARCH PILL === */}
              <div className="bg-white p-2.5 rounded-[2rem] md:rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center w-full max-w-5xl mx-auto relative z-[9999]">
                
                {/* 1. Keyword Search */}
                <div className="flex-[1.2] w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors relative group">
                  <Search className="text-[#0065eb] shrink-0 mr-3" size={20} />
                  <div className="flex-1 flex flex-col justify-center overflow-hidden">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Search Keywords</p>
                    <input 
                      type="text" 
                      placeholder="Hotel name, amenities..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full font-bold text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-300 truncate"
                    />
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full absolute right-4"><X size={14}/></button>
                  )}
                </div>

                <div className="hidden md:block w-[1px] h-10 bg-slate-200 shrink-0 mx-1"></div>
                <div className="w-full h-[1px] bg-slate-100 md:hidden my-1"></div>

                {/* 2. Location Dropdown */}
                <div className="flex-1 w-full relative">
                  <div className="w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors text-left group relative">
                    <div className="flex-1 flex items-center cursor-pointer" onClick={() => setIsLocationModalOpen(true)}>
                      <MapPin className="text-[#0065eb] shrink-0 mr-3" size={20} />
                      <div className="flex-1 flex flex-col justify-center overflow-hidden">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Location</p>
                        <span className="font-bold text-sm text-slate-900 truncate pr-6">
                          {selectedLocation ? `${selectedLocation.city}${selectedLocation.district ? `, ${selectedLocation.district}` : ''}` : 'Any Location'}
                        </span>
                      </div>
                    </div>
                    {selectedLocation ? (
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); }} className="absolute right-4 p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 z-10 transition-colors">
                        <X size={14} />
                      </button>
                    ) : (
                      <ChevronDown size={14} className="absolute right-4 text-slate-400 group-hover:text-slate-600 pointer-events-none" />
                    )}
                  </div>
                  <LocationSelectorModal 
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onSelect={(res) => setSelectedLocation(res)}
                    lang="en"
                  />
                </div>

                <div className="hidden md:block w-[1px] h-10 bg-slate-200 shrink-0 mx-1"></div>
                <div className="w-full h-[1px] bg-slate-100 md:hidden my-1"></div>

                {/* 3. Hotel Type Selector */}
                <div className="flex-1 w-full relative" ref={typeRef}>
                  <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors text-left group">
                    <Briefcase className="text-[#0065eb] shrink-0 mr-3" size={20} />
                    <div className="flex-1 flex flex-col justify-center overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Hotel Type</p>
                      <span className="font-bold text-sm text-slate-900 truncate">{searchType || 'Any Type'}</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </button>
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] max-h-60 overflow-y-auto custom-scrollbar border border-slate-100">
                      <button onClick={() => { setSearchType(''); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">All Types</button>
                      {HOTEL_TYPES.map((t) => <button key={t} onClick={() => { setSearchType(t); setIsTypeDropdownOpen(false); }} className="w-full text-left p-3 rounded-[1rem] hover:bg-slate-50 font-bold text-sm text-slate-900">{t}</button>)}
                    </div>
                  )}
                </div>

                {/* 4. Action Buttons */}
                <div className="flex items-center gap-2 pl-2 md:pl-4 pr-1 md:pr-1 w-full md:w-auto mt-2 md:mt-0 pb-1 md:pb-0 shrink-0">
                  <button onClick={() => setIsFilterOpen(true)} className="w-14 md:w-12 h-14 md:h-12 flex items-center justify-center rounded-full border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-blue-600 transition-all bg-white shadow-sm" title="Advanced Filters">
                    <SlidersHorizontal size={18} />
                  </button>
                  <button className="flex-1 md:w-32 h-14 md:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-blue-500/40 flex items-center justify-center gap-2">
                    Search
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* ================= PREMIUM GLASSMORPHISM MARQUEE ================= */}
          <div className="relative w-full border-b border-slate-200/60 bg-gradient-to-r from-blue-50/90 via-white/95 to-blue-50/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,101,235,0.06)] z-30 overflow-hidden flex items-center h-12 md:h-14 -mt-4 md:-mt-6 rounded-b-[1.5rem] md:rounded-b-[2rem]">
            {/* Left & Right gradient fades for smooth enter/exit of text */}
            <div className="absolute inset-y-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <div className="flex w-max animate-marquee-scroll items-center">
              {/* Duplicate array for seamless infinite scrolling loop */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center">
                  {[
                    "Verified Properties", "Real Guest Reviews", "Curated Stays", 
                    "Trusted by Travelers", "Exceptional Hospitality", "Book with Confidence", 
                    "Premium Stays", "Guest-Approved Hotels"
                  ].map((word, idx) => (
                    <div key={`${i}-${idx}`} className="flex items-center group cursor-default">
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-[#0065eb] whitespace-nowrap mx-6 md:mx-8">
                        {word}
                      </span>
                      <Sparkles size={14} className="text-blue-300 group-hover:text-amber-400 transition-colors" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* POPULAR DESTINATIONS CAROUSEL */}
          <Cities />

          {/* RECOMMENDED SECTION (MODERNIZED & PAGINATED) */}
          <section className="pt-0 pb-8 md:pb-10 bg-[#fafbfc] relative z-10">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight title-underline">Recommended Stays</h2>
                  <p className="text-gray-500 font-medium mt-4">Verified partners with exclusive benefits and premium locations.</p>
                </div>
              </div>

              {filteredFeaturedHotels.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentFeatured.map((h, i) => (
                      <HotelCard key={h.id || h._id || `feat-${i}`} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id || h._id || '')} onToggleFavorite={toggleFavorite} />
                    ))}
                  </div>

                  {/* PAGINATION CONTROLS */}
                  {filteredFeaturedHotels.length > featuredItemsPerPage && (
                    <div className="flex justify-center items-center gap-4 mt-12">
                      <button onClick={prevFeatured} disabled={featuredIdx === 0} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">
                        <ChevronLeft size={20} className="text-slate-600"/>
                      </button>
                      <div className="flex items-center gap-1.5">
                         {Array.from({ length: Math.ceil(filteredFeaturedHotels.length / featuredItemsPerPage) }).map((_, i) => (
                            <div key={`dot-${i}`} className={`w-2 h-2 rounded-full transition-all duration-300 ${Math.floor(featuredIdx / featuredItemsPerPage) === i ? 'bg-[#0065eb] w-4' : 'bg-slate-300'}`} />
                         ))}
                      </div>
                      <button onClick={nextFeatured} disabled={featuredIdx >= maxFeaturedIdx} className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm">
                        <ChevronRight size={20} className="text-slate-600"/>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full p-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                  <AlertCircle size={40} className="text-slate-300 mb-3" />
                  <p className="text-gray-500 font-bold">No verified partner stays match your current search criteria.</p>
                </div>
              )}
            </div>
          </section>

          {/* ALL LISTINGS */}
          <section className="pt-6 pb-16 md:pt-8 md:pb-20 bg-white">
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 title-underline">Explore All Stays</h2>
                  <p className="text-gray-500 font-medium mt-4">Browse our complete collection of exceptional properties.</p>
                </div>
                <span className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider hidden md:block">{filteredAllHotels.length} Results</span>
              </div>

              {filteredAllHotels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredAllHotels.map((h, i) => (
                      <HotelListCard key={h.id || h._id || `all-${i}`} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id || h._id || '')} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">No hotels found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or keyword query.</p>
                  <button onClick={handleResetFilters} className="mt-4 px-6 py-3 bg-white border border-slate-200 text-[#0065eb] font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm">Clear all filters</button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// =======================================================================
// SUB-COMPONENTS
// =======================================================================

// MODERNIZED FEATURED HOTEL CARD (Reduced Height & Premium Styling)
const HotelCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: any) => {
  const isPro = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
  const locationText = typeof hotel.location === 'string' 
    ? hotel.location 
    : [hotel.location?.city, hotel.location?.country].filter(Boolean).join(', ');
  const ratingVal = Number(hotel.rating || 4.5).toFixed(1);
  const reviewCount = hotel.reviewCount ?? 0;
  const fromPrice = hotel.fromPrice ?? hotel.pricePerNight ?? hotel.price ?? hotel.displayPrice ?? 0;
  const topAmenities = (hotel.amenities || []).slice(0, 3);

  return (
    <div className="group relative bg-white/90 backdrop-blur-md rounded-[2rem] overflow-hidden border border-blue-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,101,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full">
       
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button onClick={(e) => onToggleFavorite(e, hotel.id || hotel._id)} className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white hover:text-red-500'}`}><Heart size={14} className={isFavorite ? 'fill-white' : ''} /></button>
            <button onClick={(e) => onShare(e, hotel.id || hotel._id)} className="bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 hover:text-slate-900 p-2.5 rounded-full transition-all shadow-md"><Share2 size={14} /></button>
       </div>

      <Link href={`/hotels/${hotel.slug || hotel.id || hotel._id}`} className="block flex-1 flex flex-col">
        {/* Framed image: blue stroke lives on the OUTER wrapper with padding, so there's a white gap before the photo instead of the border sitting flush on it */}
        <div className="h-48 md:h-52 m-2 rounded-[1.5rem] border border-[#0065eb] p-1 bg-white">
          <div className="w-full h-full overflow-hidden relative bg-slate-200 rounded-[1.15rem]">
            <CardImageSlider images={hotel.images} alt={hotel.name || hotel.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 z-0 pointer-events-none" />

            {/* Verified badge + top amenity icons, stacked top-left so they never collide */}
            <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
              {isPro && (
                <div className="bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Verified
                </div>
              )}
              {topAmenities.length > 0 && (
                <div className="flex gap-1.5">
                  {topAmenities.map((am: string, i: number) => (
                    <div key={am || `icon-${i}`} title={am} className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                      {getAmenityIcon(am)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Name + location — bigger, city + country, on the image */}
            <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
              <h3 className="text-white text-lg font-black line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{hotel.name || hotel.title}</h3>
              <p className="text-white/90 text-sm font-bold mt-1 flex items-center gap-1 min-w-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <MapPin size={15} className="shrink-0"/> <span className="truncate">{locationText}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* COMPACT PADDING: p-5 instead of p-7 */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0065eb] bg-blue-50 px-2.5 py-1 rounded-full">{hotel.type || 'Luxury Hotel'}</span>
            </div>

            <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-4 line-clamp-2">
              {truncateWords(hotel.description, 15)}
            </p>

            {/* Up to 6 amenities, wraps instead of clipping */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(hotel.amenities?.slice(0, 6) || []).map((am: string, i: number) => (
                <div key={am || `am-${i}`} className="flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-lg whitespace-nowrap">
                  {getAmenityIcon(am)} {am}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`star-${i}`} size={10} className={i < Math.floor(hotel.rating || 5) ? "fill-amber-400" : "text-slate-300"} />
                  ))}
                </div>
                <span className="text-[11px] font-black text-slate-800">{ratingVal}</span>
                <span className="text-[10px] font-bold text-slate-400">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[9px] font-bold uppercase block">From</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">${fromPrice}</span>
                <span className="text-slate-400 text-[10px] font-bold ml-1 uppercase">/ night</span>
              </div>
              <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider group-hover:bg-[#0065eb] transition-colors shadow-lg shadow-slate-900/10">View Stay</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const HotelListCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: any) => {
  const isPro = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
  const locationText = typeof hotel.location === 'string' 
    ? hotel.location 
    : [hotel.location?.city, hotel.location?.country].filter(Boolean).join(', ');
  const ratingVal = Number(hotel.rating || 4.5).toFixed(1);
  const reviewCount = hotel.reviewCount ?? 0;
  const fromPrice = hotel.fromPrice ?? hotel.pricePerNight ?? hotel.price ?? hotel.displayPrice ?? 0;
  const topAmenities = (hotel.amenities || []).slice(0, 3);

  return (
    <div className="group relative bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3.5 flex flex-col justify-between">
      <Link href={`/hotels/${hotel.slug || hotel.id || hotel._id}`} className="block flex-1 flex flex-col">
        {/* Framed image: blue stroke on the outer wrapper, small white gap before the photo */}
        <div className="h-52 rounded-[1.5rem] border border-[#0065eb] p-1 bg-white mb-4">
          <div className="w-full h-full overflow-hidden relative bg-slate-200 rounded-[1.15rem]">
            <CardImageSlider images={hotel.images} alt={hotel.name || hotel.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 z-0 pointer-events-none" />
            <div className="absolute top-3 right-3 flex gap-2 z-20">
                 <button onClick={(e) => onToggleFavorite(e, hotel.id || hotel._id)} className={`p-2 rounded-full backdrop-blur-md shadow-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white hover:text-red-500'}`}><Heart size={14} className={isFavorite ? 'fill-white' : ''}/></button>
                 <button onClick={(e) => { e.preventDefault(); onShare(e, hotel.slug || hotel.id || hotel._id); }} className="bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 p-2 rounded-full backdrop-blur-md shadow-md"><Share2 size={14} /></button>
            </div>

            <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
              {isPro && (
                <div className="bg-blue-600/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg">
                  Verified
                </div>
              )}
              {topAmenities.length > 0 && (
                <div className="flex gap-1.5">
                  {topAmenities.map((am: string, i: number) => (
                    <div key={am || `icon-${i}`} title={am} className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                      {getAmenityIcon(am)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
              <h3 className="text-white font-black text-base line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{hotel.name || hotel.title}</h3>
              <p className="text-white/90 text-[13px] font-bold mt-1 flex items-center gap-1 min-w-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <MapPin size={14} className="shrink-0"/> <span className="truncate">{locationText}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="px-2 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-slate-500 text-[11px] font-medium line-clamp-2 mb-4">{truncateWords(hotel.description, 12)}</p>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-3 pt-3 border-t border-slate-100">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={`star-list-${i}`} size={10} className={i < Math.floor(hotel.rating || 5) ? "fill-amber-400" : "text-slate-300"} />
                ))}
              </div>
              <span className="text-[10px] font-black text-slate-800">{ratingVal}</span>
              <span className="text-[9px] font-bold text-slate-400">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold text-[9px] uppercase block">From</span>
                <span className="text-slate-900 font-black text-lg">${fromPrice}</span>
                <span className="text-slate-400 font-bold text-[10px] ml-1">/ night</span>
              </div>
              <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-[#0065eb] group-hover:text-white transition-all shadow-sm"><ArrowRight size={14}/></span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};