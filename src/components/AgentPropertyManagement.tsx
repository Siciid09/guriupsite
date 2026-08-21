'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { auth } from './.././../src/app/lib/firebase'; 
import { 
  Search, Plus, MapPin, Edit3, Trash2, X, 
  BarChart2, MoreVertical, Archive, RefreshCw,
  Building, CheckCircle, ArrowUpRight, Lock, 
  Eye, Star, TrendingUp, Clock, Phone, Key
} from 'lucide-react';
import CompletePropertyForm from './proform';
import LeaseAssignmentModal from './LeaseAssignmentModal';
import PropertyDetailsModal from './PropertyDetailsModal';
// Import your new separate form component

// --- UPDATED TYPES TO MATCH NEW API ---
interface Property {
  id?: string;
  slug?: string;
  title: string;
  price: number;
  currency?: string;
  negotiable?: boolean;
  views?: number;           
  favoritedBy?: string[];   
  clicks?: number;          
  status: string;
  images: string[];
  videoUrl?: string;
  location: { 
    country?: string; 
    city: string; 
    area: string; 
    address?: string; 
    gpsCoordinates?: string;
    visibility?: string;
  };
  propertyType: string; 
  isForSale: boolean;
  tenantName?: string;
  tenantPhone?: string;
  tenantId?: string;
  isArchived: boolean;
  hasDiscount?: boolean;
  discountPrice?: number;
  description: string;
  
  // New grouped data structures
  details?: Record<string, any>;
  rentalDetails?: Record<string, any>;
  saleDetails?: Record<string, any>;
  amenities?: Record<string, any>;
  contact?: Record<string, any>;
  highlights?: string[];
  
  features: Record<string, any>; // Keeping for backward compatibility
  createdAt?: any;
  updatedAt?: any;
  agentId: string;
}

interface AgentPropertyManagementProps {
  currentUserUid: string;
  userPlan: string; 
  onUpgrade: () => void;
}

const TABS = ['All', 'Active', 'For Rent', 'For Sale', 'Land', 'Rented', 'Sold', 'Archived'];
const FREE_LIMIT = 3;

