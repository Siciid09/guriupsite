'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Home, Search, Award, ShieldCheck, 
  ArrowRight, Users, Zap, Building2, LandPlot, Building,
  PlayCircle, SlidersHorizontal, X, Check, Bed, Bath, Move, ChevronDown,
  Lock, HeartHandshake, Globe, Map, Warehouse, Crown, Key
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
  videoUrl?: string; 
  location: { city: string; area: string; };
  bedrooms: number;
  bathrooms: number;
  area?: number; 
  type: string; 
  amenities?: string[]; 
  agentId: string;
  agentName: string; 
  agencyName?: string; 
  agentVerified: boolean; 
  planTier?: 'free' | 'pro' | 'premium'; 
  agentPlanTier?: string; 
  agentPhoto?: string;
  featured: boolean;
  createdAt: string; 
}

const PROPERTY_CATEGORIES = [
  { name: 'House', label: 'Houses', sub: 'Family', icon: <Home size={20}/>, color: 'bg-rose-50 text-rose-600' },
  { name: 'Apartment', label: 'Apartments', sub: 'Modern Flats', icon: <Building size={20}/>, color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Office', label: 'Offices', sub: 'Workspaces', icon: <MapPin size={20}/>, color: 'bg-slate-50 text-slate-600' },
  { name: 'Villa', label: 'Villas', sub: 'Elite Living', icon: <Building2 size={20}/>, color: 'bg-blue-50 text-blue-600' },
  { name: 'Penthouse', label: 'Penthouse', sub: 'Luxury', icon: <Crown size={20}/>, color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Warehouse', label: 'Storage', sub: 'Logistics', icon: <Warehouse size={20}/>, color: 'bg-amber-50 text-amber-600' },
  { name: 'Land', label: 'Land', sub: 'Investment', icon: <LandPlot size={20}/>, color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Shop', label: 'Shops', sub: 'Retail', icon: <Key size={20}/>, color: 'bg-teal-50 text-teal-600' },
  { name: 'Guest House', label: 'Guest House', sub: 'Short Stay', icon: <HeartHandshake size={20}/>, color: 'bg-rose-50 text-rose-600' },
  { name: 'Commercial', label: 'Commercial', sub: 'Business', icon: <Zap size={20}/>, color: 'bg-orange-50 text-orange-600' },
];

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
export default function PropertiesPage({ 
  initialProperties = [] 
}: { 
  initialProperties: Property[] 
}) {
  // --- STATE ---
  const [filterTab, setFilterTab] = useState<'all' | 'buy' | 'rent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(8);

  // Filter Modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [minSize, setMinSize] = useState<number>(0);
  const [selectedBeds, setSelectedBeds] = useState<number | null>(null);
  const [selectedBaths, setSelectedBaths] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Hero Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- OPTIMIZED SCROLL ANIMATION ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Stop observing once visible to free up CPU
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

    if (selectedCategory !== 'All') {
      data = data.filter(p => p.type?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (filterTab === 'buy') data = data.filter(p => p.isForSale);
    if (filterTab === 'rent') data = data.filter(p => !p.isForSale);

    data = data.filter(p => {
      const price = (p.hasDiscount && (p.discountPrice || 0) > 0) ? p.discountPrice : p.price;
      return (price || 0) >= priceRange[0] && (price || 0) <= priceRange[1];
    });

    if (minSize > 0) data = data.filter(p => (p.area || 0) >= minSize);
    if (selectedBeds !== null) data = data.filter(p => p.bedrooms >= selectedBeds);
    if (selectedBaths !== null) data = data.filter(p => p.bathrooms >= selectedBaths);
    
    if (selectedAmenities.length > 0) {
      data = data.filter(p => selectedAmenities.every(a => p.amenities?.includes(a)));
    }

    return data;
  }, [initialProperties, searchQuery, filterTab, selectedCategory, priceRange, minSize, selectedBeds, selectedBaths, selectedAmenities]);

  const featuredProperties = useMemo(() => {
    return filteredData.filter(p => p.featured === true).slice(0, 3);
  }, [filteredData]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const currentCategoryLabel = PROPERTY_CATEGORIES.find(c => c.name === selectedCategory)?.label || 'All Properties';

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <style jsx global>{`
        /* 1. FORCE SMOOTH SCROLLING */
        html { scroll-behavior: smooth; }
        
        /* 2. OPTIMIZE TEXT RENDERING */
        body { 
            text-rendering: optimizeSpeed; 
            -webkit-font-smoothing: antialiased; 
        }

        /* 3. HARDWARE ACCELERATION FOR ANIMATIONS */
        .reveal { 
            opacity: 0; 
            transform: translateY(30px) translateZ(0); /* translateZ forces GPU layer */
            transition: opacity 0.6s ease-out, transform 0.6s ease-out; 
            will-change: opacity, transform; /* Hints browser to optimize */
        }
        .reveal.visible { opacity: 1; transform: translateY(0) translateZ(0); }

        /* 4. GLASSMORPHISM OPTIMIZATION */
        .glass-card { 
            background: rgba(255, 255, 255, 0.9); 
            backdrop-filter: blur(24px); 
            -webkit-backdrop-filter: blur(24px); /* Safari Fix */
            border: 1px solid rgba(255,255,255,0.8); 
            box-shadow: 0 20px 40px rgba(0,0,0,0.05); 
            transform: translateZ(0); /* Separate layer */
        }

        .hero-gradient { background: radial-gradient(circle at top right, #1e293b, #0f172a); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* 5. CONTENT VISIBILITY (THE MAGIC FIX) 
           This tells browser to NOT render sections until you scroll close to them.
           This massively reduces main-thread work. */
        section {
            content-visibility: auto;
            contain-intrinsic-size: 600px; /* Estimates section height */
        }
      `}</style>

      {/* ================= FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-[90%] md:w-[600px] h-[80vh] max-h-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-xl font-black">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            {/* Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Price Range</h3>
                <div className="flex justify-between text-lg font-black text-slate-900 mb-2">
                  <span>${(priceRange[0]/1000).toFixed(0)}k</span>
                  <span>${(priceRange[1]/1000).toFixed(0)}k+</span>
                </div>
                <input type="range" min="0" max="1000000" step="10000" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Bedrooms</h3>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                      {[1, 2, 3, 4].map((num) => (
                        <button key={num} onClick={() => setSelectedBeds(selectedBeds === num ? null : num)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedBeds === num ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{num}+</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Baths</h3>
                    <div className="flex bg-slate-100 rounded-xl p-1">
                      {[1, 2, 3, 4].map((num) => (
                        <button key={num} onClick={() => setSelectedBaths(selectedBaths === num ? null : num)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${selectedBaths === num ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{num}+</button>
                      ))}
                    </div>
                  </div>
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
            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white">
               <div className="flex gap-3">
                 <button onClick={() => { setPriceRange([0, 1000000]); setSelectedBeds(null); setSelectedBaths(null); setSelectedAmenities([]); }} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">Reset</button>
                 <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700">Show Results</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 1. HERO SECTION ================= */}
      {/* Optimization: Use transform-gpu to prevent background from causing repaint lags */}
      <section className="relative h-[70vh] min-h-[600px] flex flex-col justify-center items-center text-center px-6 hero-gradient overflow-visible transform-gpu">
        {/* BG */}
        <div className="absolute inset-0 z-0">
           {/* Optimization: priority={true} loads this immediately. */}
           <Image 
             src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" 
             alt="Hero" 
             fill 
             className="object-cover opacity-20 mix-blend-overlay" 
             priority={true}
           />
        </div>
        
        <div className="relative z-10 max-w-3xl reveal">
          <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-500/30">
            Premium Real Estate
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
            Own Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">Future Space.</span>
          </h1>
          <p className="text-slate-400 text-base max-w-lg mx-auto font-medium mb-12 leading-relaxed">
            Connecting the global diaspora and local visionaries to Africa's most prestigious property listings.
          </p>

          {/* --- SEARCH CAPSULE --- */}
          <div className="glass-card p-2 rounded-[2rem] shadow-2xl max-w-4xl mx-auto flex flex-col md:flex-row gap-2 relative z-[50]">
            
            {/* Location */}
            <div className="flex-1 flex items-center gap-3 px-5 py-3 bg-slate-50/50 rounded-[1.5rem] hover:bg-white transition-all group">
              <MapPin className="text-blue-500" size={20} />
              <div className="text-left w-full">
                <p className="text-[9px] font-black uppercase text-slate-400">Location</p>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="City or Area" className="bg-transparent font-bold text-sm text-slate-900 outline-none w-full placeholder:text-slate-400" />
              </div>
            </div>

            {/* Dropdown */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center gap-3 px-5 py-3 bg-slate-50/50 rounded-[1.5rem] hover:bg-white transition-all text-left">
                <Home className="text-blue-500" size={20} />
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase text-slate-400">Category</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{currentCategoryLabel}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl p-2 z-[100] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-80 overflow-y-auto">
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setIsDropdownOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-[1rem] transition-all hover:bg-slate-50 ${selectedCategory === cat.name ? 'bg-blue-50' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat.icon}</div>
                      <div className="text-left">
                        <span className={`block font-bold text-sm ${selectedCategory === cat.name ? 'text-blue-600' : 'text-slate-900'}`}>{cat.label}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{cat.sub}</span>
                      </div>
                      {selectedCategory === cat.name && <Check size={14} className="ml-auto text-blue-600"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Filter & Search */}
            <button onClick={() => setIsFilterOpen(true)} className="bg-slate-50/50 hover:bg-white text-slate-700 px-5 rounded-[1.5rem] transition-all flex items-center justify-center gap-2">
              <SlidersHorizontal size={18} /> 
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-[1.5rem] font-bold text-xs transition-all shadow-lg shadow-blue-500/20 py-4 flex items-center justify-center gap-2">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ================= 2. CATEGORIES ================= */}
      {/* content-visibility: auto handled by global CSS */}
      <section className="py-16 max-w-[1200px] mx-auto px-6 reveal">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PROPERTY_CATEGORIES.map((item) => (
            <button 
              key={item.name} 
              onClick={() => setSelectedCategory(item.name)}
              // Optimization: Added transform-gpu to offload hover effect to GPU
              className={`p-4 rounded-[1.8rem] transition-all duration-300 hover:-translate-y-1 cursor-pointer group text-center border border-slate-100 bg-white hover:shadow-xl hover:border-blue-100 flex flex-col items-center justify-center gap-3 relative overflow-hidden transform-gpu`}
            >
              <div className={`p-3 rounded-full ${item.color} bg-opacity-10 mb-1 group-hover:scale-110 transition-transform`}>
                  {item.icon}
              </div>
              <div>
                <h3 className="text-slate-900 font-bold text-sm leading-tight">{item.label}</h3>
                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ================= 3. FEATURED LISTINGS ================= */}
      {featuredProperties.length > 0 && (
        <section className="bg-slate-50 py-20 px-6 reveal">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="text-blue-600 font-black tracking-widest text-xs uppercase mb-2 block">Exclusive Selection</span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">Featured Properties</h2>
              </div>
              <Link href="/properties/featured" className="hidden md:flex items-center gap-2 text-slate-900 font-bold text-sm hover:gap-4 transition-all">View All <ArrowRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} isFeatured={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= 4. LATEST LISTINGS ================= */}
      <section className="py-20 px-6 bg-white reveal">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
               <div>
                 <h2 className="text-3xl font-black text-slate-900">Latest Listings</h2>
                 <p className="text-slate-400 font-medium text-xs mt-1">{filteredData.length} New Properties</p>
               </div>
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
              <div className="mt-16 text-center">
                 <button onClick={() => setVisibleCount(prev => prev + 8)} className="border-2 border-slate-100 text-slate-900 px-8 py-3 rounded-full font-bold text-xs uppercase hover:bg-slate-900 hover:text-white transition-all">Load More</button>
              </div>
            )}
         </div>
      </section>

      {/* ================= 5. GURIUP ADVANTAGE ================= */}
      <section className="py-20 bg-slate-50 reveal border-t border-slate-100">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-16 text-slate-900 tracking-tighter">The GuriUp Advantage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {GURIUP_ADVANTAGES.map((item, i) => (
              <div key={i} className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col items-center justify-center relative overflow-hidden h-48 transform-gpu">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 text-blue-600 mb-4 group-hover:scale-110 transition-transform bg-blue-50 p-4 rounded-full">
                    {item.icon}
                </div>
                <div className="relative z-10">
                    <h3 className="font-black text-sm mb-2 text-slate-900">{item.title}</h3>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight px-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. PAN-AFRICAN REACH ================= */}
      <section className="py-24 px-6 reveal">
        <div className="max-w-[1200px] mx-auto bg-[#0a0c10] rounded-[3rem] p-12 relative overflow-hidden transform-gpu">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-20 blur-[150px] rounded-full pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <h2 className="text-white text-3xl md:text-5xl font-black mb-6 leading-tight">Every City. <br /> Every Corner.</h2>
              <p className="text-slate-400 text-sm mb-8 max-w-sm font-medium leading-relaxed">
                From the bustling streets of Mogadishu to the rising skyline of Hargeisa, we provide the digital infrastructure for Africa's property evolution.
              </p>
              <div className="flex gap-12">
                  <div><h4 className="text-3xl font-black text-white mb-1">5+</h4><p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Countries</p></div>
                  <div><h4 className="text-3xl font-black text-white mb-1">15k+</h4><p className="text-blue-500 font-black text-[10px] uppercase tracking-widest">Active Listings</p></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {['Ethiopia', 'Somalia', 'Somaliland', 'Kenya', 'Djibouti', 'Global'].map((country, i) => (
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
function PropertyCard({ property, isFeatured = false }: { property: Property, isFeatured?: boolean }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  const isVerified = property.agentVerified || property.planTier === 'pro' || property.planTier === 'premium' || property.agentPlanTier === 'pro';
  const displayPrice = (property.hasDiscount && (property.discountPrice || 0) > 0) ? property.discountPrice : property.price;

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      {/* Optimization: transform-gpu added here. This ensures the hover effect happens on the GPU. */}
      <div className={`relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition-transform duration-500 hover:shadow-2xl transform-gpu ${isFeatured ? 'hover:-translate-y-2' : ''}`}>
        <div className="relative h-64 bg-slate-200 overflow-hidden">
          {/* Optimization: loading="lazy" and sizes prop ensures we don't load huge images for small cards */}
          <Image 
            src={property.images?.[0] || 'https://placehold.co/600x400'} 
            alt={property.title} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110" 
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-60"></div>
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isFeatured && <span className="bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm flex items-center gap-1"><Award size={10}/> Featured</span>}
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm flex items-center gap-1 ${isVerified ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}><ShieldCheck size={10}/> {isVerified ? 'Verified' : 'Unverified'}</span>
          </div>
          
          {property.videoUrl && <div className="absolute center inset-0 flex items-center justify-center pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><div className="bg-white/30 backdrop-blur-sm p-3 rounded-full"><PlayCircle className="text-white" size={24}/></div></div>}
          
          <div className="absolute bottom-4 left-4 text-white">
             <div className="text-lg font-black">{formatPrice(displayPrice || 0)} {!property.isForSale && <span className="text-xs font-medium opacity-80">/mo</span>}</div>
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{property.title}</h3>
          <p className="flex items-center gap-1 text-slate-400 text-xs font-medium mb-4"><MapPin size={12} /> {property.location?.area}, {property.location?.city}</p>
          <div className="flex justify-between border-t border-slate-50 pt-3">
             <span className="flex items-center gap-1 text-xs font-bold text-slate-700"><Bed size={12} className="text-slate-400"/> {property.bedrooms}</span>
             <span className="flex items-center gap-1 text-xs font-bold text-slate-700"><Bath size={12} className="text-slate-400"/> {property.bathrooms}</span>
             {property.area && <span className="flex items-center gap-1 text-xs font-bold text-slate-700"><Move size={12} className="text-slate-400"/> {property.area} m²</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}