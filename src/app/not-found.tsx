'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, Search, ArrowLeft, MapPin, 
  Building, Key, Hotel 
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* --- BACKGROUND BLOBS (Matches your Home UI) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px] opacity-60 pointer-events-none" />

      <div className="max-w-2xl w-full text-center relative z-10">
        
        {/* --- 404 VISUAL --- */}
        <div className="mb-10 relative inline-block">
          <h1 className="text-[150px] md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-50 leading-none select-none">
            404
          </h1>
          
          {/* Floating Element Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 flex items-center justify-center animate-bounce-slow border border-slate-50">
              <MapPin size={48} className="text-[#0065eb] fill-blue-50" />
            </div>
          </div>
        </div>

        {/* --- TEXT CONTENT --- */}
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
          Lost in the neighborhood?
        </h2>
        <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          The property or page you are looking for might have been sold, removed, or is temporarily unavailable.
        </p>

        {/* --- SEARCH BAR --- */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mb-10 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="text-slate-400 group-focus-within:text-[#0065eb] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Try searching for 'Villas in Hargeisa'..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-[#0065eb]/20 focus:border-[#0065eb] transition-all text-slate-900 font-medium placeholder:text-slate-400"
          />
        </form>

        {/* --- QUICK ACTION GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <QuickLink href="/" icon={<Home size={20} />} label="Home" />
          <QuickLink href="/search?mode=buy" icon={<Building size={20} />} label="Buy" />
          <QuickLink href="/search?mode=rent" icon={<Key size={20} />} label="Rent" />
          <QuickLink href="/search?mode=hotel" icon={<Hotel size={20} />} label="Hotels" />
        </div>

        {/* --- BACK BUTTON --- */}
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors uppercase tracking-widest group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Go Back Previous Page
        </button>

      </div>

      {/* --- CSS FOR SLOW BOUNCE --- */}
      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

// --- HELPER COMPONENT ---
function QuickLink({ href, icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[#0065eb] group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{label}</span>
    </Link>
  );
}