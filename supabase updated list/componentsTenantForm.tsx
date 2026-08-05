'use client';

import React, { useState } from 'react';
import { auth } from '../app/lib/firebase'; // Client auth for token generation
import { 
  ArrowLeft, User, CreditCard, Shield, Save, Loader2 
} from 'lucide-react';
import { Tenant } from './TenantManagement';

interface TenantFormProps {
  currentUserUid: string;
  existingTenant?: Tenant;
  onClose: () => void;
}

export default function TenantForm({ currentUserUid, existingTenant, onClose }: TenantFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: existingTenant?.name || '',
    phone: existingTenant?.phone || '',
    email: existingTenant?.email || '',
    gender: existingTenant?.gender || 'Male',
    idType: existingTenant?.idType || 'National ID',
    idNumber: existingTenant?.idNumber || '',
    status: existingTenant?.status || 'active',
    notes: existingTenant?.notes || '',
    guarantor: {
      name: existingTenant?.guarantor?.name || '',
      phone: existingTenant?.guarantor?.phone || '',
      relation: existingTenant?.guarantor?.relation || '',
      idNumber: existingTenant?.guarantor?.idNumber || '',
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const payload = {
        id: existingTenant?.id || existingTenant?._id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        idType: formData.idType,
        idNumber: formData.idNumber,
        unitNumber: existingTenant?.unitNumber || '',
        rentAmount: existingTenant?.rentAmount || 0,
        depositAmount: existingTenant?.depositAmount || 0,
        leaseStart: existingTenant?.leaseStart || null,
        leaseEnd: existingTenant?.leaseEnd || null,
        status: formData.status,
        guarantor: formData.guarantor,
        notes: formData.notes,
        agentId: currentUserUid,
      };

      const endpoint = '/api/tenants';
      const method = existingTenant?.id || existingTenant?._id ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save tenant.");
      }

      onClose();
    } catch (error: any) {
      console.error("Error saving tenant:", error);
      alert(error.message || "An error occurred while saving the tenant.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-300 pb-20">
      <button 
        onClick={onClose} 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Directory
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-6 md:p-10 space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {existingTenant ? 'Edit Tenant Profile' : 'Onboard New Tenant'}
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Create a profile for client management.</p>
          </div>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full md:w-auto bg-[#0065eb] disabled:opacity-50 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            {existingTenant ? 'Save Changes' : 'Onboard Tenant'}
          </button>
        </div>

        {/* 1. Personal Information */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
            <User size={20} className="text-[#0065eb]"/> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number *</label>
              <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1234567890" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address (Optional)</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" />
            </div>
          </div>
        </div>

        {/* 2. Identification */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
            <CreditCard size={20} className="text-emerald-500"/> Identification <span className="text-slate-400 text-sm font-bold ml-1">(Optional)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Document Type</label>
              <select value={formData.idType} onChange={e => setFormData({...formData, idType: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="Driver's License">Driver's License</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ID Number</label>
              <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Doc/ID number" />
            </div>
          </div>
        </div>

        {/* 3. Guarantor Details */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
            <Shield size={20} className="text-orange-500"/> Guarantor Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Guarantor Name *</label>
              <input required type="text" value={formData.guarantor.name} onChange={e => setFormData({...formData, guarantor: {...formData.guarantor, name: e.target.value}})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Emergency Contact Name" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone *</label>
              <input required type="tel" value={formData.guarantor.phone} onChange={e => setFormData({...formData, guarantor: {...formData.guarantor, phone: e.target.value}})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contact Phone" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Relation *</label>
              <input required type="text" value={formData.guarantor.relation} onChange={e => setFormData({...formData, guarantor: {...formData.guarantor, relation: e.target.value}})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Brother, Parent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Guarantor ID Number (Optional)</label>
              <input type="text" value={formData.guarantor.idNumber} onChange={e => setFormData({...formData, guarantor: {...formData.guarantor, idNumber: e.target.value}})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Guarantor ID" />
            </div>
          </div>
        </div>

        {/* 4. Additional Information */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-900 text-lg">Additional Notes (Optional)</h3>
          <textarea 
            value={formData.notes} 
            onChange={e => setFormData({...formData, notes: e.target.value})} 
            rows={3} 
            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
            placeholder="Any internal notes or comments..."
          ></textarea>
        </div>

      </form>
    </div>
  );
}