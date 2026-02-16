'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Home, Search, Award, ShieldCheck, 
  ArrowRight, Users, Zap, Building2, LandPlot, Building,
  PlayCircle, SlidersHorizontal, X, Check, Bed, Bath, Move, ChevronDown
} from 'lucide-react';

// =======================================================================
//  TYPES
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
  // FIX: Updated to 'planTier' to match App/DB
  planTier?: 'free' | 'pro' | 'premium'; 
  agentPlanTier?: string; 
  agentPhoto?: string;
  featured: boolean;
  createdAt: string; 
}

const PROPERTY_CATEGORIES = [
  { name: 'All', label: 'All Properties', sub: 'Everything' },
  { name: 'Villa', label: 'Villas', sub: 'Elite Living', icon: <Building2 size={16}/> },
  { name: 'Apartment', label: 'Apartments', sub: 'Modern Flats', icon: <Building size={16}/> },
  { name: 'Land', label: 'Land', sub: 'Investment', icon: <LandPlot size={16}/> },
  { name: 'Commercial', label: 'Commercial', sub: 'Business', icon: <Zap size={16}/> },
];

const AMENITIES_LIST = [
  'Furnished', 'Garden', 'Balcony', 'Pool', 'Parking', 
  'Gate', 'Gym', 'Ocean View', 'AC', 'Security', 'Elevator',
  'Meeting Room', 'Internet', 'Water Available'
];

