'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase'; 
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  doc, collection, query, where, orderBy, onSnapshot, updateDoc, Timestamp, limit, getDoc,
  addDoc, serverTimestamp
} from 'firebase/firestore';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building, MessageSquare, Calendar as CalendarIcon, 
  TrendingUp, User as UserIcon, LogOut, Bell, Search, Filter, 
  CheckCircle, XCircle, Clock, Phone, MapPin, Zap, Lock, Camera, 
  Send, CheckCircle2, Globe, Briefcase, Star, Eye, Settings,
  Loader2, Plus, Edit3, ArrowLeftCircle, ChevronRight, MoreVertical
} from 'lucide-react';

import AgentAnalytics from './../../../../components/templates/agentstats'; 
import AgentPropertyManagement from '../../../../components/AgentPropertyManagement';
import TenantManagement from '../../../../components/TenantManagement';
import SharedChatComponent from '@/components/sharedchat'; // <-- ADDED
import { supabase } from '@/app/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================
interface AgentProfile {
  uid: string;
  name: string;
  agencyName: string;
  planTier: 'free' | 'pro' | 'premium' | 'agent_pro';
  profileImageUrl: string;
  isVerified: boolean;
  email: string;
  phone: string;
  whatsappNumber: string;
  city: string;
  bio: string;
  specialties: string;
  languages: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: { city: string; area: string };
  images: string[];
  views: number;
  status: 'active' | 'draft' | 'sold';
  isForSale?: boolean;
  tenantName?: string;
  tenantPhone?: string;
}

interface TourRequest {
  id: string;
  propertyId?: string;
  propertyName: string;
  userName: string;
  userPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  userId?: string;
}

interface Chat {
  id: string;
  lastMessage: string;
  participantName: string;
  participantId?: string;
  propertyId?: string;
  propertyTitle?: string;
  unreadCount: number;
  updatedAt: Timestamp;
}

