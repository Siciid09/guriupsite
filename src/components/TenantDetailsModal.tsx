'use client';

import React from 'react';
import { X, User, Phone, Edit3, Building, DollarSign, Calendar, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TenantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: any;
  onEdit: (tenant: any) => void;
}

export default function TenantDetailsModal({ isOpen, onClose, tenant, onEdit }: TenantDetailsModalProps) {
  if (!isOpen || !tenant) return null;

  const isActive = tenant.status?.toLowerCase() === 'active';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-start border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#0065eb] text-white rounded-[1.2rem] flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/30 shrink-0">
                {(tenant.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">{tenant.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tenant.status || 'Active'}
                  </span>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12}/> {tenant.phone}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm"><X size={20} /></button>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <button onClick={() => { onClose(); onEdit(tenant); }} className="flex-1 flex justify-center items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm transition-colors border border-slate-100">
                <Edit3 size={16}/> Edit Profile
              </button>
              <a href={`tel:${tenant.phone}`} className="flex-1 flex justify-center items-center gap-2 bg-[#0065eb] hover:bg-[#0052c1] text-white py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">
                <Phone size={16}/> Call Tenant
              </a>
            </div>

            {/* Lease Details */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Lease Overview</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <Building size={16} className="text-blue-500 mb-1"/>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unit</p>
                  <p className="font-black text-sm text-slate-900">{tenant.unitNumber || 'Unassigned'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <DollarSign size={16} className="text-emerald-500 mb-1"/>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</p>
                  <p className="font-black text-sm text-slate-900">${(tenant.rentAmount || 0).toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <Calendar size={16} className="text-slate-400 mb-1"/>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lease Start</p>
                  <p className="font-black text-sm text-slate-900">{tenant.leaseStart || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <Calendar size={16} className="text-slate-400 mb-1"/>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lease End</p>
                  <p className="font-black text-sm text-slate-900">{tenant.leaseEnd || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Guarantor Info */}
            {tenant.guarantor?.name && (
              <div className="bg-orange-50/50 border border-orange-100 p-5 rounded-3xl">
                <div className="flex items-center gap-2 mb-2 text-orange-600">
                  <Shield size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Guarantor</p>
                </div>
                <p className="font-black text-slate-900">{tenant.guarantor.name} <span className="text-xs font-bold text-slate-500 ml-1">({tenant.guarantor.relation})</span></p>
                <p className="text-sm font-bold text-slate-600 mt-1">{tenant.guarantor.phone}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}