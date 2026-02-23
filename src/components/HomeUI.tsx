'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

// --- TYPES (Updated to match your API/Firestore Types) ---
interface LocationData {
  city?: string;
  area?: string;
  address?: string;
}

interface Property {
  id: string;
  slug?: string;
  title: string;
  price: number;
  images: string[];
  location: LocationData | string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // Added per your types.ts
  size?: number; // Legacy fallback
  status: string;
  isForSale: boolean;
  planTier?: 'free' | 'pro' | 'premium';
  agentVerified?: boolean;
  featured?: boolean;
}

interface Hotel {
  id: string;
  slug?: string; // Added slug
  name: string;
  pricePerNight: number;
  images: string[];
  location: LocationData | string;
  rating: number;
  planTier?: 'free' | 'pro' | 'premium';
  isPro?: boolean;
  amenities?: string[]; // Added for dynamic features
}

interface HomeUIProps {
  featuredProperties: Property[];
  featuredHotels: Hotel[];
  latestProperties: Property[];
  latestHotels: Hotel[];
}

const HomeUI = ({ 
  featuredProperties = [], 
  featuredHotels = [], 
  latestProperties = [], 
  latestHotels = [] 
}: HomeUIProps) => {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // --- FILTER STATE ---
 // --- FILTER STATE ---
  const [filterTab, setFilterTab] = useState<'buy' | 'rent' | 'hotel'>('buy');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Selection State
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('Any Type'); 
  const [selectedPrice, setSelectedPrice] = useState('Any Price');

  // --- FEATURED SLIDER STATE ---
  const [featIndex, setFeatIndex] = useState(0);

  // --- FILTER DATA ---
  const [cities, setCities] = useState<string[]>(['All Cities']);

  // Fetch dynamic cities from Firebase
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const q = query(collection(db, 'cities'), where('isVerified', '==', true));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => {
          const name = doc.data().name || '';
          // Capitalize first letter of each word
          return name.replace(/\b\w/g, (l: string) => l.toUpperCase());
        });
        setCities(['All Cities', ...fetched]);
      } catch (e) {
        console.error("Failed to fetch cities:", e);
      }
    };
    fetchCities();
  }, []);
  const propertyTypes = ['Any Type', 'Apartment', 'Villa', 'Office', 'House', 'Land', 'Commercial', 'Hall'];
  const hotelRoomTypes = ['Any Room', 'Single Room', 'Double Room', 'Twin Room', 'Triple Room', 'Family Room', 'Suite', 'Deluxe Room', 'Studio Room'];
  const buyPrices = ['Any Price', '$10k - $50k', '$50k - $100k', '$100k - $200k', '$200k+'];
  const rentPrices = ['Any Price', '$0 - $500', '$500 - $1000', '$1000+'];
  const hotelPrices = ['Any Price', '$0 - $50', '$50 - $100', '$100 - $200', '$200 - $500', '$500+'];

  // --- HANDLERS ---
  const toggleNav = () => setIsNavOpen(!isNavOpen);

  const handleTabSwitch = (tab: 'buy' | 'rent' | 'hotel') => {
    setFilterTab(tab);
    setSelectedType(tab === 'hotel' ? 'Any Room' : 'Any Type');
    setSelectedPrice('Any Price');
    setOpenDropdown(null);
  };

  const slideFeatured = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setFeatIndex(prev => (prev === 0 ? 0 : prev - 3));
    } else {
      // Don't scroll past the end
      setFeatIndex(prev => (prev + 3 >= featuredProperties.length ? 0 : prev + 3));
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('mode', filterTab);
    if (selectedCity && selectedCity !== 'All Cities') params.set('city', selectedCity);
    if (selectedType && selectedType !== 'Any Type' && selectedType !== 'Any Room') {
       if (filterTab === 'hotel') params.set('roomType', selectedType);
       else params.set('type', selectedType);
    }
    if (selectedPrice && selectedPrice !== 'Any Price') params.set('price', selectedPrice);
    router.push(`/search?${params.toString()}`);
  };

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const selectOption = (setter: Function, value: string) => {
    setter(value);
    setOpenDropdown(null);
  };

  // Click Outside Handler
  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Favorites & Scroll Animation
  useEffect(() => {
    const savedFavs = localStorage.getItem('guriup_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const getLocationString = (location: LocationData | string) => {
    if (typeof location === 'string') return location;
    if (!location) return 'Unknown Location';
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    return parts.length > 0 ? parts.join(', ') : (location.address || 'Unknown Location');
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    let newFavs = favorites.includes(id) ? favorites.filter(favId => favId !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('guriup_favorites', JSON.stringify(newFavs));
  };

  const handleShare = async (e: React.MouseEvent, title: string, path: string) => {
    e.preventDefault(); e.stopPropagation();
    const fullUrl = `${window.location.origin}${path}`;
    if (navigator.share) {
      try { await navigator.share({ title, text: `Check out ${title} on GuriUp!`, url: fullUrl }); } catch (err) { console.log('Share canceled'); }
    } else {
      navigator.clipboard.writeText(fullUrl);
      alert(`Link copied to clipboard: ${fullUrl}`);
    }
  };

  // --- DATA ---
  const rawServices = [
    { icon: '📢', title: 'Comfortable', desc: 'Facebook, Google, & LinkedIn Ads.' },
    { icon: '📄', title: 'Luxury', desc: 'Instagram, TikTok & Snapchat Ads.' },
    { icon: '🏠', title: 'Reliable', desc: 'SEO & Local Marketing.' },
  ];
  const serviceCards = [...rawServices, ...rawServices, ...rawServices, ...rawServices];

  const rawPills = [
    { label: 'Stadium', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h16M4 14h16M2 10h20M6 10v4M18 10v4M12 10v4" /></svg> },
    { label: 'Apartment', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> },
    { label: 'Villa', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Resort', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22v-5"/><path d="M10 20l3-7 4 2.5"/><path d="M8 22v-5"/><path d="M6 20l2-4 2.5 1"/></svg> },
    { label: 'Farm', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/><path d="M12.9 5.8a10 10 0 0 1 1.7 8.5"/><path d="M12 22s-2-9 5.2-13a2.6 2.6 0 0 0-1.7-2"/><path d="M22 22s-2-9-5.2-13a2.6 2.6 0 0 1 1.7-2"/></svg> },
  ];
  const pillItems = [...rawPills, ...rawPills, ...rawPills, ...rawPills];

  // Helpers
  const getCurrentTypeList = () => filterTab === 'hotel' ? hotelRoomTypes : propertyTypes;
  const getCurrentPriceList = () => {
      if (filterTab === 'hotel') return hotelPrices;
      if (filterTab === 'rent') return rentPrices;
      return buyPrices;
  };

  // Get the current 3 items to show for featured properties
  const visibleFeatured = featuredProperties.slice(featIndex, featIndex + 3);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #fff; overflow-x: hidden; }
        
        /* ANIMATIONS */
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        
        /* MOVING PARTICLES (BLOBS) */
        @keyframes blob-float {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob-float 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }

        /* GRADIENT UNDERLINE */
        .gradient-underline { display: block; width: 0; height: 6px; background: linear-gradient(90deg, #0065eb, #60a5fa); border-radius: 4px; margin-top: 4px; transition: width 1.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .reveal.visible .gradient-underline { width: 80px; }

        /* HERO */
        .hero-container { width: 100%; height: 94vh; min-height: 700px; max-height: 950px; position: relative; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
        .hero-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000'); background-size: cover; background-position: center -90px; background-color: #1a1e23; background-blend-mode: overlay; clip-path: url(#hero-cutout); z-index: 0; }
        
        .glass-card { background: rgba(35, 40, 48, 0.6); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.4s ease; }
        .glass-card:hover { background: rgba(0, 101, 235, 0.15); border-color: #0065eb; transform: translateY(-5px); }
        .special-service-shape { border-radius: 24px 24px 24px 0px; }
        
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { display: flex; gap: 1rem; width: max-content; animation: scroll 60s linear infinite; }
        .animate-scroll:hover { animation-play-state: paused; }
        
        .mask-services { mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
        .mask-pills { mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%); }
        @media (max-width: 1024px) { .hero-container { height: auto; min-height: 50vh; } .hero-bg { clip-path: none; } .mask-pills { mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); } }
        
        .nav-link { position: relative; font-weight: 700; font-size: 16.5px; letter-spacing: 0.3px; }
        .nav-link::after { content: ''; position: absolute; width: 0; height: 3px; bottom: -4px; left: 0; background-color: #0065eb; transition: width 0.3s ease; }
        .nav-link:hover::after { width: 100%; }
        
        .property-pill { background: rgba(31, 41, 55, 0.95); border-radius: 50px; display: flex; align-items: center; gap: 8px; padding: 12px 24px; white-space: nowrap; font-weight: 700; color: #ffffff; font-size: 14px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(5px); transition: all 0.3s ease; cursor: pointer; }
        .property-pill:hover { background: #0065eb; transform: scale(1.05); }
        .property-pill svg { width: 16px; height: 16px; stroke: #fff; opacity: 0.8; }
        .property-pill:hover svg { opacity: 1; }
        
        /* CARD CSS */
        .modern-card { background: #fff; border-radius: 24px; overflow: hidden; position: relative; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 2px 20px rgba(0,0,0,0.05); height: 100%; display: flex; flex-direction: column; cursor: pointer; }
        .modern-card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(0, 101, 235, 0.15); }
        .modern-img-wrapper { position: relative; height: 280px; overflow: hidden; border-radius: 24px; margin: 8px; }
        .modern-img-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; border-radius: 18px; }
        .modern-card:hover .modern-img-wrapper img { transform: scale(1.1); }
        .card-actions { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 8px; z-index: 10; }
        .action-btn { width: 32px; height: 32px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; transition: 0.2s; color: #1f2937; }
        .action-btn:hover { background: #0065eb; color: white; }
        .action-btn.active { background: #ef4444; color: white; }
        .price-badge { position: absolute; bottom: 12px; left: 12px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 6px 14px; border-radius: 10px; font-weight: 800; color: #0a0c10; font-size: 1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .status-badge { position: absolute; top: 12px; left: 12px; color: white; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 5px 10px; border-radius: 30px; letter-spacing: 0.5px; z-index: 5; }
        .verified-card { position: absolute; bottom: 12px; right: 12px; background: #22c55e; padding: 4px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .verified-card span { font-size: 9px; font-weight: 800; color: white; text-transform: uppercase; }
        .unverified-card { position: absolute; bottom: 12px; right: 12px; background: #e5e7eb; padding: 4px 8px; border-radius: 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .unverified-card span { font-size: 9px; font-weight: 800; color: #6b7280; text-transform: uppercase; }
        .hotel-card { background: #fff; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: all 0.4s ease; cursor: pointer; }
        .hotel-card:hover { transform: translateY(-10px); box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .hotel-features { display: flex; gap: 8px; margin-top: 12px; }
        .hotel-feature { background: #f3f4f6; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #4b5563; }
        
        .bento-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1.5rem; }
        @media(min-width: 768px) { .bento-grid { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 300px); } }
        .bento-box { background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 30px; position: relative; overflow: hidden; transition: all 0.4s ease; display: flex; flex-direction: column; }
        .bento-box:hover { border-color: rgba(255,255,255,0.3); transform: scale(1.01); background: rgba(30, 30, 30, 0.8); }
        .bento-img-bg { background-size: cover; background-position: center; position: relative; }
        .bento-img-bg::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.75); }
        
        .modern-grow-card { border-radius: 32px; overflow: hidden; position: relative; height: 400px; }
        .modern-grow-card::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%); transition: opacity 0.3s; }
        .grow-content { position: absolute; bottom: 0; left: 0; width: 100%; padding: 40px; z-index: 10; transform: translateY(20px); transition: transform 0.4s; }
        .modern-grow-card:hover .grow-content { transform: translateY(0); }
        
        /* PHONE APP */
        .app-phone { width: 300px; height: 600px; background: #000; border: 8px solid #333; border-radius: 50px; position: relative; box-shadow: 0 0 0 2px #555, 0 30px 80px -10px rgba(0,101,235,0.3); z-index: 20; transform: rotate(0deg); transition: transform 0.5s ease; }
        @media(min-width: 768px) { .app-phone { transform: rotate(6deg); } .app-phone:hover { transform: rotate(0deg); } }
        .app-phone-screen { width: 100%; height: 100%; border-radius: 42px; overflow: hidden; position: relative; }
        .app-float-card { position: absolute; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 20px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: float 6s ease-in-out infinite; z-index: 30; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* --- WHATSAPP FLOAT --- */}
      <a href="https://wa.me/252653227084" target="_blank" rel="noopener noreferrer" className="whatsapp-float fixed right-5 bottom-4 z-[1000] flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform">
        <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.891 11.891-2.003 0-3.976-.505-5.717-1.46l-6.276 1.678zm6.29-4.15l.349.21c1.47.882 3.167 1.347 4.914 1.347 5.176 0 9.39-4.214 9.39-9.39 0-2.505-.974-4.86-2.744-6.628-1.77-1.77-4.122-2.744-6.628-2.744-5.176 0-9.39 4.214-9.39 9.39 0 1.83.533 3.613 1.54 5.143l.235.357-1.01 3.687 3.744-.982z"/></svg>
        <span className="text-[14px] font-bold">Chat with GuriUp</span>
      </a>

      {/* --- MOBILE NAV OVERLAY --- */}
      <div className={`fixed inset-0 bg-[#0a0c10]/95 backdrop-blur-xl z-[9999] flex flex-col justify-center transition-transform duration-500 ${isNavOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute top-8 right-8 cursor-pointer" onClick={toggleNav}>
          <div className="text-white/50 hover:text-white font-bold uppercase text-xs tracking-widest">Close</div>
        </div>
        <div className="pl-8 md:pl-12 flex flex-col space-y-4">
          <span className="text-[#0065eb] font-bold text-sm tracking-widest uppercase mb-4">Menu</span>
          {['Home', 'Hotels', 'Agents', 'GuriUp App'].map((item) => (
            <a key={item} href="#" className="text-4xl md:text-6xl font-black text-transparent stroke-white hover:text-[#0065eb] transition-all duration-300" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.5)' }}>
              {item}
            </a>
          ))}
        </div>
      </div>

      {/* ================= SECTION 1: HERO ================= */}
      <section className="hero-container">
        <div className="hero-bg"></div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-10 flex flex-col h-full">
          
          {/* HERO CONTENT */}
          <div className="flex flex-col lg:flex-row items-center justify-center pt-2 pb-10 reveal translate-y-[5vh]">
            
            {/* LEFT SIDE */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center">
              
              <div className="w-24 h-12 bg-[#0065eb] rounded-xl mb-6 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-900/50">
                <div className="w-5 h-5 bg-white rounded-full animate-pulse"></div>
              </div>

              <h1 className="text-white font-extrabold text-4xl md:text-6xl lg:text-[4.5rem] leading-[1.1] mb-6 tracking-tight">
                Choose Your <br /> Best Happy Land
              </h1>

              <p className="text-gray-400 text-sm md:text-base mb-10 font-medium max-w-lg">
                Real Estate & Properties For Sale Or Rent In 12+ Country
              </p>

              {/* === MODERN FILTER CAPSULE === */}
              <div ref={filterRef} className="bg-white rounded-[2rem] p-3 shadow-2xl w-full max-w-3xl mb-7 relative z-20">
                
                {/* 1. FILTER TABS */}
                <div className="flex gap-2 mb-3 pl-3 pt-2">
                  {['buy', 'rent', 'hotel'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => handleTabSwitch(tab as any)}
                      className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${filterTab === tab ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* 2. INPUTS ROW */}
                <div className="flex flex-col md:flex-row items-center bg-gray-50 rounded-[1.5rem] border border-gray-100 p-2">
                  
                  {/* --- CITY DROPDOWN --- */}
                  <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full border-b md:border-b-0 md:border-r border-gray-200 hover:bg-white transition-colors group rounded-xl relative">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
                        <svg className="w-4 h-4 text-[#0065eb] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </div>
                      <div className="flex flex-col w-full" onClick={() => toggleDropdown('city')}>
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">City</span>
                        <div className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-900">{selectedCity}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {/* City Menu */}
                      {openDropdown === 'city' && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[60] max-h-60 overflow-y-auto">
                           {cities.map((city) => (
                                <div key={city} onClick={() => selectOption(setSelectedCity, city)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-xs font-bold text-slate-700">{city}</div>
                           ))}
                        </div>
                      )}
                  </div>

                  {/* --- TYPE DROPDOWN --- */}
                  <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full border-b md:border-b-0 md:border-r border-gray-200 hover:bg-white transition-colors group rounded-xl relative">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                      </div>
                      <div className="flex flex-col w-full" onClick={() => toggleDropdown('type')}>
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">{filterTab === 'hotel' ? 'Rooms' : 'Type'}</span>
                        <div className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-900 truncate">{selectedType}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {/* Type Menu */}
                      {openDropdown === 'type' && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[60] max-h-60 overflow-y-auto">
                           {getCurrentTypeList().map((type) => (
                                <div key={type} onClick={() => selectOption(setSelectedType, type)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-xs font-bold text-slate-700">{type}</div>
                           ))}
                        </div>
                      )}
                  </div>

                  {/* --- PRICE DROPDOWN --- */}
                  <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full hover:bg-white transition-colors group rounded-xl relative">
                      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4 text-orange-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div className="flex flex-col w-full" onClick={() => toggleDropdown('price')}>
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Price</span>
                        <div className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-900 truncate">{selectedPrice}</span>
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      {/* Price Menu */}
                      {openDropdown === 'price' && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[60] max-h-60 overflow-y-auto">
                           {getCurrentPriceList().map((price) => (
                                <div key={price} onClick={() => selectOption(setSelectedPrice, price)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-xs font-bold text-slate-700">{price}</div>
                           ))}
                        </div>
                      )}
                  </div>

                  {/* 3. SEARCH BUTTON (FIXED INSIDE CARD) */}
                  <button 
                      onClick={handleSearch}
                      className="bg-[#0065eb] text-white w-full md:w-auto px-8 py-5 font-bold text-xs hover:bg-[#0052c1] transition-colors flex items-center justify-center gap-2 rounded-full shadow-lg shadow-blue-500/30"
                  >
                      Search
                  </button>

                </div>
              </div>
              {/* === END MODERN FILTER === */}

              {/* RESTORED PILLS LAYOUT (Below Filter) */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-fit">
                {['Buy a home', 'Book hotels', 'Rent a home', 'Download app'].map((text) => (
                  <div key={text} className="flex items-center gap-2 group cursor-pointer text-white font-bold text-sm opacity-90 hover:opacity-100">
                    <span>{text}</span>
                    <span className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-black group-hover:bg-[#0065eb] group-hover:text-white transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="hidden lg:flex flex-col items-end w-[45%] h-full justify-center pl-10">
               <div className="glass-card p-5 w-52 special-service-shape mb-6 self-end mr-20 mt-18">
                <h3 className="text-white font-black text-lg">Our Special Service</h3>
              </div>
              
              <div className="w-[140%] -mr-32 overflow-hidden py-4 mask-services">
                <div className="animate-scroll">
                  {serviceCards.map((card, i) => (
                    <div key={i} className="glass-card p-6 w-[240px] h-[200px] shrink-0 flex flex-col justify-center rounded-[32px]">
                      <div className={`w-10 h-10 ${i % 3 === 0 ? 'bg-[#0065eb]' : (i % 3 === 1 ? 'bg-white/10' : 'bg-white/5 border border-white/10')} rounded-full flex items-center justify-center mb-4 text-xl`}>
                           <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      </div>
                      <h4 className="text-white text-lg font-black mb-1">{card.title}</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto text-right mb-4 pb-4 translate-y-[-27px] mr-10">
                <p className="text-gray-400 text-sm mb-1">Give us a Call <span className="text-white font-black hover:text-[#0065eb] transition-colors cursor-pointer">+252  65 3227084</span></p>
                <a href="#" className="text-[#0065eb] text-sm underline font-bold">check our pricing plans</a>
              </div>
            </div>
          </div>

          {/* BOTTOM SCROLLING PILLS - RESTORED TO BOTTOM */}
          <div className="flex items-center mt-12 lg:mt-0 pb-8 w-full translate-y-[4vh]">
            <div className="flex-1 overflow-hidden w-full mask-pills">
              <div className="animate-scroll">
                {pillItems.map((item, index) => (
                  <div key={index} className="property-pill">
                    {item.label} 
                    {item.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: FEATURED PROPERTIES (PAGINATED) ================= */}
      <section className="bg-[#fafbfc] py-12 relative z-20 reveal">
        <div className="max-w-[1600px] mx-auto px-6">
          
          {/* SLIDER HEADER WITH CONTROLS */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-slate-900 text-4xl font-black leading-tight tracking-tight relative inline-block">
                Latest Featured Properties
                <span className="gradient-underline"></span>
              </h2>
              <p className="text-slate-500 mt-2 font-medium">Handpicked properties from our verified pro agents.</p>
            </div>

            <div className="flex items-center gap-3">
               {/* CONTROLS */}
               <div className="flex items-center gap-2 mr-2">
                 <button 
                   onClick={() => slideFeatured('left')}
                   disabled={featIndex === 0}
                   className={`p-3 rounded-full border border-slate-200 transition-all ${featIndex === 0 ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-slate-100 text-slate-700 hover:border-slate-300 shadow-sm'}`}
                 >
                   <ChevronLeft size={20} />
                 </button>
                 <button 
                   onClick={() => slideFeatured('right')}
                   disabled={featIndex + 3 >= featuredProperties.length}
                   className={`p-3 rounded-full border border-slate-200 transition-all ${featIndex + 3 >= featuredProperties.length ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'bg-white hover:bg-slate-100 text-slate-700 hover:border-slate-300 shadow-sm'}`}
                 >
                   <ChevronRight size={20} />
                 </button>
               </div>
               
               {/* VIEW ALL BUTTON (BLUE BG) */}
               <Link href="/properties?featured=true" className="px-6 py-3 bg-[#0065eb] hover:bg-blue-600 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2">
                 View All <ArrowRight size={16} />
               </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleFeatured.map((property) => (
               <PropertyCard key={property.id} property={property} favorites={favorites} toggleFavorite={toggleFavorite} handleShare={handleShare} formatPrice={formatPrice} getLocationString={getLocationString} />
            ))}
            {visibleFeatured.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 font-bold">No featured properties available at the moment.</div>
            )}
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: TRENDING HOTELS ================= */}
      <section className="bg-white pb-12 reveal">
         <div className="max-w-[1600px] mx-auto px-6">
            <h2 className="text-slate-900 text-4xl font-black leading-tight tracking-tight mb-10 relative inline-block">
                Trending Hotels
                <span className="gradient-underline"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredHotels.slice(0, 4).map((hotel) => (
                   <HotelCard key={hotel.id} hotel={hotel} favorites={favorites} toggleFavorite={toggleFavorite} handleShare={handleShare} formatPrice={formatPrice} getLocationString={getLocationString} />
                ))}
            </div>
         </div>
      </section>

      {/* ================= SECTION 4: RECENTLY ADDED ================= */}
      <section className="bg-slate-50 py-12 reveal">
        <div className="max-w-[1600px] mx-auto px-6">
          <h2 className="text-slate-900 text-2xl font-black mb-8">Recently Added</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {latestProperties.map((property) => (
              <Link href={property.slug ? `/properties/${property.slug}` : `/properties/${property.id}`} key={property.id} className="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all group block border border-slate-100">
                <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                   <img src={property.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" alt={property.title} />
                   <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[9px] text-white font-bold uppercase">{property.status === 'rented_out' ? 'Rented' : (property.isForSale ? 'Buy' : 'Rent')}</div>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate mb-1">{property.title}</h4>
                <p className="text-xs text-slate-400 mb-2 truncate">{getLocationString(property.location)}</p>
                <div className="flex items-center justify-between">
                    <p className="text-[#0065eb] font-black text-xs">{formatPrice(property.price)}</p>
                    <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: BENTO GRID ================= */}
      <section className="py-12 px-6 relative reveal" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470076892663-af684e5e15af?q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="absolute inset-0 bg-[#0a0c10]/90 backdrop-blur-[4px]"></div>

        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <span className="text-[#0065eb] font-bold text-xs uppercase tracking-[0.2em]">The GuriUp Ecosystem</span>
              <h2 className="text-white text-5xl md:text-6xl font-black mt-2 tracking-tighter">Homes & Hotels <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">In One App</span></h2>
            </div>
            <p className="text-gray-400 max-w-sm text-sm font-medium leading-relaxed">Whether you are buying your forever home or booking a weekend getaway, do it all with a single account.</p>
          </div>

          <div className="bento-grid">
            <div className="bento-box md:col-span-2 md:row-span-2 p-10 group">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105" alt="Hotel" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex gap-2">
                  <span className="bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">Properties</span>
                  <span className="bg-[#0065eb] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">Hotels</span>
                </div>
                <div>
                  <h3 className="text-white text-3xl font-bold mb-2">Switch Worlds <br />Instantly</h3>
                  <p className="text-gray-300 text-sm max-w-xs">One click to switch between real estate listings and luxury hotel bookings.</p>
                </div>
              </div>
            </div>
            
            <div className="bento-box md:col-span-1 md:row-span-2 p-8 group hover:border-[#0065eb]/50 bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-lg group-hover:bg-[#0065eb] transition-colors">⚡</div>
                <div>
                  <h3 className="text-white text-xl font-bold">Instant <br />Booking</h3>
                  <p className="text-gray-200 text-xs mt-3 leading-relaxed">No waiting. Secure your hotel room or schedule a house tour in seconds.</p>
                </div>
              </div>
            </div>

            <div className="bento-box md:col-span-1 md:row-span-1 p-8 flex items-center justify-center bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-5xl font-black text-white mb-1">130k+</h3>
                <p className="text-[#0065eb] text-[10px] font-black uppercase tracking-[0.2em] bg-white/90 px-2 py-1 rounded">Active Users</p>
              </div>
            </div>

            <div className="bento-box md:col-span-1 md:row-span-1 p-8 bg-[#0065eb] hover:bg-[#0052c1] cursor-pointer bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <h3 className="text-white font-bold text-lg leading-tight">100% Verified <br />Listings</h3>
                <div className="self-end w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-black">✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 6: GROW WITH GURIUP ================= */}
      <section className="bg-white py-12 reveal">
        <div className="max-w-[1600px] mx-auto px-6">
          <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tight relative inline-block">
            Grow With GuriUp
            <span className="gradient-underline"></span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AGENT CARD - LINK TO /join/agent */}
            <Link href="/join/agent">
                <div className="modern-grow-card group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Real Estate Agent" />
                <div className="absolute top-6 left-6 z-20">
                    <div className="bg-[#0065eb] w-fit px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest">For Agents</div>
                </div>
                <div className="grow-content">
                    <h3 className="text-white text-4xl font-black mb-2">Close Deals Faster</h3>
                    <p className="text-white/80 text-sm mb-6 max-w-md font-medium">Access our database of verified buyers and sellers. Use GuriUp's CRM tools to manage your portfolio efficiently.</p>
                    <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                </div>
                </div>
            </Link>

            {/* HOTEL CARD - LINK TO /join/hotel */}
            <Link href="/join/hotel">
                <div className="modern-grow-card group cursor-pointer">
                <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Hotel Lobby" />
                <div className="absolute top-6 left-6 z-20">
                    <div className="bg-white w-fit px-4 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-widest">For Hotels</div>
                </div>
                <div className="grow-content">
                    <h3 className="text-white text-4xl font-black mb-2">Fill Every Room</h3>
                    <p className="text-white/80 text-sm mb-6 max-w-md font-medium">List your hotel on the fastest growing booking platform. Manage reservations and pricing in real-time.</p>
                    <div className="w-12 h-12 rounded-full border border-white flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </div>
                </div>
                </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= SECTION 7: REFERRAL PROGRAM ================= */}
      <section className="bg-gradient-to-r from-[#0065eb] to-[#004bb5] py-12 reveal relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                    <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-sm">Referral Program</span>
                    <h2 className="text-white text-4xl md:text-5xl font-black mb-6 leading-tight">Invite Friends, <br/> Get Rewards!</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-lg font-medium">Share GuriUp with your network. For every friend who joins, we’ll drop <span className="text-white font-bold underline decoration-yellow-400 decoration-4 underline-offset-4">100 GuriPoints</span> directly into your wallet.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button 
                            onClick={() => router.push('/referral')}
                            className="bg-white text-[#0065eb] px-8 py-4 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                           Share Your Link
                        </button>
                        <button 
                            onClick={() => router.push('/referral')}
                            className="border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                        >
                           How it Works
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="relative">
                        <div className="w-80 h-80 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                             <div className="text-[120px]">🎁</div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 bg-white text-[#0065eb] p-6 rounded-2xl shadow-xl animate-bounce">
                            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Earned</div>
                            <div className="text-3xl font-black">+100 pts</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* ================= SECTION 8: MOBILE APP ================= */}
      <section className="bg-[#050505] py-12 md:py-20 px-6 relative overflow-hidden reveal">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-600/30 blur-[60px] rounded-full animate-blob pointer-events-none"></div>
        <div className="absolute bottom-20 right-40 w-40 h-40 bg-purple-600/30 blur-[60px] rounded-full animate-blob animation-delay-2000 pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-20">
          <div className="w-full md:w-1/2 z-10">
            <span className="text-[#0065eb] font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Go Mobile</span>
            <h2 className="text-white text-5xl md:text-7xl font-black leading-[1] mb-8 tracking-tight">
              Property Searching. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Reinvented.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md font-medium">Get instant notifications on price drops, explore neighborhoods with AR, and book tours in one click.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-gray-200 transition-colors">
                 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.49l1.84-3.18a.56.56 0 0 0-.2-.76.56.56 0 0 0-.77.2l-1.93 3.32a9.1 9.1 0 0 0-4.54-1.22 9.1 9.1 0 0 0-4.55 1.22L5.53 5.75a.56.56 0 0 0-.77-.2.56.56 0 0 0-.2.76l1.84 3.18A9.2 9.2 0 0 0 2.5 17c0 0 .1.1.25.1h18.5c.15 0 .25-.1.25-.1a9.2 9.2 0 0 0-3.9-7.51zM8.25 14.5a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25zm7.5 0a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25z"/></svg>
                <div className="text-left leading-none">
                  <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Get it on</div>
                  <div className="text-lg">Google Play</div>
                </div>
              </button>
              <button className="bg-[#1a1e23] border border-white/10 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-[#252a30] transition-colors">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.55-.03 3.03 1.04 3.98 1.04 1.26 0 3.22-1.54 5.39-1.31 2.27.1 4 1.63 4.65 2.58-3.92 1.95-3.3 6.94.8 8.65l-.93 1.65zM13 3.5c.53-1.38 2.3-2.5 4.38-2.5.34 1.7-1.48 3.53-2.8 4.15-1.1.58-2.65.5-2.13-1.07z"/></svg>
                <div className="text-left leading-none">
                  <div className="text-[10px] uppercase font-black text-gray-500 mb-1">Download on the</div>
                  <div className="text-lg">App Store</div>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex justify-center md:justify-end relative z-10 pt-32 md:pt-0 pb-10 md:pb-0">
            {/* PHONE CONTAINER */}
            <div className="app-phone relative border-[8px] border-slate-800 rounded-[3rem] shadow-2xl h-[600px] w-[320px] bg-black transform -translate-y-[15%] md:translate-y-0 transition-transform">
              <div className="app-phone-screen relative w-full h-full bg-slate-900 overflow-hidden rounded-[2.5rem]">
                <Image 
                    src="/images/mobile.jpg" 
                    alt="Mobile App Screenshot" 
                    fill 
                    className="object-cover"
                />
              </div>

              {/* FLOAT CARD */}
              <div className="app-float-card absolute -top-24 left-1/2 -translate-x-1/2 w-max md:w-[90%] md:top-1/2 md:bottom-auto md:-left-32 md:-translate-y-1/2 md:translate-x-0 z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-0.5">Tour Booked</p>
                        <p className="text-base font-black text-slate-900 leading-none">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <svg width="0" height="0">
        <defs>
          <clipPath id="hero-cutout" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 H 1 V 0.90 H 0.32 Q 0.30,0.90 0.30,1 H 0 V 0 Z" />
          </clipPath>
        </defs>
      </svg>
    </>
  );
};

// --- HELPER COMPONENTS ---

const PropertyCard = ({ property, favorites, toggleFavorite, handleShare, formatPrice, getLocationString }: any) => {
    const isVerified = property.planTier === 'pro' || property.planTier === 'premium' || property.agentVerified;
    const isFavorite = favorites.includes(property.id);
    const propertyPath = `/properties/${property.slug || property.id}`;
    
    // Use 'area' from types.ts, fallback to 'size' for legacy data
    const displaySize = property.area || property.size || 0;

    let statusLabel = 'For Rent';
    let statusColor = 'bg-black';
    let actionLabel = 'Rent Now';

    if (property.status === 'rented_out') { 
        statusLabel = 'Rented'; 
        statusColor = 'bg-red-600'; 
        actionLabel = 'Rented';
    } 
    else if (property.isForSale) { 
        statusLabel = 'For Sale'; 
        statusColor = 'bg-[#0065eb]'; 
        actionLabel = 'Buy Now';
    }

    return (
        <div className="modern-card group">
            <Link href={propertyPath} className="absolute inset-0 z-0"></Link>
            <div className="modern-img-wrapper">
                <img src={property.images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000"} alt={property.title} />
                <div className={`status-badge ${statusColor}`}>{statusLabel}</div>
                {isVerified ? (
                    <div className="verified-card"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg><span>Verified</span></div>
                ) : (
                    <div className="unverified-card"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg><span>Unverified</span></div>
                )}
                <div className="price-badge">{formatPrice(property.price)} {!property.isForSale && <span className="text-sm font-normal text-gray-500">/mo</span>}</div>
                <div className="card-actions">
                    <div className={`action-btn ${isFavorite ? 'active' : ''}`} onClick={(e) => toggleFavorite(e, property.id)}>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <div className="action-btn" onClick={(e) => handleShare(e, property.title, propertyPath)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                    </div>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-grow relative pointer-events-none">
                <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors mb-2 line-clamp-1">{property.title}</h4>
                <p className="text-gray-500 text-sm font-medium mb-5">{getLocationString(property.location)}</p>
                <div className="flex gap-4 text-sm font-bold text-gray-700 mb-6">
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{property.bedrooms || 0}</span> Beds</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{property.bathrooms || 0}</span> Baths</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{displaySize}</span> Sqft</span>
                </div>
                <div className="mt-auto flex justify-between pt-4 border-t border-gray-100 gap-2 pointer-events-auto">
                    <Link href={propertyPath} className="border border-gray-200 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:border-black transition-colors w-full text-center relative z-10">Details</Link>
                    <Link href={propertyPath} className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-[#0065eb] transition-colors w-full text-center flex items-center justify-center relative z-10">{actionLabel}</Link>
                </div>
            </div>
        </div>
    );
}

const HotelCard = ({ hotel, favorites, toggleFavorite, handleShare, formatPrice, getLocationString }: any) => {
    const isVerified = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
    const isFavorite = favorites.includes(hotel.id);
    const hotelPath = `/hotels/${hotel.id}`;
    
    // Dynamic Rating Check
    const isTopRated = hotel.rating >= 4.5;

    return (
        <div className="hotel-card group relative">
            <Link href={hotelPath} className="absolute inset-0 z-0"></Link>
            <div className="h-64 overflow-hidden relative">
                <img src={hotel.images?.[0] || `https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={hotel.name} />
                
                {/* Dynamically show Top Rated only if rating is good */}
                {isTopRated && (
                     <div className="absolute top-4 left-4 bg-[#0065eb] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">Top Rated</div>
                )}
                
                {isVerified ? (
                    <div className="verified-card"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg><span>Verified</span></div>
                ) : (
                    <div className="unverified-card"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg><span>Unverified</span></div>
                )}
                
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <button onClick={(e) => toggleFavorite(e, hotel.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-black hover:bg-[#0065eb] hover:text-white'}`}>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <button onClick={(e) => handleShare(e, hotel.name, hotelPath)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg bg-white/90 text-black hover:bg-[#0065eb] hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                    </button>
                </div>
            </div>
            <div className="p-5 relative pointer-events-none">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{hotel.name}</h3>
                    <span className="flex items-center text-xs font-bold text-[#0065eb] gap-1">{hotel.rating || 5.0} <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>
                </div>
                <p className="text-gray-400 text-xs font-bold mb-3">{getLocationString(hotel.location)}</p>
                
                {/* DYNAMIC AMENITIES: No more fake data */}
                <div className="hotel-features">
                    {hotel.amenities && hotel.amenities.length > 0 ? (
                        hotel.amenities.slice(0, 3).map((am: string, i: number) => (
                            <span key={i} className="hotel-feature">{am}</span>
                        ))
                    ) : (
                        // Fallback only if no data
                        <>
                            <span className="hotel-feature">Luxury Stay</span>
                        </>
                    )}
                </div>

                <div className="mt-5 flex items-center justify-between pointer-events-auto">
                    <div className="text-slate-900 font-black text-lg">{formatPrice(hotel.pricePerNight || 120)}<span className="text-xs font-normal text-gray-400">/night</span></div>
                    <Link href={hotelPath} className="bg-[#0065eb] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-colors shadow-lg shadow-blue-500/20 relative z-10">Book Now</Link>
                </div>
            </div>
        </div>
    );
}

export default HomeUI;