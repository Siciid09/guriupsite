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
  ChevronLeft, ChevronRight
} from 'lucide-react';
import MapUI from './mapui';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

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

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(id);
      triggerToast(isFav ? 'Removed from favorites' : 'Added to favorites');
      return isFav ? prev.filter(favId => favId !== id) : [...prev, id];
    });
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
               <button onClick={() => { setPriceRange([0, 2000]); setSelectedAmenities([]); setMinRating(0); setSelectedLocation(null); setSearchType(''); setSearchQuery(''); }} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Reset All</button>
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
          <section className="relative h-[65vh] min-h-[600px] flex flex-col justify-center items-center text-center px-4">
            <div className="absolute inset-0 hero-bg"><div className="absolute inset-0 bg-black/80"></div></div>
            <div className="relative z-20 max-w-[1400px] mx-auto w-full flex flex-col items-center pt-5">
              <div className="mb-4 px-4 py-1.5 rounded-full bg-blue-900/40 backdrop-blur-md border border-white/20 shadow-2xl flex items-center gap-2">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-white text-[0.8rem] font-black uppercase tracking-[0.1em]">Hospitality Redefined</span>
              </div>
              <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight leading-[1.0]">Find Your <br /><span className="text-[#0065eb]">Perfect Stay</span></h1>
              <p className="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-widest mb-12 max-w-[900px]">Luxury hotels, resorts & suites across the Horn of Africa.</p>

              {/* RESPONSIVE SEARCH CAPSULE (EXPANDED WIDTH) */}
              <div className="glass-card p-2 md:p-3 rounded-[2.5rem] shadow-2xl w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-center relative z-[50] gap-2">
                
                {/* Keyword Search Input */}
                <div className="flex-[1.5] w-full">
                  <div className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white text-left transition-all border border-transparent focus-within:border-blue-200 focus-within:bg-white">
                    <Search className="text-[#0065eb] shrink-0" size={20} />
                    <div className="flex-1 overflow-hidden">
                       <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Search Keywords</p>
                       <input 
                         type="text" 
                         placeholder="Hotel name, address, amenities..." 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="w-full font-bold text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-400 h-full py-2 md:py-0"
                       />
                    </div>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"><X size={14}/></button>
                    )}
                  </div>
                </div>

                {/* Location Selector Trigger */}
                <div className="flex-1 w-full relative">
                  <button onClick={() => setIsLocationModalOpen(true)} className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white transition-all text-left">
                    <MapPin className="text-[#0065eb] shrink-0" size={20} />
                    <div className="flex-1 overflow-hidden">
                       <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Destination</p>
                       <span className="font-bold text-sm text-slate-900 truncate block">
                         {selectedLocation ? `${selectedLocation.city}${selectedLocation.district ? `, ${selectedLocation.district}` : ''}` : 'Anywhere'}
                       </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  
                  <LocationSelectorModal 
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onSelect={(res) => setSelectedLocation(res)}
                    lang="en"
                  />
                </div>

                {/* Hotel Type Selector */}
                <div className="flex-1 w-full relative" ref={typeRef}>
                  <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white transition-all text-left">
                    <Briefcase className="text-orange-500 shrink-0" size={20} />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Hotel Type</p>
                      <span className="font-bold text-sm text-slate-900 truncate block">{searchType || 'Any Type'}</span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] max-h-60 overflow-y-auto custom-scrollbar border border-slate-100">
                      <button onClick={() => { setSearchType(''); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">All Types</button>
                      {HOTEL_TYPES.map((t) => <button key={t} onClick={() => { setSearchType(t); setIsTypeDropdownOpen(false); }} className="w-full text-left p-3 rounded-[1rem] hover:bg-slate-50 font-bold text-sm text-slate-900">{t}</button>)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="w-full md:w-auto flex gap-2 h-14 md:h-full">
                  <button onClick={() => setIsFilterOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-14 md:w-16 rounded-[2rem] flex items-center justify-center transition-all shrink-0" title="Advanced Filters">
                    <SlidersHorizontal size={20} className="text-[#0065eb]" />
                  </button>
                  <button className="flex-1 md:w-32 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30">
                    <Search size={18} />
                    <span className="hidden md:inline">Search</span>
                  </button>
                </div>

              </div>
            </div>
          </section>

          {/* RECOMMENDED SECTION (MODERNIZED & PAGINATED) */}
          <section className="py-16 md:py-20 bg-[#fafbfc] relative z-10 border-b border-slate-100">
            <div className="max-w-[1400px] mx-auto px-6">
              <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight title-underline">Recommended Stays</h2>
                  <p className="text-gray-500 font-medium mt-4">Verified partners with exclusive benefits and premium locations.</p>
                </div>
              </div>

              {filteredFeaturedHotels.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentFeatured.map((h, i) => (
                      // Apply guaranteed unique Key
                      <HotelCard key={h.id || h._id || `feat-${i}`} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id || '')} onToggleFavorite={toggleFavorite} />
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
          <section className="py-16 md:py-20 bg-white">
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
                      <HotelListCard key={h.id || h._id || `all-${i}`} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id || '')} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900">No hotels found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or keyword query.</p>
                  <button onClick={() => { setSelectedLocation(null); setSearchType(''); setPriceRange([0, 2000]); setSelectedAmenities([]); setMinRating(0); setSearchQuery(''); }} className="mt-4 px-6 py-3 bg-white border border-slate-200 text-[#0065eb] font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm">Clear all filters</button>
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
  const locationText = typeof hotel.location === 'string' ? hotel.location : `${hotel.location?.area || ''}, ${hotel.location?.city || ''}`;
  const ratingVal = Number(hotel.rating || 4.5).toFixed(1);
  const reviewCount = hotel.reviewCount || Math.floor(Math.random() * 80) + 12;

  const price = hotel.pricePerNight || hotel.price || hotel.displayPrice || 0;

  return (
    <div className="group relative bg-white/90 backdrop-blur-md rounded-[2rem] overflow-hidden border border-blue-500/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,101,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full">
       
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button onClick={(e) => onToggleFavorite(e, hotel.id || hotel._id)} className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white hover:text-red-500'}`}><Heart size={14} className={isFavorite ? 'fill-white' : ''} /></button>
            <button onClick={(e) => onShare(e, hotel.id || hotel._id)} className="bg-white/80 backdrop-blur-md hover:bg-white text-slate-700 hover:text-slate-900 p-2.5 rounded-full transition-all shadow-md"><Share2 size={14} /></button>
       </div>

      <Link href={`/hotels/${hotel.slug || hotel.id || hotel._id}`} className="block flex-1 flex flex-col">
        {/* REDUCED HEIGHT: h-48 md:h-52 instead of h-72 */}
        <div className="h-48 md:h-52 overflow-hidden relative bg-slate-200 m-2 rounded-[1.5rem]">
          <Image src={hotel.images?.[0] || 'https://placehold.co/600x400'} alt={hotel.name || hotel.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          {isPro && <div className="absolute bottom-3 left-3 bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5"><ShieldCheck size={12} /> Verified</div>}
        </div>
        
        {/* COMPACT PADDING: p-5 instead of p-7 */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0065eb] bg-blue-50 px-2.5 py-1 rounded-full">{hotel.type || 'Luxury Hotel'}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-[#0065eb] transition-colors mb-1.5">{hotel.name || hotel.title}</h3>
            <p className="text-slate-400 text-[11px] font-bold mb-3 flex items-center gap-1.5"><MapPin size={12} className="text-[#0065eb] shrink-0"/> {locationText}</p>
            
            <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-4 line-clamp-2">
              {truncateWords(hotel.description, 15)}
            </p>

            <div className="flex gap-2 mb-4 overflow-hidden">
              {(hotel.amenities?.slice(0, 3) || []).map((am: string, i: number) => (
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
                <span className="text-[10px] font-bold text-slate-400">({reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">${price}</span>
                <span className="text-slate-400 text-[10px] font-bold ml-1 uppercase">/ night</span>
              </div>
              <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider group-hover:bg-[#0065eb] transition-colors shadow-lg shadow-slate-900/10">Book</div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const HotelListCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: any) => {
  const isPro = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
  const locationText = typeof hotel.location === 'string' ? hotel.location : hotel.location?.city;
  const ratingVal = Number(hotel.rating || 4.5).toFixed(1);
  const reviewCount = hotel.reviewCount || Math.floor(Math.random() * 50) + 8;

  const price = hotel.pricePerNight || hotel.price || hotel.displayPrice || 0;

  return (
    <div className="group relative bg-white rounded-[2rem] border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-3.5 flex flex-col justify-between">
      <Link href={`/hotels/${hotel.slug || hotel.id || hotel._id}`} className="block flex-1 flex flex-col">
        <div className="h-52 rounded-[1.5rem] overflow-hidden relative mb-4 bg-slate-200">
          <Image src={hotel.images?.[0] || 'https://placehold.co/600x400'} alt={hotel.name || hotel.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-3 right-3 flex gap-2">
               <button onClick={(e) => onToggleFavorite(e, hotel.id || hotel._id)} className={`p-2 rounded-full backdrop-blur-md shadow-md ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white hover:text-red-500'}`}><Heart size={14} className={isFavorite ? 'fill-white' : ''}/></button>
               <button onClick={(e) => { e.preventDefault(); onShare(e, hotel.slug || hotel.id || hotel._id); }} className="bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 p-2 rounded-full backdrop-blur-md shadow-md"><Share2 size={14} /></button>
          </div>
        </div>
        <div className="px-2 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              {isPro ? <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">Verified</span> : <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wider">Standard</span>}
            </div>
            <h3 className="font-black text-[15px] text-slate-900 group-hover:text-[#0065eb] transition-colors line-clamp-1 mb-1">{hotel.name || hotel.title}</h3>
            <p className="text-slate-400 text-[10px] font-bold mb-2 flex items-center gap-1"><MapPin size={10} className="text-[#0065eb]"/> {locationText}</p>
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
              <span className="text-[9px] font-bold text-slate-400">({reviewCount})</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-900 font-black text-lg">${price}</span>
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