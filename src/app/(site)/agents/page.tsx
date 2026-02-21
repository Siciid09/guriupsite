'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter, 
  QueryDocumentSnapshot,
  where,
  getCountFromServer,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './../../lib/firebase'; 
import { useAuth } from '@/hooks/useAuth'; // Ensure you have this hook
import { button } from 'framer-motion/client';

// --- ICONS ---
const Icons = {
  Verified: () => <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
  Search: () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Whatsapp: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.891 11.891-2.003 0-3.976-.505-5.717-1.46l-6.276 1.678zm6.29-4.15l.349.21c1.47.882 3.167 1.347 4.914 1.347 5.176 0 9.39-4.214 9.39-9.39 0-2.505-.974-4.86-2.744-6.628-1.77-1.77-4.122-2.744-6.628-2.744-5.176 0-9.39 4.214-9.39 9.39 0 1.83.533 3.613 1.54 5.143l.235.357-1.01 3.687 3.744-.982z" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Location: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Star: () => <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
  StarFilled: () => <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>,
  Rocket: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Loader: () => <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  Briefcase: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
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

const ITEMS_PER_PAGE = 22; 

const AgentsPage = () => {
  const router = useRouter();
  const { user } = useAuth(); // Assuming your auth hook provides the logged-in user object
  
  // --- STATE ---
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  
  // Current Agent State for Hero Button
  const [currentAgentProfile, setCurrentAgentProfile] = useState<Agent | null>(null);
  const [checkingAgentStatus, setCheckingAgentStatus] = useState(false);

  // --- 1. FETCH AGENTS LOGIC ---
  const fetchAgents = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const agentsRef = collection(db, 'agents');
      let q;

      // QUERY: Filter only 'pro' or 'premium'
      if (isInitial) {
        q = query(
          agentsRef, 
          where('planTier', 'in', ['pro', 'premium']), 
          orderBy('totalListings', 'desc'), 
          limit(ITEMS_PER_PAGE)
        );
      } else if (lastVisible) {
        q = query(
          agentsRef, 
          where('planTier', 'in', ['pro', 'premium']),
          orderBy('totalListings', 'desc'), 
          startAfter(lastVisible), 
          limit(ITEMS_PER_PAGE)
        );
      } else {
        return; 
      }
      
      const snapshot = await getDocs(q);
      
      const lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);
      
      if (snapshot.docs.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      // Process Agents + Fetch REAL Counts in Parallel
      const fetchedAgents = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const tier = (data.planTier || 'free').toLowerCase();
        const isVerified = tier === 'pro' || tier === 'premium';

        // --- FETCH REAL LISTING COUNT ---
        // We query the property collection to get the accurate number
        let realCount = 0;
        try {
          const propsQuery = query(collection(db, 'property'), where('agentId', '==', docSnapshot.id));
          const countSnap = await getCountFromServer(propsQuery);
          realCount = countSnap.data().count;
        } catch (e) {
          console.warn(`Failed to count listings for agent ${docSnapshot.id}`, e);
          realCount = data.totalListings || 0; // Fallback
        }

        return {
          id: docSnapshot.id,
          slug: data.slug || null,
          name: data.name ?? 'Unknown Agent',
          agencyName: data.agencyName ?? '',
          profileImageUrl: data.profileImageUrl || data.photoURL || '',
          coverPhoto: data.coverPhoto ?? '',
          planTier: tier,
          totalListings: realCount, // Using the real count
          averageRating: data.averageRating ?? 0,
          phone: data.phone || data.whatsappNumber || '',
          specialties: data.specialties ?? [],
          isVerified: isVerified,
          location: data.city ?? 'Hargeisa, Somaliland' 
        };
      }));

      if (isInitial) {
        setAgents(fetchedAgents);
      } else {
        setAgents(prev => [...prev, ...fetchedAgents]);
      }

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
      if (!user) {
        setCurrentAgentProfile(null);
        return;
      }
      
      setCheckingAgentStatus(true);
      try {
        // Try to find an agent document with the user's ID
        // Assuming agent ID matches User ID, otherwise we'd need to query by ownerId/email
        const agentRef = doc(db, 'agents', user.uid);
        const agentSnap = await getDoc(agentRef);
        
        if (agentSnap.exists()) {
           const d = agentSnap.data();
           setCurrentAgentProfile({ id: agentSnap.id, planTier: d.planTier || 'free', ...d } as Agent);
        } else {
           // Maybe query by email if IDs don't match
           const q = query(collection(db, 'agents'), where('email', '==', user.email));
           const snap = await getDocs(q);
           if (!snap.empty) {
             const d = snap.docs[0].data();
             setCurrentAgentProfile({ id: snap.docs[0].id, planTier: d.planTier || 'free', ...d } as Agent);
           } else {
             setCurrentAgentProfile(null); // User exists but is NOT an agent
           }
        }
      } catch (e) {
        console.error("Error checking agent status", e);
      } finally {
        setCheckingAgentStatus(false);
      }
    };
    
    checkStatus();
  }, [user]);


  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.agencyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const handleContactClick = (e: React.MouseEvent, agent: Agent, type: 'call' | 'whatsapp') => {
    e.stopPropagation(); 
    e.preventDefault();

    // SILENT INTERCEPT: Verified uses their number, Free uses your custom number
    const targetPhone = agent.isVerified && agent.phone ? agent.phone : '+252653227084';

    if (type === 'call') {
      window.open(`tel:${targetPhone}`);
    } else {
      const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  // --- HERO BUTTON RENDERER ---
  const renderHeroButton = () => {
    if (checkingAgentStatus) {
      return (
        <button disabled className="bg-white/20 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2">
           <Icons.Loader /> Checking Status...
        </button>
      );
    }

    // 1. Not Logged In -> Register Now
    if (!user) {
      return (
        <a 
          href="https://guriup.hiigsitech.com/signup?role=reagent" 
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-[#0065eb] px-8 py-4 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Icons.Rocket />
          Register Now
        </a>
      );
    }

    // 2. Logged In BUT Not an Agent (Or Free Agent) -> Upgrade
    const isPro = currentAgentProfile && ['pro', 'premium'].includes(currentAgentProfile.planTier);
    
    if (!isPro) {
       return (
         <button 
            // Changed this to point to your new pricing/subscription page!
            onClick={() => router.push('/pricing')} 
            className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-8 py-4 rounded-xl font-black text-sm hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/30"
         >
           <Icons.Upgrade />
           Upgrade to Premium
         </button>
       );
    }

    // 3. Logged In AND Pro Agent -> Manage Agent
    return (
       <button 
          onClick={() => router.push('/dashboard/agent')}
          className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black text-sm hover:bg-slate-50 transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
       >
         <Icons.Briefcase />
         Manage Your Agent
       </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      
      {/* ================= HERO WALL ================= */}
      <div className="relative w-full pt-16 pb-16">
        <div className="absolute inset-0 z-0">
            <Image 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000" 
                alt="Real Estate Background" 
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-slate-900/80"></div>
        </div>
        <div className="relative z-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#0065eb]/90 to-[#004bb5]/90 backdrop-blur-md rounded-[24px] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-blue-900/30 relative overflow-hidden border border-white/10">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
              <div className="relative z-10 flex-1 text-center md:text-left mb-6 md:mb-0">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">Join GuriUp</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-3 leading-tight">Grow Your Real Estate Business</h2>
                <p className="text-blue-100 text-sm md:text-lg font-medium max-w-xl leading-relaxed">
                  Get listed as a Verified Agent, access advanced analytics, and reach thousands of potential buyers daily.
                </p>
              </div>
              <div className="relative z-10 flex-shrink-0">
                {renderHeroButton()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE HEADER (Elite Agents) ================= */}
      <div className="bg-white border-b border-slate-100 relative shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 relative inline-block">
                Elite Agents
                <span className="absolute -bottom-2 left-0 w-full h-[6px] bg-[#0065eb] rounded-full"></span>
              </h1>
              <p className="text-slate-500 font-medium text-sm mt-3">Connect with verified professionals.</p>
            </div>
            
            <div className="relative w-full md:w-[400px] group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0065eb] transition-colors">
                <Icons.Search />
              </div>
              <input 
                type="text" 
                placeholder="Search agents by name or agency..." 
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#0065eb]/20 focus:border-[#0065eb] transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= AGENT GRID ================= */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3, 4, 5, 6].map((i) => (
                 <div key={i} className="bg-white h-[340px] rounded-[32px] shadow-sm border border-slate-100 animate-pulse" />
             ))}
           </div>
        ) : filteredAgents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  onClick={() => router.push(`/agents/${agent.slug || agent.id}`)}
                  className={`group bg-white rounded-[32px] border shadow-sm transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-2xl
                    ${agent.isVerified ? 'border-blue-100 hover:border-blue-300 hover:shadow-blue-900/10' : 'border-slate-100 hover:shadow-slate-200'}
                  `}
                >
                  
                  {/* --- COVER PHOTO --- */}
                  <div className="h-32 bg-slate-100 relative overflow-hidden">
                      {agent.coverPhoto && agent.coverPhoto.startsWith('http') ? (
                          <Image src={agent.coverPhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Cover" fill />
                      ) : (
                          <div className="w-full h-full bg-gradient-to-r from-slate-200 to-slate-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                  </div>

                  {/* --- PROFILE CONTENT --- */}
                  <div className="px-6 relative flex-1 flex flex-col">
                      {/* Avatar Floating */}
                      <div className="-mt-14 mb-3 flex justify-between items-end">
                          <div className="relative">
                              <div className={`w-24 h-24 rounded-2xl p-1 bg-white shadow-xl rotate-2 group-hover:rotate-0 transition-transform duration-300 overflow-hidden relative ${agent.isVerified ? 'ring-2 ring-blue-500/20' : ''}`}>
                                  <Image 
                                      src={agent.profileImageUrl || 'https://ui-avatars.com/api/?background=random&name=' + agent.name} 
                                      alt={agent.name} 
                                      fill
                                      className="object-cover rounded-xl bg-slate-50"
                                  />
                              </div>
                              {agent.isVerified && (
                                  <div className="absolute -right-2 -bottom-2 bg-blue-500 text-white p-1.5 rounded-full border-[3px] border-white shadow-lg shadow-blue-500/30">
                                      <Icons.Verified />
                                  </div>
                              )}
                          </div>
                          
                          {/* Rating Badge */}
                          <div className="flex flex-col items-end gap-1 mb-1">
                              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
                                  <Icons.Star />
                                  <span className="text-xs font-black text-amber-700">{agent.averageRating.toFixed(1)}</span>
                              </div>
                          </div>
                      </div>

                      {/* Text Info */}
                      <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{agent.name}</h3>
                              {agent.isVerified && (
                                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                  <Icons.StarFilled /> Pro
                                </span>
                              )}
                          </div>
                          <p className="text-sm font-bold text-slate-400 mb-3 line-clamp-1">
                              {agent.agencyName || "Independent Agent"}
                          </p>
                          
                          <div className="flex justify-between items-center">
                               {/* Specialties */}
                               <div className="flex flex-wrap gap-1">
                                  {agent.specialties.length > 0 ? (
                                      agent.specialties.slice(0, 1).map((tag, idx) => (
                                          <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 uppercase tracking-wide">
                                              {tag}
                                          </span>
                                      ))
                                  ) : (
                                      <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wide">
                                          Agent
                                      </span>
                                  )}
                              </div>

                              {/* Total Listings Count */}
                              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                  {agent.totalListings} Listings
                              </div>
                          </div>
                      </div>

                      {/* Action Buttons */}
                     <div className="mt-auto pb-6 pt-4 border-t border-slate-50 grid grid-cols-2 gap-3">
                          <button 
                              onClick={(e) => handleContactClick(e, agent, 'call')}
                              className="py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-900 hover:text-slate-900"
                          >
                              <Icons.Phone /> Call
                          </button>

                          <button 
                              onClick={(e) => handleContactClick(e, agent, 'whatsapp')}
                              className="py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all bg-[#25D366] text-white shadow-lg shadow-green-100 hover:bg-[#1fa851] hover:shadow-green-200"
                          >
                              <Icons.Whatsapp /> WhatsApp
                          </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && !searchTerm && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => fetchAgents(false)} 
                  disabled={loadingMore}
                  className="bg-white border-2 border-slate-200 text-slate-900 px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? <Icons.Loader /> : 'Load More Agents'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                <Icons.Search />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No agents found</h3>
            <p className="text-slate-500 max-w-md mx-auto">We couldn't find any active agents. Try adjusting your search.</p>
          </div>
        )}
      </div>

      {/* ================= RESTRICTED ACCESS MODAL ================= */}
      {showRestrictedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRestrictedModal(false)}></div>
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h3 className="text-2xl font-black text-center text-slate-900 mb-3">Restricted Access</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-8 leading-relaxed">
              This agent is unverified. Direct contact details are hidden for your safety. Please use the secure In-App Chat on their profile.
            </p>
            <div className="space-y-3">
              <button onClick={() => setShowRestrictedModal(false)} className="w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95">Go to Profile</button>
              <button onClick={() => setShowRestrictedModal(false)} className="w-full py-4 font-bold text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgentsPage;