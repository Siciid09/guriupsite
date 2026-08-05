'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import LocationSelectorModal, { LocationResult } from '@/components/LocationSelectorModal';
import { 
  Search, MapPin, Filter, X, ChevronDown, CheckCircle2, 
  Phone, MessageCircle, Briefcase, Star, Award, SlidersHorizontal, 
  ShieldCheck
} from 'lucide-react';

// --- CUSTOM BRAND ICONS ---
const Icons = {
  Verified: () => <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
  Whatsapp: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.891 11.891-2.003 0-3.976-.505-5.717-1.46l-6.276 1.678zm6.29-4.15l.349.21c1.47.882 3.167 1.347 4.914 1.347 5.176 0 9.39-4.214 9.39-9.39 0-2.505-.974-4.86-2.744-6.628-1.77-1.77-4.122-2.744-6.628-2.744-5.176 0-9.39 4.214-9.39 9.39 0 1.83.533 3.613 1.54 5.143l.235.357-1.01 3.687 3.744-.982z" /></svg>,
  Rocket: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Loader: () => <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Upgrade: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
};

// --- DATA TYPES ---
interface Agent {
  id: string;             
  slug?: string;
  name: string;           
  agencyName: string;     
  profileImageUrl: string;
  coverPhoto: string;     
  planTier: string;       
  totalListings: number; 
  averageRating: number; 
  phone: string;          
  specialties: string[];  
  isVerified: boolean;    
  location: string;
}

const ITEMS_PER_PAGE = 24; 

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as any, stiffness: 100, damping: 15 } }
};

