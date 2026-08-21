'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '../app/lib/firebase'; // Client auth for token generation
import { 
  Search, Plus, Users, Edit3, Trash2, Phone, Building, 
  Lock, ArrowRight, MoreVertical, Loader2, Key, Unlink 
} from 'lucide-react';
import TenantForm from './TenantForm';
import LeaseAssignmentModal from './LeaseAssignmentModal';
import TenantDetailsModal from './TenantDetailsModal';

export interface Tenant {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  idType: string;
  idNumber: string;
  unitNumber: string;
  propertyId?: string;
  propertyName?: string;
  rentAmount: number;
  depositAmount: number;
  leaseStart: any; 
  leaseEnd: any;   
  status: string;
  guarantor: {
    name: string;
    phone: string;
    relation: string;
    idNumber: string;
  };
  notes: string;
  agentId: string;
  createdAt?: any;
}

interface TenantManagementProps {
  currentUserUid: string;
  userPlan: string;
  onUpgrade: () => void;
}

export default function TenantManagement({ currentUserUid, userPlan, onUpgrade }: TenantManagementProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Assigned' | 'Unassigned'>('All');
  
  // --- VIEW STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingTenant, setEditingTenant] = useState<Tenant | undefined>(undefined);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Tenant | null>(null);
  const [viewingTenant, setViewingTenant] = useState<Tenant | null>(null);

  // --- STRICT PRO CHECK ---
  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes((userPlan || 'free').toLowerCase());

  // --- FETCH TENANTS VIA SECURE NEXT.JS API ---
  const fetchTenants = async () => {
    if (!currentUserUid || !isPro) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const res = await fetch(`/api/tenants?agentId=${currentUserUid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.tenants)) {
        const formatted = data.tenants.map((t: any) => ({
          ...t,
          id: t.id || t._id
        }));
        formatted.sort((a: Tenant, b: Tenant) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setTenants(formatted);
      }
    } catch (error) {
      console.error("Error fetching tenants via API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [currentUserUid, isPro]);

  const handleUnassign = async (tenant: Tenant) => {
    if (!window.confirm("Unassign this tenant? This will also mark the property as available.")) return;
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      // 1. Remove property data from the Tenant
      await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ _id: tenant.id || tenant._id, propertyId: null, unitNumber: '', rentAmount: 0 })
      });

      // 2. Mark the Property as Available
      if (tenant.propertyId) {
        await fetch('/api/properties', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ id: tenant.propertyId, status: 'available', tenantId: null })
        });
      }

      fetchTenants();
      alert("Tenant successfully unassigned.");
    } catch (error) {
      console.error(error);
      alert("Failed to unassign tenant.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently remove this tenant?")) return;
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const res = await fetch(`/api/tenants?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      if (!res.ok) throw new Error("Failed to delete tenant");

      setTenants(prev => prev.filter(t => (t.id !== id && t._id !== id)));
      setActiveMenu(null);
    } catch (error) {
      console.error("Error deleting tenant:", error);
      alert("Failed to delete tenant.");
    }
  };

  const openForm = (tenant?: Tenant) => {
    setEditingTenant(tenant);
    setViewMode('form');
  };

  const closeForm = () => {
    setEditingTenant(undefined);
    setViewMode('list');
    fetchTenants(); // Refresh list after close
  };

  // --- 1. LOCKED UI FOR FREE USERS ---
  if (!isLoading && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          
          <div className="w-24 h-24 bg-blue-50 text-[#0065eb] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={40} />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            Tenant Management is Locked
          </h2>
          
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Upgrade to PRO to unlock the full tenant directory, assign tenants to properties, manage ledgers, and automate rent reminders.
          </p>
          
          <button 
            onClick={onUpgrade}
            className="w-full bg-[#0065eb] text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            UPGRADE TO PRO <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // --- 2. LOADING STATE ---
  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#0065eb]" /></div>;
  }

  // --- 3. FORM VIEW ---
  if (viewMode === 'form') {
    return <TenantForm currentUserUid={currentUserUid} existingTenant={editingTenant} onClose={closeForm} />;
  }

  // --- 4. MAIN DIRECTORY VIEW ---
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.unitNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === 'Assigned') return !!t.propertyId;
    if (activeTab === 'Unassigned') return !t.propertyId;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tenant Directory</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage leases, payments, and client communications.</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-[#0065eb] text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
        >
          <Plus size={18} />
          <span>Add Tenant</span>
        </button>
      </div>

      {/* Search & Tabs */}
      <div className="bg-white p-3 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-3">
        <div className="flex items-center bg-slate-50/50 rounded-2xl border border-slate-100 px-2">
          <div className="px-4 text-slate-400"><Search size={20} /></div>
          <input 
            type="text" 
            placeholder="Search by name, phone, or unit..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none py-3 font-bold text-slate-700"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-1">
          {['All', 'Assigned', 'Unassigned'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tenant List */}
      {filteredTenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => {
            const isStatusActive = (tenant.status || '').toLowerCase() === 'active';
            const tenantKey = tenant.id || tenant._id;
            
            return (
              <div key={tenantKey} onClick={() => setViewingTenant(tenant)} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group cursor-pointer hover:border-[#0065eb]/30">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-[#0065eb] rounded-2xl flex items-center justify-center font-black text-xl">
                      {(tenant.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg truncate w-32">{tenant.name}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                        <Building size={12} /> {tenant.propertyId ? `Assigned to Unit ${tenant.unitNumber || ''}` : 'Not Assigned'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === tenantKey ? null : tenantKey!); }} 
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl hover:text-slate-900 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === tenantKey && (
                      <div className="absolute top-10 right-0 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-20 py-1 animate-in zoom-in-95">
                        {tenant.propertyId ? (
                          <button onClick={(e) => { e.stopPropagation(); handleUnassign(tenant); setActiveMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50 flex items-center gap-2"><Unlink size={16}/> Unassign Property</button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setAssignTarget(tenant); setActiveMenu(null); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#0065eb] hover:bg-blue-50 flex items-center gap-2"><Key size={16}/> Assign to Property</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu(null); openForm(tenant); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit3 size={16}/> Edit Profile</button>
                        <a href={`tel:${tenant.phone}`} onClick={(e) => e.stopPropagation()} className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"><Phone size={16}/> Call</a>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(tenantKey!); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50"><Trash2 size={16}/> Remove</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Status</p>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isStatusActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {tenant.status || 'Active'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Monthly Rent</p>
                    <p className="text-xl font-black text-[#0065eb]">${(tenant.rentAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4"><Users size={32} /></div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Tenants Found</h3>
          <p className="text-slate-500 font-medium">Add your first tenant to start managing leases.</p>
        </div>
      )}

      {assignTarget && (
        <LeaseAssignmentModal
          isOpen={!!assignTarget}
          onClose={() => setAssignTarget(null)}
          currentUserUid={currentUserUid}
          mode="tenant-to-property"
          preselectedData={assignTarget}
          onSuccess={() => {
            fetchTenants();
            alert("Tenant successfully assigned to property!");
          }}
        />
      )}

      <TenantDetailsModal 
        isOpen={!!viewingTenant} 
        onClose={() => setViewingTenant(null)} 
        tenant={viewingTenant} 
        onEdit={(tenant) => { setViewingTenant(null); openForm(tenant); }} 
      />
    </div>
  );
}