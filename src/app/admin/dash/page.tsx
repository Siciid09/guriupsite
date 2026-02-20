'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Building, Home, Briefcase, Search, ShieldCheck, 
  Ban, Loader2, Star, TrendingUp, Phone, MessageCircle, 
  Globe, Info, X, LayoutDashboard, Database, Activity, MapPin
} from 'lucide-react';
import { db } from '@/app/lib/firebase'; // Adjust path if needed
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth'; // Adjust path if needed
import SharedChatComponent from '../../../components/sharedchat'; // Adjust path if needed

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
type TabType = 'users' | 'agents' | 'hotels' | 'properties';

interface LiveStats {
  activeListings: number;
  soldListings: number;
  totalViews: number;
  averageRating: number | string;
  totalRooms?: number;
}

// ==========================================
// 2. HELPER UTILITIES
// ==========================================
const parseFirestoreDate = (timestamp: any): string => {
  if (!timestamp) return 'N/A';
  // Handle Firestore Timestamp object
  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  // Handle ISO strings or standard dates
  const date = new Date(timestamp);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
  return 'Invalid Date format';
};

const formatValue = (val: any): string => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Empty Array';
  if (typeof val === 'object') {
    if (val.seconds) return parseFirestoreDate(val); // Catch stray timestamps
    return JSON.stringify(val, null, 2);
  }
  return String(val);
};

// ==========================================
// 3. REUSABLE UI COMPONENTS (DRY CODE)
// ==========================================
const MetricCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon?: any, colorClass: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
      {Icon && <Icon size={14} className={colorClass} />} {title}
    </p>
    <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
  </div>
);

const DetailRow = ({ label, value, isCode = false }: { label: string, value: any, isCode?: boolean }) => (
  <div className="flex flex-col sm:flex-row border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
    <div className="sm:w-1/3 p-4 bg-slate-50/50 sm:bg-transparent border-b sm:border-b-0 sm:border-r border-slate-100 font-bold text-sm text-slate-500 capitalize flex items-center">
      {label.replace(/([A-Z])/g, ' $1').trim()}
    </div>
    <div className="sm:w-2/3 p-4 text-sm text-slate-800 font-medium break-words overflow-hidden">
      {isCode || typeof value === 'object' ? (
        <pre className="text-[11px] bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto shadow-inner custom-scrollbar">
          {formatValue(value)}
        </pre>
      ) : (
        <span className={typeof value === 'boolean' ? (value ? 'text-green-600 bg-green-50 px-2 py-1 rounded-md' : 'text-red-600 bg-red-50 px-2 py-1 rounded-md') : ''}>
          {formatValue(value)}
        </span>
      )}
    </div>
  </div>
);

