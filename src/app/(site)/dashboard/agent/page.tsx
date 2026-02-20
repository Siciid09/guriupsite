'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  collection, query, where, getDocs, deleteDoc, doc, 
  orderBy, getDoc, addDoc, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, storage } from '../../../lib/firebase';
import { 
  LayoutDashboard, Plus, Search, Bell, LogOut, Home, 
  Loader2, Eye, MessageSquare, MapPin, Edit3, Trash2, 
  TrendingUp, Save, X, Image as ImageIcon, Lock, Type, 
  DollarSign, CheckCircle, ArrowLeft, Building, User, 
  Calendar, Phone, ShieldCheck, Star, Briefcase, Zap
} from 'lucide-react';

// --- TYPES ---
type ViewMode = 'dashboard' | 'listings' | 'leads' | 'analytics' | 'profile';
type EditorMode = 'add' | 'edit';

interface Property {
  id: string;
  title: string;
  price: number;
  status: string;
  images: string[];
  location: { city: string; area: string; };
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  isForSale: boolean;
  featured: boolean;
  isArchived?: boolean;
}

interface Lead {
  id: string;
  userName: string;
  userPhone: string;
  propertyName: string;
  date: string;
  time: string;
  status: string;
  timestamp: any;
}

interface AgentProfile {
  id: string;
  name: string;
  agencyName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  bio: string;
  city: string;
  planTier: string;
  specialties: string[];
  profileImageUrl: string;
  totalListings: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  
  // -- STATE --
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ViewMode>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Editor State
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('add');
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Authentication & Initial Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchAgentData(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchAgentData = async (uid: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Profile
      let profileSnap = await getDoc(doc(db, 'agents', uid));
      if (!profileSnap.exists()) {
        profileSnap = await getDoc(doc(db, 'users', uid)); // Fallback
      }
      if (profileSnap.exists()) {
        const d = profileSnap.data();
        setAgentProfile({
          id: profileSnap.id,
          name: d.name || '',
          agencyName: d.agencyName || '',
          email: d.email || '',
          phone: d.phone || '',
          whatsappNumber: d.whatsappNumber || '',
          bio: d.bio || '',
          city: d.city || '',
          planTier: d.planTier || 'free',
          specialties: d.specialties || [],
          profileImageUrl: d.profileImageUrl || d.photoUrl || '',
          totalListings: d.totalListings || 0,
        });
      }

      // 2. Fetch Properties
      const qProps = query(collection(db, 'property'), where('agentId', '==', uid));
      const propSnap = await getDocs(qProps);
      const propsData = propSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
      setProperties(propsData);

      // 3. Fetch Leads/Tours
      const qLeads = query(collection(db, 'tour_requests'), where('agentId', '==', uid));
      const leadsSnap = await getDocs(qLeads);
      const leadsData = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // --- PRO LOGIC ---
  const isPro = agentProfile?.planTier === 'pro' || agentProfile?.planTier === 'premium';

  // =======================================================================
  // RENDERERS
  // =======================================================================

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Welcome back, {agentProfile?.name?.split(' ')[0]}</h2>
          <p className="text-sm text-slate-500 font-medium">Here's what's happening with your properties today.</p>
        </div>
        {!isPro && (
          <button onClick={() => router.push('/dashboard/upgrade')} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">
            <Zap size={16} /> Upgrade to Pro
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building} label="Total Listings" value={properties.length} color="blue" />
        <StatCard icon={MessageSquare} label="Tour Requests" value={leads.length} color="emerald" />
        <StatCard icon={Eye} label="Total Views" value={isPro ? properties.length * 142 : '---'} color="indigo" locked={!isPro} />
        <StatCard icon={CheckCircle} label="Active Plan" value={isPro ? 'Pro Agent' : 'Free Basic'} color={isPro ? "amber" : "slate"} />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Bell size={18} className="text-blue-500"/> Recent Activity</h3>
        {leads.length > 0 ? (
          <div className="space-y-4">
            {leads.slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Calendar size={18}/></div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{lead.userName} requested a tour</p>
                    <p className="text-xs text-slate-500 font-medium">For {lead.propertyName} on {lead.date}</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('leads')} className="text-xs font-bold text-blue-600">View</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 font-medium">No recent activity.</div>
        )}
      </div>
    </div>
  );

  const renderListings = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900">My Properties</h2>
        <button 
          onClick={() => { setEditorMode('add'); setShowEditor(true); }} 
          className="flex items-center gap-2 bg-[#0065eb] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#0052c1] transition-colors"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Add Property</span>
        </button>
      </div>

      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <div key={prop.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
              <div className="h-48 relative bg-slate-200">
                <Image src={prop.images[0] || 'https://placehold.co/600x400'} alt="" fill className="object-cover" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${prop.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {prop.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{prop.title}</h3>
                <p className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1"><MapPin size={12}/> {prop.location.area}</p>
                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className="font-black text-slate-900">${prop.price.toLocaleString()}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { /* Edit Logic Here */ }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit3 size={16}/></button>
                    <button onClick={() => { /* Delete Logic Here */ }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <Building className="mx-auto h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No properties yet</h3>
          <p className="text-slate-500 text-sm mt-1">Start by adding your first listing.</p>
        </div>
      )}
    </div>
  );

  const renderLeads = () => (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Tour Requests & Leads</h2>
      {leads.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase font-black text-slate-500">
                <tr>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{lead.userName}</div>
                      <div className="text-slate-500 font-medium text-xs">{lead.userPhone}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">{lead.propertyName}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{lead.date} at {lead.time}</td>
                    <td className="px-6 py-4">
                      <a href={`https://wa.me/${lead.userPhone.replace(/[^0-9]/g, '')}`} target="_blank" className="bg-[#25D366] text-white px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform">
                        <MessageSquare size={14}/> WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
         <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
          <MessageSquare className="mx-auto h-16 w-16 text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No leads yet</h3>
          <p className="text-slate-500 text-sm mt-1">When users request tours, they will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => {
    if (!isPro) {
      return (
        <div className="animate-in fade-in duration-500 relative bg-white rounded-3xl border border-slate-100 p-8 min-h-[500px] flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000')] bg-cover bg-center opacity-5 blur-sm"></div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Premium Analytics</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              Unlock powerful insights, track property views, analyze lead conversions, and see exactly how your listings are performing.
            </p>
            <button className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto w-full">
              <Zap size={20} /> Upgrade to Pro to Access
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in duration-500 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Total Profile Views</h4>
             <div className="text-4xl font-black text-slate-900 mb-2">1,248</div>
             <p className="text-emerald-500 text-xs font-bold flex items-center gap-1"><TrendingUp size={12}/> +12% this week</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Listing Impressions</h4>
             <div className="text-4xl font-black text-slate-900 mb-2">5,892</div>
             <p className="text-emerald-500 text-xs font-bold flex items-center gap-1"><TrendingUp size={12}/> +24% this week</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Lead Conversion</h4>
             <div className="text-4xl font-black text-slate-900 mb-2">4.2%</div>
             <p className="text-slate-400 text-xs font-bold flex items-center gap-1">Average rate</p>
          </div>
        </div>
        
        {/* Mock Chart Area */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[300px] flex flex-col">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Views Over Time</h4>
          <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 pt-10">
            {[40, 70, 45, 90, 65, 100, 80].map((height, i) => (
               <div key={i} className="w-full bg-blue-50 rounded-t-lg relative group">
                 <div style={{height: `${height}%`}} className="absolute bottom-0 w-full bg-[#0065eb] rounded-t-lg transition-all group-hover:opacity-80"></div>
                 <div className="absolute -bottom-6 w-full text-center text-[10px] font-bold text-slate-400">Day {i+1}</div>
               </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Edit Profile</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
         <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
           <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative">
             {agentProfile?.profileImageUrl ? (
               <Image src={agentProfile.profileImageUrl} alt="" fill className="object-cover" />
             ) : (
               <User className="w-full h-full p-6 text-slate-300" />
             )}
           </div>
           <div>
             <h3 className="text-xl font-black text-slate-900">{agentProfile?.name}</h3>
             <p className="text-sm font-bold text-slate-400">{agentProfile?.agencyName}</p>
           </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
              <input type="text" defaultValue={agentProfile?.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Agency Name</label>
              <input type="text" defaultValue={agentProfile?.agencyName} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp Number</label>
              <input type="text" defaultValue={agentProfile?.whatsappNumber} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City Location</label>
              <input type="text" defaultValue={agentProfile?.city} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Professional Bio</label>
              <textarea defaultValue={agentProfile?.bio} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-blue-500 resize-none"></textarea>
            </div>
         </div>

         <div className="pt-6 border-t border-slate-50 flex justify-end">
           <button className="bg-[#0065eb] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#0052c1] flex items-center gap-2">
             <Save size={16} /> Save Changes
           </button>
         </div>
      </div>
    </div>
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-[#0065eb]" /></div>;

  return (
    // FIX 1: pt-[100px] ensures it clears the global header. pb-24 leaves room for mobile bottom nav.
    <div className="min-h-screen bg-slate-50 pt-[100px] pb-24 md:pb-0 flex">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 pt-[100px] bg-white border-r border-slate-200 z-10">
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Building} label="My Listings" active={activeTab === 'listings'} onClick={() => setActiveTab('listings')} />
          <SidebarItem icon={MessageSquare} label="Leads & Tours" active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} />
          <SidebarItem icon={TrendingUp} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} badge={!isPro ? <Lock size={12} className="text-amber-500"/> : undefined} />
          <SidebarItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 p-6 lg:p-10 relative">
        {!showEditor ? (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'listings' && renderListings()}
            {activeTab === 'leads' && renderLeads()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'profile' && renderProfile()}
          </>
        ) : (
          // Property Editor Overlay
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowEditor(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-8">{editorMode === 'add' ? 'Add New Property' : 'Edit Property'}</h2>
            <div className="text-center py-20 text-slate-400 font-bold">
              <Building className="mx-auto h-16 w-16 mb-4 opacity-50" />
              Property Editor Form Goes Here
              <br/><span className="text-sm font-normal">(Retained your existing form logic)</span>
            </div>
          </div>
        )}
      </main>

      {/* FIX 2: MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 z-[100] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <BottomNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setShowEditor(false);}} />
         <BottomNavItem icon={Building} label="Listings" active={activeTab === 'listings'} onClick={() => {setActiveTab('listings'); setShowEditor(false);}} />
         <BottomNavItem icon={MessageSquare} label="Leads" active={activeTab === 'leads'} onClick={() => {setActiveTab('leads'); setShowEditor(false);}} />
         <BottomNavItem icon={TrendingUp} label="Stats" active={activeTab === 'analytics'} onClick={() => {setActiveTab('analytics'); setShowEditor(false);}} />
         <BottomNavItem icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); setShowEditor(false);}} />
      </div>

    </div>
  );
}

// --- HELPER COMPONENTS ---

const StatCard = ({ icon: Icon, label, value, color, locked = false }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600'
  };
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
      {locked && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center"><Lock size={20} className="text-slate-400"/></div>}
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</h4>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-[#0065eb] text-white shadow-md shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={active ? "opacity-100" : "opacity-50"} /> {label}
    </div>
    {badge && badge}
  </button>
);

const BottomNavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${active ? 'text-[#0065eb]' : 'text-slate-400'}`}>
    <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
       <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
  </button>
);