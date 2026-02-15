'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Calendar, Users, Search, 
  CheckCircle, Star, ArrowRight, ShieldCheck, 
  Wifi, Coffee, Award
} from 'lucide-react';

// --- FIX: Define types locally to ensure 'isPro' exists ---
interface Hotel {
  id: string;
  name: string;
  pricePerNight: number;
  images: string[];
  location: any; // Flexible for string or object
  rating: number;
  planTier?: string;
  isPro?: boolean; // <--- This fixes the build error
}

interface HotelsUIProps {
  featuredHotels: Hotel[];
  allHotels: Hotel[];
}

const HotelsUI = ({ featuredHotels, allHotels }: HotelsUIProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Format Helper
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);

  const getLocationString = (location: any) => {
    if (typeof location === 'string') return location;
    return location?.city || location?.address || 'Unknown Location';
  };

  return (
    <div className="font-sans text-slate-900 bg-white">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        .hero-bg {
          background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000');
          background-size: cover; background-position: center;
        }
        
        /* Modern Scrollbar for filters */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Card Hovers */
        .hotel-card { transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .hotel-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0, 101, 235, 0.1); }
        .hotel-card:hover .img-scale { transform: scale(1.1); }
      `}</style>

      {/* ================= HERO SECTION ================= */}
      <section className="relative h-[85vh] min-h-[600px] flex flex-col justify-end pb-20 px-6">
        <div className="absolute inset-0 hero-bg">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto w-full reveal">
          <div className="mb-8">
            <span className="bg-[#0065eb] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
              Hospitality Redefined
            </span>
            <h1 className="text-white text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Wake up in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                Paradise.
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-xl font-medium">
              Experience the finest collection of luxury hotels, boutique stays, and resorts across the Horn of Africa.
            </p>
          </div>

          {/* MODERN SEARCH CAPSULE */}
          <div className="bg-white p-3 rounded-[2rem] shadow-2xl max-w-4xl">
            <div className="flex flex-col md:flex-row gap-2">
              
              {/* Destination */}
              <div className="flex-1 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-[1.5rem] px-6 py-4 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#0065eb] group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Destination</label>
                    <input type="text" placeholder="Mogadishu, Somalia" className="w-full bg-transparent font-bold text-slate-900 outline-none placeholder:text-gray-300" />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex-1 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-[1.5rem] px-6 py-4 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Check In - Out</label>
                    <input type="text" placeholder="Add Dates" className="w-full bg-transparent font-bold text-slate-900 outline-none placeholder:text-gray-300" />
                  </div>
                </div>
              </div>

              {/* Guests */}
              <div className="flex-1 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-[1.5rem] px-6 py-4 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <Users size={18} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">Guests</label>
                    <input type="text" placeholder="2 Adults, 1 Room" className="w-full bg-transparent font-bold text-slate-900 outline-none placeholder:text-gray-300" />
                  </div>
                </div>
              </div>

              {/* Search Button */}
              <button className="bg-[#0065eb] text-white px-8 rounded-[1.5rem] font-bold text-sm hover:bg-[#0052c1] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 py-4 md:py-0">
                <Search size={20} />
                <span className="md:hidden">Search Hotels</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED HOTELS ================= */}
      <section className="py-24 bg-[#fafbfc] relative z-20 reveal">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Curated Stays</h2>
              <p className="text-gray-500 font-medium">Handpicked for quality, comfort, and style.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-[#0065eb] font-bold hover:gap-3 transition-all">
              View All <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.slice(0, 3).map((hotel) => (
              <Link href={`/hotels/${hotel.id}`} key={hotel.id} className="hotel-card bg-white rounded-[2rem] overflow-hidden border border-gray-100 block">
                <div className="h-72 overflow-hidden relative">
                  <Image 
                    src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80'} 
                    alt={hotel.name}
                    fill
                    className="object-cover img-scale"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-black text-slate-900">{hotel.rating.toFixed(1)}</span>
                  </div>
                  {hotel.isPro && (
                    <div className="absolute bottom-4 right-4 bg-[#0065eb] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                      <ShieldCheck size={12} /> Partner
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{hotel.name}</h3>
                  </div>
                  <p className="text-gray-400 text-xs font-bold mb-6 flex items-center gap-1">
                    <MapPin size={12} /> {getLocationString(hotel.location)}
                  </p>
                  
                  <div className="flex gap-2 mb-6">
                    {['Wifi', 'Pool', 'Breakfast'].map((amenity, i) => (
                      <span key={i} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        {i === 0 && <Wifi size={10} />}
                        {i === 1 && <Wifi size={10} />}
                        {i === 2 && <Coffee size={10} />}
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div>
                      <span className="text-2xl font-black text-slate-900">{formatPrice(hotel.pricePerNight)}</span>
                      <span className="text-gray-400 text-xs font-bold ml-1">/ night</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-[#0065eb] transition-colors">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY BOOK SECTION ================= */}
      <section className="py-24 bg-white reveal">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-[#0a0c10] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0065eb] opacity-20 blur-[150px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[#0065eb] font-bold text-xs uppercase tracking-[0.2em] mb-4 block">Why GuriUp?</span>
                <h2 className="text-white text-4xl md:text-5xl font-black mb-6 leading-tight">More than just <br/> a booking.</h2>
                <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md">
                  We verify every hotel partner personally to ensure your safety and comfort. Enjoy exclusive local rates you won't find on international platforms.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: <Award className="text-[#0065eb]" />, title: "Best Price", desc: "Guaranteed local rates." },
                    { icon: <ShieldCheck className="text-[#0065eb]" />, title: "Verified", desc: "Inspected properties." },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                      <div className="mb-4">{item.icon}</div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[500px] w-full hidden lg:block rounded-[2rem] overflow-hidden border-8 border-white/5 shadow-2xl">
                <Image src="https://images.unsplash.com/photo-1590490360182-f33db079502d?q=80&w=1000" alt="Interior" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ALL HOTELS LIST ================= */}
      <section className="py-24 bg-white reveal">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Explore All Stays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allHotels.map((hotel) => (
              <Link href={`/hotels/${hotel.id}`} key={hotel.id} className="group cursor-pointer">
                <div className="h-64 rounded-[2rem] overflow-hidden relative mb-4">
                  <Image 
                    src={hotel.images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80'} 
                    alt={hotel.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                </div>
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#0065eb] transition-colors">{hotel.name}</h3>
                    <span className="flex items-center text-xs font-bold text-slate-900 gap-1">
                      <Star size={12} className="fill-black" /> {hotel.rating}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-medium mt-1">{getLocationString(hotel.location)}</p>
                  <p className="text-slate-900 font-black mt-2">{formatPrice(hotel.pricePerNight)} <span className="text-gray-400 font-normal text-xs">/ night</span></p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-16">
            <button className="border-2 border-slate-100 text-slate-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-black hover:text-white hover:border-black transition-all">
              Load More Hotels
            </button>
          </div>
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="py-20 bg-[#fafbfc] border-t border-gray-100 reveal">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Questions?</h2>
            <p className="text-gray-500">Everything you need to know about booking with GuriUp.</p>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Can I pay with local mobile money?", a: "Yes! We support Zaad, EVC Plus, and Sahal for all local hotel bookings." },
              { q: "Is cancellation free?", a: "Most hotels offer free cancellation up to 24 hours before check-in. Check specific hotel policies." },
              { q: "Do I need an account to book?", a: "No, you can book as a guest, but creating an account lets you earn loyalty points." }
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HotelsUI;