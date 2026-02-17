'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Home, Search, Award, ShieldCheck, 
  ChevronDown, SlidersHorizontal, X, Bed, Bath, Move, 
  Building2, LandPlot, Building, Warehouse, Crown, Key, 
  HeartHandshake, Zap, Globe, Lock, ChevronLeft, ChevronRight, 
  Heart, Share2
} from 'lucide-react';

// =======================================================================
//  1. TYPES & DATA CONFIGURATION
// =======================================================================

interface Property {
  id: string;
  title: string;
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

// FULL 10 CATEGORIES
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

const POPULAR_CITIES = ['All Cities', 'Mogadishu', 'Hargeisa', 'Berbera', 'Garowe', 'Bosaso', 'Jigjiga', 'Nairobi', 'Djibouti'];

const GURIUP_ADVANTAGES = [
  { icon: <Award size={24} />, title: "Market Experts", desc: "Decades of local market intelligence." },
  { icon: <ShieldCheck size={24} />, title: "Vetted Only", desc: "Rigorous anti-fraud verification." },
  { icon: <Zap size={24} />, title: "Instant Access", desc: "Book tours in real-time." },
  { icon: <Globe size={24} />, title: "Global Network", desc: "Built for the diaspora." },
  { icon: <Lock size={24} />, title: "Secure Deals", desc: "Safe transactions guaranteed." },
  { icon: <HeartHandshake size={24} />, title: "24/7 Support", desc: "Always here for you." },
];

const AMENITIES_LIST = [
  'Furnished', 'Garden', 'Balcony', 'Pool', 'Parking', 
  'Gate', 'Gym', 'Ocean View', 'AC', 'Security', 'Elevator',
  'Meeting Room', 'Internet', 'Water Available'
];

// =======================================================================
//  2. MAIN COMPONENT
// =======================================================================
export default function PropertiesUI({ 
  initialProperties = [] 
}: { 
  initialProperties: Property[] 
}) {
  // --- STATE ---
  const [filterTab, setFilterTab] = useState<'all' | 'buy' | 'rent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  // Pagination for Featured
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const itemsPerPage = 4;

  // Filter Modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Hero Dropdowns
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsCatDropdownOpen(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) setIsCityDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ANIMATION ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); 
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    let data = initialProperties.filter(p => p.status?.toLowerCase() !== 'sold');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p => 
        p.title?.toLowerCase().includes(q) || 
        p.location?.city?.toLowerCase().includes(q) || 
        p.location?.area?.toLowerCase().includes(q)
      );
    }

    if (selectedCity !== 'All Cities') {
      data = data.filter(p => p.location?.city === selectedCity);
    }

    if (selectedCategory !== 'All') {
      data = data.filter(p => p.type?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (filterTab === 'buy') data = data.filter(p => p.isForSale);
    if (filterTab === 'rent') data = data.filter(p => !p.isForSale);

    data = data.filter(p => {
      const price = (p.hasDiscount && (p.discountPrice || 0) > 0) ? p.discountPrice : p.price;
      return (price || 0) >= priceRange[0] && (price || 0) <= priceRange[1];
    });
    
    if (selectedAmenities.length > 0) {
      data = data.filter(p => selectedAmenities.every(a => p.amenities?.includes(a)));
    }

    return data;
  }, [initialProperties, searchQuery, selectedCity, filterTab, selectedCategory, priceRange, selectedAmenities]);

  // --- FEATURED LOGIC (Pro/Premium Only) ---
  const proFeaturedProperties = useMemo(() => {
    return filteredData.filter(p => 
      // 1. Property must be marked as Featured
      // 2. Agent must be Pro or Premium
      (p.featured === true) && 
      (p.agentPlanTier === 'pro' || p.agentPlanTier === 'premium')
    );
  }, [filteredData]);

  const currentFeatured = proFeaturedProperties.slice(featuredIdx, featuredIdx + itemsPerPage);

  const nextFeatured = () => {
    if (featuredIdx + itemsPerPage < proFeaturedProperties.length) setFeaturedIdx(prev => prev + itemsPerPage);
  };

  const prevFeatured = () => {
    if (featuredIdx - itemsPerPage >= 0) setFeaturedIdx(prev => prev - itemsPerPage);
  };

  const currentCategoryLabel = PROPERTY_CATEGORIES.find(c => c.name === selectedCategory)?.label || 'All Properties';

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        body { text-rendering: optimizeSpeed; -webkit-font-smoothing: antialiased; }
        .reveal { opacity: 0; transform: translateY(20px) translateZ(0); transition: opacity 0.5s ease-out, transform 0.5s ease-out; will-change: opacity, transform; }
        .reveal.visible { opacity: 1; transform: translateY(0) translateZ(0); }
        .glass-card { background: rgba(255, 255, 255, 0.98); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); box-shadow: 0 15px 35px rgba(0,0,0,0.08); }
        .hero-gradient { background: radial-gradient(circle at center, #1e293b, #0f172a); }
      `}</style>

      {/* ================= FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-[90%] md:w-[660px] h-[80vh] max-h-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-xl font-black">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Price Range</h3>
                <div className="flex justify-between text-lg font-black text-slate-900 mb-2">
                  <span>${(priceRange[0]/1000).toFixed(0)}k</span>
                  <span>${(priceRange[1]/1000).toFixed(0)}k+</span>
                </div>
                <input type="range" min="0" max="1000000" step="10000" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((amenity) => (
                    <button key={amenity} onClick={() => setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity])} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedAmenities.includes(amenity) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}>{amenity}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
               <button onClick={() => { setPriceRange([0, 1000000]); setSelectedAmenities([]); setSelectedCity('All Cities'); }} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">Reset</button>
               <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700">Show Results</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative h-[65vh] min-h-[550px] flex flex-col justify-center items-center text-center px-6 hero-gradient overflow-visible z-20">
        <div className="absolute inset-0 z-0">
          <Image src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" alt="Hero" fill className="object-cover opacity-20 mix-blend-overlay" priority />
        </div>
        
        <div className="relative z-10 max-w-3xl reveal">
          <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-500/30">Premium Real Estate</span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">Own Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">Future Space.</span></h1>
          
          {/* --- SEARCH CAPSULE --- */}
          <div className="glass-card p-2 rounded-[2rem] shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 relative z-[50] overflow-visible">
            
            {/* City Dropdown */}
            <div className="flex-1 relative" ref={cityDropdownRef}>
              <button onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)} className="w-full h-full flex items-center gap-3 px-5 py-3 bg-slate-50/50 rounded-[1.5rem] hover:bg-white transition-all text-left">
                <MapPin className="text-blue-500" size={20} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[9px] font-black uppercase text-slate-400">Location</p>
                  <span className="font-bold text-sm text-slate-900">{selectedCity}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl p-2 z-[999] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                  {POPULAR_CITIES.map(city => (
                    <button key={city} onClick={() => { setSelectedCity(city); setIsCityDropdownOpen(false); }} className={`w-full text-left p-3 hover:bg-blue-50 rounded-xl font-bold text-sm ${selectedCity === city ? 'text-blue-600 bg-blue-50' : ''}`}>{city}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <button onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full h-full flex items-center gap-3 px-5 py-3 bg-slate-50/50 rounded-[1.5rem] hover:bg-white transition-all text-left">
                <Home className="text-blue-500" size={20} />
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase text-slate-400">Category</p>
                  <span className="font-bold text-sm text-slate-900">{currentCategoryLabel}</span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCatDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl p-2 z-[999] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-80 overflow-y-auto">
                  <button onClick={() => { setSelectedCategory('All'); setIsCatDropdownOpen(false); }} className="w-full text-left p-3 font-bold text-sm hover:bg-blue-50 rounded-xl">All Properties</button>
                  {PROPERTY_CATEGORIES.map(cat => (
                    <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setIsCatDropdownOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl">
                      <span className="font-bold text-sm">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button onClick={() => setIsFilterOpen(true)} className="bg-slate-50/50 hover:bg-white text-slate-700 px-5 rounded-[1.5rem] transition-all flex items-center justify-center"><SlidersHorizontal size={18} /></button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-[1.5rem] font-bold py-4">Search</button>
          </div>
        </div>
      </section>

      {/* ================= 2. COMPACT CATEGORIES ================= */}
      {/* Reduced Padding */}
      <section className="py-8 max-w-[1300px] mx-auto px-4 reveal z-0 relative">
        {/* MOBILE GRID: grid-cols-4 (4 per line) */}
        <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2 md:gap-3">
          {PROPERTY_CATEGORIES.map((item) => (
            <button key={item.name} onClick={() => setSelectedCategory(item.name)} className="p-2 md:p-2.5 rounded-[1rem] md:rounded-[1.4rem] transition-all duration-300 hover:-translate-y-1 border border-slate-100 bg-white hover:shadow-lg flex flex-col items-center justify-center gap-1.5 md:gap-2 transform-gpu">
              <div className={`p-1.5 md:p-2 rounded-full ${item.color} bg-opacity-10 group-hover:scale-110 transition-transform`}>{item.icon}</div>
              <div className="text-center w-full">
                {/* Break words to prevent overflow on 4-column mobile */}
                <h3 className="text-slate-900 font-bold text-[9px] md:text-xs leading-tight break-words px-1">{item.label}</h3>
                <p className="text-slate-400 font-bold text-[7px] md:text-[8px] uppercase tracking-widest hidden sm:block">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ================= 3. FEATURED PROPERTIES (Pro/Premium Only) ================= */}
      {/* Placed BEFORE Latest Listings */}
      {proFeaturedProperties.length > 0 && (
        <section className="bg-blue-50/50 py-10 px-6 reveal border-y border-blue-100">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <span className="text-blue-600 font-bold text-xs uppercase tracking-widest block mb-2">Exclusive</span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Featured Properties</h2>
                <p className="text-slate-400 text-xs mt-1">Our most premium verified listings.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={prevFeatured} disabled={featuredIdx === 0} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all bg-white"><ChevronLeft size={20}/></button>
                <button onClick={nextFeatured} disabled={featuredIdx + itemsPerPage >= proFeaturedProperties.length} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all bg-white"><ChevronRight size={20}/></button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentFeatured.map((prop) => (
                <PropertyCard key={prop.id} property={prop} isFeatured={true} compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= 4. LATEST LISTINGS ================= */}
      {/* Reduced padding to py-10 */}
      <section className="py-10 px-6 bg-white reveal">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
               <h2 className="text-3xl font-black text-slate-900">Latest Listings</h2>
               <div className="bg-slate-100 p-1 rounded-xl flex">
                  {['all', 'buy', 'rent'].map((t) => (
                    <button key={t} onClick={() => setFilterTab(t as any)} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filterTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}>{t}</button>
                  ))}
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {filteredData.slice(0, visibleCount).map((prop) => (
                 <PropertyCard key={prop.id} property={prop} />
               ))}
            </div>
            {filteredData.length > visibleCount && (
              <div className="mt-12 text-center">
                 <button onClick={() => setVisibleCount(prev => prev + 10)} className="border-2 border-slate-100 text-slate-900 px-8 py-3 rounded-full font-bold text-xs uppercase hover:bg-slate-900 hover:text-white transition-all">Load More</button>
              </div>
            )}
         </div>
      </section>

      {/* ================= 5. GURIUP ADVANTAGE ================= */}
      <section className="py-10 bg-slate-50 reveal border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-12 text-slate-900 tracking-tighter">The GuriUp Advantage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {GURIUP_ADVANTAGES.map((item, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group flex flex-col items-center justify-center transform-gpu h-48">
                <div className="text-blue-600 mb-4 bg-blue-50 p-4 rounded-full group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-black text-sm mb-2 text-slate-900">{item.title}</h3>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. PAN-AFRICAN REACH ================= */}
      <section className="py-12 px-6 reveal">
        <div className="max-w-[1200px] mx-auto bg-[#0a0c10] rounded-[3rem] p-12 relative overflow-hidden transform-gpu">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-20 blur-[150px] rounded-full pointer-events-none"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <h2 className="text-white text-3xl md:text-5xl font-black mb-6 leading-tight">Every City. <br /> Every Corner.</h2>
              <p className="text-slate-400 text-sm mb-8 max-w-sm font-medium leading-relaxed">From the bustling streets of Mogadishu to the rising skyline of Hargeisa, we provide the digital infrastructure for Africa's property evolution.</p>
              <div className="flex gap-12">
                <div><h4 className="text-3xl font-black text-white mb-1">5+</h4><p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Countries</p></div>
                <div><h4 className="text-3xl font-black text-white mb-1">15k+</h4><p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Active Listings</p></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Ethiopia', 'Somalia', 'Somaliland', 'Kenya', 'Djibouti', 'Global'].map((country) => (
                <div key={country} className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer backdrop-blur-sm">
                  <Globe className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={20} />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">{country}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// =======================================================================
//  REUSABLE COMPONENT: Property Card
// =======================================================================
function PropertyCard({ property, isFeatured = false, compact = false }: { property: Property, isFeatured?: boolean, compact?: boolean }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  const isVerified = property.agentVerified || property.agentPlanTier === 'pro' || property.agentPlanTier === 'premium';
  const displayPrice = (property.hasDiscount && (property.discountPrice || 0) > 0) ? property.discountPrice : property.price;

  // Handlers
  const handleAction = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (property.agentId) {
       console.log("Contacting agent", property.agentId);
    }
  };

  const handleShare = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/properties/${property.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!"); 
  };

  const handleFav = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition-all duration-500 hover:shadow-xl transform-gpu h-full flex flex-col">
        
        {/* IMAGE SECTION */}
        <div className={`relative ${compact ? 'h-48' : 'h-64'} bg-slate-200 overflow-hidden`}>
          <Image src={property.images?.[0] || 'https://placehold.co/600x400'} alt={property.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {isFeatured && <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Award size={10}/> Featured</span>}
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 ${isVerified ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ShieldCheck size={10}/> {isVerified ? 'Verified' : 'Unverified'}</span>
          </div>

          {/* Action Icons (Heart/Share) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
             <button onClick={handleFav} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-red-500 rounded-full transition-all"><Heart size={16} /></button>
             <button onClick={handleShare} className="p-2 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-blue-500 rounded-full transition-all"><Share2 size={16} /></button>
          </div>

          {/* Price Overlay */}
          <div className="absolute bottom-3 left-3 text-white z-10">
             <div className="text-xl font-black drop-shadow-md">{formatPrice(displayPrice || 0)} {!property.isForSale && <span className="text-[10px] opacity-80 font-normal">/mo</span>}</div>
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 line-clamp-1 text-base group-hover:text-blue-600 transition-colors mb-1">{property.title}</h3>
          <p className="flex items-center gap-1 text-slate-400 text-[11px] mb-4 font-medium"><MapPin size={11} /> {property.location?.area}, {property.location?.city}</p>
          
          {/* Amenities Grid */}
          <div className="flex justify-between border-y border-slate-50 py-3 text-[11px] font-bold text-slate-600 mb-4">
             <span className="flex items-center gap-1.5"><Bed size={14} className="text-slate-300"/> {property.bedrooms} Beds</span>
             <span className="flex items-center gap-1.5"><Bath size={14} className="text-slate-300"/> {property.bathrooms} Bath</span>
             {property.area && <span className="flex items-center gap-1.5"><Move size={14} className="text-slate-300"/> {property.area} m²</span>}
          </div>

          {/* NEW BUTTONS SECTION */}
          <div className="mt-auto grid grid-cols-2 gap-3">
             <button className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-colors">
                Details
             </button>
             <button onClick={handleAction} className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-colors text-white ${property.isForSale ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {property.isForSale ? 'Buy Now' : 'Rent Now'}
             </button>
          </div>
        </div>
      </div>
    </Link>
  );
}