type TabType = 'overview' | 'properties' | 'tenants' | 'inbox' | 'bookings' | 'analytics' | 'settings';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SuperAgentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb]" size={40}/></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tours, setTours] = useState<TourRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // New Form State for Settings
  const [profileForm, setProfileForm] = useState<Partial<AgentProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  // Modal State
  const [selectedTour, setSelectedTour] = useState<TourRequest | null>(null);
  const [tourChatOpen, setTourChatOpen] = useState(false);

  const isPro = ['pro', 'premium', 'agent_pro'].includes(profile?.planTier || 'free');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      
      const idToken = await user.getIdToken();
      
      // 1. Fetch Profile Directly from Supabase
      const { data: d } = await supabase.from('agents').select('*').eq('_id', user.uid).single();
      if (d) {
        const loadedProfile = {
          uid: user.uid,
          name: d.name || d.ownerName || 'Agent',
          agencyName: d.agencyName || d.businessName || 'Independent',
          planTier: d.planTier || 'free',
          profileImageUrl: d.profileImageUrl || d.photoUrl || '',
          isVerified: d.isVerified || d.agentVerified || false,
          email: d.email || '',
          phone: d.phone || '',
          whatsappNumber: d.whatsappNumber || '',
          city: d.city || '',
          bio: d.bio || '',
          specialties: Array.isArray(d.specialties) ? d.specialties.join(', ') : '',
          languages: Array.isArray(d.languages) ? d.languages.join(', ') : '',
        };
        setProfile(loadedProfile);
        setProfileForm(loadedProfile); // Initialize form with DB data
      }

      // 2. Fetch Properties from Supabase
      const propRes = await fetch('/api/properties?agentId=' + user.uid);
      if (propRes.ok) {
         const { data } = await propRes.json();
         setProperties(data || []);
      }

      // 3. Fetch Tour Requests DIRECTLY from Supabase 'tour_requests' table
      const { data: tourData } = await supabase
        .from('tour_requests')
        .select('*')
        .eq('agentId', user.uid)
        .order('timestamp', { ascending: false });
        
      if (tourData) {
         // Map _id to id so the UI renders it correctly
         setTours(tourData.map(t => ({ ...t, id: t._id || t.id })));
      }

      // FIX: Removed 'orderBy' to prevent Firestore Composite Index crash. Sorting is now done in memory.
      const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
      onSnapshot(qChats, (snap) => {
        const loadedChats = snap.docs.map(d => {
           const data = d.data();
           // Extract the ID of the client the agent is talking to
           const otherParticipantId = Array.isArray(data.participants) 
              ? data.participants.find((p: string) => p !== user.uid) 
              : null;

           return {
             id: d.id,
             lastMessage: data.lastMessage || 'Sent a message',
             participantName: data.otherUserName || data.userName || data.senderName || data.recipientName || 'Client',
             participantId: otherParticipantId,
             propertyId: data.propertyId || '',
             propertyTitle: data.propertyTitle || 'Property Inquiry',
             unreadCount: data.unreadCount?.[user.uid] || 0,
             updatedAt: data.updatedAt || data.lastMessageTime || Timestamp.now()
           };
        });

        // Sort by the latest message locally
        loadedChats.sort((a, b) => {
           const timeA = a.updatedAt?.toMillis?.() || 0;
           const timeB = b.updatedAt?.toMillis?.() || 0;
           return timeB - timeA;
        });

        setChats(loadedChats as Chat[]);
        setLoading(false);
      }, (error) => {
         console.error("Firestore Chat Error:", error);
         setLoading(false);
      });
    });
    return () => unsubAuth();
  }, [router]);

  const updateTab = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const updateTourStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('tour_requests').update({ status }).eq('_id', id);
      if (!error) {
        setTours(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
      } else { throw error; }
    } catch (e) { console.error(e); alert("Failed to update tour status."); }
  };

  // ADDED: Profile Save Logic
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setIsSavingProfile(true);

    try {
      const { error } = await supabase.from('agents').update({
        name: profileForm.name,
        ownerName: profileForm.name, // Keep both in sync
        agencyName: profileForm.agencyName,
        email: profileForm.email,
        phone: profileForm.phone,
        whatsappNumber: profileForm.whatsappNumber,
        city: profileForm.city,
        bio: profileForm.bio,
        specialties: profileForm.specialties?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        languages: profileForm.languages?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
        lastUpdated: new Date().toISOString()
      }).eq('_id', profile.uid);

      if (error) throw error;
      
      setProfile({ ...profile, ...(profileForm as AgentProfile) });
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb] w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-slate-900 font-sans relative pt-16">
      
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-30 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 text-white"><Building size={24} /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight leading-tight truncate w-40">{profile?.agencyName}</h2>
            <div className="mt-1.5">
              {profile?.planTier === 'free' ? (
                <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest border border-slate-200">Free Plan</span>
              ) : (
                <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm">Pro Agent</span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Core Hub</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
          <SidebarItem icon={Building} label="Properties" active={activeTab === 'properties'} onClick={() => updateTab('properties')} count={properties.length} />
          <SidebarItem icon={UserIcon} label="Tenants" active={activeTab === 'tenants'} onClick={() => updateTab('tenants')} isProLocked={!isPro} />
          <SidebarItem icon={CalendarIcon} label="Tour Requests" active={activeTab === 'bookings'} onClick={() => updateTab('bookings')} count={tours.filter(t=>t.status==='pending').length} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'inbox'} onClick={() => updateTab('inbox')} count={chats.reduce((acc, c) => acc + c.unreadCount, 0)} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Intelligence</p>
          <SidebarItem icon={TrendingUp} label="Analytics" active={activeTab === 'analytics'} onClick={() => updateTab('analytics')} isProLocked={!isPro} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Account</p>
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => updateTab('settings')} />
          <SidebarItem icon={LogOut} label="Log Out" active={false} onClick={handleLogout} />
        </nav>
      </aside>

     <div className="lg:hidden sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 px-6 py-4 flex justify-between items-center">
       <div className="flex items-center gap-3">
          <div className="bg-[#0065eb] p-2 rounded-xl text-white"><Building size={18} /></div>
          <div className="flex items-center gap-2">
             <span className="font-black text-lg truncate max-w-[200px]">{profile?.name || 'Agent'}</span>
             {profile?.planTier === 'free' ? (
                <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Free</span>
             ) : (
                <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">Pro</span>
             )}
          </div>
       </div>
       <button className="relative w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
       </button>
      </div>

      <main className="flex-1 flex flex-col min-w-0 p-4 -mt-12 pb-48 md:p-8 md:-mt-12 lg:p-12 lg:-mt-16 lg:pb-48 transition-all duration-300">    
        <AnimatePresence mode="wait">
          
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-8">
               <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-black tracking-tight">Agent Overview</h1>
                  <button className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg">
                    <Globe size={14}/> View Portfolio
                  </button>
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard title="Portfolio Views" value={properties.reduce((a,b)=>a+(b.views||0),0).toLocaleString()} icon={Eye} color="text-blue-600" bg="bg-blue-50" />
                  <StatCard title="Active Listings" value={properties.length} icon={Building} color="text-emerald-600" bg="bg-emerald-50" />
                  <StatCard title="New Tours" value={tours.filter(t=>t.status==='pending').length} icon={CalendarIcon} color="text-orange-600" bg="bg-orange-50" />
                  <StatCard title="Total Leads" value={chats.length} icon={MessageSquare} color="text-purple-600" bg="bg-purple-50" />
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Active Tenants Widget */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-xl">Current Tenants</h3>
                       <button onClick={() => updateTab('properties')} className="text-sm font-bold text-[#0065eb] hover:underline">Manage</button>
                    </div>
                    <div className="space-y-4">
                       {properties.filter(p => !p.isForSale && p.tenantName).slice(0, 4).map(p => (
                          <div key={p.id} className="flex items-center gap-4 group">
                             <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                               {p.tenantName![0]}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold truncate text-slate-900">{p.tenantName}</h4>
                                <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                  {p.tenantPhone}
                                </p>
                             </div>
                             <a href={`tel:${p.tenantPhone}`} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#0065eb] hover:bg-blue-50 transition-colors">
                               <Phone size={14}/>
                             </a>
                          </div>
                       ))}
                       {properties.filter(p => !p.isForSale && p.tenantName).length === 0 && (
                          <p className="text-slate-400 text-sm py-4 text-center">No tenants assigned yet.</p>
                       )}
                    </div>
                  </div>

                  {/* Pending Tours */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-xl">Pending Tours</h3>
                       <button onClick={() => updateTab('bookings')} className="text-sm font-bold text-[#0065eb] hover:underline">View Schedule</button>
                    </div>
                    <div className="space-y-3">
                       {tours.filter(t => t.status === 'pending').slice(0, 4).map(t => (
                          <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                             <div>
                                <span className="font-bold text-slate-900 block">{t.userName}</span>
                                <span className="text-xs text-slate-500 font-medium">{t.propertyName} • {t.date} @ {t.time}</span>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => updateTourStatus(t.id, 'completed')} className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm hover:scale-105 transition-transform"><CheckCircle size={18}/></button>
                                <button onClick={() => updateTourStatus(t.id, 'cancelled')} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><XCircle size={18}/></button>
                             </div>
                          </div>
                       ))}
                       {tours.filter(t => t.status === 'pending').length === 0 && <p className="text-slate-400 text-sm py-4 text-center">No pending tour requests.</p>}
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-xl">Recent Inquiries</h3>
                       <button onClick={() => updateTab('inbox')} className="text-sm font-bold text-[#0065eb] hover:underline">Inbox</button>
                    </div>
                    <div className="space-y-4">
                       {chats.slice(0, 4).map(c => (
                          <div key={c.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => updateTab('inbox')}>
                             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-[#0065eb] font-bold">{c.participantName[0]}</div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold truncate group-hover:text-[#0065eb] transition-colors">{c.participantName}</h4>
                                <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                             </div>
                             {c.unreadCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                          </div>
                       ))}
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* --- TAB: PROPERTIES --- */}
          {activeTab === 'properties' && (
            <motion.div key="properties" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
               <AgentPropertyManagement 
                  currentUserUid={profile?.uid || ''} 
                  userPlan={profile?.planTier || 'free'} 
                  onUpgrade={() => updateTab('settings')}
               />
            </motion.div>
          )}

          {/* --- TAB: TENANTS --- */}
          {activeTab === 'tenants' && (
            <motion.div key="tenants" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
               <TenantManagement 
                  currentUserUid={profile?.uid || ''} 
                  userPlan={profile?.planTier || 'free'} 
                  onUpgrade={() => updateTab('settings')}
               />
            </motion.div>
          )}

          {/* --- TAB: BOOKINGS (TOURS) --- */}
          {activeTab === 'bookings' && (
             <motion.div key="bookings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                   <h1 className="text-3xl font-black tracking-tight">Tour Schedule</h1>
                   <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex text-xs font-black shadow-sm">
                      {['all', 'pending', 'approved', 'completed'].map(f => (
                         <button key={f} className="px-4 py-2 rounded-lg capitalize text-slate-500 hover:text-slate-900">
                            {f}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <th className="p-6">Client</th>
                           <th className="p-6">Listing</th>
                           <th className="p-6">Schedule</th>
                           <th className="p-6">Status</th>
                           <th className="p-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tours.map(tour => (
                           <tr key={tour.id} onClick={() => setSelectedTour(tour)} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                              <td className="p-6">
                                 <p className="font-bold text-sm text-slate-900 group-hover:text-[#0065eb] transition-colors">{tour.userName}</p>
                                 <p className="text-xs text-slate-500 font-mono">
                                   {isPro ? tour.userPhone : `${tour.userPhone.substring(0, 4)}******`}
                                 </p>
                              </td>
                              <td className="p-6 font-bold text-sm text-[#0065eb]">{tour.propertyName}</td>
                              <td className="p-6">
                                 <p className="text-sm font-bold text-slate-900">{tour.date}</p>
                                 <p className="text-xs text-slate-500">{tour.time}</p>
                              </td>
                              <td className="p-6"><StatusBadge status={tour.status} /></td>
                              <td className="p-6 text-right space-x-2">
                                 {/* Added e.stopPropagation() so clicking inline buttons doesn't trigger the modal */}
                                 <button onClick={(e) => { e.stopPropagation(); updateTourStatus(tour.id, 'completed'); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"><CheckCircle size={18}/></button>
                                 <button onClick={(e) => { e.stopPropagation(); updateTourStatus(tour.id, 'cancelled'); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><XCircle size={18}/></button>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>

                {/* SUPER MODERN TOUR DETAILS MODAL */}
                <AnimatePresence>
                  {selectedTour && (
                     <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTour(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20">
                           
                           {/* Header */}
                           <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-center border-b border-slate-100">
                              <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 bg-blue-100 text-[#0065eb] rounded-2xl flex items-center justify-center shadow-inner"><CalendarIcon size={24} /></div>
                                 <div>
                                    <h3 className="text-xl font-black text-slate-900">Tour Request</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">ID: {selectedTour.id.substring(0,8)}</p>
                                 </div>
                              </div>
                              <button onClick={() => setSelectedTour(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all shadow-sm"><XCircle size={24} /></button>
                           </div>

                           {/* Body */}
                           <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                              
                              {/* Client Info */}
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Client Details</p>
                                 <div className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xl shrink-0">
                                       {selectedTour.userName[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <h4 className="font-bold text-lg text-slate-900 truncate">{selectedTour.userName}</h4>
                                       <div className="flex items-center gap-2 mt-1">
                                          <Phone size={14} className="text-slate-400" />
                                          <span className="font-mono text-sm font-bold text-slate-600">
                                            {isPro ? selectedTour.userPhone : `${selectedTour.userPhone.substring(0, 4)}******`}
                                          </span>
                                       </div>
                                    </div>
                                    {isPro && (
                                       <div className="flex items-center gap-2 shrink-0">
                                          <button onClick={(e) => { e.stopPropagation(); setTourChatOpen(true); }} className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-[#0065eb] rounded-full flex items-center justify-center transition-colors shadow-sm" title="In-App Chat">
                                             <MessageSquare size={18} />
                                          </button>
                                          <button onClick={() => window.open(`https://wa.me/${selectedTour.userPhone.replace(/[^0-9]/g, '')}`, '_blank')} className="w-10 h-10 bg-green-50 hover:bg-green-100 text-green-600 rounded-full flex items-center justify-center transition-colors shadow-sm" title="Message on WhatsApp">
                                             <Phone size={18} />
                                          </button>
                                       </div>
                                    )}
                                 </div>

                                 {/* Shared Chat Modal for Tour Request */}
                                 {tourChatOpen && selectedTour && (
                                    <SharedChatComponent 
                                       isOpen={tourChatOpen} 
                                       onClose={() => setTourChatOpen(false)} 
                                       recipientId={selectedTour.userId || ''} 
                                       recipientName={selectedTour.userName} 
                                       propertyId={selectedTour.propertyId || ''} 
                                       propertyTitle={selectedTour.propertyName} 
                                    />
                                 )}

                                 {/* Upgrade Prompt if Free */}
                                 {!isPro && (
                                    <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
                                       <div className="flex items-center gap-3">
                                          <Lock size={20} className="text-amber-500 shrink-0" />
                                          <div>
                                            <p className="text-xs font-black text-amber-900">Phone Number Hidden</p>
                                            <p className="text-[10px] font-bold text-amber-700/70">Upgrade to Pro to view full client contact details.</p>
                                          </div>
                                       </div>
                                       <button onClick={() => { setSelectedTour(null); updateTab('settings'); }} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors whitespace-nowrap shadow-md shadow-amber-500/20">Upgrade</button>
                                    </div>
                                 )}
                              </div>

                              {/* Tour Info */}
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Tour Information</p>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                                       <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Property</p>
                                       <p className="font-black text-sm text-blue-900 line-clamp-1">{selectedTour.propertyName}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                       <p className="font-black text-sm text-slate-900">{selectedTour.date}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                       <p className="font-black text-sm text-slate-900">{selectedTour.time}</p>
                                    </div>
                                 </div>
                              </div>

                           </div>

                           {/* Footer Actions */}
                           <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                              <button onClick={() => { updateTourStatus(selectedTour.id, 'cancelled'); setSelectedTour(null); }} className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl font-black text-xs uppercase tracking-widest transition-all">Decline</button>
                              <button onClick={() => { updateTourStatus(selectedTour.id, 'completed'); setSelectedTour(null); }} className="flex-[2] py-4 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><CheckCircle2 size={18} /> Confirm Tour</button>
                           </div>
                        </motion.div>
                     </div>
                  )}
                </AnimatePresence>
             </motion.div>
          )}

          {/* --- TAB: INBOX --- */}
          {activeTab === 'inbox' && (
             <motion.div key="inbox" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden min-h-[600px] shadow-sm flex flex-col md:flex-row">
                <div className="w-full md:w-80 border-r border-slate-100 flex flex-col h-[600px] md:h-auto shrink-0">
                   <div className="p-8 border-b border-slate-100">
                      <h2 className="text-2xl font-black">Inbox</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Lead Management</p>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {chats.length === 0 && <div className="p-8 text-center text-slate-400 text-sm font-bold">No messages yet.</div>}
                      {chats.map(chat => (
                         <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`p-6 border-b border-slate-50 cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-[#0065eb]' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                            <div className="flex justify-between items-start mb-1">
                               <h4 className="font-bold text-slate-900 truncate pr-2">{chat.participantName}</h4>
                               <span className="text-[10px] font-bold text-slate-400 shrink-0">
                                 {chat.updatedAt ? (chat.updatedAt?.toDate ? format(chat.updatedAt.toDate(), 'h:mm a') : format(new Date(chat.updatedAt as any), 'h:mm a')) : 'Now'}
                               </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center relative">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6"><MessageSquare size={40}/></div>
                   <h3 className="text-xl font-black text-slate-900">Select a Conversation</h3>
                   <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Click on a chat in the sidebar to open the messenger and manage leads.</p>

                   {/* Render the chat modal over everything when an ID is active */}
                   {activeChatId && (() => {
                      const activeChat = chats.find(c => c.id === activeChatId);
                      if (!activeChat) return null;
                      return (
                         <SharedChatComponent 
                            isOpen={true} 
                            onClose={() => setActiveChatId(null)} 
                            recipientId={activeChat.participantId || ''} 
                            recipientName={activeChat.participantName} 
                            propertyId={activeChat.propertyId || ''} 
                            propertyTitle={activeChat.propertyTitle || 'Property Inquiry'} 
                         />
                      );
                   })()}
                </div>
             </motion.div>
          )}
{/* --- TAB: ANALYTICS --- */}
          {activeTab === 'analytics' && (
             <motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <AgentAnalytics isPro={isPro} initialAgentId={profile?.uid} />
             </motion.div>
          )}
          {/* --- TAB: SETTINGS --- */}
          {activeTab === 'settings' && (
             <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-black tracking-tight">Account Settings</h1>
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-6 md:gap-8 mb-10 border-b border-slate-50 pb-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-full relative overflow-hidden group border-4 border-white shadow-lg shrink-0">
                        {profile?.profileImageUrl ? <img src={profile.profileImageUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-300 mx-auto mt-6" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"><Camera size={20}/></div>
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-xl md:text-2xl font-black text-slate-900">{profile?.name}</h3>
                           {profile?.planTier !== 'free' ? (
                             <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">Pro</span>
                           ) : (
                             <span className="bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200">Free</span>
                           )}
                         </div>
                         <p className="text-slate-500 font-medium text-sm">Update your public information.</p>
                         {profile?.isVerified && <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase mt-2">✓ Verified Entity</span>}
                      </div>
                   </div>
                   
                   <form onSubmit={handleSaveProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Display Name *</label>
                          <input required type="text" value={profileForm.name || ''} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Agency / Business Name</label>
                          <input type="text" value={profileForm.agencyName || ''} onChange={e => setProfileForm({...profileForm, agencyName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Address</label>
                          <input type="email" value={profileForm.email || ''} onChange={e => setProfileForm({...profileForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                          <input type="tel" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">WhatsApp Number</label>
                          <input type="tel" value={profileForm.whatsappNumber || ''} onChange={e => setProfileForm({...profileForm, whatsappNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" placeholder="e.g. 25263..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">City / Location</label>
                          <input type="text" value={profileForm.city || ''} onChange={e => setProfileForm({...profileForm, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Agent Bio / Description</label>
                        <textarea rows={4} value={profileForm.bio || ''} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb] resize-none" placeholder="Tell clients about your experience..." />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Specialties (Comma Separated)</label>
                          <input type="text" value={profileForm.specialties || ''} onChange={e => setProfileForm({...profileForm, specialties: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" placeholder="e.g. Residential, Commercial" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Languages (Comma Separated)</label>
                          <input type="text" value={profileForm.languages || ''} onChange={e => setProfileForm({...profileForm, languages: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm outline-none focus:border-[#0065eb]" placeholder="e.g. Somali, English, Arabic" />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-slate-100">
                         <button type="submit" disabled={isSavingProfile} className="bg-[#0065eb] hover:bg-[#0052c1] disabled:opacity-50 text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                           {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile Changes'}
                         </button>
                      </div>
                   </form>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <BottomNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
         <BottomNavItem icon={Building} label="Listings" active={activeTab === 'properties'} onClick={() => updateTab('properties')} />
         <BottomNavItem icon={UserIcon} label="Tenants" active={activeTab === 'tenants'} onClick={() => updateTab('tenants')} />
         <BottomNavItem icon={MessageSquare} label="Chat" active={activeTab === 'inbox'} onClick={() => updateTab('inbox')} badge={chats.reduce((acc, c) => acc + c.unreadCount, 0)} />
         <BottomNavItem icon={Settings} label="More" active={['settings', 'analytics'].includes(activeTab)} onClick={() => updateTab('settings')} />
      </nav>

    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function SidebarItem({ icon: Icon, label, active, onClick, count, isProLocked }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <div className="flex items-center gap-3">
          <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
          <span className="font-bold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
         {isProLocked && <Lock size={14} className="text-amber-500" />}
         {count > 0 && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`}>{count}</span>}
      </div>
    </button>
  );
}

function BottomNavItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-2 relative w-16">
       <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#0065eb] text-white shadow-md -translate-y-1' : 'text-slate-400'}`}>
          <Icon size={22} strokeWidth={active ? 2.5 : 2} />
          {badge > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
       </div>
       <span className={`text-[10px] font-bold mt-1 transition-all ${active ? 'text-[#0065eb]' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
       <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color} mb-4`}>
          <Icon size={24} strokeWidth={2.5} />
       </div>
       <div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">{title}</p>
       </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: any) {
   return (
     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 shrink-0"><Icon size={24}/></div>
        <div className="min-w-0">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className="font-bold text-slate-900 truncate">{value || 'Not set'}</p>
        </div>
     </div>
   )
}

function StatusBadge({ status }: { status: string }) {
   const styles: any = {
     'pending': 'bg-amber-100 text-amber-700',
     'approved': 'bg-blue-100 text-blue-700',
     'completed': 'bg-emerald-100 text-emerald-700',
     'cancelled': 'bg-red-100 text-red-700',
   };
   return (
     <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-slate-100 text-slate-900'}`}>
       {status}
     </span>
   );
}