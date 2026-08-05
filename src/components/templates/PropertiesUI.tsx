'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LocationSelectorModal, { LocationResult } from '@/components/LocationSelectorModal';
import MapUI from './mapui'; // <-- IMPORTANT: Ensure this path correctly points to mapui.tsx
import { 
  MapPin, Home, Award, ShieldCheck, ChevronDown, 
  SlidersHorizontal, X, Bed, Bath, Move, Building2, 
  LandPlot, Building, Warehouse, Crown, Key, HeartHandshake, 
  Zap, Globe, ChevronLeft, ChevronRight, Search, Compass, User,
  Heart, Share2, Camera, RotateCcw
} from 'lucide-react';

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
//  TYPES
// =======================================================================

interface Property {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  price: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  isForSale: boolean; 
  status: string;
  images: string[];
  location: { city: string; area: string; };
  bedrooms: number;
  bathrooms: number;
  area?: number; 
  type: string; 
  amenities?: string[]; 
  agentId: string;
  agentName: string; 
  agentVerified: boolean; 
  planTier?: 'free' | 'pro' | 'premium'; 
  agentPlanTier?: string; 
  featured: boolean;
  createdAt: string; 
}

const PROPERTY_CATEGORIES = [
  { name: 'House', label: 'Houses', sub: 'Family', icon: <Home size={16}/>, color: 'bg-rose-50 text-rose-600' },
  { name: 'Apartment', label: 'Apartments', sub: 'Modern Flats', icon: <Building size={16}/>, color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Office', label: 'Offices', sub: 'Workspaces', icon: <MapPin size={16}/>, color: 'bg-slate-50 text-slate-600' },
  { name: 'Villa', label: 'Villas', sub: 'Elite Living', icon: <Building2 size={16}/>, color: 'bg-blue-50 text-blue-600' },
  { name: 'Penthouse', label: 'Penthouse', sub: 'Luxury', icon: <Crown size={16}/>, color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Warehouse', label: 'Storage', sub: 'Logistics', icon: <Warehouse size={16}/>, color: 'bg-amber-50 text-amber-600' },
  { name: 'Land', label: 'Land', sub: 'Investment', icon: <LandPlot size={16}/>, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Shop', label: 'Shops', sub: 'Retail', icon: <Key size={16}/>, color: 'bg-teal-50 text-teal-600' },
  { name: 'Guest House', label: 'Guest House', sub: 'Short Stay', icon: <HeartHandshake size={16}/>, color: 'bg-rose-50 text-rose-600' },
  { name: 'Commercial', label: 'Commercial', sub: 'Business', icon: <Zap size={16}/>, color: 'bg-orange-50 text-orange-600' },
];

const AMENITIES_LIST = [
  'Furnished', 'Garden', 'Balcony', 'Pool', 'Parking', 
  'Gate', 'Gym', 'Ocean View', 'AC', 'Security', 
  'Elevator', 'Meeting Room', 'Internet', 'Water Available',
  'Backup Generator', 'CCTV', 'Servant Quarters'
];

// =======================================================================
//  MAIN COMPONENT
// =======================================================================
export default function PropertiesUI({ 
  featuredProperties = [], 
  allProperties = [] 
}: { 
  featuredProperties: Property[], 
  allProperties: Property[] 
}) {
  // --- STATE ---
  const [filterTab, setFilterTab] = useState<'all' | 'buy' | 'rent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Pagination for Featured
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const itemsPerPage = 4;

  // Filter Modal Controls
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [beds, setBeds] = useState<number>(0);
  const [baths, setBaths] = useState<number>(0);
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');

  // Dropdowns
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setPriceRange([0, 1000000]);
    setSelectedCategory('All');
    setSelectedAmenities([]);
    setBeds(0);
    setBaths(0);
    setMinArea('');
    setMaxArea('');
    setSelectedLocation(null);
    setFilterTab('all');
  };

  // --- REUSABLE SUPER FILTER FUNCTION ---
  const applyFilters = (properties: Property[]) => {
    return properties.filter(p => {
      if (p.status?.toLowerCase() === 'sold' || p.status?.toLowerCase() === 'archived') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const displayPrice = (p.hasDiscount && (p.discountPrice || 0) > 0) ? p.discountPrice : p.price;
        
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        const matchesCity = p.location?.city?.toLowerCase().includes(q);
        const matchesArea = p.location?.area?.toLowerCase().includes(q);
        const matchesAgent = p.agentName?.toLowerCase().includes(q);
        const matchesType = p.type?.toLowerCase().includes(q);
        const matchesPrice = displayPrice?.toString().includes(q);
        const matchesAmenities = p.amenities?.some(a => a.toLowerCase().includes(q));

        if (!matchesTitle && !matchesDesc && !matchesCity && !matchesArea && !matchesAgent && !matchesType && !matchesPrice && !matchesAmenities) {
          return false;
        }
      }

      if (selectedLocation?.city && p.location?.city?.toLowerCase() !== selectedLocation.city.toLowerCase()) return false;
      if (selectedLocation?.district && p.location?.area?.toLowerCase() !== selectedLocation.district.toLowerCase()) return false;

      if (selectedCategory !== 'All' && p.type?.toLowerCase() !== selectedCategory.toLowerCase()) return false;

      if (filterTab === 'buy' && !p.isForSale) return false;
      if (filterTab === 'rent' && p.isForSale) return false;

      const effectivePrice = (p.hasDiscount && (p.discountPrice || 0) > 0) ? p.discountPrice : p.price;
      if ((effectivePrice || 0) < priceRange[0] || (effectivePrice || 0) > priceRange[1]) return false;

      if (beds > 0 && (p.bedrooms || 0) < beds) return false;
      if (baths > 0 && (p.bathrooms || 0) < baths) return false;

      if (minArea !== '' && (p.area || 0) < minArea) return false;
      if (maxArea !== '' && (p.area || 0) > maxArea) return false;

      if (selectedAmenities.length > 0) {
        if (!selectedAmenities.every(a => p.amenities?.includes(a))) return false;
      }

      return true;
    });
  };

  const filteredFeatured = useMemo(() => applyFilters(featuredProperties), 
    [featuredProperties, searchQuery, selectedLocation, filterTab, selectedCategory, priceRange, selectedAmenities, beds, baths, minArea, maxArea]);

  const filteredLatest = useMemo(() => applyFilters(allProperties), 
    [allProperties, searchQuery, selectedLocation, filterTab, selectedCategory, priceRange, selectedAmenities, beds, baths, minArea, maxArea]);

  // Featured Pagination Logic fixed to slide smoothly even with 5 properties
  const maxFeaturedIdx = Math.max(0, filteredFeatured.length - itemsPerPage);
  const currentFeatured = filteredFeatured.slice(featuredIdx, featuredIdx + itemsPerPage);
  const nextFeatured = () => setFeaturedIdx(prev => Math.min(prev + 1, maxFeaturedIdx));
  const prevFeatured = () => setFeaturedIdx(prev => Math.max(prev - 1, 0));

  const currentCategoryLabel = PROPERTY_CATEGORIES.find(c => c.name === selectedCategory)?.label || 'All Properties';

  return (
    <div className="bg-[#FAFBFC] font-sans text-slate-900 overflow-x-hidden min-h-screen">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .hero-gradient { background: radial-gradient(circle at center, #1e293b, #0f172a); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>

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

      {/* ================= EXTENDED ADVANCED FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-2xl font-black flex items-center gap-2"><SlidersHorizontal size={24} className="text-blue-600"/> Advanced Search</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
               {/* PRICE */}
               <div>
                  <h3 className="font-bold text-xs uppercase text-slate-400 mb-4">Price Range</h3>
                  <div className="flex justify-between text-lg font-black mb-2 text-blue-600"><span>${(priceRange[0]/1000).toFixed(0)}k</span><span>${(priceRange[1]/1000).toFixed(0)}k+</span></div>
                  <input type="range" min="0" max="1000000" step="10000" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
               </div>

               {/* BEDS & BATHS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Bedrooms</h3>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <button key={`bed-${num}`} onClick={() => setBeds(num)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${beds === num ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {num === 0 ? 'Any' : `${num}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Bathrooms</h3>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4].map(num => (
                        <button key={`bath-${num}`} onClick={() => setBaths(num)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${baths === num ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {num === 0 ? 'Any' : `${num}+`}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               {/* AREA */}
               <div>
                  <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Property Size (m²)</h3>
                  <div className="flex items-center gap-4">
                    <input type="number" placeholder="Min m²" value={minArea} onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : '')} className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-sm focus:border-blue-500 outline-none" />
                    <span className="text-slate-400 font-bold">-</span>
                    <input type="number" placeholder="Max m²" value={maxArea} onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : '')} className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-sm focus:border-blue-500 outline-none" />
                  </div>
               </div>

               {/* AMENITIES */}
               <div>
                <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((amenity) => (
                    <button key={amenity} onClick={() => setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedAmenities.includes(amenity) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{amenity}</button>
                  ))}
                </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
               <button onClick={handleResetFilters} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Reset All</button>
               <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg transition-colors flex items-center justify-center gap-2">Show {filteredLatest.length} Results</button>
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
          {/* ================= RESTORED HERO SECTION (EXACT BACKGROUND) ================= */}
          <section className="relative pt-[130px] pb-16 md:pb-24 flex flex-col items-center text-center px-4 md:px-6 hero-gradient z-20 overflow-hidden">
            
            <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" 
                alt="Hero" 
                fill 
                className="object-cover opacity-20 mix-blend-overlay" 
                priority 
              />
            </div>
            
            <div className="relative z-10 w-full max-w-[1200px] flex flex-col items-center">
              <span className="bg-blue-500/20 text-[#4F95FF] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-6 md:mb-8 border border-blue-500/30 backdrop-blur-md">
                Premium Real Estate
              </span>
              
              <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-black text-white mb-10 md:mb-12 leading-[1.05] tracking-tighter drop-shadow-2xl">
                Own Your <span className="text-[#4F95FF]">Future Space.</span>
              </h1>
              
              {/* ================= MODERN UNIFIED SEARCH PILL ================= */}
              <div className="w-full max-w-5xl relative z-[9999]">
                
                {/* MODE TABS & VIEW MAP TOGGLE */}
                <div className="flex justify-between items-end mb-4 md:mb-5">
                  <div className="bg-[#0B1120]/80 p-1.5 rounded-[2rem] flex gap-1 border border-white/10 shadow-2xl backdrop-blur-xl">
                    {['all', 'buy', 'rent'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setFilterTab(tab as any)} 
                        className={`px-7 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${filterTab === tab ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={handleResetFilters} className="text-[11px] font-bold text-white/70 hover:text-white transition-colors items-center gap-1 hidden md:flex">
                      <RotateCcw size={12} /> Reset Filters
                    </button>
                    <button 
                      onClick={() => setViewMode('map')}
                      className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 border border-blue-500/30 backdrop-blur-md"
                    >
                      <Compass size={14} /> <span className="hidden sm:inline">View Map</span>
                    </button>
                  </div>
                </div>

                {/* THE UNIFIED SEARCH BAR */}
                <div className="bg-white p-2.5 rounded-[2rem] md:rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center w-full relative">
                  
                  {/* 1. Keyword Search */}
                  <div className="flex-[1.2] w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors relative group">
                    <Search className="text-blue-500 shrink-0 mr-3" size={20} />
                    <div className="flex-1 flex flex-col justify-center overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Search Keywords</p>
                      <input 
                        type="text" 
                        placeholder="Search title, agent, location..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full font-bold text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-300 truncate"
                      />
                    </div>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full absolute right-4"><X size={14}/></button>
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-[1px] h-10 bg-slate-200 shrink-0 mx-1"></div>
                  <div className="w-full h-[1px] bg-slate-100 md:hidden my-1"></div>

                  {/* 2. Location Dropdown */}
                  <div className="flex-1 w-full relative">
                    <div className="w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors text-left group relative">
                      <div className="flex-1 flex items-center cursor-pointer" onClick={() => setIsLocationModalOpen(true)}>
                        <MapPin className="text-blue-500 shrink-0 mr-3" size={20} />
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

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-[1px] h-10 bg-slate-200 shrink-0 mx-1"></div>
                  <div className="w-full h-[1px] bg-slate-100 md:hidden my-1"></div>

                  {/* 3. Property Type Dropdown */}
                  <div className="flex-1 w-full relative" ref={dropdownRef}>
                    <button onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full flex items-center px-4 md:px-6 h-16 md:h-14 hover:bg-slate-50 rounded-full transition-colors text-left group">
                      <Home className="text-blue-500 shrink-0 mr-3" size={20} />
                      <div className="flex-1 flex flex-col justify-center overflow-hidden">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Property Type</p>
                        <span className="font-bold text-sm text-slate-900 truncate">{currentCategoryLabel}</span>
                      </div>
                      <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                    {isCatDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-2 z-[9999] border border-slate-100 max-h-80 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => { setSelectedCategory('All'); setIsCatDropdownOpen(false); }} className="w-full text-left p-3 font-bold text-sm hover:bg-blue-50 rounded-xl transition-colors">All Properties</button>
                        {PROPERTY_CATEGORIES.map(cat => (
                          <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setIsCatDropdownOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors"><span className="font-bold text-sm text-slate-700">{cat.label}</span></button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Actions (Filters + Search) */}
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
            </div>
          </section>

          {/* CATEGORY BUTTONS */}
          <section className="py-10 max-w-[1300px] mx-auto px-4 relative z-0 mt-4 md:mt-8">
            <div className="flex overflow-x-auto md:grid md:grid-cols-5 lg:grid-cols-10 gap-3 pb-4 md:pb-0 custom-scrollbar snap-x">
              {PROPERTY_CATEGORIES.map((item) => (
                <button key={item.name} onClick={() => setSelectedCategory(item.name === selectedCategory ? 'All' : item.name)} className={`shrink-0 w-24 md:w-auto p-4 md:p-3 rounded-[1.75rem] md:rounded-[1.25rem] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-2 snap-center border ${selectedCategory === item.name ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white text-slate-800 border-slate-100 hover:shadow-lg'}`}>
                  <div className={`p-3 md:p-2.5 rounded-2xl ${selectedCategory === item.name ? 'bg-white/20 text-white' : `${item.color} bg-opacity-10`}`}>{item.icon}</div>
                  <div className="text-center w-full"><h3 className="font-black text-[11px] md:text-xs leading-tight">{item.label}</h3></div>
                </button>
              ))}
            </div>
          </section>

          {/* FEATURED PROPERTIES */}
          <section className="bg-blue-50/40 py-16 px-4 md:px-6 border-y border-blue-100/60">
            <div className="max-w-[1400px] mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest block mb-1.5">Exclusive</span>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Featured Properties</h2>
                  <p className="text-slate-500 text-xs md:text-sm mt-1">Verified premium listings from top agents.</p>
                </div>
                
                <div className="flex gap-2 self-end md:self-auto">
                  <button onClick={prevFeatured} disabled={featuredIdx === 0} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"><ChevronLeft size={16}/></button>
                  <button onClick={nextFeatured} disabled={featuredIdx >= maxFeaturedIdx} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm"><ChevronRight size={16}/></button>
                </div>
              </div>

              {filteredFeatured.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {currentFeatured.map((prop) => (
                    <PropertyCard key={prop.id} property={prop} isFeatured={true} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-500 font-bold bg-white/60 rounded-[2.5rem] border border-dashed border-slate-300">
                  No Featured Properties match your current search criteria.
                </div>
              )}
            </div>
          </section>

          {/* ALL LISTINGS */}
          <section className="py-16 md:py-20 px-4 md:px-6 bg-white">
             <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                   <div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Latest Listings</h2>
                      <p className="text-slate-500 text-xs md:text-sm mt-1">Explore our newest properties available on the market.</p>
                   </div>
                   <div className="bg-slate-100 p-1.5 rounded-2xl flex w-full md:w-auto shadow-inner">
                      {['all', 'buy', 'rent'].map((t) => (
                        <button key={t} onClick={() => setFilterTab(t as any)} className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterTab === t ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>{t}</button>
                      ))}
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {filteredLatest.slice(0, visibleCount).map((prop) => (
                     <PropertyCard key={prop.id} property={prop} />
                   ))}
                </div>

                {filteredLatest.length > visibleCount && (
                  <div className="mt-12 text-center">
                     <button onClick={() => setVisibleCount(prev => prev + 12)} className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-black text-[11px] uppercase hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-500/20 transition-all tracking-wider">Load More Properties</button>
                  </div>
                )}

                {filteredLatest.length === 0 && (
                  <div className="text-center py-20 text-slate-500 font-bold bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <Search size={40} className="text-slate-300 mb-4" />
                    <p className="text-base">No properties match your active search or filter criteria.</p>
                    <button onClick={handleResetFilters} className="mt-5 px-5 py-2.5 bg-white border border-slate-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm text-sm">Clear All Filters</button>
                  </div>
                )}
             </div>
          </section>

          {/* ADVANTAGE */}
          <section className="py-16 bg-slate-50 border-t border-slate-100">
            <div className="max-w-[1400px] mx-auto px-6 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-12 text-slate-900 tracking-tight">The GuriUp Advantage</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[{ icon: <Award size={20} />, title: "Market Experts", desc: "Local intelligence." }, { icon: <ShieldCheck size={20} />, title: "Vetted Only", desc: "Anti-fraud verification." }, { icon: <Zap size={20} />, title: "Instant Access", desc: "Book tours real-time." }, { icon: <Globe size={20} />, title: "Global Network", desc: "For the diaspora." }, { icon: <Key size={20} />, title: "Secure Deals", desc: "Safe transactions." }, { icon: <HeartHandshake size={20} />, title: "24/7 Support", desc: "Always here." }].map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center justify-center h-44">
                    <div className="text-blue-600 mb-3 bg-blue-50 p-3 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">{item.icon}</div>
                    <h3 className="font-black text-[13px] mb-1 text-slate-900">{item.title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// -------------------------------------------------------------
//  COMPACT, MODERN GLASSMORPHISM CARD COMPONENT WITH CAROUSEL
// -------------------------------------------------------------
function PropertyCard({ property, isFeatured = false, compact = false }: { property: Property, isFeatured?: boolean, compact?: boolean }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  const isVerified = property.agentVerified || property.agentPlanTier === 'pro' || property.agentPlanTier === 'premium';
  const displayPrice = (property.hasDiscount && (property.discountPrice || 0) > 0) ? property.discountPrice : property.price;

  return (
    <Link href={`/properties/${property.slug || property.id}`} className="group block h-full">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-500/20 bg-white/90 backdrop-blur-md transition-all duration-500 hover:shadow-[0_15px_40px_rgba(59,130,246,0.15)] hover:-translate-y-1.5 h-full flex flex-col">
        
        {/* IMAGE CAROUSEL SECTION */}
        <div className={`relative ${compact ? 'h-40' : 'h-48 md:h-[210px]'} bg-slate-200 overflow-hidden`}>
          <CardImageSlider images={property.images} alt={property.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90 pointer-events-none" />
          
          {/* BADGES: Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {isFeatured && <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md"><Award size={10}/> Featured</span>}
            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm backdrop-blur-md ${isVerified ? 'bg-blue-600/90 text-white' : 'bg-slate-800/80 text-slate-300'}`}>
              <ShieldCheck size={10}/> {isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          {/* ACTIONS: Top Right (Love & Share) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-7 h-7 bg-white/80 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:text-rose-500 transition-colors shadow-sm">
               <Heart size={13}/>
             </button>
             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="w-7 h-7 bg-white/80 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:text-blue-500 transition-colors shadow-sm">
               <Share2 size={13}/>
             </button>
          </div>
          
          {/* PRICE */}
          <div className="absolute bottom-3 left-4 text-white z-10 pointer-events-none">
             <div className="text-xl font-black drop-shadow-md flex items-end gap-1">
               {formatPrice(displayPrice || 0)} 
               {!property.isForSale && <span className="text-[10px] font-bold text-white/80 mb-0.5">/mo</span>}
             </div>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="p-4 md:p-5 flex flex-col flex-1">
          <h3 className="font-black text-slate-900 line-clamp-1 text-[15px] group-hover:text-blue-600 transition-colors mb-1">{property.title}</h3>
          <p className="flex items-center gap-1 text-slate-400 text-[10px] mb-3 font-bold uppercase tracking-wider"><MapPin size={12} className="text-blue-500 shrink-0"/> {property.location?.area}, {property.location?.city}</p>
          
          {/* COMPACT AGENT PILL (No "Agent:" Text) */}
          <div className="flex items-center gap-2 mb-4 bg-slate-50/80 px-2 py-1.5 rounded-full border border-slate-100/80 w-max max-w-full group-hover:bg-blue-50 transition-colors">
             <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
               <User size={10} className="text-slate-400" />
             </div>
             <p className="text-[11px] font-bold text-slate-700 truncate pr-1">{property.agentName}</p>
             {isVerified && <ShieldCheck size={14} className="text-blue-500 shrink-0 pr-1" />}
          </div>

          <div className="flex justify-between border-y border-slate-100 py-3 text-[11px] font-black text-slate-500 mb-4 mt-auto">
             <span className="flex items-center gap-1"><Bed size={14} className="text-slate-300"/> {property.bedrooms} Beds</span>
             <span className="flex items-center gap-1"><Bath size={14} className="text-slate-300"/> {property.bathrooms} Bath</span>
             {property.area && <span className="flex items-center gap-1"><Move size={14} className="text-slate-300"/> {property.area} m²</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
             <button className="bg-slate-50 hover:bg-slate-100 text-slate-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-slate-200">Details</button>
             <button className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-white shadow-md ${property.isForSale ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}>{property.isForSale ? 'Buy Now' : 'Rent Now'}</button>
          </div>
        </div>
      </div>
    </Link>
  );
}