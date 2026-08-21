'use client';

import React from 'react';
import { X, MapPin, Edit3, Building, DollarSign, Eye, Calendar, Tag, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onEdit: (prop: any) => void;
}

export default function PropertyDetailsModal({ isOpen, onClose, property, onEdit }: PropertyDetailsModalProps) {
  if (!isOpen || !property) return null;

  const isSold = property.status?.toLowerCase() === 'sold';
  const isRented = property.status?.toLowerCase() === 'rented_out';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Hero Image Header */}
          <div className="relative h-64 md:h-80 w-full bg-slate-100 shrink-0">
            <Image 
              src={property.images?.[0] || 'https://placehold.co/800x600'} 
              alt={property.title} 
              fill 
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"><X size={20} /></button>
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30">
                  {property.isForSale ? 'For Sale' : 'For Rent'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30 backdrop-blur-md ${isSold || isRented ? 'bg-rose-500/80' : 'bg-emerald-500/80'}`}>
                  {property.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-3xl font-black truncate">{property.title}</h2>
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-200 mt-1"><MapPin size={16}/> {property.location?.area}, {property.location?.city}</p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-6">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Listed Price</p>
                <p className="text-4xl font-black text-[#0065eb]">{property.currency || '$'}{(property.price || 0).toLocaleString()}</p>
              </div>
              <button onClick={() => { onClose(); onEdit(property); }} className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-5 py-3 rounded-2xl font-bold transition-colors">
                <Edit3 size={18}/> Edit
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <Building size={20} className="text-slate-400 mb-2"/>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Type</p>
                <p className="font-bold text-slate-900">{property.propertyType}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <Eye size={20} className="text-blue-400 mb-2"/>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Views</p>
                <p className="font-bold text-slate-900">{property.views || 0}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl md:col-span-2">
                <Calendar size={20} className="text-slate-400 mb-2"/>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Listed On</p>
                <p className="font-bold text-slate-900">{property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {property.description && (
              <div>
                <h3 className="font-black text-slate-900 mb-3 text-lg">Description</h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}