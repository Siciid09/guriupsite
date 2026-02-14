'use client';

import React, { useState } from 'react';

const HeroSection = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // Data for infinite scroll (Duplicated for seamless loop)
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
        }

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

        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          gap: 1rem;
          width: max-content;
          /* Adjusted animation speed for smoothness */
          animation: scroll 40s linear infinite;
        }
        
        .mask-services {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }

        .mask-pills {
          mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, transparent 28%, black 38%, black 95%, transparent 100%);
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
      `}</style>

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

      <section className="hero-container">
        <div className="hero-bg"></div>

        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-10 flex flex-col h-full">
          
          {/* 1. NAVBAR */}
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

          {/* 2. MAIN HERO CONTENT */}
          <div className="flex flex-col lg:flex-row items-center flex-grow pt-10 md:pt-0">
            
            {/* LEFT SIDE */}
            <div className="w-full lg:w-[55%] flex flex-col justify-center">
              
              <div className="w-24 h-12 bg-[#0065eb] rounded-xl mb-6 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-900/50">
                <div className="w-5 h-5 bg-white rounded-full animate-pulse"></div>
              </div>

              {/* SMALLER HEADING (Changed to text-4xl md:text-6xl) */}
              <h1 className="text-white font-extrabold text-4xl md:text-6xl lg:text-[4.5rem] leading-[1.1] mb-6 tracking-tight">
                Choose Your <br /> Best Happy Land
              </h1>

              {/* SMALLER SUBTEXT (Changed to text-sm md:text-base) */}
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
                        {/* If using emojis for now, or map icons similar to below */}
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

          {/* 3. BOTTOM SCROLLING PILLS (MOVED DOWN) */}
          {/* Added 'translate-y-2' to move it down slightly */}
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