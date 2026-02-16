'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Users, Search, 
  CheckCircle, Star, ArrowRight, ShieldCheck, 
  Wifi, Coffee, Award, SlidersHorizontal, X, Share2, 
  Utensils, Car, Dumbbell, Wind, ChevronDown, Sparkles, 
  Heart, Briefcase
} from 'lucide-react';

// =======================================================================
//  TYPES & CONSTANTS
// =======================================================================
interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: any;
  rating: number;
  planTier?: string;
  isPro?: boolean;
  amenities?: string[];
  type?: string; 
}

interface HotelsUIProps {
  featuredHotels: Hotel[];
  allHotels: Hotel[];
}

const AMENITIES_LIST = [
  'Wi-Fi', 'Swimming Pool', 'Gym', 'Restaurant', 
  'Parking', 'Room Service'
];

const HOTEL_TYPES = [
  'Business Hotel', 'Airport Hotel', 'Boutique Hotel', 
  'Luxury Hotel', 'Budget/Economy Hotel', 'Extended Stay Hotel', 
  'Resort Hotel', 'Suite Hotel', 'Heritage/Historic Hotel', 
  'Conference/Convention Hotel', 'Casino Hotel', 'Eco-Hotel', '5 Star'
];

const POPULAR_CITIES = [
  'Mogadishu', 'Hargeisa', 'Berbera', 'Garowe', 'Bosaso', 'Jigjiga', 'Nairobi', 'Djibouti'
];

const getAmenityIcon = (amenity: string) => {
  if (amenity.includes('Wi-Fi')) return <Wifi size={14} />;
  if (amenity.includes('Pool')) return <Wind size={14} />;
  if (amenity.includes('Gym')) return <Dumbbell size={14} />;
  if (amenity.includes('Restaurant')) return <Utensils size={14} />;
  if (amenity.includes('Parking')) return <Car size={14} />;
  if (amenity.includes('Coffee')) return <Coffee size={14} />;
  return <CheckCircle size={14} />;
};

