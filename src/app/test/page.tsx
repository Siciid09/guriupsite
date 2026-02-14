'use client';

import React, { useState } from 'react';

const HeroSection = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // --- DATA FOR HERO SECTION ---
  const serviceCards = [
    { icon: '📢', title: 'Comfortable', desc: 'Facebook, Google, & LinkedIn Ads.' },
    { icon: '📄', title: 'Luxury', desc: 'Instagram, TikTok & Snapchat Ads.' },
    { icon: '🏠', title: 'Reliable', desc: 'SEO & Local Marketing.' },
    // Duplicate for loop
    { icon: '📢', title: 'Comfortable', desc: 'Facebook, Google, & LinkedIn Ads.' },
    { icon: '📄', title: 'Luxury', desc: 'Instagram, TikTok & Snapchat Ads.' },
    { icon: '🏠', title: 'Reliable', desc: 'SEO & Local Marketing.' },
  ];

  const pillItems = [
    { label: 'Stadium', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h16M4 14h16M2 10h20M6 10v4M18 10v4M12 10v4" /></svg> },
    { label: 'Apartment', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> },
    { label: 'Villa', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Resort', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22v-5"/><path d="M10 20l3-7 4 2.5"/><path d="M8 22v-5"/><path d="M6 20l2-4 2.5 1"/></svg> },
    { label: 'Farm', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/><path d="M12.9 5.8a10 10 0 0 1 1.7 8.5"/><path d="M12 22s-2-9 5.2-13a2.6 2.6 0 0 0-1.7-2"/><path d="M22 22s-2-9-5.2-13a2.6 2.6 0 0 1 1.7-2"/></svg> },
    // Duplicate for loop
    { label: 'Stadium', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 10h16M4 14h16M2 10h20M6 10v4M18 10v4M12 10v4" /></svg> },
    { label: 'Apartment', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> },
    { label: 'Villa', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: 'Resort', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22v-5"/><path d="M10 20l3-7 4 2.5"/><path d="M8 22v-5"/><path d="M6 20l2-4 2.5 1"/></svg> },
    { label: 'Farm', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/><path d="M12.9 5.8a10 10 0 0 1 1.7 8.5"/><path d="M12 22s-2-9 5.2-13a2.6 2.6 0 0 0-1.7-2"/><path d="M22 22s-2-9-5.2-13a2.6 2.6 0 0 1 1.7-2"/></svg> },
  ];

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #fff;
          overflow-x: hidden;
        }

        /* --- HERO STYLES --- */
        .hero-container {
          width: 100%;
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
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

        /* SCROLL ANIMATION */
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .speed-services { animation: scroll 24s linear infinite; }

        .mask-services {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .mask-pills {
          mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
        }

        @media (max-width: 1024px) {
            .hero-container { height: auto; min-height: 100vh; }
            .hero-bg { clip-path: none; }
            .mask-pills {
                mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
            }
        }

        .nav-link { position: relative; font-weight: 800; }
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

        /* --- STYLES FOR OTHER SECTIONS --- */
        
        /* Modern Property Cards */
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
        
        .price-badge {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(10px);
            padding: 8px 16px;
            border-radius: 12px;
            font-weight: 800;
            color: #0a0c10;
            font-size: 1.1rem;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #0065eb;
            color: white;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            padding: 6px 12px;
            border-radius: 30px;
            letter-spacing: 0.5px;
        }

        /* Bento Grid */
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

        /* Image BG Card */
        .image-bg-card {
            position: relative;
            border-radius: 30px;
            overflow: hidden;
            height: 450px;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .image-bg-card img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s ease;
        }
        .image-bg-card:hover img {
            transform: scale(1.1);
        }
        .card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, transparent 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 40px;
            transition: all 0.3s ease;
        }
        .image-bg-card:hover .card-overlay {
            padding-bottom: 50px;
        }

        /* Phone App */
        .app-phone {
            width: 280px;
            height: 560px;
            background: #000;
            border: 8px solid #333;
            border-radius: 40px;
            position: relative;
            box-shadow: 0 0 0 2px #555, 0 20px 50px -10px rgba(0,0,0,0.5);
        }
        .app-phone-screen {
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600') center/cover;
            border-radius: 32px;
            overflow: hidden;
        }
        .app-phone::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 20px;
            background: #000;
            border-radius: 0 0 10px 10px;
            z-index: 20;
        }
        @media(max-width: 768px) {
            .image-bg-card { height: 350px; }
            .card-overlay { padding: 24px; }
        }
      `}</style>

      {/* --- WHATSAPP FLOAT --- */}
      <div className="whatsapp-float fixed right-5 bottom-4 z-[1000] flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform">
        <span className="text-[12px] font-bold">Chat with GuriUp</span>
        <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.891 11.891-2.003 0-3.976-.505-5.717-1.46l-6.276 1.678zm6.29-4.15l.349.21c1.47.882 3.167 1.347 4.914 1.347 5.176 0 9.39-4.214 9.39-9.39 0-2.505-.974-4.86-2.744-6.628-1.77-1.77-4.122-2.744-6.628-2.744-5.176 0-9.39 4.214-9.39 9.39 0 1.83.533 3.613 1.54 5.143l.235.357-1.01 3.687 3.744-.982z"/></svg>
      </div>

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
          <nav className="flex justify-between items-center py-6">
            <div className="text-white border-2 border-white/30 px-4 py-1.5 text-sm md:text-base font-black uppercase rounded tracking-wider cursor-pointer hover:border-white transition-colors">
              GuriUp
            </div>

            <div className="hidden lg:flex gap-8 text-sm font-bold text-gray-400">
              <a href="#" className="text-[#0065eb] nav-link">Home</a>
              <a href="#" className="nav-link hover:text-white transition-colors">Properties</a>
              <a href="#" className="nav-link hover:text-white transition-colors">Hotels</a>
              <a href="#" className="nav-link hover:text-white transition-colors">Agents</a>
              <a href="#" className="nav-link hover:text-white transition-colors">Contact</a>
              <a href="#" className="nav-link hover:text-white transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="text-white text-xs font-bold hidden md:block">Log In</a>
              <div className="flex items-center gap-2">
                <button className="bg-white/10 text-white rounded-full px-6 py-2 text-[10px] font-bold hover:bg-white hover:text-black transition-all">Sign Up</button>
                <button className="bg-[#0065eb] text-white rounded-full px-4 py-2 text-[10px] font-bold hover:bg-[#0052c1] transition-all flex items-center gap-1">
                  Download
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                </button>
              </div>
              <div className="lg:hidden cursor-pointer" onClick={toggleNav}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </div>
            </div>
          </nav>

          {/* HERO CONTENT */}
          <div className="flex flex-col lg:flex-row items-center flex-grow pt-10 md:pt-0">
            
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

              <div className="bg-white rounded-3xl md:rounded-full p-2 flex flex-col md:flex-row items-center shadow-2xl w-full max-w-xl mb-12 relative z-20">
                <div className="flex flex-1 items-center gap-4 px-6 py-4 md:py-2 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer rounded-t-2xl md:rounded-l-full group">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 text-[#0065eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Property type</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      Show all 
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 items-center gap-4 px-6 py-4 md:py-2 w-full hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Price range</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                      Any price 
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                </div>

                <button className="bg-[#0065eb] text-white w-full md:w-auto px-10 py-4 md:py-3 rounded-2xl md:rounded-full font-bold text-sm hover:bg-[#0052c1] transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                   Search
                </button>
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
              <div className="glass-card p-5 w-52 special-service-shape mb-6 self-end mr-20">
                <h3 className="text-white font-black text-lg">Our Special Service</h3>
              </div>
              
              {/* INFINITE SCROLL SERVICES */}
              <div className="w-[140%] -mr-32 overflow-hidden py-4 mask-services">
                <div className="flex gap-4 animate-scroll">
                  {serviceCards.map((card, i) => (
                    <div key={i} className="glass-card p-6 w-[240px] h-[200px] shrink-0 flex flex-col justify-center rounded-[32px]">
                      <div className={`w-10 h-10 ${i % 3 === 0 ? 'bg-[#0065eb]' : (i % 3 === 1 ? 'bg-white/10' : 'bg-white/5 border border-white/10')} rounded-full flex items-center justify-center mb-4 text-xl`}>
                         {i % 3 === 0 && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>}
                         {i % 3 === 1 && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                         {i % 3 === 2 && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                      </div>
                      <h4 className="text-white text-lg font-black mb-1">{card.title}</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto text-right mb-4 pb-4 translate-y-[36px] mr-10">
                <p className="text-gray-400 text-sm mb-1">Give us a Call <span className="text-white font-black hover:text-[#0065eb] transition-colors cursor-pointer">1-888-498-9240</span></p>
                <a href="#" className="text-[#0065eb] text-sm underline font-bold">check our pricing plans</a>
              </div>
            </div>
          </div>

          {/* BOTTOM SCROLLING PILLS */}
          <div className="flex items-center mt-12 lg:mt-0 pb-8 w-full translate-y-2">
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

      {/* ================= SECTION 2: FEATURED PROPERTIES ================= */}
      <section className="bg-[#fafbfc] py-12 relative z-20">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">Latest Featured <br/> Properties</h2>
            </div>
            <button className="hidden md:block border border-slate-200 px-6 py-3 rounded-full font-bold hover:bg-black hover:text-white transition-all text-sm">View All Listings</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="modern-card group">
              <div className="modern-img-wrapper">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000" alt="House" />
                <div className="status-badge">For Sale</div>
                <div className="price-badge">$2,450,000</div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors">Modern Glass Villa</h4>
                  <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-5">Beverly Hills, California</p>
                <div className="flex gap-4 text-sm font-bold text-gray-700 mb-6">
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">4</span> Beds</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">3</span> Baths</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">3,200</span> Sqft</span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" className="w-8 h-8 rounded-full" alt="Agent" />
                  <span className="text-xs font-bold text-gray-500">Listed by James D.</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="modern-card group">
              <div className="modern-img-wrapper">
                <img src="https://images.unsplash.com/photo-1600607687940-c52af0a43328?q=80&w=1000" alt="House" />
                <div className="status-badge bg-black">For Rent</div>
                <div className="price-badge">$8,500<span className="text-sm font-normal text-gray-500">/mo</span></div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors">Skyline Penthouse</h4>
                  <div className="bg-green-100 text-green-700 p-1.5 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-5">New York, NY</p>
                <div className="flex gap-4 text-sm font-bold text-gray-700 mb-6">
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">2</span> Beds</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">2</span> Baths</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">1,800</span> Sqft</span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" className="w-8 h-8 rounded-full" alt="Agent" />
                  <span className="text-xs font-bold text-gray-500">Listed by Sarah L.</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="modern-card group">
              <div className="modern-img-wrapper">
                <img src="https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?q=80&w=1000" alt="House" />
                <div className="status-badge bg-orange-500">Pending</div>
                <div className="price-badge">$3,120,000</div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors">Azure Waterfront</h4>
                  <div className="bg-gray-100 text-gray-400 p-1.5 rounded-full"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-5">Miami, Florida</p>
                <div className="flex gap-4 text-sm font-bold text-gray-700 mb-6">
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">5</span> Beds</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">4</span> Baths</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full self-center"></span>
                  <span className="flex items-center gap-1"><span className="text-[#0065eb]">4,500</span> Sqft</span>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/men/11.jpg" className="w-8 h-8 rounded-full" alt="Agent" />
                  <span className="text-xs font-bold text-gray-500">Listed by Mike R.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 3: BENTO GRID ================= */}
      <section className="py-20 px-6 relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1470076892663-af684e5e15af?q=80&w=2000')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]"></div>

        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <span className="text-[#0065eb] font-bold text-xs uppercase tracking-widest">The GuriUp Ecosystem</span>
              <h2 className="text-white text-4xl font-black mt-2">Homes & Hotels <br /> In One App</h2>
            </div>
            <p className="text-gray-400 max-w-sm text-sm">Whether you are buying your forever home or booking a weekend getaway, do it all with a single account.</p>
          </div>

          <div className="bento-grid">
            <div className="bento-box md:col-span-2 md:row-span-2 p-10 group">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-all duration-700 group-hover:scale-105" alt="Hotel" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex gap-2">
                  <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Properties</span>
                  <span className="bg-[#0065eb] text-white px-3 py-1 rounded-full text-xs font-bold">Hotels</span>
                </div>
                <div>
                  <h3 className="text-white text-3xl font-bold mb-2">Switch Worlds <br />Instantly</h3>
                  <p className="text-gray-300 text-sm max-w-xs">One click to switch between real estate listings and luxury hotel bookings.</p>
                </div>
              </div>
            </div>
            <div className="bento-box md:col-span-1 md:row-span-2 p-8 group">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl border border-white/10">⚡</div>
                <div>
                  <h3 className="text-white text-xl font-bold">Instant <br />Booking</h3>
                  <p className="text-gray-400 text-xs mt-2">No waiting. Secure your hotel room or schedule a house tour in seconds.</p>
                </div>
              </div>
            </div>
            <div className="bento-box md:col-span-1 md:row-span-1 p-8 bg-[#0a0c10]">
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 mb-1">5M+</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active GuriUp Users</p>
              </div>
            </div>
            <div className="bento-box md:col-span-1 md:row-span-1 p-8 bg-[#0065eb] hover:bg-[#0052c1] cursor-pointer">
              <div className="relative z-10 h-full flex flex-col justify-between">
                <h3 className="text-white font-bold text-lg leading-tight">100% Verified <br />Listings</h3>
                <div className="self-end w-8 h-8 bg-white rounded-full flex items-center justify-center text-black">✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: GROW WITH GURIUP ================= */}
      <section className="bg-white py-20">
        <div className="max-w-[1600px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Grow With GuriUp</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="image-bg-card group">
              <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000" alt="Real Estate Agent" />
              <div className="card-overlay">
                <div className="bg-[#0065eb] w-fit px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-4">For Agents</div>
                <h3 className="text-white text-3xl font-bold mb-2">Close Deals Faster</h3>
                <p className="text-white/80 text-sm mb-6 max-w-md opacity-0 group-hover:opacity-100 transition-opacity">Access our database of verified buyers and sellers. Use GuriUp's CRM tools to manage your portfolio efficiently.</p>
                <span className="text-white font-bold underline text-sm opacity-0 group-hover:opacity-100 transition-opacity">Join as an Agent →</span>
              </div>
            </div>

            <div className="image-bg-card group">
              <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1000" alt="Hotel Lobby" />
              <div className="card-overlay">
                <div className="bg-white w-fit px-4 py-1 rounded-full text-black text-[10px] font-black uppercase tracking-widest mb-4">For Hotels</div>
                <h3 className="text-white text-3xl font-bold mb-2">Fill Every Room</h3>
                <p className="text-white/80 text-sm mb-6 max-w-md opacity-0 group-hover:opacity-100 transition-opacity">List your hotel on the fastest growing booking platform. Manage reservations and pricing in real-time.</p>
                <span className="text-white font-bold underline text-sm opacity-0 group-hover:opacity-100 transition-opacity">List Your Hotel →</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: MOBILE APP ================= */}
      <section className="bg-[#050505] py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0065eb] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-20">
          <div className="w-full md:w-1/2 z-10">
            <span className="text-[#0065eb] font-bold text-sm uppercase tracking-widest mb-4 block">Go Mobile</span>
            <h2 className="text-white text-5xl md:text-7xl font-black leading-[1.1] mb-8">
              Property Searching. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">Reinvented.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-md">Get instant notifications on price drops, explore neighborhoods with AR, and book tours in one click.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.49l1.84-3.18a.56.56 0 0 0-.2-.76.56.56 0 0 0-.77.2l-1.93 3.32a9.1 9.1 0 0 0-4.54-1.22 9.1 9.1 0 0 0-4.55 1.22L5.53 5.75a.56.56 0 0 0-.77-.2.56.56 0 0 0-.2.76l1.84 3.18A9.2 9.2 0 0 0 2.5 17c0 0 .1.1.25.1h18.5c.15 0 .25-.1.25-.1a9.2 9.2 0 0 0-3.9-7.51zM8.25 14.5a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25zm7.5 0a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Get it on</div>
                  <div className="text-base leading-none">Google Play</div>
                </div>
              </button>
              <button className="bg-[#1a1e23] border border-white/10 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-[#252a30] transition-colors">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.5 1.55-.03 3.03 1.04 3.98 1.04 1.26 0 3.22-1.54 5.39-1.31 2.27.1 4 1.63 4.65 2.58-3.92 1.95-3.3 6.94.8 8.65l-.93 1.65zM13 3.5c.53-1.38 2.3-2.5 4.38-2.5.34 1.7-1.48 3.53-2.8 4.15-1.1.58-2.65.5-2.13-1.07z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold text-gray-500">Download on the</div>
                  <div className="text-base leading-none">App Store</div>
                </div>
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex justify-center md:justify-end relative z-10">
            <div className="app-phone transform rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
              <div className="app-phone-screen"></div>
            </div>
            <div className="absolute top-1/2 -left-10 bg-white p-4 rounded-2xl shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</div>
                <div>
                  <p className="text-xs text-gray-500 font-bold">Tour Booked</p>
                  <p className="text-sm font-bold">Tomorrow, 10:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white py-20 px-10 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[1600px] mx-auto">
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">About</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Careers</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Blog</a>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Buyers Guide</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Sellers Guide</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Investors</a>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Help Center</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Terms</a>
            <a href="#" className="block text-gray-500 hover:text-black mb-2">Privacy</a>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex border-b border-black pb-2">
              <input type="email" placeholder="Enter your email" className="w-full outline-none text-black placeholder-gray-400" />
              <button className="font-bold">SUBMIT</button>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1600px] mx-auto pt-20 flex justify-between items-end">
             <div className="text-[80px] md:text-[120px] leading-none font-black text-gray-100 select-none">GuriUp.</div>
             <p className="text-gray-400 font-bold mb-6">© 2026 GuriUp Inc.</p>
        </div>
      </footer>

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

export default HeroSection;