'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase'; // Matches your path
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

// --- COMPONENTS ---
import AgentAnalytics from './../../../../components/templates/agentstats'; // The full analytics file provided previously
import AgentPropertyManagement from '../../../../components/AgentPropertyManagement';

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
}

interface Property {
  id: string;
  title: string;
  price: number;
  location: { city: string; area: string };
  images: string[];
  views: number;
  status: 'active' | 'draft' | 'sold';
}

interface TourRequest {
  id: string;
  propertyName: string;
  userName: string;
  userPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
}

interface Chat {
  id: string;
  lastMessage: string;
  participantName: string;
  unreadCount: number;
  updatedAt: Timestamp;
}

type TabType = 'overview' | 'properties' | 'inbox' | 'bookings' | 'analytics' | 'settings' | 'add-property';

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

  // --- STATE ---
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tours, setTours] = useState<TourRequest[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // --- REVENUE CALCS ---
  const isPro = ['pro', 'premium', 'agent_pro'].includes(profile?.planTier || 'free');

  // --- INITIALIZE REAL-TIME ENGINE ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      
      // 1. Fetch Profile
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        setProfile({
          uid: user.uid,
          name: d.name || 'Agent',
          agencyName: d.agencyName || 'Independent',
          planTier: d.planTier || 'free',
          profileImageUrl: d.profileImageUrl || d.photoUrl || '',
          isVerified: d.isVerified || false
        });
      }

      // 2. Properties Listener
      const qProps = query(collection(db, 'property'), where('agentId', '==', user.uid));
      onSnapshot(qProps, (snap) => setProperties(snap.docs.map(d => ({ id: d.id, ...d.data() } as Property))));

      // 3. Tours Listener
      const qTours = query(collection(db, 'tour_requests'), where('agentId', '==', user.uid), orderBy('timestamp', 'desc'));
      onSnapshot(qTours, (snap) => setTours(snap.docs.map(d => ({ id: d.id, ...d.data() } as TourRequest))));

      // 4. Chats Listener
      const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
      onSnapshot(qChats, (snap) => {
        setChats(snap.docs.map(d => {
           const data = d.data();
           return {
             id: d.id,
             lastMessage: data.lastMessage,
             participantName: data.otherUserName || 'Client',
             unreadCount: data.unreadCount?.[user.uid] || 0,
             updatedAt: data.updatedAt || data.lastMessageTime
           } as Chat;
        }));
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb] w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-slate-900 font-sans relative pt-16">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      {/* Changed top-20 to top-0 and height to 100vh */}
<aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen z-30 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 text-white"><Building size={24} /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight leading-tight truncate w-40">{profile?.agencyName}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile?.planTier.replace('_', ' ')} Plan</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Core Hub</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
          <SidebarItem icon={Building} label="Properties" active={activeTab === 'properties'} onClick={() => updateTab('properties')} count={properties.length} />
          <SidebarItem icon={CalendarIcon} label="Tour Requests" active={activeTab === 'bookings'} onClick={() => updateTab('bookings')} count={tours.filter(t=>t.status==='pending').length} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'inbox'} onClick={() => updateTab('inbox')} count={chats.reduce((acc, c) => acc + c.unreadCount, 0)} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Intelligence</p>
          <SidebarItem icon={TrendingUp} label="Analytics" active={activeTab === 'analytics'} onClick={() => updateTab('analytics')} isProLocked={!isPro} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Account</p>
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => updateTab('settings')} />
          <SidebarItem icon={LogOut} label="Log Out" active={false} onClick={handleLogout} />
        </nav>
      </aside>

      {/* ================= MOBILE HEADER ================= */}
     <div className="lg:hidden sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 px-6 py-4 flex justify-between items-center">
   <div className="flex items-center gap-3">
      <div className="bg-[#0065eb] p-2 rounded-xl text-white"><Building size={18} /></div>
      {/* Updated this line to be dynamic */}
      <span className="font-black text-lg truncate max-w-[200px]">{profile?.name || 'Agent'}</span>
   </div>
         <button className="relative w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
         </button>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      {/* pt-24 provides the extra vertical spacing requested */}
      {/* Fixed line with tighter spacing */}
{/* Change pt-24 to a negative margin like -mt-12 or higher */}
<main className="flex-1 flex flex-col min-w-0 p-4 -mt-12 pb-48 md:p-8 md:-mt-12 lg:p-12 lg:-mt-16 lg:pb-48 transition-all duration-300">    <AnimatePresence mode="wait">
          
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

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                                <button className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm hover:scale-105 transition-transform"><CheckCircle size={18}/></button>
                                <button className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><XCircle size={18}/></button>
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
                           <tr key={tour.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-6">
                                 <p className="font-bold text-sm text-slate-900">{tour.userName}</p>
                                 <p className="text-xs text-slate-500">{tour.userPhone}</p>
                              </td>
                              <td className="p-6 font-bold text-sm text-[#0065eb]">{tour.propertyName}</td>
                              <td className="p-6">
                                 <p className="text-sm font-bold text-slate-900">{tour.date}</p>
                                 <p className="text-xs text-slate-500">{tour.time}</p>
                              </td>
                              <td className="p-6"><StatusBadge status={tour.status} /></td>
                              <td className="p-6 text-right space-x-2">
                                 <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle size={18}/></button>
                                 <button className="p-2 bg-red-50 text-red-600 rounded-lg"><XCircle size={18}/></button>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </motion.div>
          )}

          {/* --- TAB: INBOX --- */}
          {activeTab === 'inbox' && (
             <motion.div key="inbox" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden min-h-[600px] shadow-sm flex flex-col md:flex-row">
                {/* Left: Chat List */}
                <div className="w-full md:w-80 border-r border-slate-100 flex flex-col h-[600px] md:h-auto">
                   <div className="p-8 border-b border-slate-100">
                      <h2 className="text-2xl font-black">Inbox</h2>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Lead Management</p>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {chats.map(chat => (
                         <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`p-6 border-b border-slate-50 cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-1">
                               <h4 className="font-bold text-slate-900">{chat.participantName}</h4>
                               <span className="text-[10px] font-bold text-slate-400">
                                 {chat.updatedAt ? format(chat.updatedAt.toDate(), 'h:mm a') : 'Now'}
                               </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                         </div>
                      ))}
                   </div>
                </div>
                {/* Right: Message View (Simplified for Page shell) */}
                <div className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6"><MessageSquare size={40}/></div>
                   <h3 className="text-xl font-black text-slate-900">Select a Conversation</h3>
                   <p className="text-slate-500 text-sm max-w-xs mx-auto">Click on a chat to manage leads and schedule property viewings.</p>
                </div>
             </motion.div>
          )}

          {/* --- TAB: ANALYTICS --- */}
          {activeTab === 'analytics' && (
             <motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <AgentAnalytics />
             </motion.div>
          )}

          {/* --- TAB: SETTINGS --- */}
          {activeTab === 'settings' && (
             <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-black tracking-tight">Account Settings</h1>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-8 mb-10 border-b border-slate-50 pb-8">
                      <div className="w-24 h-24 bg-slate-100 rounded-full relative overflow-hidden group border-4 border-white shadow-lg">
                        {profile?.profileImageUrl ? <img src={profile.profileImageUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-300 mx-auto mt-6" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"><Camera size={20}/></div>
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-slate-900">{profile?.name}</h3>
                         <p className="text-slate-500 font-medium">Manage your agency profile and verification status.</p>
                         {profile?.isVerified && <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase mt-2">Verified Agent</span>}
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoField label="Display Name" value={profile?.name} icon={UserIcon} />
                      <InfoField label="Agency Name" value={profile?.agencyName} icon={Building} />
                      <div className="md:col-span-2 flex justify-end pt-4">
                         <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">Save Changes</button>
                      </div>
                   </div>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <BottomNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
         <BottomNavItem icon={Building} label="Listings" active={activeTab === 'properties'} onClick={() => updateTab('properties')} />
         <BottomNavItem icon={CalendarIcon} label="Tours" active={activeTab === 'bookings'} onClick={() => updateTab('bookings')} badge={tours.filter(t=>t.status==='pending').length} />
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