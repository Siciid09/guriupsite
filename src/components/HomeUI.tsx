'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- TYPES BASED ON FLUTTER MODELS ---
interface LocationData {
  city?: string;
  area?: string;
  address?: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: LocationData | string;
  bedrooms?: number;   // Added ?
  bathrooms?: number;  // Added ?
  area?: number;       // Added ?
  status: string; 
  isForSale: boolean;
  planTier?: 'free' | 'pro' | 'premium';
  agentVerified?: boolean;
  featured?: boolean;
}

interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: LocationData | string;
  rating: number;
  planTier?: 'free' | 'pro' | 'premium';
  isPro?: boolean;
}

interface HomeUIProps {
  featuredProperties: Property[];
  featuredHotels: Hotel[];
}

const HomeUI = ({ featuredProperties, featuredHotels }: HomeUIProps) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('buy');

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // --- SCROLL ANIMATION OBSERVER ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  // --- HELPER: FORMAT PRICE ---
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  // --- HELPER: GET LOCATION STRING ---
  const getLocationString = (location: LocationData | string) => {
    if (typeof location === 'string') return location;
    if (!location) return 'Unknown Location';
    const parts = [];
    if (location.area) parts.push(location.area);
    if (location.city) parts.push(location.city);
    return parts.length > 0 ? parts.join(', ') : (location.address || 'Unknown Location');
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

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #fff;
          overflow-x: hidden;
        }

        /* --- ANIMATIONS --- */
        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }
        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* --- HERO STYLES (FROM UPDATED SNIPPET) --- */
        .hero-container {
          width: 100%;
          height: 94vh;        /* Forces strictly 94% of viewport height */
          min-height: 700px;   /* Prevents it from getting too squashed on small screens */
          max-height: 950px;   /* Prevents it from getting too tall on huge screens */
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between; /* This balances the space evenly */
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000');
          background-size: cover;
          background-position: center;
          background-color: #1a1e23;
          background-blend-mode: overlay;
          clip-path: url(#hero-cutout);
          z-index: 0;
        }

        .glass-card {
          background: rgba(35, 40, 48, 0.6);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s ease;
        }
        .glass-card:hover {
          background: rgba(0, 101, 235, 0.15);
          border-color: #0065eb;
          transform: translateY(-5px);
        }

        .special-service-shape { border-radius: 24px 24px 24px 0px; }

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-scroll {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: scroll 60s linear infinite;
        }
        .animate-scroll:hover {
            animation-play-state: paused;
        }

        .mask-services {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .mask-pills {
          mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
        }

        @media (max-width: 1024px) {
            .hero-container { height: auto; min-height: 50vh; }
            .hero-bg { clip-path: none; }
            .mask-pills {
                mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
            }
        }

        /* --- NAV LINKS SIZE 4% BIGGER --- */
        .nav-link { position: relative; font-weight: 700; font-size: 16.5px; letter-spacing: 0.3px; }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 3px;
          bottom: -4px;
          left: 0;
          background-color: #0065eb;
          transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        .property-pill {
          background: rgba(31, 41, 55, 0.95);
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          white-space: nowrap;
          font-weight: 700;
          color: #ffffff;
          font-size: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .property-pill:hover { background: #0065eb; transform: scale(1.05); }
        .property-pill svg { width: 16px; height: 16px; stroke: #fff; opacity: 0.8; }
        .property-pill:hover svg { opacity: 1; }

        /* --- CARDS & INTERACTIONS --- */
        .modern-card {
            background: #fff;
            border-radius: 24px;
            overflow: hidden;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            box-shadow: 0 2px 20px rgba(0,0,0,0.05);
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .modern-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0, 101, 235, 0.15);
        }
        .modern-img-wrapper {
            position: relative;
            height: 280px;
            overflow: hidden;
            border-radius: 24px;
            margin: 8px;
        }
        .modern-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
            border-radius: 18px;
        }
        .modern-card:hover .modern-img-wrapper img { transform: scale(1.1); }
        
        .card-actions {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 10;
        }
        .action-btn {
            width: 32px;
            height: 32px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(4px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            transition: 0.2s;
            color: #1f2937;
        }
        .action-btn:hover { background: #0065eb; color: white; }

        .price-badge {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            padding: 6px 14px;
            border-radius: 10px;
            font-weight: 800;
            color: #0a0c10;
            font-size: 1rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .status-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            /* BG color is set dynamically inline or via utility classes */
            color: white;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            padding: 5px 10px;
            border-radius: 30px;
            letter-spacing: 0.5px;
            z-index: 5;
        }
        
        /* NEW VERIFICATION BADGE STYLES */
        .verified-card {
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: #22c55e; /* Green */
            padding: 4px 8px;
            border-radius: 8px;
            display: flex; align-items: center; gap: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .verified-card span { font-size: 9px; font-weight: 800; color: white; text-transform: uppercase; }
        
        .unverified-card {
            position: absolute;
            bottom: 12px;
            right: 12px;
            background: #e5e7eb; /* Gray */
            padding: 4px 8px;
            border-radius: 8px;
            display: flex; align-items: center; gap: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .unverified-card span { font-size: 9px; font-weight: 800; color: #6b7280; text-transform: uppercase; }

        /* HOTEL CARDS */
        .hotel-card {
           background: #fff;
           border-radius: 30px;
           overflow: hidden;
           box-shadow: 0 10px 30px rgba(0,0,0,0.05);
           transition: all 0.4s ease;
        }
        .hotel-card:hover { transform: translateY(-10px); box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .hotel-features { display: flex; gap: 8px; margin-top: 12px; }
        .hotel-feature { background: #f3f4f6; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; color: #4b5563; }

        /* Bento Grid with IMG BG */
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 1.5rem;
        }
        @media(min-width: 768px) {
            .bento-grid {
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(2, 300px);
            }
        }
        .bento-box {
            background: rgba(20, 20, 20, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 30px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s ease;
            display: flex;
            flex-direction: column;
        }
        .bento-box:hover {
            border-color: rgba(255,255,255,0.3);
            transform: scale(1.01);
            background: rgba(30, 30, 30, 0.8);
        }
        .bento-img-bg {
             background-size: cover;
             background-position: center;
             position: relative;
        }
        .bento-img-bg::before {
             content: '';
             position: absolute;
             inset: 0;
             background: rgba(0,0,0,0.75); /* Dark overlay */
        }

        /* MODERN GROW SECTION */
        .modern-grow-card {
            border-radius: 32px;
            overflow: hidden;
            position: relative;
            height: 400px;
        }
        .modern-grow-card::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%);
            transition: opacity 0.3s;
        }
        .grow-content {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            padding: 40px;
            z-index: 10;
            transform: translateY(20px);
            transition: transform 0.4s;
        }
        .modern-grow-card:hover .grow-content { transform: translateY(0); }

        /* Phone App - ROTATED RIGHT */
        .app-phone {
            width: 300px;
            height: 600px;
            background: #000;
            border: 8px solid #333;
            border-radius: 50px;
            position: relative;
            box-shadow: 0 0 0 2px #555, 0 30px 80px -10px rgba(0,101,235,0.3);
            z-index: 20;
            transform: rotate(6deg); /* Rotated RIGHT */
            transition: transform 0.5s ease;
        }
        .app-phone:hover {
            transform: rotate(0deg);
        }
        .app-phone-screen {
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600') center/cover;
            border-radius: 42px;
            overflow: hidden;
            position: relative;
        }
        .app-float-card {
            position: absolute;
            bottom: 100px;
            left: -40px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px);
            padding: 20px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            animation: float 6s ease-in-out infinite;
        }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }

        @media(max-width: 768px) {
            .image-bg-card { height: 350px; }
            .card-overlay { padding: 24px; }
        }
        
        select.modern-select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0px center;
            background-size: 14px;
            padding-right: 20px;
        }
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
          
          {/* NAVBAR */}
         

          {/* HERO CONTENT */}
          <div className="flex flex-col lg:flex-row items-center justify-center pt-2 pb-10 reveal">
            
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

              {/* FILTER CAPSULE */}
              <div className="bg-white rounded-[2rem] p-3 shadow-2xl w-full max-w-3xl mb-7 relative z-20">
                {/* FILTER TABS */}
                <div className="flex gap-2 mb-3 pl-3 pt-2">
                    {['buy', 'rent', 'hotel'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setFilterTab(tab)}
                            className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${filterTab === tab ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row items-center bg-gray-50 rounded-[1.5rem] border border-gray-100 p-2">
                  {/* City Input */}
                  <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full border-b md:border-b-0 md:border-r border-gray-200 hover:bg-white transition-colors group rounded-xl">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
                      <svg className="w-4 h-4 text-[#0065eb] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <div className="flex flex-col w-full">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">City</span>
                      <select className="modern-select text-xs font-bold text-slate-900 bg-transparent w-full">
                          <option>Hargeisa</option>
                          <option>Mogadishu</option>
                          <option>Berbera</option>
                      </select>
                    </div>
                  </div>

                  {/* Type Input */}
                  <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full border-b md:border-b-0 md:border-r border-gray-200 hover:bg-white transition-colors group rounded-xl">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    </div>
                    <div className="flex flex-col w-full">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">
                        {filterTab === 'hotel' ? 'Rooms' : 'Type'}
                      </span>
                      <select className="modern-select text-xs font-bold text-slate-900 bg-transparent w-full">
                          {filterTab === 'hotel' ? (
                            <>
                                <option>1 Room, 2 Guests</option>
                                <option>2 Rooms, 4 Guests</option>
                            </>
                          ) : (
                            <>
                                <option>Apartment</option>
                                <option>Villa</option>
                                <option>Office</option>
                            </>
                          )}
                      </select>
                    </div>
                  </div>

                   {/* Price Input */}
                   <div className="flex flex-1 items-center gap-3 px-4 py-5 w-full hover:bg-white transition-colors group rounded-xl">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                       <svg className="w-4 h-4 text-orange-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div className="flex flex-col w-full">
                      <span className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Price</span>
                      <select className="modern-select text-xs font-bold text-slate-900 bg-transparent w-full">
                          <option>Any Price</option>
                          <option>$50k - $100k</option>
                          <option>$100k+</option>
                      </select>
                    </div>
                  </div>

                  <button className="bg-[#0065eb] text-white w-full md:w-auto px-8 py-5 font-bold text-xs hover:bg-[#0052c1] transition-colors flex items-center justify-center gap-2 rounded-full shadow-lg shadow-blue-500/30">
                     Search
                  </button>
                </div>
              </div>

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
                <p className="text-gray-400 text-sm mb-1">Give us a Call <span className="text-white font-black hover:text-[#0065eb] transition-colors cursor-pointer">1-888-498-9240</span></p>
                <a href="#" className="text-[#0065eb] text-sm underline font-bold">check our pricing plans</a>
              </div>
            </div>
          </div>

          {/* BOTTOM SCROLLING PILLS */}
          <div className="flex items-center mt-12 lg:mt-0 pb-8 w-full translate-y-1">
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

      {/* ================= SECTION 2: FEATURED PROPERTIES (REAL DB DATA) ================= */}
      <section className="bg-[#fafbfc] py-20 relative z-20 reveal">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">Latest Featured <br/> Properties</h2>
            </div>
            <button className="hidden md:block border border-slate-200 px-6 py-3 rounded-full font-bold hover:bg-black hover:text-white transition-all text-sm">View All Listings</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.slice(0, 3).map((property) => {
                // --- TRUTH DATA LOGIC ---
                // Verification: Based on planTier ('pro'/'premium') OR explicit agentVerified flag
                const isVerified = property.planTier === 'pro' || property.planTier === 'premium' || property.agentVerified;
                
                // Status Label Logic
                let statusLabel = 'For Rent';
                let statusColor = 'bg-black'; // Default black

                if (property.status === 'rented_out') {
                    statusLabel = 'Rented';
                    statusColor = 'bg-red-600';
                } else if (property.isForSale) {
                    statusLabel = 'For Sale';
                    statusColor = 'bg-[#0065eb]';
                }

                // Location Formatting
                const locationText = getLocationString(property.location);

                return (
                <div key={property.id} className="modern-card group">
                <div className="modern-img-wrapper">
                    <img 
                        src={property.images && property.images.length > 0 ? property.images[0] : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000"} 
                        alt={property.title} 
                    />
                    
                    {/* STATUS BADGE */}
                    <div className={`status-badge ${statusColor}`}>
                        {statusLabel}
                    </div>
                    
                    {/* VERIFIED BADGE LOGIC */}
                    {isVerified ? (
                        <div className="verified-card">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            <span>Verified</span>
                        </div>
                    ) : (
                        <div className="unverified-card">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            <span>Unverified</span>
                        </div>
                    )}

                    <div className="price-badge">
                        {formatPrice(property.price)}
                        {!property.isForSale && <span className="text-sm font-normal text-gray-500">/mo</span>}
                    </div>
                    
                    <div className="card-actions">
                        <div className="action-btn"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div>
                        <div className="action-btn"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg></div>
                    </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors">{property.title}</h4>
                    {property.featured && <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black px-2 py-0.5 rounded">Featured</span>}
                    </div>
                    
                    <p className="text-gray-500 text-sm font-medium mb-5">{locationText}</p>
                    
                    <div className="flex gap-4 text-sm font-bold text-gray-700 mb-6">
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{property.bedrooms || 0}</span> Beds</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{property.bathrooms || 0}</span> Baths</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                    <span className="flex items-center gap-1"><span className="text-[#0065eb]">{property.area || 0}</span> Sqft</span>
                    </div>
                    <div className="mt-auto flex justify-between pt-4 border-t border-gray-100 gap-2">
                        <Link href={`/properties/${property.id}`} className="border border-gray-200 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:border-black transition-colors w-full text-center">
                            Details
                        </Link>
                        <button className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase hover:bg-[#0065eb] transition-colors w-full">
                            {property.status === 'rented_out' ? 'Rented' : 'Buy Now'}
                        </button>
                    </div>
                </div>
                </div>
            )})}
          </div>
        </div>
      </section>

      {/* ================= TRENDING HOTELS SECTION (REAL DB DATA) ================= */}
      <section className="bg-white pb-24 reveal">
         <div className="max-w-[1600px] mx-auto px-6">
            <h2 className="text-slate-900 text-4xl font-black leading-tight tracking-tight mb-10">Trending Hotels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredHotels.slice(0, 4).map((hotel) => {
                    // --- TRUTH DATA LOGIC ---
                    // Verification for hotels: planTier == 'pro' || 'premium'
                    const isHotelVerified = hotel.planTier === 'pro' || hotel.planTier === 'premium' || hotel.isPro;
                    const hotelLocation = getLocationString(hotel.location);

                    return (
                    <div key={hotel.id} className="hotel-card group relative">
                        <div className="h-64 overflow-hidden relative">
                            <img 
                                src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : `https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt={hotel.name} 
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Top Rated</div>
                             
                             {/* HOTEL VERIFICATION BADGE */}
                             {isHotelVerified ? (
                                <div className="verified-card">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Verified</span>
                                </div>
                             ) : (
                                <div className="unverified-card">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    <span>Unverified</span>
                                </div>
                             )}

                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-black hover:bg-[#0065eb] hover:text-white transition-colors shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></button>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{hotel.name}</h3>
                                <span className="flex items-center text-xs font-bold text-[#0065eb] gap-1">{hotel.rating || 5.0} <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>
                            </div>
                            
                            <p className="text-gray-400 text-xs font-bold mb-3">
                                {hotelLocation}
                            </p>

                            <div className="hotel-features">
                                <span className="hotel-feature">Free Wifi</span>
                                <span className="hotel-feature">Pool</span>
                                <span className="hotel-feature">Spa</span>
                            </div>
                            <div className="mt-5 flex items-center justify-between">
                                <div className="text-slate-900 font-black text-lg">{formatPrice(hotel.pricePerNight || 120)}<span className="text-xs font-normal text-gray-400">/night</span></div>
                                <Link href={`/hotels/${hotel.id}`} className="bg-[#0065eb] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-colors shadow-lg shadow-blue-500/20">
                                    Book Now
                                </Link>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
         </div>
      </section>

      {/* ================= SECTION 3: BENTO GRID ================= */}
      <section className="py-20 px-6 relative reveal" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470076892663-af684e5e15af?q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
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
            
            {/* Instant Booking - IMG BG */}
            <div className="bento-box md:col-span-1 md:row-span-2 p-8 group hover:border-[#0065eb]/50 bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 shadow-lg group-hover:bg-[#0065eb] transition-colors">⚡</div>
                <div>
                  <h3 className="text-white text-xl font-bold">Instant <br />Booking</h3>
                  <p className="text-gray-200 text-xs mt-3 leading-relaxed">No waiting. Secure your hotel room or schedule a house tour in seconds.</p>
                </div>
              </div>
            </div>

            {/* Active Users - IMG BG */}
            <div className="bento-box md:col-span-1 md:row-span-1 p-8 flex items-center justify-center bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-5xl font-black text-white mb-1">5M+</h3>
                <p className="text-[#0065eb] text-[10px] font-black uppercase tracking-[0.2em] bg-white/90 px-2 py-1 rounded">Active Users</p>
              </div>
            </div>

            {/* Verified Listings - IMG BG */}
            <div className="bento-box md:col-span-1 md:row-span-1 p-8 bg-[#0065eb] hover:bg-[#0052c1] cursor-pointer bento-img-bg" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600")'}}>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <h3 className="text-white font-bold text-lg leading-tight">100% Verified <br />Listings</h3>
                <div className="self-end w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-black">✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: GROW WITH GURIUP ================= */}
      <section className="bg-white py-20 reveal">
        <div className="max-w-[1600px] mx-auto px-6">
          <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tight">Grow With GuriUp</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AGENT CARD - Tag Top Left */}
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

            {/* HOTEL CARD - Tag Top Left */}
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
          </div>
        </div>
      </section>

      {/* ================= NEW: REFERRAL PROGRAM SECTION ================= */}
      <section className="bg-gradient-to-r from-[#0065eb] to-[#004bb5] py-20 reveal relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 text-center md:text-left">
                    <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block backdrop-blur-sm">Referral Program</span>
                    <h2 className="text-white text-4xl md:text-5xl font-black mb-6 leading-tight">Invite Friends, <br/> Get Rewards!</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-lg font-medium">Share GuriUp with your network. For every friend who joins, we’ll drop <span className="text-white font-bold underline decoration-yellow-400 decoration-4 underline-offset-4">100 GuriPoints</span> directly into your wallet.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button className="bg-white text-[#0065eb] px-8 py-4 rounded-xl font-bold text-sm shadow-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                           Share Your Link
                        </button>
                        <button className="border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
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

      {/* ================= SECTION 5: MOBILE APP ================= */}
      <section className="bg-[#050505] py-24 md:py-32 px-6 relative overflow-hidden reveal">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

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

          <div className="w-full md:w-1/2 flex justify-center md:justify-end relative z-10">
            <div className="app-phone">
              <div className="app-phone-screen"></div>
              {/* FLOAT CARD */}
              <div className="app-float-card">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1">Tour Booked</p>
                        <p className="text-lg font-black text-slate-900 leading-none">Tomorrow, 10:00 AM</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SUPER COMPLETE MODERN FOOTER ================= */}
     

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

export default HomeUI;