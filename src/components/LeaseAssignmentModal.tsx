'use client';

import React, { useState, useEffect } from 'react';
import { X, Home, User, Calendar, DollarSign, Key, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/app/lib/firebase';

interface LeaseAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUid: string;
  mode: 'property-to-tenant' | 'tenant-to-property';
  preselectedData: any; // The Property or Tenant object passed in
  onSuccess: () => void;
}

export default function LeaseAssignmentModal({ isOpen, onClose, currentUserUid, mode, preselectedData, onSuccess }: LeaseAssignmentModalProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [targetId, setTargetId] = useState('');
  const [rentAmount, setRentAmount] = useState(preselectedData?.price || preselectedData?.rentAmount || '');
  const [depositAmount, setDepositAmount] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');

  // Fetch the "other" list when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };
        
        if (mode === 'property-to-tenant') {
          // We have a property, need a list of tenants to choose from
          const res = await fetch(`/api/tenants?agentId=${currentUserUid}`, { headers });
          const data = await res.json();
          setOptions(data.tenants || data.data || (Array.isArray(data) ? data : []));
        } else {
          // We have a tenant, need a list of active properties to choose from
          const res = await fetch(`/api/properties?agentId=${currentUserUid}`, { headers });
          const data = await res.json();
          const props = data.properties || data.data || (Array.isArray(data) ? data : []);
          // Filter to only show available properties
          setOptions(props.filter((p: any) => p.status === 'active' || p.status === 'available'));
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen, mode, currentUserUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId) return alert(`Please select a ${mode === 'property-to-tenant' ? 'Tenant' : 'Property'}`);
    setIsSaving(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      
      const propertyId = mode === 'property-to-tenant' ? preselectedData.id : targetId;
      const tenantId = mode === 'tenant-to-property' ? preselectedData.id : targetId;

      // 1. Update Property Status to Rented & Link Tenant
      await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: propertyId, status: 'rented_out', tenantId })
      });

      // 2. Update Tenant with Lease details & Link Property
      await fetch('/api/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
           _id: tenantId, 
           propertyId,
           rentAmount: Number(rentAmount),
           depositAmount: Number(depositAmount),
           leaseStart,
           leaseEnd,
           status: 'active'
        })
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to assign lease.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        
        {/* Modal Content */}
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-center border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-[#0065eb] rounded-2xl flex items-center justify-center shadow-inner"><Key size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Assign Lease</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  {mode === 'property-to-tenant' ? preselectedData.title : preselectedData.name}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm"><X size={20} /></button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh]">
            
            {/* The Dynamic Dropdown */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">
                {mode === 'property-to-tenant' ? 'Select Tenant to Move In *' : 'Select Property to Assign *'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {mode === 'property-to-tenant' ? <User size={18}/> : <Home size={18}/>}
                </div>
                <select required value={targetId} onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb] appearance-none"
                >
                  <option value="" disabled>{loadingOptions ? 'Loading...' : 'Choose...'}</option>
                  {options.map(opt => (
                    <option key={opt.id || opt._id} value={opt.id || opt._id}>
                       {mode === 'property-to-tenant' ? `${opt.name} (${opt.phone})` : `${opt.title} - $${opt.price}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financials Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Monthly Rent *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={16}/></div>
                  <input required type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Security Deposit *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={16}/></div>
                  <input required type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]" />
                </div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Lease Start *</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={16}/></div>
                  <input required type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Lease End (Optional)</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={16}/></div>
                  <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#0065eb]" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-50">
               <button type="submit" disabled={isSaving || loadingOptions} className="w-full bg-[#0065eb] hover:bg-[#0052c1] disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2">
                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Assignment'}
               </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}