export default function CompletePropertyManagement({ 
  currentUserUid, 
  userPlan, 
  onUpgrade 
}: AgentPropertyManagementProps) {
  
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [statsProp, setStatsProp] = useState<Property | null>(null); 
  const [assignTarget, setAssignTarget] = useState<Property | null>(null);
  const [viewingProp, setViewingProp] = useState<Property | null>(null); 
  
  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes(userPlan?.toLowerCase() || 'free');

  const fetchDashboardData = async () => {
    if (!currentUserUid) return;
    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const propRes = await fetch(`/api/properties?agentId=${currentUserUid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const propData = await propRes.json();
      const rawProperties = propData.success ? propData.properties : (Array.isArray(propData) ? propData : []);

      const tenantRes = await fetch(`/api/tenants?agentId=${currentUserUid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const tenantData = await tenantRes.json();
      setTenants(tenantData.success ? tenantData.tenants : (Array.isArray(tenantData) ? tenantData : []));

      const merged = rawProperties.map((p: any) => ({
        ...p,
        id: p.id || p._id,
        propertyType: p.propertyType || p.type || 'House', 
        views: p.views || 0,
        clicks: p.clicks || 0,
      }));
      
      merged.sort((a: Property, b: Property) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
      setProperties(merged);
    } catch (error) {
      console.error("Failed to load dashboard data via API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUserUid]);

  const updatePropertyStatus = async (prop: Property, newStatus: string) => {
    if (!window.confirm(`Mark this listing as ${newStatus.toUpperCase()}?`)) return;
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const res = await fetch(`/api/properties`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: prop.id, status: newStatus, isArchived: false })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: newStatus, isArchived: false } : p));
    } catch (error) { alert("Error updating status."); }
  };

  const toggleArchive = async (prop: Property) => {
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const res = await fetch(`/api/properties`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: prop.id, isArchived: !prop.isArchived })
      });
      if (!res.ok) throw new Error("Failed to archive/unarchive");
      setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, isArchived: !prop.isArchived } : p));
      setActiveMenu(null);
    } catch (error) { console.error(error); }
  };

  const deleteProperty = async (propId: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const res = await fetch(`/api/properties?id=${propId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error("Failed to delete property");
      setProperties(prev => prev.filter(p => p.id !== propId));
      setActiveMenu(null);
    } catch (error) { alert("Error deleting listing."); }
  };

  const openForm = (prop?: Property) => {
    if (prop && !isPro) {
      const createdTime = new Date(prop.createdAt || Date.now());
      const diffHours = (new Date().getTime() - createdTime.getTime()) / (1000 * 60 * 60);
      
      if (diffHours > 4) {
        alert(`Edit Window Expired: Free users can only edit listings within the first 4 hours of publishing. Upgrade to Pro for unlimited edits.`);
        return;
      }
    }
    setEditingProp(prop || null);
    setViewMode('form');
  };

  const filteredProperties = properties.filter(p => {
    const search = searchQuery.toLowerCase();
    const title = (p.title || '').toLowerCase();
    const area = (p.location?.area || '').toLowerCase();
    const status = (p.status || 'available').toLowerCase();
    const type = (p.propertyType || '').toLowerCase();

    if (search && !title.includes(search) && !area.includes(search)) return false;
    if (activeTab === 'Archived') return p.isArchived === true;
    if (p.isArchived) return false;

    switch (activeTab) {
      case 'Active': return status === 'active' || status === 'available';
      case 'For Rent': return !p.isForSale && (status === 'active' || status === 'available');
      case 'For Sale': return p.isForSale && (status === 'active' || status === 'available');
      case 'Land': return type === 'land';
      case 'Rented': return status === 'rented_out' || status === 'rented';
      case 'Sold': return status === 'sold';
      default: return true;
    }
  }).sort((a, b) => {
    if (sortBy === 'Price High') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'Price Low') return (a.price || 0) - (b.price || 0);
    return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
  });

  const canAdd = isPro || properties.length < FREE_LIMIT;

  const renderList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Rad Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Property Portfolio</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage listings, track inquiries, and analyze performance.</p>
        </div>
        <button 
          onClick={() => canAdd ? openForm() : onUpgrade()}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
            canAdd 
              ? 'bg-gradient-to-r from-[#0065eb] to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50' 
              : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl shadow-slate-900/30'
          }`}
        >
          {canAdd ? <Plus size={20} strokeWidth={3} /> : <Lock size={20} strokeWidth={3} />}
          <span>{canAdd ? 'Add New Property' : 'Upgrade to Add More'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-3">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-2">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search by title or area..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <select 
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none cursor-pointer focus:ring-4 focus:ring-blue-500/10 transition-all"
          >
            <option value="Newest">Sort: Newest First</option>
            <option value="Price High">Price: High to Low</option>
            <option value="Price Low">Price: Low to High</option>
          </select>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar border-t border-slate-50 pt-3 px-2 mt-2 gap-2">
          {TABS.map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map(prop => {
            const isSold = prop.status.toLowerCase() === 'sold';
            const isRented = prop.status.toLowerCase() === 'rented_out';
            const isInactive = isSold || isRented || prop.isArchived;

            return (
              <div key={prop.id} className="bg-white rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group relative transition-all duration-300 flex flex-col">
                <div className="h-52 relative bg-slate-200 cursor-pointer overflow-hidden" onClick={() => setViewingProp(prop)}>
                  <Image 
                    src={prop.images?.[0] || 'https://placehold.co/600x400'} 
                    alt={prop.title} 
                    fill 
                    className={`object-cover transition-transform duration-700 group-hover:scale-110 ${isInactive ? 'grayscale opacity-70' : ''}`} 
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md ${
                      prop.isArchived ? 'bg-slate-800/90' : 
                      isSold ? 'bg-rose-500/90' : 
                      isRented ? 'bg-orange-500/90' : 
                      'bg-emerald-500/90'
                    }`}>
                      {prop.isArchived ? 'Archived' : isSold ? 'Sold' : isRented ? 'Rented' : 'Active'}
                    </span>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/90 text-slate-900 shadow-lg backdrop-blur-md">
                      {prop.isForSale ? 'Sale' : 'Rent'}
                    </span>
                  </div>
                  
                  {/* Rad Menu Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === prop.id ? null : prop.id!); }} 
                    className="absolute top-4 right-4 w-9 h-9 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/40 hover:scale-110 transition-all shadow-lg z-10"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeMenu === prop.id && (
                    <div className="absolute top-14 right-4 w-44 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in zoom-in-95">
                      <button onClick={() => { setAssignTarget(prop); setActiveMenu(null); }} className="w-full text-left px-5 py-3 text-sm font-bold text-[#0065eb] hover:bg-blue-50 flex items-center gap-3 transition-colors"><Key size={16} /> Assign Tenant</button>
                      <button onClick={() => toggleArchive(prop)} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors"><Archive size={16} /> {prop.isArchived ? 'Unarchive' : 'Archive'}</button>
                      <button onClick={() => deleteProperty(prop.id!)} className="w-full text-left px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-100 transition-colors"><Trash2 size={16} /> Delete</button>
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-black text-slate-900 text-lg truncate mb-1 cursor-pointer hover:text-[#0065eb] transition-colors" onClick={() => setViewingProp(prop)}>{prop.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-1.5"><MapPin size={14} className="text-[#0065eb]"/> {prop.location?.area || 'N/A'}, {prop.location?.city}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-end mb-5">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                        <span className="font-black text-slate-900 text-2xl">{prop.currency || '$'}{(prop.price || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Rad Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => openForm(prop)} 
                        className="flex-1 flex justify-center items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs transition-all hover:shadow-md"
                      >
                        <Edit3 size={16}/> Edit
                      </button>
                      <button 
                        onClick={() => isPro ? setStatsProp(prop) : onUpgrade()} 
                        className="flex-1 flex justify-center items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl font-bold text-xs transition-all hover:shadow-md"
                      >
                        {isPro ? <BarChart2 size={16}/> : <Lock size={14}/>} Stats
                      </button>
                    </div>

                    <div className="mt-2 flex gap-2">
                      {isInactive ? (
                        <button onClick={() => updatePropertyStatus(prop, 'available')} className="w-full flex justify-center items-center gap-2 p-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:scale-[1.02] shadow-lg shadow-slate-900/20 rounded-2xl font-bold text-xs transition-all">
                          <RefreshCw size={16}/> Relist as Active
                        </button>
                      ) : (
                        <>
                          {prop.isForSale ? (
                            <button onClick={() => updatePropertyStatus(prop, 'sold')} className="flex-1 flex justify-center items-center gap-2 p-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:scale-[1.02] shadow-lg shadow-rose-500/30 rounded-2xl font-bold text-xs transition-all">
                              <CheckCircle size={16}/> Mark Sold
                            </button>
                          ) : (
                            <button onClick={() => updatePropertyStatus(prop, 'rented_out')} className="flex-1 flex justify-center items-center gap-2 p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] shadow-lg shadow-emerald-500/30 rounded-2xl font-bold text-xs transition-all">
                              <CheckCircle size={16}/> Mark Rented
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm">
          <div className="w-24 h-24 bg-blue-50 text-[#0065eb] rounded-full flex items-center justify-center mx-auto mb-6"><Building size={40} /></div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No properties found</h3>
          <p className="text-slate-500 font-medium mb-8">Start building your portfolio by adding your first listing.</p>
          <button 
            onClick={() => canAdd ? openForm() : onUpgrade()} 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-[#0065eb] to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:scale-105 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> Add New Listing
          </button>
        </div>
      )}

      {/* Stats Modal */}
      {statsProp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-900 truncate pr-4">{statsProp.title}</h3>
              <button onClick={() => setStatsProp(null)} className="p-2 bg-white shadow-sm hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[24px] flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="text-[#0065eb] mb-3 bg-white p-3 rounded-2xl shadow-sm"><Eye size={24}/></div>
                  <h4 className="text-3xl font-black text-slate-900">{statsProp.views || 0}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Views</p>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-5 rounded-[24px] flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="text-rose-500 mb-3 bg-white p-3 rounded-2xl shadow-sm"><Star size={24}/></div>
                  <h4 className="text-3xl font-black text-slate-900">{statsProp.favoritedBy?.length || 0}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Favorites</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-[24px] flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="text-emerald-500 mb-3 bg-white p-3 rounded-2xl shadow-sm"><TrendingUp size={24}/></div>
                  <h4 className="text-3xl font-black text-slate-900">{statsProp.clicks || 0}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inquiries</p>
                </div>
                <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-[24px] flex flex-col items-center text-center transition-transform hover:scale-105">
                  <div className="text-purple-500 mb-3 bg-white p-3 rounded-2xl shadow-sm"><Clock size={24}/></div>
                  <h4 className="text-3xl font-black text-slate-900">
                      {statsProp.createdAt ? Math.max(1, Math.floor((new Date().getTime() - new Date(statsProp.createdAt).getTime()) / (1000 * 3600 * 24))) : 1}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Days Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {assignTarget && (
        <LeaseAssignmentModal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          currentUserUid={currentUserUid}
          mode="property-to-tenant"
          preselectedData={assignTarget}
          onSuccess={() => {
            fetchDashboardData();
            alert("Property successfully leased!");
          }}
        />
      )}

      <PropertyDetailsModal 
        isOpen={!!viewingProp} 
        onClose={() => setViewingProp(null)} 
        property={viewingProp} 
        onEdit={(prop) => { setViewingProp(null); openForm(prop); }} 
      />
    </div>
  );

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-[#0065eb]" /></div>;
  
  // Render the new decoupled form component if viewMode is 'form'
  if (viewMode === 'form') {
    return (
      <div className="w-full">
        <CompletePropertyForm 
          currentUserUid={currentUserUid} 
          existingProperty={editingProp} 
          userPlan={userPlan} // 🆕 Added so the form knows if the user is Pro
          tenants={tenants}   // 🆕 Added so the form can do Tenant Assignment
          onCancel={() => setViewMode('list')}
          onSuccess={() => {
            setViewMode('list');
            fetchDashboardData(); 
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {renderList()}
    </div>
  );
}