// =======================================================================
//  MAIN COMPONENT
// =======================================================================
const HotelsUI = ({ featuredHotels, allHotels }: HotelsUIProps) => {
  // --- STATE ---
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>(allHotels);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '' });
  const [favorites, setFavorites] = useState<string[]>([]);

  // Search Capsule State
  const [searchDestination, setSearchDestination] = useState('');
  const [searchType, setSearchType] = useState('');
  
  // Dropdown UI States
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const cityRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // LOGIC FIX: Default price range starts from 0 to avoid hiding cheaper hotels on load
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC: SORTING & FILTERING ---
  const sortHotels = (hotels: Hotel[]) => {
    return [...hotels].sort((a, b) => {
      const isAPro = a.isPro || a.planTier === 'pro' || a.planTier === 'premium';
      const isBPro = b.isPro || b.planTier === 'pro' || b.planTier === 'premium';
      if (isAPro && !isBPro) return -1;
      if (!isAPro && isBPro) return 1;
      return 0;
    });
  };

  useEffect(() => {
    let result = allHotels;
    if (searchDestination) {
      const term = searchDestination.toLowerCase();
      result = result.filter(h => {
        const locString = typeof h.location === 'string' ? h.location : `${h.location?.city} ${h.location?.area}`;
        return h.name.toLowerCase().includes(term) || locString.toLowerCase().includes(term);
      });
    }
    if (searchType) {
      result = result.filter(h => h.type === searchType || h.name.includes(searchType) || (h.amenities && h.amenities.includes(searchType)));
    }
    result = result.filter(h => h.pricePerNight >= priceRange[0] && h.pricePerNight <= priceRange[1]);
    result = result.filter(h => h.rating >= minRating);
    if (selectedAmenities.length > 0) {
      result = result.filter(h => selectedAmenities.every(amenity => h.amenities?.includes(amenity)));
    }
    setFilteredHotels(sortHotels(result));
  }, [allHotels, searchDestination, searchType, priceRange, minRating, selectedAmenities]);

  // --- ANIMATION OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // --- HELPERS ---
  const handleShare = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const url = `${window.location.origin}/hotels/${id}`;
    navigator.clipboard.writeText(url);
    triggerToast('Link copied to clipboard!');
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
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

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  return (
    <div className="font-sans text-slate-900 bg-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hero-bg {
          background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000');
          background-size: cover; background-position: center;
        }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .title-underline { position: relative; display: inline-block; }
        .title-underline::after {
            content: ''; display: block; width: 60px; height: 6px; 
            background: #0065eb; margin-top: 8px; border-radius: 4px;
        }
      `}</style>

      {/* --- TOAST --- */}
      <div className={`fixed top-5 right-5 z-[99999] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${showToast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-green-400"/>
          <span className="font-bold text-sm">{showToast.message}</span>
        </div>
      </div>

      {/* ================= FILTER MODAL ================= */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-[90%] md:w-[600px] h-[80vh] max-h-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
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
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}+</span>
                </div>
                <input type="range" min="0" max="2000" step="50" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-[#0065eb] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Star Rating</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setMinRating(star === minRating ? 0 : star)} className={`flex-1 py-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-1 transition-all ${minRating === star ? 'bg-[#0065eb] border-[#0065eb] text-white' : 'border-gray-200 text-slate-600 hover:border-[#0065eb]'}`}>
                      {star} <Star size={12} className={minRating === star ? 'fill-white' : 'fill-slate-600'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((amenity) => (
                    <button key={amenity} onClick={() => toggleAmenity(amenity)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedAmenities.includes(amenity) ? 'bg-[#0065eb] border-[#0065eb] text-white' : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'}`}>
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
               <div className="flex gap-3">
                 <button onClick={() => { setPriceRange([0, 2000]); setSelectedAmenities([]); setMinRating(0); setSearchType(''); setSearchDestination(''); }} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors">Reset</button>
                 <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-[#0065eb] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-[#0052c1]">Show Results</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO SECTION ================= */}
     <section className="relative h-[60vh] min-h-[600px] flex flex-col justify-center items-center text-center px-4">
  <div className="absolute inset-0 hero-bg">
    <div className="absolute inset-0 bg-black/80"></div>
  </div>

  <div className="relative z-20 max-w-[1400px] mx-auto w-full reveal flex flex-col items-center pt-5">
    <div className="mb-4 px-4 py-1 rounded-full bg-blue-900/20 backdrop-blur-md border border-white/20 shadow-2xl">
      <span className="text-white text-[0.8rem] font-black uppercase tracking-[0.1em]">
        Hospitality Redefined
      </span>
    </div>

    <h1 className="text-white text-6xl md:text-8xl font-black mb-4 tracking-tight leading-[1.0]">
      Find Your <br />
      <span className="text-[#0065eb]">Perfect Stay</span>
    </h1>

    <p className="text-gray-400 text-[0.9rem] md:text-sm font-bold uppercase tracking-widest mb-16 max-w-[900px] leading-snug">
      Luxury hotels & resorts across the Horn of Africa. Luxury hotels & resorts across the Horn of Africa.
    </p>

    <div className="glass-card p-2 rounded-full shadow-2xl w-full max-w-4xl mx-auto flex items-center relative z-[50]">
      <div className="flex-[1.5] relative border-r border-slate-200/50" ref={cityRef}>
        <button 
          onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
          className="w-full flex items-center gap-3 px-6 py-3 rounded-l-full hover:bg-white/50 transition-all text-left"
        >
          <MapPin className="text-[#0065eb]" size={20} />
          <div className="flex-1 overflow-hidden">
            <p className="text-[9px] font-black uppercase text-slate-400">Destination</p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 truncate">
                {searchDestination || 'Select City'}
              </span>
            </div>
          </div>
        </button>

        {isCityDropdownOpen && (
          <div className="absolute top-full left-0 mt-4 w-[300px] bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
            <button onClick={() => { setSearchDestination(''); setIsCityDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">
              Anywhere
            </button>
            {POPULAR_CITIES.map((city) => (
              <button key={city} onClick={() => { setSearchDestination(city); setIsCityDropdownOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-[1rem] transition-all hover:bg-slate-50 ${searchDestination === city ? 'bg-blue-50 text-[#0065eb]' : 'text-slate-900'}`}>
                <MapPin size={16} className={searchDestination === city ? 'text-[#0065eb]' : 'text-slate-400'} />
                <span className="font-bold text-sm">{city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-[1.5] relative" ref={typeRef}>
          <button 
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/50 transition-all text-left"
          >
              <Briefcase className="text-orange-500" size={20} />
              <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black uppercase text-slate-400">Hotel Type</p>
              <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">
                  {searchType || 'Any Type'}
                  </span>
              </div>
              </div>
          </button>

          {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 mt-4 w-[300px] bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
              <button onClick={() => { setSearchType(''); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">
                  All Types
              </button>
              {HOTEL_TYPES.map((type) => (
                  <button key={type} onClick={() => { setSearchType(type); setIsTypeDropdownOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-[1rem] transition-all hover:bg-slate-50 ${searchType === type ? 'bg-orange-50 text-orange-600' : 'text-slate-900'}`}>
                  <span className="font-bold text-sm">{type}</span>
                  </button>
              ))}
              </div>
          )}
      </div>

      <div className="flex items-center gap-2 pl-2">
          <button onClick={() => setIsFilterOpen(true)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 w-12 h-12 rounded-full transition-all flex items-center justify-center">
             <SlidersHorizontal size={18} />
          </button>

          <button className="bg-[#0065eb] hover:bg-[#0052c1] text-white px-8 h-12 rounded-full font-black text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
            <Search size={18} /> Search
          </button>
      </div>
    </div>
  </div>
</section>

      {/* ================= RECOMMENDED / PRO HOTELS ================= */}
      <section className="py-12 bg-[#fafbfc] relative z-10 reveal">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight title-underline">Recommended Stays</h2>
              <p className="text-gray-500 font-medium mt-4">Verified partners with exclusive benefits.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* LOGIC FIX: Removed .slice(0, 3) to show all recommended stays, matching the app */}
            {sortHotels(featuredHotels.length > 0 ? featuredHotels : allHotels).map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} onShare={handleShare} isFavorite={favorites.includes(hotel.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= ALL LISTINGS ================= */}
      <section className="py-12 bg-white reveal">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-slate-900 title-underline">Explore All Stays</h2>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold self-start mt-1">
              {filteredHotels.length} results
            </span>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredHotels.map((hotel) => (
                  <HotelListCard key={hotel.id} hotel={hotel} onShare={handleShare} isFavorite={favorites.includes(hotel.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-[3rem]">
              <div className="mb-4 inline-block p-4 bg-white rounded-full shadow-sm">
                <Search size={32} className="text-gray-300"/>
              </div>
              <h3 className="text-xl font-bold text-slate-900">No hotels found</h3>
              <button onClick={() => { setPriceRange([0, 2000]); setSelectedAmenities([]); setMinRating(0); setSearchDestination(''); setSearchType(''); }} className="mt-6 text-[#0065eb] font-bold underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= MARKETING SECTION ================= */}
      <section className="py-12 px-6 reveal">
        <div className="max-w-[1400px] mx-auto bg-[#0a0c10] rounded-[3rem] p-12 md:p-16 relative overflow-hidden text-center md:text-left">
           <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb] opacity-20 blur-[150px] rounded-full pointer-events-none"></div>
           
           <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
             <div>
               <span className="text-[#0065eb] font-bold text-xs uppercase tracking-[0.2em] mb-4 block">World Class Travel</span>
               <h2 className="text-white text-4xl md:text-5xl font-black mb-6 leading-tight">
                 Experience <br/> Luxury & Comfort.
               </h2>
               <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md">
                 We partner with the finest hotels to ensure your stay is nothing short of exceptional. From budget stays to 5-star resorts.
               </p>
               <div className="flex flex-col sm:flex-row gap-4">
                 <button className="bg-[#0065eb] text-white px-8 py-4 rounded-2xl font-black hover:bg-[#0052c1] transition-colors">List Your Hotel</button>
                 <button className="bg-white/10 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-colors">Download App</button>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                   <Award className="text-[#0065eb] mb-4" size={28} />
                   <h4 className="text-white font-bold text-base">Best Rates</h4>
                   <p className="text-gray-500 text-xs mt-1">Guaranteed lowest prices.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md translate-y-6">
                   <ShieldCheck className="text-green-500 mb-4" size={28} />
                   <h4 className="text-white font-bold text-base">Verified</h4>
                   <p className="text-gray-500 text-xs mt-1">Inspected properties.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                    <Star className="text-yellow-400 mb-4" size={28} />
                    <h4 className="text-white font-bold text-base">5-Star</h4>
                    <p className="text-gray-500 text-xs mt-1">Premium service.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md translate-y-6">
                    <Users className="text-purple-500 mb-4" size={28} />
                    <h4 className="text-white font-bold text-base">Community</h4>
                    <p className="text-gray-500 text-xs mt-1">10k+ happy travelers.</p>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-transparent p-6 rounded-[2rem] border border-white/10 backdrop-blur-md mt-6 flex items-center gap-4">
                    <div className="bg-white/10 p-3 rounded-full"><Sparkles className="text-orange-400" size={20}/></div>
                    <div>
                        <h4 className="text-white font-bold text-base">Exclusive Deals</h4>
                        <p className="text-gray-500 text-xs mt-0.5">Members save up to 40%.</p>
                    </div>
                </div>
             </div>
           </div>
        </div>
      </section>

    </div>
  );
};

// =======================================================================
//  REUSABLE SUB-COMPONENTS
// =======================================================================

const HotelCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: { hotel: Hotel, onShare: any, isFavorite: boolean, onToggleFavorite: any }) => {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  const amenitiesToShow = hotel.amenities ? hotel.amenities.slice(0, 3) : ['Wi-Fi', 'Coffee', 'Parking'];

  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
           <button onClick={(e) => onToggleFavorite(e, hotel.id)} className={`p-2.5 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'}`}>
               <Heart size={18} className={isFavorite ? 'fill-white' : ''} />
           </button>
           <button onClick={(e) => onShare(e, hotel.id)} className="bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 p-2.5 rounded-full transition-all">
            <Share2 size={18} />
          </button>
       </div>
      <Link href={`/hotels/${hotel.id}`} className="block flex-1 flex flex-col">
        <div className="h-64 overflow-hidden relative bg-slate-200">
          <Image src={hotel.images[0] || 'https://placehold.co/600x400'} alt={hotel.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black text-slate-900">{hotel.rating.toFixed(1)}</span>
          </div>
          {(hotel.isPro || hotel.planTier === 'premium') && (
            <div className="absolute bottom-4 left-4 bg-[#0065eb] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
              <ShieldCheck size={12} /> Partner
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-[#0065eb] transition-colors">{hotel.name}</h3>
          </div>
          <p className="text-gray-400 text-xs font-bold mb-4 flex items-center gap-1">
            <MapPin size={12} /> {typeof hotel.location === 'string' ? hotel.location : `${hotel.location?.area}, ${hotel.location?.city}`}
          </p>
          <div className="flex gap-2 mb-6 overflow-hidden">
             {amenitiesToShow.map((am, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md whitespace-nowrap">
                   {getAmenityIcon(am)} {am}
                </div>
             ))}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div>
              <span className="text-2xl font-black text-slate-900">{formatPrice(hotel.pricePerNight)}</span>
              <span className="text-gray-400 text-xs font-bold ml-1">/ night</span>
            </div>
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold group-hover:bg-[#0065eb] transition-colors">Book Now</div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const HotelListCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: { hotel: Hotel, onShare: any, isFavorite: boolean, onToggleFavorite: any }) => {
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  return (
    <div className="group relative bg-white rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl transition-all duration-300 p-3">
      <Link href={`/hotels/${hotel.id}`} className="block">
        <div className="h-48 rounded-[1.5rem] overflow-hidden relative mb-4 bg-slate-200">
          <Image src={hotel.images[0] || 'https://placehold.co/600x400'} alt={hotel.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
           <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
               <button onClick={(e) => onToggleFavorite(e, hotel.id)} className={`p-2 rounded-full backdrop-blur-sm shadow-sm ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/30 text-white hover:bg-white hover:text-red-500'}`}>
                  <Heart size={14} className={isFavorite ? 'fill-white' : ''}/>
               </button>
               <button onClick={(e) => { e.preventDefault(); onShare(e, hotel.id); }} className="bg-white/30 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-sm shadow-sm">
                  <Share2 size={14} />
               </button>
           </div>
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black shadow-sm">
             <Star size={10} className="fill-orange-400 text-orange-400" /> {hotel.rating}
          </div>
        </div>
        <div className="px-2 pb-2">
          <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0065eb] transition-colors line-clamp-1 mb-1">{hotel.name}</h3>
          <p className="text-gray-400 text-[10px] font-medium mb-3 flex items-center gap-1">
             <MapPin size={10}/> {typeof hotel.location === 'string' ? hotel.location : hotel.location?.city}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-slate-900 font-black text-lg">{formatPrice(hotel.pricePerNight)} <span className="text-gray-400 font-normal text-xs">/ night</span></p>
            <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
              <ArrowRight size={14}/>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HotelsUI;