export default function AgentsPage() {
  const router = useRouter();
  const { user } = useAuth(); 
  
  // --- STATE ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0); 
  const [hasMore, setHasMore] = useState(true);
  
  // Advanced Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false);
  
  // Current Agent State for Hero Button
  const [currentAgentProfile, setCurrentAgentProfile] = useState<Agent | null>(null);
  const [checkingAgentStatus, setCheckingAgentStatus] = useState(false);
  const specialtyRef = useRef<HTMLDivElement>(null);

  const ALL_SPECIALTIES = ['All', 'Residential', 'Commercial', 'Luxury', 'Land', 'Rentals', 'Investments'];

  // Handle outside click for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (specialtyRef.current && !specialtyRef.current.contains(event.target as Node)) {
        setIsSpecialtyDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 1. FETCH AGENTS LOGIC ---
  const fetchAgents = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }
      
      const currentOffset = isInitial ? 0 : offset;
      const res = await fetch(`/api/agents?limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`);
      
      if (!res.ok) throw new Error('Failed to fetch agents');

      const data = await res.json();
      
      if (isInitial) {
        setAgents(data.agents || []);
      } else {
        setAgents(prev => {
          const combined = [...prev, ...(data.agents || [])];
          return combined.sort((a, b) => b.totalListings - a.totalListings);
        });
      }

      setHasMore(data.hasMore);
      setOffset(currentOffset + ITEMS_PER_PAGE);

    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchAgents(true);
  }, []);

  // --- 2. CHECK CURRENT USER AGENT STATUS ---
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid) {
        setCurrentAgentProfile(null);
        return;
      }
      setCheckingAgentStatus(true);
      try {
        const res = await fetch(`/api/agents?id=${user.uid}`);
        if (res.ok) {
           const data = await res.json();
           setCurrentAgentProfile(data as Agent);
        } else {
           setCurrentAgentProfile(null);
        }
      } catch (e) {
        setCurrentAgentProfile(null);
      } finally {
        setCheckingAgentStatus(false);
      }
    };
    checkStatus();
  }, [user]);

  // --- 3. SUPER ADVANCED FILTERING LOGIC ---
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // 1. Omnisearch (Name, Agency, Phone, Location, Specialties)
      let matchesSearch = true;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase().trim();
        matchesSearch = 
          (agent.name && agent.name.toLowerCase().includes(q)) ||
          (agent.agencyName && agent.agencyName.toLowerCase().includes(q)) ||
          (agent.phone && agent.phone.includes(q)) ||
          (agent.location && agent.location.toLowerCase().includes(q)) ||
          (agent.specialties && agent.specialties.some(s => s.toLowerCase().includes(q)));
      }

      // 2. Strict Location Filter (From Modal)
      let matchesLocation = true;
      if (selectedLocation?.city) {
        const targetCity = selectedLocation.city.toLowerCase();
        const targetDistrict = selectedLocation.district?.toLowerCase();
        const agentLoc = agent.location?.toLowerCase() || '';
        
        matchesLocation = agentLoc.includes(targetCity);
        if (matchesLocation && targetDistrict) {
          matchesLocation = agentLoc.includes(targetDistrict);
        }
      }

      // 3. Specialty Dropdown Filter
      let matchesSpecialty = true;
      if (selectedSpecialty !== 'All') {
        matchesSpecialty = agent.specialties?.includes(selectedSpecialty) || false;
      }

      // 4. Verified Only Toggle
      let matchesVerified = true;
      if (verifiedOnly) {
        matchesVerified = agent.isVerified === true;
      }

      return matchesSearch && matchesLocation && matchesSpecialty && matchesVerified;
    });
  }, [agents, searchTerm, selectedLocation, selectedSpecialty, verifiedOnly]);

  // --- CONTACT LOGIC ---
  const handleContactClick = (e: React.MouseEvent, agent: Agent, type: 'call' | 'whatsapp') => {
    e.stopPropagation(); 
    e.preventDefault();

    if (!agent.isVerified) {
      setShowRestrictedModal(true);
      return;
    }

    const targetPhone = agent.phone || '+252653227084';
    if (type === 'call') {
      window.open(`tel:${targetPhone}`);
    } else {
      let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('63') && cleanPhone.length === 9) cleanPhone = '252' + cleanPhone;
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  // --- HERO BUTTON ---
  const renderHeroButton = () => {
    if (checkingAgentStatus) return <button disabled className="bg-white/20 text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 backdrop-blur-md"><Icons.Loader /> Checking...</button>;
    if (!user) return <a href="https://guriup.hiigsitech.com/signup?role=reagent" target="_blank" rel="noopener noreferrer" className="bg-white text-[#0065eb] px-8 py-4 rounded-full font-black text-sm hover:bg-blue-50 transition-all shadow-2xl hover:-translate-y-1 flex items-center gap-2"><Icons.Rocket /> Register Now</a>;
    const isPro = currentAgentProfile && ['pro', 'premium'].includes(currentAgentProfile.planTier);
    if (!isPro) return <button onClick={() => router.push('/pricing')} className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 px-8 py-4 rounded-full font-black text-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30"><Icons.Upgrade /> Upgrade to Pro</button>;
    return <button onClick={() => router.push('/dashboard/agent')} className="bg-white text-slate-900 px-8 py-4 rounded-full font-black text-sm hover:bg-slate-50 transition-all shadow-2xl hover:-translate-y-1 flex items-center gap-2"><Briefcase size={18} /> Manage Profile</button>;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLocation(null);
    setSelectedSpecialty('All');
    setVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] font-sans text-slate-900 pb-24 selection:bg-blue-200">
      
      {/* ================= SUPER MODERN HERO WALL ================= */}
      <section className="relative w-full h-[65vh] min-h-[550px] flex items-center justify-center mb-32">
        <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[4rem]">
            <Image 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000" 
                alt="Luxury Real Estate" 
                fill
                className="object-cover scale-105 animate-[slowPan_20s_ease-in-out_infinite_alternate]"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-900/90 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 px-6 w-full max-w-[1400px] flex flex-col items-center text-center -mt-16">
           <span className="bg-white/10 backdrop-blur-md text-blue-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20 mb-6 shadow-2xl">
             GuriUp Elite Network
           </span>
           <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 leading-[1.05] tracking-tighter drop-shadow-2xl">
              Connect with <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#0065eb]">Top Agents.</span>
           </h1>
           <p className="text-slate-300 text-sm md:text-lg font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover verified real estate professionals ready to help you buy, sell, or rent your perfect property in the Horn of Africa.
           </p>
           {renderHeroButton()}
        </div>

        {/* ================= FLOATING GLASSMORPHISM FILTER BAR ================= */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[95%] max-w-[1200px] z-30">
          <div className="bg-white/90 backdrop-blur-2xl p-3 md:p-4 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,101,235,0.15)] border border-white flex flex-col md:flex-row items-center gap-3">
             
             {/* 1. Global Search */}
             <div className="flex-[1.5] w-full relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-[#0065eb]">
                   <Search size={20} />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, phone, or agency..." 
                  className="w-full pl-14 pr-10 py-4 md:py-5 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-slate-600">
                    <X size={16}/>
                  </button>
                )}
             </div>

             <div className="hidden md:block w-[1px] h-12 bg-slate-200"></div>

             {/* 2. Location Modal Trigger */}
             <div className="flex-1 w-full">
                <button 
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full flex items-center justify-between px-5 py-4 md:py-5 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 rounded-[1.5rem] transition-all group"
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                      <MapPin size={20} className="text-[#0065eb] shrink-0" />
                      <div className="flex flex-col items-start text-left truncate">
                         <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Location</span>
                         <span className="text-sm font-bold text-slate-900 truncate w-full">
                           {selectedLocation ? `${selectedLocation.city}${selectedLocation.district ? `, ${selectedLocation.district}` : ''}` : 'Anywhere'}
                         </span>
                      </div>
                   </div>
                   {selectedLocation ? (
                     <div onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); }} className="p-1 bg-slate-200 rounded-full hover:bg-slate-300 text-slate-600"><X size={12}/></div>
                   ) : (
                     <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
                   )}
                </button>
             </div>

             <div className="hidden md:block w-[1px] h-12 bg-slate-200"></div>

             {/* 3. Specialty Dropdown */}
             <div className="flex-1 w-full relative" ref={specialtyRef}>
                <button 
                  onClick={() => setIsSpecialtyDropdownOpen(!isSpecialtyDropdownOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 md:py-5 bg-slate-50/50 hover:bg-slate-100/50 border border-slate-100 rounded-[1.5rem] transition-all group"
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                      <Briefcase size={20} className="text-[#0065eb] shrink-0" />
                      <div className="flex flex-col items-start text-left truncate">
                         <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Specialty</span>
                         <span className="text-sm font-bold text-slate-900 truncate w-full">{selectedSpecialty}</span>
                      </div>
                   </div>
                   <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
                </button>
                
                {isSpecialtyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[1.5rem] shadow-2xl p-2 z-[100] border border-slate-100 max-h-60 overflow-y-auto">
                    {ALL_SPECIALTIES.map(spec => (
                      <button 
                        key={spec} 
                        onClick={() => { setSelectedSpecialty(spec); setIsSpecialtyDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedSpecialty === spec ? 'bg-[#0065eb] text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                )}
             </div>

             {/* 4. Verified Toggle & Reset */}
             <div className="flex items-center justify-between w-full md:w-auto px-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                   <div className="relative">
                     <input type="checkbox" className="sr-only" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                     <div className={`block w-12 h-7 rounded-full transition-colors ${verifiedOnly ? 'bg-[#0065eb]' : 'bg-slate-200'}`}></div>
                     <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${verifiedOnly ? 'transform translate-x-5 shadow-sm' : ''}`}></div>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-xs font-black text-slate-900">Verified</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Only</span>
                   </div>
                </label>
                
                <button onClick={handleResetFilters} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors" title="Reset Filters">
                  <Filter size={18} />
                </button>
             </div>

          </div>
        </div>
      </section>

      {/* Location Modal Integrator */}
      <LocationSelectorModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(res) => setSelectedLocation(res)}
        lang="en"
      />

      {/* ================= RESULTS HEADER ================= */}
      <div className="max-w-[1400px] mx-auto px-6 mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agent Directory</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">Showing {filteredAgents.length} professionals</p>
        </div>
      </div>

      {/* ================= AGENT GRID (FRAMER MOTION) ================= */}
      <div className="max-w-[1400px] mx-auto px-6">
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {[...Array(8)].map((_, i) => (
                 <div key={i} className="bg-white h-[420px] rounded-[2.5rem] shadow-sm border border-slate-100 animate-pulse" />
             ))}
           </div>
        ) : filteredAgents.length > 0 ? (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence>
              {filteredAgents.map((agent) => (
                <motion.div 
                  key={agent.id}
                  variants={itemVariants}
                  layout
                  onClick={() => router.push(`/agents/${agent.slug || agent.id}`)}
                  className={`group relative bg-white rounded-[2.5rem] border shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,101,235,0.15)]
                    ${agent.isVerified ? 'border-blue-500/20' : 'border-slate-100'}
                  `}
                >
                  
                  {/* --- TOP BANNER --- */}
                  <div className="h-36 bg-slate-200 relative overflow-hidden">
                      <Image 
                        src={agent.coverPhoto || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800'} 
                        alt="Cover" 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0"></div>
                      
                      {/* Location Pill on Cover */}
                      <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
                        <MapPin size={12} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{agent.location || 'Somalia'}</span>
                      </div>
                  </div>

                  {/* --- PROFILE CONTENT --- */}
                  <div className="px-6 relative flex-1 flex flex-col bg-white">
                      
                      {/* Floating Avatar & Ratings */}
                      <div className="-mt-12 mb-4 flex justify-between items-end relative z-20">
                          <div className="relative group-hover:scale-105 transition-transform duration-500">
                              {agent.isVerified && <div className="absolute inset-0 bg-[#0065eb] rounded-[1.5rem] blur-lg opacity-40 group-hover:opacity-70 transition-opacity animate-pulse"></div>}
                              <div className={`w-24 h-24 rounded-[1.5rem] p-1 bg-white shadow-xl overflow-hidden relative z-10 ${agent.isVerified ? 'ring-4 ring-blue-50' : 'ring-1 ring-slate-100'}`}>
                                  <Image 
                                      src={agent.profileImageUrl || `https://ui-avatars.com/api/?background=f1f5f9&color=0065eb&name=${encodeURIComponent(agent.name)}`} 
                                      alt={agent.name} 
                                      fill
                                      className="object-cover rounded-[1.2rem] bg-slate-50"
                                  />
                              </div>
                              {agent.isVerified && (
                                  <div className="absolute -right-2 -bottom-2 bg-gradient-to-br from-[#0065eb] to-blue-400 text-white p-2 rounded-xl border-2 border-white shadow-lg z-20">
                                      <CheckCircle2 size={14} className="fill-white text-[#0065eb]" />
                                  </div>
                              )}
                          </div>
                          
                          {/* Rating Pill */}
                          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                              <Star size={12} className="text-amber-500 fill-amber-500" />
                              <span className="text-xs font-black text-amber-700">{agent.averageRating?.toFixed(1) || '5.0'}</span>
                          </div>
                      </div>

                      {/* Info block */}
                      <div className="mb-6 flex-1">
                          <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-[#0065eb] transition-colors">{agent.name}</h3>
                          <p className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest line-clamp-1">
                              {agent.agencyName || "Independent Broker"}
                          </p>
                          
                          {/* Specialties */}
                          <div className="flex flex-wrap gap-1.5 mb-5 h-[52px] overflow-hidden">
                              {(agent.specialties?.length > 0 ? agent.specialties : ['Real Estate']).map((tag, idx) => (
                                  <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-100">
                                      {tag}
                                  </span>
                              ))}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                             <Award size={16} className="text-[#0065eb]" />
                             <span>{agent.totalListings || 0} Active Properties</span>
                          </div>
                      </div>

                      {/* Action Buttons */}
                     <div className="mt-auto pb-6 border-t border-slate-100 pt-5 grid grid-cols-2 gap-3 relative z-20">
                          <button 
                              onClick={(e) => handleContactClick(e, agent, 'call')}
                              className="py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-xs transition-all bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white shadow-sm hover:shadow-xl hover:shadow-slate-900/20 active:scale-95"
                          >
                              <Phone size={14} /> Call
                          </button>

                          <button 
                              onClick={(e) => handleContactClick(e, agent, 'whatsapp')}
                              className="py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-xs transition-all bg-[#25D366] text-white shadow-lg shadow-green-500/20 hover:bg-[#1fa851] hover:shadow-green-500/40 hover:-translate-y-0.5 active:scale-95"
                          >
                              <MessageCircle size={14} /> WhatsApp
                          </button>
                      </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 border-dashed text-center max-w-3xl mx-auto shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
                <Search size={40} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3">No agents found</h3>
            <p className="text-slate-500 font-medium mb-8">We couldn't find any professionals matching your exact criteria.</p>
            <button onClick={handleResetFilters} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-colors shadow-xl">
               Clear All Filters
            </button>
          </div>
        )}

        {/* Load More */}
        {hasMore && filteredAgents.length > 0 && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => fetchAgents(false)} 
              disabled={loadingMore}
              className="bg-white border border-slate-200 text-slate-900 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center gap-3 mx-auto"
            >
              {loadingMore ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <SlidersHorizontal size={18} />}
              {loadingMore ? 'Loading Database...' : 'Load More Professionals'}
            </button>
          </div>
        )}
      </div>

      {/* ================= RESTRICTED ACCESS MODAL ================= */}
      {showRestrictedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRestrictedModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner relative z-10">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-black text-center text-slate-900 mb-3 relative z-10">Protected Contact</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed relative z-10">
              Direct phone numbers are hidden for unverified agents to protect your security. Please contact them through their profile page.
            </p>
            <div className="space-y-3 relative z-10">
              <button onClick={() => setShowRestrictedModal(false)} className="w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95">Go to Profile</button>
              <button onClick={() => setShowRestrictedModal(false)} className="w-full py-4 font-black text-slate-400 text-sm uppercase tracking-widest hover:text-slate-900 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Background Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slowPan {
          0% { object-position: top center; }
          100% { object-position: bottom center; }
        }
      `}} />
    </div>
  );
}