// ==========================================
// 4. MAIN ADMIN DASHBOARD COMPONENT
// ==========================================
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // State Management
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Live Stats State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Chat State
  const [chatConfig, setChatConfig] = useState({ isOpen: false, recipientId: '', recipientName: '' });

  // ------------------------------------------
  // SECURITY GUARD: SADMIN CHECK
  // ------------------------------------------
  useEffect(() => {
    const verifyAccess = async () => {
      if (authLoading) return;
      if (!user) {
        router.push('/dashboard');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'sadmin') {
          setIsAuthorized(true);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push('/dashboard');
      }
    };
    verifyAccess();
  }, [user, authLoading, router]);

  // ------------------------------------------
  // LIST DATA FETCHING
  // ------------------------------------------
  const fetchListData = async (resource: TabType) => {
    if (!user) return;
    setLoading(true);
    try {
      // Using standard API call for list speed
      const res = await fetch(`/api/admin?resource=${resource}`, { 
        headers: { 'x-admin-uid': user.uid } 
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchListData(activeTab);
  }, [activeTab, isAuthorized]);

  // ------------------------------------------
  // LIVE 100% TRUTH STATS FETCHING
  // ------------------------------------------
  const fetchLiveTruthStats = async (item: any, type: TabType) => {
    setStatsLoading(true);
    setLiveStats(null);
    
    try {
      let active = 0, sold = 0, views = 0, rating = item.averageRating || 0, rooms = 0;
      const targetId = item.userid || item.id; // Agents often store auth uid in `userid`

      if (type === 'agents') {
        // Query exact properties owned by this agent
        const q = query(collection(db, 'property'), where('agentId', '==', targetId));
        const snaps = await getDocs(q);
        
        snaps.forEach(doc => {
          const p = doc.data();
          if (p.status === 'sold' || p.isSold) sold++;
          else active++;
          
          views += (p.views || p.totalViews || 0);
        });
        
        // Add standalone analytics if present
        views += (item.analytics?.views || 0);

      } else if (type === 'hotels') {
        // Similar logic for hotels if needed, or just map standard properties
        rooms = item.rooms?.length || item.totalRooms || 0;
        active = item.listings?.length || 0;
        views = item.totalViews || item.views || 0;
      } else {
        // Fallbacks for standard users/properties
        active = item.totalListings || 0;
        views = item.views || 0;
      }

      setLiveStats({
        activeListings: active,
        soldListings: sold,
        totalViews: views,
        averageRating: rating || 'N/A',
        totalRooms: rooms
      });

    } catch (error) {
      console.error("Failed to fetch live stats", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleOpenModal = (item: any) => {
    setSelectedItem(item);
    fetchLiveTruthStats(item, activeTab);
  };

  // ------------------------------------------
  // QUICK ACTIONS
  // ------------------------------------------
  const handleAction = async (id: string, type: string, action: string, payload: any = {}) => {
    if (!user) return;
    
    // Optimistic UI Update
    setData(prev => prev.map(item => {
      if (item.id === id) {
        if (action === 'promote_plan') {
          const isPro = payload.plan === 'pro';
          return { ...item, planTier: payload.plan, isVerified: isPro, agentVerified: isPro, featured: isPro };
        }
        if (action === 'ban') return { ...item, status: 'banned', isBanned: true };
      }
      return item;
    }));

    // If modal is open for this item, update it too
    if (selectedItem?.id === id) {
      setSelectedItem((prev: any) => ({ ...prev, planTier: payload.plan || prev.planTier, status: action === 'ban' ? 'banned' : prev.status }));
    }

    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUid: user.uid, resourceId: id, resourceType: type, action, payload })
      });
    } catch (error) {
      console.error("Action failed", error);
    }
  };

  const openChat = (item: any) => {
    setChatConfig({
      isOpen: true,
      recipientId: item.userid || item.id,
      recipientName: item.name || item.agencyName || item.title || 'User'
    });
  };

  // ------------------------------------------
  // FILTERING
  // ------------------------------------------
  const filteredData = data.filter(item => 
    (item.name || item.agencyName || item.title || item.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ------------------------------------------
  // RENDER LOADING / AUTH GUARD
  // ------------------------------------------
  if (authLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <h2 className="text-xl font-black tracking-widest uppercase">Verifying Admin Credentials...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 md:pl-64 flex flex-col font-sans text-slate-900 selection:bg-blue-200">
      
      {/* --- SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-950 text-slate-300 p-6 hidden md:flex flex-col z-40 border-r border-slate-800">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">GuriUp <span className="text-[#0065eb]">Admin</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest flex items-center gap-1">
            <ShieldCheck size={12}/> Super User Suite
          </p>
        </div>
        <nav className="flex-1 space-y-3">
          {[
            { id: 'users', icon: <Users size={20}/> },
            { id: 'agents', icon: <Briefcase size={20}/> },
            { id: 'hotels', icon: <Building size={20}/> },
            { id: 'properties', icon: <Home size={20}/> }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as TabType); setSearchTerm(''); }} 
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-[#0065eb] text-white shadow-lg shadow-blue-900/50 scale-[1.02]' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.icon} <span className="capitalize text-sm tracking-wide">{tab.id}</span>
            </button>
          ))}
        </nav>
        
        <div className="pt-6 border-t border-slate-800 mt-auto">
          <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black">
              {user?.displayName?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{user?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- TOP HEADER --- */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[28rem]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab} by name, email, or agency...`} 
            value={searchTerm}
            className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0065eb] focus:ring-4 focus:ring-[#0065eb]/10 outline-none transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <button 
          onClick={() => fetchListData(activeTab)} 
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-black hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Activity size={16}/> Refresh Data
        </button>
      </header>

      {/* --- MAIN LIST CONTENT --- */}
      <main className="p-8 max-w-[1600px] flex-1">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-4xl font-black capitalize text-slate-900 tracking-tight">{activeTab} Management</h2>
            <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
              <Database size={16}/> Showing {filteredData.length} records in database
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="animate-spin text-[#0065eb] mb-4" size={48}/>
            <p className="font-bold text-slate-400 animate-pulse">Fetching live records...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-[2rem] border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <Search size={32} />
            </div>
            <p className="font-bold text-slate-500 text-lg">No {activeTab} found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group">
                
                {/* Status Indicator Bar */}
                {(item.status === 'banned' || item.isBanned) && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
                )}
                {item.planTier === 'pro' && item.status !== 'banned' && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                )}

                <div className="flex justify-between items-start mb-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    item.status === 'banned' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#0065eb]'
                  }`}>
                    {activeTab === 'users' && <Users size={28}/>}
                    {activeTab === 'agents' && <Briefcase size={28}/>}
                    {activeTab === 'hotels' && <Building size={28}/>}
                    {activeTab === 'properties' && <Home size={28}/>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      ID: {item.id.slice(0,6)}...
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-xl truncate mb-1">
                  {item.name || item.agencyName || item.title || 'Unnamed Record'}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-5 truncate">
                  <MapPin size={12}/> {item.city || item.location?.city || item.email || 'No location set'}
                </div>

                <div className="flex flex-wrap gap-2 mb-6 flex-1">
                   {item.planTier === 'pro' && <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Star size={10}/> Pro</span>}
                   {(item.featured || item.isFeatured) && <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><TrendingUp size={10}/> Featured</span>}
                   {(item.isVerified || item.agentVerified) && <span className="bg-[#0065eb]/10 text-[#0065eb] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10}/> Verified</span>}
                   {(item.status === 'banned' || item.isBanned) && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Ban size={10}/> Banned</span>}
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  <button 
                    onClick={() => handleOpenModal(item)}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0065eb] transition-all flex justify-center items-center gap-2 group-hover:shadow-lg"
                  >
                    <Info size={16} /> Open Full Dossier
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleAction(item.id, activeTab.slice(0,-1), 'promote_plan', {plan: item.planTier === 'pro' ? 'free' : 'pro'})} 
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        item.planTier === 'pro' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#0065eb]/10 text-[#0065eb] hover:bg-[#0065eb]/20'
                      }`}
                    >
                      {item.planTier === 'pro' ? 'Revoke Pro' : 'Grant Pro'}
                    </button>
                    <button 
                      onClick={() => handleAction(item.id, activeTab.slice(0,-1), item.status === 'banned' ? 'unban' : 'ban')} 
                      className={`${item.status === 'banned' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'} py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all`}
                    >
                      {item.status === 'banned' ? 'Unban' : 'Ban Entity'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* FULL DOSSIER SUPER MODAL (THE 100% TRUTH)  */}
      {/* ========================================== */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl max-h-[95vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50">
            
            {/* --- MODAL HEADER --- */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex justify-between items-start relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#0065eb] rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 flex gap-5 items-center w-full">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner shrink-0">
                  {activeTab === 'users' && <Users size={36}/>}
                  {activeTab === 'agents' && <Briefcase size={36}/>}
                  {activeTab === 'hotels' && <Building size={36}/>}
                  {activeTab === 'properties' && <Home size={36}/>}
                </div>
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-black truncate">{selectedItem.name || selectedItem.agencyName || selectedItem.title || 'Unknown Entity'}</h2>
                    {selectedItem.planTier === 'pro' && <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">PRO</span>}
                  </div>
                  <p className="text-sm font-medium text-blue-200 flex items-center gap-2 opacity-80 font-mono">
                    <Database size={14}/> UID: {selectedItem.userid || selectedItem.id}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest flex items-center gap-1">
                    Joined: {parseFirestoreDate(selectedItem.joinDate || selectedItem.createdAt)}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedItem(null)} 
                className="relative z-10 p-2.5 bg-white/5 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-all shrink-0"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* --- MODAL BODY --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
              
              {/* Quick Contact & Public Actions */}
              <div className="bg-white border-b border-slate-100 p-6 flex flex-wrap gap-3 sticky top-0 z-20 shadow-sm">
                {selectedItem.phone && (
                  <a href={`tel:${selectedItem.phone}`} className="flex-1 bg-slate-50 hover:bg-green-500 hover:text-white text-slate-700 py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-slate-200 hover:border-green-500 transition-all min-w-[140px]">
                    <Phone size={16} /> Call
                  </a>
                )}
                {(selectedItem.whatsapp || selectedItem.whatsappNumber) && (
                  <a href={`https://wa.me/${(selectedItem.whatsapp || selectedItem.whatsappNumber).replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-50 hover:bg-emerald-500 hover:text-white text-slate-700 py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 border border-slate-200 hover:border-emerald-500 transition-all min-w-[140px]">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
                <button onClick={() => openChat(selectedItem)} className="flex-1 bg-[#0065eb]/10 hover:bg-[#0065eb] hover:text-white text-[#0065eb] py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all min-w-[140px]">
                  <MessageCircle size={16} /> Internal Chat
                </button>
                <a href={`/${activeTab}/${selectedItem.id}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-900 hover:bg-black text-white py-3 px-4 rounded-xl text-sm font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all min-w-[140px]">
                  <Globe size={16} /> Public View
                </a>
              </div>

              <div className="p-6 sm:p-8">
                
                {/* --- LIVE CALCULATED TRUTH STATS --- */}
                <div className="mb-10">
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-[#0065eb]"/> 
                    Live Performance Metrics 
                    <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded-full ml-2">Real-time DB Query</span>
                  </h3>
                  
                  {statsLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 flex justify-center items-center gap-3 text-slate-400 font-bold shadow-sm">
                      <Loader2 size={24} className="animate-spin text-[#0065eb]" /> Calculating live aggregates...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard title="Active Listings" value={liveStats?.activeListings || 0} colorClass="text-blue-600" />
                      {activeTab === 'agents' && <MetricCard title="Properties Sold" value={liveStats?.soldListings || 0} colorClass="text-emerald-600" />}
                      {activeTab === 'hotels' && <MetricCard title="Total Rooms" value={liveStats?.totalRooms || 0} colorClass="text-emerald-600" />}
                      <MetricCard title="Total Views" value={liveStats?.totalViews || 0} colorClass="text-purple-600" />
                      <MetricCard title="Avg Rating" value={liveStats?.averageRating || 'N/A'} icon={Star} colorClass="text-yellow-500" />
                    </div>
                  )}
                </div>

                {/* --- RAW DATABASE DUMP --- */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                    <Database size={20} className="text-[#0065eb]"/> 
                    Complete Database Record
                  </h3>
                  <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    {Object.entries(selectedItem)
                      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Alphabetical sort for cleanliness
                      .map(([key, value]) => {
                        if (key === 'id') return null; // ID is in header
                        return <DetailRow key={key} label={key} value={value} />;
                      })
                    }
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- INTEGRATED SHARED CHAT --- */}
      <SharedChatComponent 
        isOpen={chatConfig.isOpen} 
        onClose={() => setChatConfig({ ...chatConfig, isOpen: false })} 
        recipientId={chatConfig.recipientId} 
        recipientName={chatConfig.recipientName}
        propertyId="admin_support"
        propertyTitle="Admin Support Override"
      />

    </div>
  );
}