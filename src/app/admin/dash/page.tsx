'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Home, Briefcase, Search, ShieldCheck, 
  Ban, Trash2, Loader2, Star, TrendingUp, ChevronRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'agents' | 'hotels' | 'properties'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const adminUid = 'Nj57KK3nJvPbnFjGekxQE4uEW3C2'; 

  const fetchData = async (resource: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?resource=${resource}`, { 
        headers: { 'x-admin-uid': adminUid } 
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const handleAction = async (id: string, type: string, action: string, payload: any = {}) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        if (action === 'promote_plan') {
          const isPro = payload.plan === 'pro';
          return { ...item, planTier: payload.plan, isVerified: isPro, agentVerified: isPro, featured: isPro, isFeatured: isPro };
        }
        if (action === 'ban') return { ...item, status: 'banned' };
      }
      return item;
    }));

    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUid, resourceId: id, resourceType: type, action, payload })
    });
  };

  const filteredData = data.filter(item => 
    (item.name || item.agencyName || item.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 md:pl-64 flex flex-col font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col z-50">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-white">GuriUp <span className="text-blue-500">Admin</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Management Suite</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'users', icon: <Users size={18}/> },
            { id: 'agents', icon: <Briefcase size={18}/> },
            { id: 'hotels', icon: <Building size={18}/> },
            { id: 'properties', icon: <Home size={18}/> }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {tab.icon} <span className="capitalize">{tab.id}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* TOPBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`} 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <button onClick={() => fetchData(activeTab)} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-black transition-all">
          Refresh List
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-3xl font-black capitalize">{activeTab} Management</h2>
          <p className="text-slate-500 font-medium">Review and update {activeTab} accounts.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={48}/>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-blue-600">
                    {activeTab === 'users' && <Users size={24}/>}
                    {activeTab === 'agents' && <Briefcase size={24}/>}
                    {activeTab === 'properties' && <Home size={24}/>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-300 block mb-1">ID: {item.id.slice(0,8)}...</span>
                  </div>
                </div>

                <h3 className="font-black text-slate-900 text-lg truncate mb-1">{item.name || item.agencyName || item.title}</h3>
                <p className="text-xs text-slate-400 font-medium mb-4 truncate">{item.email || item.location?.city || 'No details available'}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                   {item.planTier === 'pro' && <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Star size={10}/> Pro Plan</span>}
                   {(item.featured || item.isFeatured) && <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><TrendingUp size={10}/> Featured</span>}
                   {(item.isVerified || item.agentVerified) && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={10}/> Verified</span>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAction(item.id, activeTab.slice(0,-1), 'promote_plan', {plan: item.planTier === 'pro' ? 'free' : 'pro'})} 
                    className={`py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      item.planTier === 'pro' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.planTier === 'pro' ? 'Make Free' : 'Make Pro'}
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, activeTab.slice(0,-1), 'ban')} 
                    className="bg-red-50 text-red-600 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Ban
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}