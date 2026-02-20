'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import Image from 'next/image';
import { 
  MapPin, Users, Search, 
  CheckCircle, Star, ArrowRight, ShieldCheck, 
  Wifi, Coffee, Award, SlidersHorizontal, X, Share2, 
  Utensils, Car, Dumbbell, Wind, ChevronDown, Sparkles, 
  Heart, Briefcase, AlertCircle
} from 'lucide-react';

// =======================================================================
//  TYPES & CONSTANTS
// =======================================================================
interface Hotel {
  id: string;
  slug?: string;
  name: string;
  pricePerNight: number;
  displayPrice?: number;
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
  'Parking', 'Air Conditioning'
];

const HOTEL_TYPES = [
  'Business Hotel', 'Airport Hotel', 'Boutique Hotel', 
  'Luxury Hotel', 'Budget/Economy Hotel', 'Extended Stay Hotel', 
  'Resort Hotel', 'Suite Hotel', 'Heritage/Historic Hotel', 
  'Conference/Convention Hotel', 'Casino Hotel', 'Eco-Hotel', '5 Star'
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

  // Search State
const [searchDestination, setSearchDestination] = useState('');
  const [searchType, setSearchType] = useState('');
  
  // Dynamic Cities
  const [popularCities, setPopularCities] = useState<string[]>([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const q = query(collection(db, 'cities'), where('isVerified', '==', true));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => {
          const name = doc.data().name || '';
          return name.replace(/\b\w/g, (l: string) => l.toUpperCase());
        });
        setPopularCities(fetched);
      } catch (e) {
        console.error("Failed to fetch cities:", e);
      }
    };
    fetchCities();
  }, []);

  // Dropdown UI States
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const cityRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  // LOGIC FIX: Changed default from [50, 1000] to [0, 2000] to include cheaper hotels on load
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) setIsCityDropdownOpen(false);
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) setIsTypeDropdownOpen(false);
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
    let result = [...allHotels];

    // Destination Filter
    if (searchDestination) {
      const term = searchDestination.toLowerCase();
      result = result.filter(h => {
        const locString = typeof h.location === 'string' ? h.location : `${h.location?.city} ${h.location?.area}`;
        return h.name.toLowerCase().includes(term) || locString.toLowerCase().includes(term);
      });
    }

    // Type Filter
    if (searchType) {
      result = result.filter(h => 
        h.type === searchType || 
        h.name.toLowerCase().includes(searchType.toLowerCase()) || 
        (h.amenities && h.amenities.includes(searchType))
      );
    }

    // Price Filter (Fix: using displayPrice if available, otherwise pricePerNight)
    result = result.filter(h => {
        const p = h.pricePerNight || 0;
        return p >= priceRange[0] && p <= priceRange[1];
    });

    // Rating Filter
    result = result.filter(h => h.rating >= minRating);

    // Amenities Filter
    if (selectedAmenities.length > 0) {
      result = result.filter(h => selectedAmenities.every(amenity => h.amenities?.includes(amenity)));
    }

    setFilteredHotels(sortHotels(result));
  }, [allHotels, searchDestination, searchType, priceRange, minRating, selectedAmenities]);

  // --- HELPERS ---
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
    <div className="font-sans text-slate-900 bg-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .hero-bg {
          background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000');
          background-size: cover; background-position: center;
        }
        .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,1); }
        .title-underline { position: relative; display: inline-block; }
        .title-underline::after {
            content: ''; display: block; width: 60px; height: 6px; 
            background: #0065eb; margin-top: 8px; border-radius: 4px;
        }
      `}</style>

      {/* TOAST */}
      <div className={`fixed top-5 right-5 z-[99999] bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${showToast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5 pointer-events-none'}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <CheckCircle size={18} className="text-green-400"/> {showToast.message}
        </div>
      </div>

      {/* FILTER MODAL */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)}></div>
          <div className="relative bg-white w-[90%] md:w-[600px] h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Price Range</h3>
                <div className="flex justify-between text-lg font-black mb-2"><span>${priceRange[0]}</span><span>${priceRange[1]}+</span></div>
                <input type="range" min="0" max="2000" step="50" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])} className="w-full accent-[#0065eb] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
              </div>
              <div className="mb-8">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map((a) => (
                    <button key={a} onClick={() => setSelectedAmenities(prev => prev.includes(a) ? prev.filter(item => item !== a) : [...prev, a])} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedAmenities.includes(a) ? 'bg-[#0065eb] border-[#0065eb] text-white' : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'}`}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
               <button onClick={() => { setPriceRange([0, 2000]); setSelectedAmenities([]); setMinRating(0); setSearchDestination(''); setSearchType(''); }} className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 rounded-2xl">Reset</button>
               <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-[#0065eb] text-white rounded-2xl font-bold">Show Results</button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative h-[60vh] min-h-[600px] flex flex-col justify-center items-center text-center px-4">
        <div className="absolute inset-0 hero-bg"><div className="absolute inset-0 bg-black/80"></div></div>
        <div className="relative z-20 max-w-[1400px] mx-auto w-full flex flex-col items-center pt-5">
          <div className="mb-4 px-4 py-1 rounded-full bg-blue-900/20 backdrop-blur-md border border-white/20 shadow-2xl">
            <span className="text-white text-[0.8rem] font-black uppercase tracking-[0.1em]">Hospitality Redefined</span>
          </div>
          <h1 className="text-white text-6xl md:text-8xl font-black mb-4 tracking-tight leading-[1.0]">Find Your <br /><span className="text-[#0065eb]">Perfect Stay</span></h1>
          <p className="text-gray-400 text-[0.9rem] md:text-sm font-bold uppercase tracking-widest mb-16 max-w-[900px]">Luxury hotels & resorts across the Horn of Africa.</p>

          {/* SEARCH CAPSULE */}
          <div className="glass-card p-3 rounded-3xl md:rounded-full shadow-2xl w-full max-w-3xl mx-auto grid grid-cols-2 md:flex md:items-center relative z-[50] gap-2 md:gap-6">
            <div className="relative w-full" ref={cityRef}>
              <button onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl md:rounded-full hover:bg-slate-100/50 transition-all text-left">
                <MapPin className="text-[#0065eb]" size={20} />
                <div className="flex-1 overflow-hidden"><p className="text-[9px] font-black uppercase text-slate-400">Destination</p><span className="font-bold text-sm text-slate-900 truncate">{searchDestination || 'Select City'}</span></div>
              </button>
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 mt-4 w-[280px] bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] max-h-60 overflow-y-auto">
                  <button onClick={() => { setSearchDestination(''); setIsCityDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">Anywhere</button>
                  {popularCities.map((c) => <button key={c} onClick={() => { setSearchDestination(c); setIsCityDropdownOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-[1rem] hover:bg-slate-50 font-bold text-sm text-slate-900"><MapPin size={16} className="text-slate-400"/> {c}</button>)}
                </div>
              )}
            </div>
            <div className="relative w-full" ref={typeRef}>
              <button onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl md:rounded-full hover:bg-slate-100/50 transition-all text-left">
                <Briefcase className="text-orange-500" size={20} />
                <div className="flex-1 overflow-hidden"><p className="text-[9px] font-black uppercase text-slate-400">Hotel Type</p><span className="font-bold text-sm text-slate-900 truncate">{searchType || 'Any Type'}</span></div>
              </button>
              {isTypeDropdownOpen && (
                <div className="absolute top-full left-0 mt-4 w-[280px] bg-white rounded-[1.5rem] shadow-2xl p-2 z-[9999] max-h-60 overflow-y-auto">
                  <button onClick={() => { setSearchType(''); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 rounded-[1rem] hover:bg-slate-50 text-sm font-bold text-slate-500">All Types</button>
                  {HOTEL_TYPES.map((t) => <button key={t} onClick={() => { setSearchType(t); setIsTypeDropdownOpen(false); }} className="w-full text-left p-3 rounded-[1rem] hover:bg-slate-50 font-bold text-sm text-slate-900">{t}</button>)}
                </div>
              )}
            </div>
            <div className="md:w-auto w-full flex gap-2">
              <button onClick={() => setIsFilterOpen(true)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 h-14 md:w-12 md:h-12 rounded-2xl md:rounded-full flex items-center justify-center transition-all"><SlidersHorizontal size={18} /></button>
              <button className="flex-[2] md:w-auto bg-[#0065eb] hover:bg-[#0052c1] text-white h-14 md:px-8 md:h-12 rounded-2xl md:rounded-full font-black text-sm flex items-center justify-center gap-2 transition-all"><Search size={18} /> Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDED SECTION */}
      <section className="py-12 bg-[#fafbfc] relative z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight title-underline">Recommended Stays</h2>
            <p className="text-gray-500 font-medium mt-4">Verified partners with exclusive benefits.</p>
          </div>

          {featuredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHotels.map((h) => (
                <HotelCard key={h.id} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <div className="w-full p-16 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <AlertCircle size={40} className="text-slate-200 mb-3" />
              <p className="text-gray-400 font-bold">No verified partners found matching this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ALL LISTINGS */}
      <section className="py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-slate-900 title-underline">Explore All Stays</h2>
            <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold mt-1">{filteredHotels.length} results</span>
          </div>

          {filteredHotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredHotels.map((h) => (
                  <HotelListCard key={h.id} hotel={h} onShare={handleShare} isFavorite={favorites.includes(h.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[3rem]">
              <h3 className="text-xl font-bold text-slate-900">No hotels found</h3>
              <button onClick={() => { setSearchDestination(''); setSearchType(''); setPriceRange([0, 2000]); setSelectedAmenities([]); }} className="mt-4 text-[#0065eb] font-bold underline">Clear all filters</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// SUB-COMPONENTS
const HotelCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: any) => {
  const isPro = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
  return (
    <div className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
       <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
           <button onClick={(e) => onToggleFavorite(e, hotel.id)} className={`p-2.5 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'}`}><Heart size={18} className={isFavorite ? 'fill-white' : ''} /></button>
           <button onClick={(e) => onShare(e, hotel.id)} className="bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 p-2.5 rounded-full transition-all"><Share2 size={18} /></button>
       </div>
      <Link href={`/hotels/${hotel.slug || hotel.id}`} className="block flex-1 flex flex-col">
        <div className="h-64 overflow-hidden relative bg-slate-200">
          <Image src={hotel.images[0] || 'https://placehold.co/600x400'} alt={hotel.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg"><Star size={12} className="fill-yellow-400 text-yellow-400" /><span className="text-xs font-black text-slate-900">{hotel.rating.toFixed(1)}</span></div>
          {isPro && <div className="absolute bottom-4 left-4 bg-[#0065eb] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1"><ShieldCheck size={12} /> Verified</div>}
        </div>
        <div className="p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-slate-900 line-clamp-1 group-hover:text-[#0065eb] transition-colors mb-2">{hotel.name}</h3>
          <p className="text-gray-400 text-xs font-bold mb-4 flex items-center gap-1"><MapPin size={12} /> {typeof hotel.location === 'string' ? hotel.location : `${hotel.location?.area}, ${hotel.location?.city}`}</p>
          <div className="flex gap-2 mb-6 overflow-hidden">{(hotel.amenities?.slice(0, 3) || []).map((am: string, i: number) => <div key={i} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md whitespace-nowrap">{getAmenityIcon(am)} {am}</div>)}</div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div><span className="text-2xl font-black text-slate-900">${hotel.pricePerNight}</span><span className="text-gray-400 text-xs font-bold ml-1">/ night</span></div>
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold group-hover:bg-[#0065eb] transition-colors">Book Now</div>
          </div>
        </div>
      </Link>
    </div>
  );
};

const HotelListCard = ({ hotel, onShare, isFavorite, onToggleFavorite }: any) => {
  const isPro = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
  return (
    <div className="group relative bg-white rounded-[2rem] border border-transparent hover:border-slate-100 hover:shadow-xl transition-all duration-300 p-3">
      <Link href={`/hotels/${hotel.slug || hotel.id}`} className="block">
        <div className="h-48 rounded-[1.5rem] overflow-hidden relative mb-4 bg-slate-200">
          <Image src={hotel.images[0] || 'https://placehold.co/600x400'} alt={hotel.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
               <button onClick={(e) => onToggleFavorite(e, hotel.id)} className={`p-2 rounded-full backdrop-blur-sm shadow-sm ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/30 text-white hover:bg-white hover:text-red-500'}`}><Heart size={14} className={isFavorite ? 'fill-white' : ''}/></button>
               <button onClick={(e) => { e.preventDefault(); onShare(e, hotel.slug || hotel.id); }} className="bg-white/30 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-sm shadow-sm"><Share2 size={14} /></button>
          </div>
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-black shadow-sm"><Star size={10} className="fill-orange-400 text-orange-400" /> {hotel.rating}</div>
        </div>
        <div className="px-2 pb-2">
          <h3 className="font-bold text-base text-slate-900 group-hover:text-[#0065eb] transition-colors line-clamp-1 mb-1">{hotel.name}</h3>
          <div className="mb-2">
            {isPro ? <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Verified</span> : <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">Unverified</span>}
          </div>
          <p className="text-gray-400 text-[10px] font-medium mb-3 flex items-center gap-1"><MapPin size={10}/> {typeof hotel.location === 'string' ? hotel.location : hotel.location?.city}</p>
          <div className="flex items-center justify-between">
            <p className="text-slate-900 font-black text-lg">${hotel.pricePerNight} <span className="text-gray-400 font-normal text-xs">/ night</span></p>
            <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-[#0065eb] group-hover:text-white transition-colors transition-all"><ArrowRight size={14}/></span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HotelsUI;