// =======================================================================
//  MAIN COMPONENT
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

  // Filter Modal State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [minSize, setMinSize] = useState<number>(0);
  const [selectedBeds, setSelectedBeds] = useState<number | null>(null);
  const [selectedBaths, setSelectedBaths] = useState<number | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Hero Dropdown State
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

  // --- SCROLL ANIMATION ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    // 1. Integrity: Remove 'sold'
    let data = initialProperties.filter(p => p.status?.toLowerCase() !== 'sold');

    // 2. Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p => 
        p.title?.toLowerCase().includes(q) || 
        p.location?.city?.toLowerCase().includes(q) || 
        p.location?.area?.toLowerCase().includes(q)
      );
    }

    // 3. Category
    if (selectedCategory !== 'All') {
      data = data.filter(p => p.type?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 4. Tab (Rent/Buy)
    if (filterTab === 'buy') data = data.filter(p => p.isForSale);
    if (filterTab === 'rent') data = data.filter(p => !p.isForSale);

    // 5. Advanced Filters
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

  // --- FEATURED LOGIC ---
  const featuredProperties = useMemo(() => {
    return filteredData.filter(p => {
      // FIX: Use planTier instead of planTierAtUpload
      const isVerified = p.agentVerified || p.planTier === 'pro' || p.planTier === 'premium' || p.agentPlanTier === 'pro';
      return p.featured === true && isVerified;
    }).slice(0, 3);
  }, [filteredData]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const currentCategoryLabel = PROPERTY_CATEGORIES.find(c => c.name === selectedCategory)?.label || 'All Types';

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <style jsx global>{`
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); }
        .hero-gradient { background: linear-gradient(to bottom, #0f172a, #1e293b); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ================= CENTERED FILTER MODAL (80% / SQUARE) ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          
          <div className="relative bg-white w-[90%] md:w-[600px] h-[80vh] max-h-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-2xl font-black">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              
              {/* 1. Price Range */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Price Range</h3>
                  <div className="text-lg font-black text-slate-900">
                    ${(priceRange[0]/1000).toFixed(0)}k - ${(priceRange[1]/1000).toFixed(0)}k+
                  </div>
                </div>
                <div className="p-1">
                  <input 
                    type="range" 
                    min="0" max="1000000" step="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. Rooms & Size (Grid) */}
              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Bed size={14}/> Bedrooms
                    </h3>
                    <div className="flex bg-slate-100 rounded-xl p-1.5">
                      {[1, 2, 3, 4].map((num) => (
                        <button 
                          key={num}
                          onClick={() => setSelectedBeds(selectedBeds === num ? null : num)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${selectedBeds === num ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {num}+
                        </button>
                      ))}
                    </div>
                 </div>
                 <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Bath size={14}/> Baths
                    </h3>
                    <div className="flex bg-slate-100 rounded-xl p-1.5">
                      {[1, 2, 3, 4].map((num) => (
                        <button 
                          key={num}
                          onClick={() => setSelectedBaths(selectedBaths === num ? null : num)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
                            ${selectedBaths === num ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {num}+
                        </button>
                      ))}
                    </div>
                 </div>
              </div>

              {/* 3. Min Size */}
              <div className="mb-10">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Move size={14} /> Min Area (m²)
                </h3>
                <input 
                  type="number" 
                  value={minSize || ''}
                  onChange={(e) => setMinSize(parseInt(e.target.value) || 0)}
                  placeholder="e.g 150"
                  className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none border border-slate-200 focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>

              {/* 4. Amenities (Modern Chips) */}
              <div className="mb-8">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all
                          ${isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-white sticky bottom-0">
               <div className="flex gap-4">
                 <button 
                    onClick={() => {
                      setPriceRange([0, 1000000]);
                      setSelectedBeds(null);
                      setSelectedBaths(null);
                      setSelectedAmenities([]);
                      setMinSize(0);
                    }}
                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors"
                 >
                   Reset
                 </button>
                 <button 
                   onClick={() => setIsFilterOpen(false)}
                   className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
                 >
                   Show Results
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- 1. PREMIUM HERO SECTION --- */}
      <section className="relative h-[80vh] min-h-[650px] flex flex-col justify-center items-center text-center px-6 hero-gradient overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000" 
          alt="Luxury Home" 
          fill 
          className="object-cover opacity-30 mix-blend-overlay"
          priority
        />
        
        <div className="relative z-10 max-w-4xl reveal">
          <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 inline-block border border-blue-500/30">
            Premium Real Estate Ecosystem
          </span>
          <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tighter">
            Own Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              Future Space.
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-12">
            Connecting the global diaspora and local visionaries to Africa's most prestigious property listings.
          </p>

          {/* --- MODERN SEARCH CAPSULE --- */}
          <div className="glass-card p-3 rounded-[2.5rem] shadow-2xl max-w-5xl mx-auto flex flex-col md:flex-row gap-2 relative">
            
            {/* Location Input */}
            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-slate-50/50 rounded-[1.8rem] border border-transparent hover:border-blue-500/30 transition-all group">
              <MapPin className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
              <div className="text-left w-full">
                <p className="text-[10px] font-black uppercase text-slate-400">Location</p>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where is home?" 
                  className="bg-transparent font-bold text-slate-900 outline-none w-full placeholder:text-slate-400" 
                />
              </div>
            </div>

            {/* MODERN CATEGORY DROPDOWN */}
            <div className="flex-1 relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center gap-4 px-6 py-4 bg-slate-50/50 rounded-[1.8rem] border border-transparent hover:border-blue-500/30 transition-all text-left"
              >
                <Home className="text-blue-500" size={20} />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-400">Category</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{currentCategoryLabel}</span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {/* DROPDOWN MENU */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl p-2 z-50 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                  {PROPERTY_CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-[1.5rem] transition-all hover:bg-slate-50
                        ${selectedCategory === cat.name ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCategory === cat.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {cat.icon || <Home size={16}/>}
                      </div>
                      <div className="text-left">
                        <span className={`block font-bold ${selectedCategory === cat.name ? 'text-blue-600' : 'text-slate-900'}`}>{cat.label}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat.sub}</span>
                      </div>
                      {selectedCategory === cat.name && <Check size={16} className="ml-auto text-blue-600"/>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Filter Trigger */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="bg-slate-50/50 hover:bg-white text-slate-700 px-6 rounded-[1.8rem] font-bold text-sm transition-all flex items-center justify-center gap-2 border border-transparent hover:border-blue-500/30"
            >
              <SlidersHorizontal size={18} /> 
              <span className="hidden md:inline">Filters</span>
            </button>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 rounded-[1.8rem] font-black text-sm transition-all shadow-xl shadow-blue-500/20 py-5 flex items-center justify-center gap-3">
              <Search size={20} /> Search
            </button>
          </div>
        </div>
      </section>

      {/* --- 2. BENTO GRID TYPES (Preserved logic) --- */}
      <section className="py-24 max-w-[1400px] mx-auto px-6 reveal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PROPERTY_CATEGORIES.slice(1).map((item) => (
            <button 
              key={item.name} 
              onClick={() => setSelectedCategory(item.name)}
              className={`p-8 rounded-[2.5rem] hover:scale-[1.02] transition-all cursor-pointer group text-left
                ${item.name === 'Villa' ? 'bg-blue-50' : 
                  item.name === 'Apartment' ? 'bg-indigo-50' : 
                  item.name === 'Land' ? 'bg-emerald-50' : 'bg-orange-50'}`}
            >
              <div className={`mb-12 group-hover:scale-110 transition-transform
                ${item.name === 'Villa' ? 'text-blue-600' : 
                  item.name === 'Apartment' ? 'text-indigo-600' : 
                  item.name === 'Land' ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {item.icon}
              </div>
              <h3 className="text-slate-900 font-black text-xl mb-1">{item.label}</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{item.sub}</p>
            </button>
          ))}
        </div>
      </section>

      {/* --- 3. FEATURED LISTINGS --- */}
      {featuredProperties.length > 0 && (
        <section className="bg-slate-50 py-24 px-6 reveal">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Handpicked <br /> Selection</h2>
                <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-4"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} isFeatured={true} formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- 4. PAN-AFRICAN REACH --- */}
      <section className="py-32 px-6 reveal">
        <div className="max-w-[1400px] mx-auto bg-slate-900 rounded-[3.5rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 opacity-20 blur-[150px] rounded-full pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <h2 className="text-white text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">Every City. <br /> Every Corner.</h2>
              <p className="text-slate-400 text-lg mb-12 max-w-md font-medium leading-relaxed">
                From the bustling streets of Mogadishu to the rising skyline of Hargeisa, we provide the digital infrastructure for Africa's property evolution.
              </p>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-4xl font-black text-white mb-2">12+</h4>
                    <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest">Active Cities</p>
                 </div>
                 <div>
                    <h4 className="text-4xl font-black text-white mb-2">15k+</h4>
                    <p className="text-blue-500 font-black uppercase text-[10px] tracking-widest">Verified Listings</p>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {['Mogadishu', 'Hargeisa', 'Berbera', 'Garowe'].map((city, i) => (
                <div key={city} className={`h-64 relative rounded-[2rem] overflow-hidden ${i % 2 === 0 ? 'translate-y-8' : ''}`}>
                  <Image src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600`} fill alt={city} className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex items-end">
                    <p className="text-white font-black text-xl">{city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. THE ADVANTAGE --- */}
      <section className="py-24 bg-white reveal">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-20 tracking-tighter text-slate-900 underline decoration-blue-600 decoration-8 underline-offset-[12px]">The GuriUp Advantage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Award size={32} />, title: "Market Experts", desc: "Decades of local market intelligence." },
              { icon: <ShieldCheck size={32} />, title: "Vetted Only", desc: "Rigorous anti-fraud verification." },
              { icon: <Zap size={32} />, title: "Instant Access", desc: "Book tours in real-time." },
              { icon: <Users size={32} />, title: "Global Network", desc: "Built for the diaspora." },
            ].map((item) => (
              <div key={item.title} className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:bg-blue-600 hover:text-white transition-all duration-500 group">
                <div className="text-blue-600 mb-8 group-hover:text-white transition-colors">{item.icon}</div>
                <h3 className="font-black text-xl mb-4 uppercase tracking-tighter">{item.title}</h3>
                <p className="text-sm font-medium opacity-60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 6. ALL LISTINGS --- */}
      <section className="bg-slate-50 py-24 px-6 reveal">
         <div className="max-w-[1400px] mx-auto">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h2 className="text-3xl font-black text-slate-900">Latest Listings</h2>
                 <p className="text-slate-400 font-medium text-sm mt-1">{filteredData.length} Properties found</p>
               </div>
               <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                  {['all', 'buy', 'rent'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => setFilterTab(t as any)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
               {filteredData.slice(0, visibleCount).map((prop) => (
                 <PropertyCard key={prop.id} property={prop} formatPrice={formatPrice} />
               ))}
            </div>

            {filteredData.length === 0 && (
                <div className="text-center py-20">
                  <h3 className="text-xl font-bold text-slate-900">No properties found</h3>
                  <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
                </div>
            )}

            {filteredData.length > visibleCount && (
              <div className="mt-16 text-center">
                 <button 
                   onClick={() => setVisibleCount(prev => prev + 8)}
                   className="border-2 border-slate-200 text-slate-900 px-8 py-3 rounded-full font-bold text-sm hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                 >
                   Load More Properties
                 </button>
              </div>
            )}
         </div>
      </section>
    </div>
  );
}

// =======================================================================
//  REUSABLE CARD
// =======================================================================
function PropertyCard({ property, isFeatured = false, formatPrice }: { property: Property, isFeatured?: boolean, formatPrice: (n:number)=>string }) {
  const displayName = property.agencyName || property.agentName || "GuriUp Agent";
  // FIX: Use updated planTier field for verification check
  const isVerified = property.agentVerified || property.planTier === 'pro' || property.planTier === 'premium' || property.agentPlanTier === 'pro';
  const hasValidDiscount = property.hasDiscount && (property.discountPrice || 0) > 0;
  const displayPrice = hasValidDiscount ? property.discountPrice : property.price;

  return (
    <div className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-80 overflow-hidden m-4 rounded-[2rem]">
          <Image 
            src={property.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} 
            alt={property.title} 
            fill 
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

          {/* BADGES */}
          <div className="absolute top-6 left-6 flex gap-2">
            {isFeatured && (
               <span className="bg-white/90 backdrop-blur text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1">
                 <Award size={12}/> Featured
               </span>
            )}
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg flex items-center gap-1 ${isVerified ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
               <ShieldCheck size={12}/> {isVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          {/* VIDEO OVERLAY */}
          {property.videoUrl && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlayCircle className="text-white drop-shadow-md" size={32} />
             </div>
          )}

          {/* PRICE TAG */}
          <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur text-white px-5 py-2.5 rounded-2xl font-black text-lg shadow-xl">
            {formatPrice(displayPrice || 0)}
            {hasValidDiscount && <span className="text-xs text-slate-400 line-through ml-2">{formatPrice(property.price)}</span>}
            {!property.isForSale && <span className="text-xs font-medium text-slate-400 ml-1">/mo</span>}
          </div>
        </div>

        <div className="p-8 pt-4">
          <div className="flex justify-between items-start mb-2">
             <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{property.type}</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{property.title}</h3>
          
          <p className="flex items-center gap-2 text-slate-400 font-medium mb-8 text-sm">
            <MapPin size={16} /> {property.location?.area}, {property.location?.city}
          </p>

          <div className="flex items-center justify-between py-6 border-t border-slate-50">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{property.bedrooms}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beds</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-900">{property.bathrooms}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baths</p>
              </div>
            </div>

            {/* Agent Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
               <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden relative">
                 {property.agentPhoto ? (
                   <Image src={property.agentPhoto} alt={displayName} fill className="object-cover" />
                 ) : (
                   <Users size={14} className="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                 )}
               </div>
               <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                 <ArrowRight size={20} />
               </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}