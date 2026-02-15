'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Home, Wallet, Search, Award, ShieldCheck, 
  ArrowRight, Users, Zap, Building2, LandPlot, Building
} from 'lucide-react';

// --- TYPES (Local copy for the UI) ---
interface Property {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: any;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  status: string;
  isForSale: boolean;
  featured?: boolean;
}

// =======================================================================
//  MODERN UI COMPONENT (Consolidated)
// =======================================================================
export default function PropertiesPage({ 
  featuredProperties = [], 
  allProperties = [] 
}: { 
  featuredProperties: Property[], 
  allProperties: Property[] 
}) {
  const [filterTab, setFilterTab] = useState<'all' | 'buy' | 'rent'>('all');

  // --- Scroll Animation ---
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      <style jsx global>{`
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.3); }
        .hero-gradient { background: linear-gradient(to bottom, #0f172a, #1e293b); }
      `}</style>

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
          <div className="glass-card p-3 rounded-[2.5rem] shadow-2xl max-w-5xl mx-auto flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-slate-50/50 rounded-[1.8rem] border border-transparent hover:border-blue-500/30 transition-all group">
              <MapPin className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400">Location</p>
                <input type="text" placeholder="Where is home?" className="bg-transparent font-bold text-slate-900 outline-none w-full" />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-4 px-6 py-4 bg-slate-50/50 rounded-[1.8rem] border border-transparent hover:border-blue-500/30 transition-all group">
              <Home className="text-blue-500" size={20} />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-400">Category</p>
                <select className="bg-transparent font-bold text-slate-900 outline-none w-full appearance-none">
                  <option>All Properties</option>
                  <option>Villas</option>
                  <option>Apartments</option>
                  <option>Commercial</option>
                </select>
              </div>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 rounded-[1.8rem] font-black text-sm transition-all shadow-xl shadow-blue-500/20 py-5 flex items-center justify-center gap-3">
              <Search size={20} /> Search Now
            </button>
          </div>
        </div>
      </section>

      {/* --- 2. BENTO GRID TYPES --- */}
      <section className="py-24 max-w-[1400px] mx-auto px-6 reveal">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'Modern Villas', icon: <Building2 />, count: '120+', bg: 'bg-blue-50', text: 'text-blue-600' },
            { name: 'City Apartments', icon: <Building />, count: '450+', bg: 'bg-indigo-50', text: 'text-indigo-600' },
            { name: 'Luxury Lands', icon: <LandPlot />, count: '85+', bg: 'bg-emerald-50', text: 'text-emerald-600' },
            { name: 'Retail Space', icon: <Zap />, count: '32+', bg: 'bg-orange-50', text: 'text-orange-600' },
          ].map((item) => (
            <div key={item.name} className={`${item.bg} p-8 rounded-[2.5rem] hover:scale-[1.02] transition-all cursor-pointer group`}>
              <div className={`${item.text} mb-12 group-hover:scale-110 transition-transform`}>{item.icon}</div>
              <h3 className="text-slate-900 font-black text-xl mb-1">{item.name}</h3>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{item.count} Listings</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- 3. FEATURED LISTINGS (GRID) --- */}
      <section className="bg-slate-50 py-24 px-6 reveal">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Handpicked <br /> Selection</h2>
              <div className="h-1.5 w-24 bg-blue-600 rounded-full mt-4"></div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredProperties.map((prop) => (
              <div key={prop.id} className="group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                <div className="relative h-80 overflow-hidden m-4 rounded-[2rem]">
                  <Image src={prop.images[0]} alt={prop.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="bg-white/90 backdrop-blur text-slate-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg">Featured</span>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg">Verified</span>
                  </div>
                  <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur text-white px-5 py-2.5 rounded-2xl font-black text-lg shadow-xl">
                    {formatPrice(prop.price)}
                    {!prop.isForSale && <span className="text-xs font-medium text-slate-400 ml-1">/mo</span>}
                  </div>
                </div>
                <div className="p-8 pt-4">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{prop.title}</h3>
                  <p className="flex items-center gap-2 text-slate-400 font-medium mb-8 text-sm">
                    <MapPin size={16} /> {typeof prop.location === 'string' ? prop.location : 'Somalia'}
                  </p>
                  <div className="flex items-center justify-between py-6 border-t border-slate-50">
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-xl font-black text-slate-900">{prop.bedrooms}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beds</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-black text-slate-900">{prop.bathrooms}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baths</p>
                      </div>
                    </div>
                    <Link href={`/properties/${prop.id}`} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <ArrowRight size={24} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

      {/* --- 5. THE ADVANTAGE (GLASS CARDS) --- */}
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
    </div>
  );
}

// =======================================================================
//  SERVER-SIDE DATA FETCHING (PAGE)
// =======================================================================
/*
import { getFeaturedProperties, getAllProperties } from '../../lib/data';

export default async function Page() {
  const [featured, all] = await Promise.all([
    getFeaturedProperties(),
    getAllProperties(),
  ]);

  return <PropertiesPage featuredProperties={featured} allProperties={all} />;
}
*/