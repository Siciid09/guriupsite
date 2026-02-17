'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Home, Briefcase, 
  Search, ShieldCheck, Ban, Trash2, 
  CheckCircle, XCircle, Loader2, Menu,
  MoreVertical, Star, TrendingUp
} from 'lucide-react';

// --- TYPES (Matches your API) ---
interface AdminItem {
  id: string;
  name?: string;
  title?: string; // For properties
  email?: string;
  role?: string;
  status?: string;
  planTier?: 'free' | 'pro' | 'premium';
  isVerified?: boolean;
  isArchived?: boolean;
  featured?: boolean;
  price?: number;
  location?: any;
  createdAt?: string;
  [key: string]: any;
}

export default function AdminDashboard() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'users' | 'agents' | 'hotels' | 'properties'>('users');
  const [data, setData] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminUid, setAdminUid] = useState(''); // In real app, get this from auth context

  // --- MOCK AUTH (Replace with your actual Auth Context) ---
  useEffect(() => {
    // SIMULATION: For testing, we assume we are logged in. 
    // In production, use: const { user } = useAuth(); setAdminUid(user.uid);
    const storedUid = localStorage.getItem('sadmin_uid');
    if (storedUid) setAdminUid(storedUid);
  }, []);

  // --- FETCH DATA ---
  const fetchData = async (resource: string) => {
    setLoading(true);
    try {
      // Pass the Admin UID in headers for security check
      const res = await fetch(`/api/admin?resource=${resource}`, {
        headers: { 'x-admin-uid': adminUid || 'TEST_UID' } 
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        console.error(json.error);
        alert('Access Denied: You are not a Super Admin');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, adminUid]);

  // --- ACTIONS (The "God Mode" Controls) ---
  const handleAction = async (id: string, type: string, action: string, payload: any = {}) => {
    if (!confirm(`Are you sure you want to ${action} this ${type}?`)) return;

    try {
      // 1. Optimistic UI Update (Instant Feedback)
      setData(prev => prev.map(item => {
        if (item.id === id) {
          if (action === 'ban') return { ...item, status: 'banned', planTier: 'free' };
          if (action === 'verify') return { ...item, isVerified: true };
          if (action === 'promote_plan') return { ...item, planTier: payload.plan, isVerified: true };
          if (action === 'feature') return { ...item, featured: payload.featured };
          if (action === 'archive') return { ...item, isArchived: true };
        }
        return item;
      }));

      // 2. API Call
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUid: adminUid || 'TEST_UID',
          resourceId: id,
          resourceType: type,
          action,
          payload
        })
      });

      if (!res.ok) throw new Error('Action failed');

    } catch (err) {
      alert('Operation failed. Please try again.');
      fetchData(activeTab); // Revert on error
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`WARNING: PERMANENTLY DELETE this ${type}? This cannot be undone.`)) return;
    
    try {
      setData(prev => prev.filter(item => item.id !== id));
      await fetch(`/api/admin?id=${id}&type=${type}`, {
        method: 'DELETE',
        headers: { 'x-admin-uid': adminUid || 'TEST_UID' }
      });
    } catch (err) {
      alert('Delete failed');
      fetchData(activeTab);
    }
  };

  // --- FILTERING ---
  const filteredData = data.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(search) || 
      item.title?.toLowerCase().includes(search) || 
      item.email?.toLowerCase().includes(search) ||
      item.id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0 md:pl-64">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex-col z-50">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black tracking-tight text-white">GuriUp <span className="text-blue-500">Admin</span></h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">God Mode</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarLink icon={<Users size={20}/>} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <SidebarLink icon={<Briefcase size={20}/>} label="Agents" active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} />
          <SidebarLink icon={<Building size={20}/>} label="Hotels" active={activeTab === 'hotels'} onClick={() => setActiveTab('hotels')} />
          <SidebarLink icon={<Home size={20}/>} label="Properties" active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">SA</div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold truncate">Super Admin</p>
                 <input 
                   type="text" 
                   placeholder="Enter S-Admin UID" 
                   className="text-[10px] bg-transparent text-slate-400 outline-none w-full"
                   value={adminUid}
                   onChange={(e) => { setAdminUid(e.target.value); localStorage.setItem('sadmin_uid', e.target.value); }}
                 />
              </div>
           </div>
        </div>
      </aside>

      {/* --- TOP BAR (Mobile & Desktop) --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
         <div className="md:hidden font-black text-xl text-slate-900">GuriUp <span className="text-blue-600">Admin</span></div>
         <div className="flex-1 max-w-xl mx-auto md:mx-0 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="hidden md:flex items-center gap-3 ml-4">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase">System Healthy</span>
         </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
           <div>
             <h2 className="text-3xl font-black capitalize">{activeTab} Management</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">Total: {data.length} records found</p>
           </div>
           <button onClick={() => fetchData(activeTab)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors">
              Refresh Data
           </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((item) => (
               <DataCard 
                  key={item.id} 
                  item={item} 
                  type={activeTab} 
                  onAction={handleAction} 
                  onDelete={handleDelete} 
               />
            ))}
            {filteredData.length === 0 && (
               <div className="col-span-full text-center py-20 text-slate-400 font-medium">
                  No {activeTab} found matching your search.
               </div>
            )}
          </div>
        )}
      </main>

      {/* --- BOTTOM NAV (Mobile Only) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-50 pb-safe">
          <MobileNavLink icon={<Users size={20}/>} label="Users" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <MobileNavLink icon={<Briefcase size={20}/>} label="Agents" active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} />
          <MobileNavLink icon={<Building size={20}/>} label="Hotels" active={activeTab === 'hotels'} onClick={() => setActiveTab('hotels')} />
          <MobileNavLink icon={<Home size={20}/>} label="Props" active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
      </nav>

    </div>
  );
}

// =======================================================================
// SUB-COMPONENTS
// =======================================================================

const SidebarLink = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    {icon} <span>{label}</span>
  </button>
);

const MobileNavLink = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
  >
    {icon} <span className="text-[10px] font-bold">{label}</span>
  </button>
);

const DataCard = ({ item, type, onAction, onDelete }: any) => {
  const isBanned = item.status === 'banned';
  const isVerified = item.isVerified || item.agentVerified;
  const isPro = item.planTier === 'pro' || item.planTier === 'premium';
  const title = item.name || item.title || item.email || 'Untitled';
  const subtitle = type === 'properties' ? (item.location?.city || 'No Location') : (item.email || 'No Email');
  const image = item.images?.[0] || item.photoUrl || item.logoUrl || `https://ui-avatars.com/api/?name=${title}&background=random`;

  return (
    <div className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-xl group relative ${isBanned ? 'border-red-200 bg-red-50/50' : 'border-slate-100'}`}>
      
      {/* HEADER */}
      <div className="flex items-start gap-4 mb-4">
        <img src={image} alt={title} className="w-12 h-12 rounded-xl object-cover bg-slate-100" />
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold text-slate-900 truncate pr-6">{title}</h3>
          <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {isVerified && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><ShieldCheck size={10}/> Verified</span>}
            {isPro && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><Star size={10}/> {item.planTier}</span>}
            {item.featured && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><TrendingUp size={10}/> Featured</span>}
            {isBanned && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><Ban size={10}/> Banned</span>}
          </div>
        </div>
      </div>

      {/* ID (Copyable) */}
      <div className="bg-slate-50 p-2 rounded-lg mb-4 flex justify-between items-center group/id cursor-pointer" onClick={() => navigator.clipboard.writeText(item.id)}>
         <span className="text-[10px] font-mono text-slate-400 truncate w-3/4">ID: {item.id}</span>
         <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover/id:opacity-100 transition-opacity">COPY</span>
      </div>

      {/* ACTION GRID */}
      <div className="grid grid-cols-2 gap-2">
        {/* BAN / UNBAN */}
        {isBanned ? (
           <button onClick={() => onAction(item.id, type === 'properties' ? 'property' : type.slice(0, -1), 'unban')} className="bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors">Unban</button>
        ) : (
           <button onClick={() => onAction(item.id, type === 'properties' ? 'property' : type.slice(0, -1), 'ban')} className="bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">Ban User</button>
        )}

        {/* VERIFY / PROMOTE */}
        {(type === 'agents' || type === 'hotels') && (
            <div className="relative group/menu">
              <button className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Manage Plan</button>
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border border-slate-100 p-1 hidden group-hover/menu:block z-10 animate-in zoom-in-95">
                  <button onClick={() => onAction(item.id, type.slice(0, -1), 'promote_plan', { plan: 'free' })} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600">Downgrade to Free</button>
                  <button onClick={() => onAction(item.id, type.slice(0, -1), 'promote_plan', { plan: 'pro' })} className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-lg text-xs font-bold text-purple-600">Upgrade to Pro</button>
                  <button onClick={() => onAction(item.id, type.slice(0, -1), 'promote_plan', { plan: 'premium' })} className="w-full text-left px-3 py-2 hover:bg-yellow-50 rounded-lg text-xs font-bold text-yellow-600">Upgrade to Premium</button>
              </div>
            </div>
        )}

        {/* FEATURE PROPERTY */}
        {type === 'properties' && (
           <button 
             onClick={() => onAction(item.id, 'property', 'feature', { featured: !item.featured })} 
             className={`py-2 rounded-lg text-xs font-bold transition-colors ${item.featured ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             {item.featured ? 'Unfeature' : 'Feature'}
           </button>
        )}

        {/* DELETE (Nuclear) */}
        <button onClick={() => onDelete(item.id, type === 'properties' ? 'property' : type.slice(0, -1))} className="bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors flex items-center justify-center gap-1 col-span-2 mt-1">
           <Trash2 size={12}/> Delete Permanently
        </button>
      </div>

    </div>
  );
}