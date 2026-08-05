'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LocationSelectorModal, { LocationResult } from '@/components/LocationSelectorModal';
import { 
  MapPin, Home, Award, ShieldCheck, ChevronDown, 
  SlidersHorizontal, X, Bed, Bath, Move, Building2, 
  LandPlot, Building, Warehouse, Crown, Key, HeartHandshake, 
  Zap, Globe, ChevronLeft, ChevronRight, Search
} from 'lucide-react';

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

  // Pagination for Featured
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const itemsPerPage = 4;

  // Filter Modal Controls (Expanded for complete search)
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

  // --- REUSABLE SUPER FILTER FUNCTION ---
  const applyFilters = (properties: Property[]) => {
    return properties.filter(p => {
      // 1. Status Check
      if (p.status?.toLowerCase() === 'sold' || p.status?.toLowerCase() === 'archived') return false;

      // 2. Global Text Search
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

      // 3. Location
      if (selectedLocation?.city && p.location?.city?.toLowerCase() !== selectedLocation.city.toLowerCase()) return false;
      if (selectedLocation?.district && p.location?.area?.toLowerCase() !== selectedLocation.district.toLowerCase()) return false;

      // 4. Category
      if (selectedCategory !== 'All' && p.type?.toLowerCase() !== selectedCategory.toLowerCase()) return false;

      // 5. Buy/Rent Tab
      if (filterTab === 'buy' && !p.isForSale) return false;
      if (filterTab === 'rent' && p.isForSale) return false;

      // 6. Advanced Filter: Price
      const effectivePrice = (p.hasDiscount && (p.discountPrice || 0) > 0) ? p.discountPrice : p.price;
      if ((effectivePrice || 0) < priceRange[0] || (effectivePrice || 0) > priceRange[1]) return false;

      // 7. Advanced Filter: Beds & Baths
      if (beds > 0 && (p.bedrooms || 0) < beds) return false;
      if (baths > 0 && (p.bathrooms || 0) < baths) return false;

      // 8. Advanced Filter: Area (m²)
      if (minArea !== '' && (p.area || 0) < minArea) return false;
      if (maxArea !== '' && (p.area || 0) > maxArea) return false;

      // 9. Advanced Filter: Amenities
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

  const currentFeatured = filteredFeatured.slice(featuredIdx, featuredIdx + itemsPerPage);
  const nextFeatured = () => { if (featuredIdx + itemsPerPage < filteredFeatured.length) setFeaturedIdx(prev => prev + itemsPerPage); };
  const prevFeatured = () => { if (featuredIdx - itemsPerPage >= 0) setFeaturedIdx(prev => prev - itemsPerPage); };

  const currentCategoryLabel = PROPERTY_CATEGORIES.find(c => c.name === selectedCategory)?.label || 'All Properties';

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .glass-card { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
        .hero-gradient { background: radial-gradient(circle at center, #1e293b, #0f172a); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* ================= EXTENDED ADVANCED FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
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
                       <button key={`bed-${num}`} onClick={() => setBeds(num)} className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${beds === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                         {num === 0 ? 'Any' : `${num}+`}
                       </button>
                     ))}
                   </div>
                 </div>
                 <div>
                   <h3 className="font-bold text-xs uppercase text-slate-400 mb-3">Bathrooms</h3>
                   <div className="flex gap-2">
                     {[0, 1, 2, 3, 4].map(num => (
                       <button key={`bath-${num}`} onClick={() => setBaths(num)} className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${baths === num ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
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
                    <button key={amenity} onClick={() => setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])} className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedAmenities.includes(amenity) ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>{amenity}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
               <button onClick={() => { setPriceRange([0, 1000000]); setSelectedAmenities([]); setSelectedLocation(null); setSearchQuery(''); setBeds(0); setBaths(0); setMinArea(''); setMaxArea(''); }} className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors">Reset All</button>
               <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg transition-colors flex items-center justify-center gap-2">Show {filteredLatest.length} Results</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[70vh] min-h-[600px] flex flex-col justify-center items-center text-center px-4 md:px-6 hero-gradient z-20">
        <div className="absolute inset-0 z-0"><Image src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" alt="Hero" fill className="object-cover opacity-20 mix-blend-overlay" priority /></div>
        <div className="relative z-10 max-w-6xl w-full">
          <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-500/30">Premium Real Estate</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight tracking-tighter">Own Your <br className="md:hidden"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">Future Space.</span></h1>
          
          {/* SEARCH CAPSULE WRAPPER */}
          <div className="max-w-5xl mx-auto relative z-[50]">
            
            {/* MODE TABS (ALL / BUY / RENT) */}
            <div className="flex justify-center md:justify-start mb-3 px-2 md:px-4">
              <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-[1.25rem] flex gap-1 border border-white/20 shadow-inner">
                <button 
                  onClick={() => setFilterTab('all')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterTab === 'all' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterTab('buy')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterTab === 'buy' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  Buy
                </button>
                <button 
                  onClick={() => setFilterTab('rent')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterTab === 'rent' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  Rent
                </button>
              </div>
            </div>

            {/* RESPONSIVE SEARCH CAPSULE */}
            <div className="glass-card p-2 md:p-2.5 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-2 md:gap-3">
              
              {/* Free Text Search Box */}
              <div className="flex-[1.5] relative">
                <div className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white text-left transition-all border border-transparent focus-within:border-blue-200 focus-within:bg-white">
                  <Search className="text-blue-500 shrink-0" size={20} />
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Search Keywords</p>
                     <input 
                        type="text" 
                        placeholder="Search title, agent, location..." 
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
              <div className="flex-1 relative">
                <button onClick={() => setIsLocationModalOpen(true)} className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white text-left transition-all">
                  <MapPin className="text-blue-500 shrink-0" size={20} />
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Location</p>
                     <span className="font-bold text-sm text-slate-900 truncate block">
                       {selectedLocation ? `${selectedLocation.city}${selectedLocation.district ? `, ${selectedLocation.district}` : ''}` : 'Any Location'}
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

              {/* Category Dropdown */}
              <div className="flex-1 relative" ref={dropdownRef}>
                <button onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full h-14 md:h-full flex items-center gap-3 px-5 bg-slate-50/50 rounded-[2rem] hover:bg-white text-left transition-all">
                  <Home className="text-blue-500 shrink-0" size={20} />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] font-black uppercase text-slate-400 hidden md:block">Property Type</p>
                    <span className="font-bold text-sm text-slate-900 truncate block">{currentCategoryLabel}</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {isCatDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl p-2 z-[999] border border-slate-100 max-h-80 overflow-y-auto custom-scrollbar">
                    <button onClick={() => { setSelectedCategory('All'); setIsCatDropdownOpen(false); }} className="w-full text-left p-3 font-bold text-sm hover:bg-blue-50 rounded-xl">All Properties</button>
                    {PROPERTY_CATEGORIES.map(cat => (
                      <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setIsCatDropdownOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl"><span className="font-bold text-sm">{cat.label}</span></button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 h-14 md:h-full">
                <button onClick={() => setIsFilterOpen(true)} className="bg-slate-50/50 hover:bg-white text-slate-700 w-14 md:w-16 rounded-[2rem] flex items-center justify-center transition-all border border-transparent hover:border-slate-200 shadow-sm" title="Advanced Filters">
                  <SlidersHorizontal size={20} className="text-blue-600" />
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:w-32 rounded-[2rem] font-black text-sm transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2">
                  <Search size={18} className="md:hidden" />
                  <span className="hidden md:inline">Search</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY BUTTONS */}
      <section className="py-8 max-w-[1300px] mx-auto px-4 relative z-0">
        <div className="flex overflow-x-auto md:grid md:grid-cols-5 lg:grid-cols-10 gap-2 md:gap-3 pb-4 md:pb-0 custom-scrollbar snap-x">
          {PROPERTY_CATEGORIES.map((item) => (
            <button key={item.name} onClick={() => setSelectedCategory(item.name === selectedCategory ? 'All' : item.name)} className={`shrink-0 w-24 md:w-auto p-3 md:p-2.5 rounded-[1.5rem] md:rounded-[1rem] hover:-translate-y-1 border transition-all flex flex-col items-center justify-center gap-2 md:gap-1.5 snap-center ${selectedCategory === item.name ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-900 border-slate-100 hover:shadow-lg'}`}>
              <div className={`p-2.5 md:p-2 rounded-full ${selectedCategory === item.name ? 'bg-white/20 text-white' : `${item.color} bg-opacity-10`}`}>{item.icon}</div>
              <div className="text-center w-full"><h3 className="font-bold text-[10px] md:text-xs leading-tight">{item.label}</h3></div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="bg-blue-50/50 py-10 md:py-16 px-4 md:px-6 border-y border-blue-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Exclusive</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Featured Properties</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Verified premium listings from top agents.</p>
            </div>
            
            <div className="flex gap-2 self-end md:self-auto">
              <button onClick={prevFeatured} disabled={featuredIdx === 0} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeft size={20}/></button>
              <button onClick={nextFeatured} disabled={featuredIdx + itemsPerPage >= filteredFeatured.length} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRight size={20}/></button>
            </div>
          </div>

          {filteredFeatured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {currentFeatured.map((prop) => (
                <PropertyCard key={prop.id} property={prop} isFeatured={true} compact />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 font-bold bg-white/60 rounded-3xl border border-dashed border-slate-300">
              No Featured Properties match your current search criteria.
            </div>
          )}
        </div>
      </section>

      {/* ALL LISTINGS */}
      <section className="py-10 md:py-16 px-4 md:px-6 bg-white">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Latest Listings</h2>
               <div className="bg-slate-100 p-1 rounded-xl flex w-full md:w-auto">
                  {['all', 'buy', 'rent'].map((t) => (
                    <button key={t} onClick={() => setFilterTab(t as any)} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}>{t}</button>
                  ))}
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
               {filteredLatest.slice(0, visibleCount).map((prop) => (
                 <PropertyCard key={prop.id} property={prop} />
               ))}
            </div>

            {filteredLatest.length > visibleCount && (
              <div className="mt-14 text-center">
                 <button onClick={() => setVisibleCount(prev => prev + 12)} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-xs uppercase hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all tracking-wider">Load More Properties</button>
              </div>
            )}

            {filteredLatest.length === 0 && (
              <div className="text-center py-24 text-slate-500 font-bold bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                <Search size={48} className="text-slate-300 mb-4" />
                <p className="text-lg">No properties match your active search or filter criteria.</p>
                <button onClick={() => { setSearchQuery(''); setPriceRange([0, 1000000]); setSelectedCategory('All'); setSelectedAmenities([]); setBeds(0); setBaths(0); setMinArea(''); setMaxArea(''); setSelectedLocation(null); setFilterTab('all'); }} className="mt-6 px-6 py-2 bg-white border border-slate-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">Clear All Filters</button>
              </div>
            )}
         </div>
      </section>

      {/* ADVANTAGE */}
      <section className="py-12 md:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-slate-900 tracking-tighter">The GuriUp Advantage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {[{ icon: <Award size={24} />, title: "Market Experts", desc: "Local intelligence." }, { icon: <ShieldCheck size={24} />, title: "Vetted Only", desc: "Anti-fraud verification." }, { icon: <Zap size={24} />, title: "Instant Access", desc: "Book tours real-time." }, { icon: <Globe size={24} />, title: "Global Network", desc: "For the diaspora." }, { icon: <Key size={24} />, title: "Secure Deals", desc: "Safe transactions." }, { icon: <HeartHandshake size={24} />, title: "24/7 Support", desc: "Always here." }].map((item, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group flex flex-col items-center justify-center h-48">
                <div className="text-blue-600 mb-4 bg-blue-50 p-4 rounded-full group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">{item.icon}</div>
                <h3 className="font-black text-sm mb-2 text-slate-900">{item.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PropertyCard({ property, isFeatured = false, compact = false }: { property: Property, isFeatured?: boolean, compact?: boolean }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  const isVerified = property.agentVerified || property.agentPlanTier === 'pro' || property.agentPlanTier === 'premium';
  const displayPrice = (property.hasDiscount && (property.discountPrice || 0) > 0) ? property.discountPrice : property.price;

  return (
    <Link href={`/properties/${property.slug || property.id}`} className="group block h-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 h-full flex flex-col">
        <div className={`relative ${compact ? 'h-48' : 'h-64 md:h-72'} bg-slate-200 overflow-hidden`}>
          <Image src={property.images?.[0] || 'https://placehold.co/600x400'} alt={property.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {isFeatured && <span className="bg-yellow-400 text-yellow-900 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"><Award size={12}/> Featured</span>}
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm backdrop-blur-md ${isVerified ? 'bg-blue-600/90 text-white' : 'bg-slate-800/80 text-slate-300'}`}><ShieldCheck size={12}/> {isVerified ? 'Verified Agent' : 'Unverified'}</span>
          </div>
          <div className="absolute bottom-4 left-4 text-white z-10">
             <div className="text-2xl font-black drop-shadow-md flex items-end gap-1">
               {formatPrice(displayPrice || 0)} 
               {!property.isForSale && <span className="text-[11px] font-bold text-white/80 mb-1">/mo</span>}
             </div>
          </div>
        </div>
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <h3 className="font-black text-slate-900 line-clamp-1 text-lg group-hover:text-blue-600 transition-colors mb-2">{property.title}</h3>
          <p className="flex items-center gap-1 text-slate-500 text-xs mb-3 font-bold uppercase tracking-wider"><MapPin size={14} className="text-blue-500"/> {property.location?.area}, {property.location?.city}</p>
          
          <div className="flex items-center gap-2 mb-5 bg-slate-50 p-2 rounded-xl border border-slate-100">
             <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck size={12}/></div>
             <p className="text-xs font-bold text-slate-700 truncate">Agent: {property.agentName}</p>
          </div>

          <div className="flex justify-between border-y border-slate-100 py-3 md:py-4 text-xs font-black text-slate-600 mb-5 mt-auto">
             <span className="flex items-center gap-1.5"><Bed size={16} className="text-slate-400"/> {property.bedrooms} Beds</span>
             <span className="flex items-center gap-1.5"><Bath size={16} className="text-slate-400"/> {property.bathrooms} Bath</span>
             {property.area && <span className="flex items-center gap-1.5"><Move size={16} className="text-slate-400"/> {property.area} m²</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-slate-200">Details</button>
             <button className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors text-white shadow-md ${property.isForSale ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30' : 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30'}`}>{property.isForSale ? 'Buy Now' : 'Rent Now'}</button>
          </div>
        </div>
      </div>
    </Link>
  );
}