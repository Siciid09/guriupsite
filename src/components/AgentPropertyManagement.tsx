'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  collection, query, where, getDocs, doc, addDoc,
  updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './.././../src/app/lib/firebase'; // Adjust to your firebase config path
import { 
  Search, Plus, MapPin, Edit3, Trash2, X, Upload,
  BarChart2, MoreVertical, Archive, RefreshCw,
  Building, CheckCircle, ArrowUpRight, Lock, Image as ImageIcon,
  Save, ArrowLeft
} from 'lucide-react';

// --- TYPES ---
interface Property {
  id?: string; // Optional for new properties
  title: string;
  price: number;
  status: string;
  images: string[];
  location: { city: string; area: string; gpsCoordinates?: string };
  propertyType: string; // House, Apartment, Studio, Office, Land, Hall
  isForSale: boolean;
  isArchived: boolean;
  description: string;
  features: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
  agentId: string;
}

interface AgentPropertyManagementProps {
  currentUserUid: string;
  userPlan: string; // 'free', 'pro', 'premium'
  onUpgrade: () => void;
}

const TABS = ['All', 'Active', 'For Rent', 'For Sale', 'Land', 'Rented', 'Sold', 'Archived'];
const PROPERTY_CATEGORIES = ['House', 'Apartment', 'Villa', 'Studio', 'Office', 'Business', 'Mall', 'Land', 'Hall'];
const FREE_LIMIT = 3;

export default function CompletePropertyManagement({ 
  currentUserUid, 
  userPlan, 
  onUpgrade 
}: AgentPropertyManagementProps) {
  
  // --- CORE STATE ---
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- LIST STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // --- FORM STATE ---
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = ['pro', 'premium', 'agent_pro'].includes(userPlan?.toLowerCase() || 'free');

  // --- 1. FETCH DATA ---
  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'property'), where('agentId', '==', currentUserUid));
      const snap = await getDocs(q);
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
      
      // Client-side sort for 'Newest'
      fetched.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProperties(fetched);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserUid) fetchProperties();
  }, [currentUserUid]);

  // --- 2. LIST ACTIONS ---
  const toggleStatus = async (prop: Property) => {
    const isAvailable = prop.status.toLowerCase() === 'available' || prop.status.toLowerCase() === 'active';
    const newStatus = isAvailable ? 'sold' : 'available';
    try {
      await updateDoc(doc(db, 'property', prop.id!), { status: newStatus, isArchived: false, updatedAt: new Date() });
      setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: newStatus, isArchived: false } : p));
    } catch (error) { console.error(error); }
  };

  const toggleArchive = async (prop: Property) => {
    try {
      await updateDoc(doc(db, 'property', prop.id!), { isArchived: !prop.isArchived });
      setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, isArchived: !prop.isArchived } : p));
      setActiveMenu(null);
    } catch (error) { console.error(error); }
  };

  const deleteProperty = async (propId: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, 'property', propId));
      setProperties(prev => prev.filter(p => p.id !== propId));
      setActiveMenu(null);
    } catch (error) { console.error(error); }
  };

  const openForm = (prop?: Property) => {
    if (prop && !isPro) {
      // Free User 24-hour Cooldown Check
      const lastEdit = prop.updatedAt?.toDate?.() || new Date(prop.updatedAt || prop.createdAt);
      const diffHours = (new Date().getTime() - lastEdit.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        alert(`Editing Locked: You can edit this listing again in ${Math.ceil(24 - diffHours)} hours. Upgrade to Pro for unlimited edits.`);
        return;
      }
    }
    
    setEditingProp(prop || {
      title: '', price: 0, status: 'available', images: [], 
      location: { city: 'Hargeisa', area: '' }, // Default city optimization
      propertyType: 'House', isForSale: false, isArchived: false,
      description: '', features: {}, agentId: currentUserUid
    });
    setFormImages([]);
    setExistingImages(prop?.images || []);
    setViewMode('form');
  };

  // --- 3. FORM ACTIONS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (!isPro && filesArray.length + existingImages.length > 1) {
        alert("Free plan is limited to 1 image. Upgrade for unlimited.");
        return;
      }
      setFormImages(prev => [...prev, ...filesArray]);
    }
  };

  const saveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;
    if (!isPro && editingProp.description.length > 100) {
      alert("Description too long for Free Plan (Max 100 chars).");
      return;
    }
    if (existingImages.length === 0 && formImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload new images to Firebase Storage
      const uploadedUrls = [];
      for (const file of formImages) {
        const storageRef = ref(storage, `property_images/${currentUserUid}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      // 2. Prepare payload
      const payload = {
        ...editingProp,
        images: finalImages,
        updatedAt: serverTimestamp(),
      };

      // 3. Save to Firestore
      // 3. Save to Firestore
      if (editingProp.id) {
        await updateDoc(doc(db, 'property', editingProp.id), payload);
        setProperties(prev => prev.map(p => p.id === editingProp.id ? { ...p, ...payload } as Property : p));
      } else {
        // Create a new object specifically for the new document
        const newDocPayload = {
          ...payload,
          createdAt: serverTimestamp(),
          agentVerified: isPro
        };
        const docRef = await addDoc(collection(db, 'property'), newDocPayload);
        setProperties([{ ...newDocPayload, id: docRef.id } as Property, ...properties]);
      }

      setViewMode('list');
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving property.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. LIST FILTERING ---
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
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });

  const canAdd = isPro || properties.length < FREE_LIMIT;

  // =========================================================================
  // VIEW: LIST
  // =========================================================================
  const renderList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Property Management</h2>
          <p className="text-sm font-medium text-slate-500">Manage your portfolio, track status, and analyze performance.</p>
        </div>
        <button 
          onClick={() => canAdd ? openForm() : onUpgrade()}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-transform hover:scale-105 ${
            canAdd ? 'bg-[#0065eb] text-white shadow-blue-500/20' : 'bg-slate-800 text-white shadow-slate-900/20'
          }`}
        >
          {canAdd ? <Plus size={18} /> : <Lock size={18} />}
          <span>Add Property</span>
        </button>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search listings..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select 
            value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
          >
            <option value="Newest">Sort: Newest First</option>
            <option value="Price High">Price: High to Low</option>
            <option value="Price Low">Price: Low to High</option>
          </select>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar border-t border-slate-50 pt-2 px-2">
          {TABS.map(tab => (
            <button
              key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map(prop => {
            const isSold = prop.status.toLowerCase() === 'sold';
            return (
              <div key={prop.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group relative">
                {/* Image */}
                <div className="h-48 relative bg-slate-200 cursor-pointer" onClick={() => openForm(prop)}>
                  <Image src={prop.images?.[0] || 'https://placehold.co/600x400'} alt={prop.title} fill className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isSold || prop.isArchived ? 'grayscale opacity-80' : ''}`} />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${prop.isArchived ? 'bg-slate-800' : isSold ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      {prop.isArchived ? 'Archived' : isSold ? 'Sold' : 'Active'}
                    </span>
                  </div>
                  {/* Menu */}
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === prop.id ? null : prop.id!); }} className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === prop.id && (
                    <div className="absolute top-12 right-3 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-20 animate-in zoom-in-95">
                      <button onClick={() => toggleArchive(prop)} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Archive size={14} /> {prop.isArchived ? 'Unarchive' : 'Archive'}</button>
                      <button onClick={() => deleteProperty(prop.id!)} className="w-full text-left px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-50 mt-1 pt-2"><Trash2 size={14} /> Delete</button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-[15px] truncate mb-1 cursor-pointer hover:text-blue-600" onClick={() => openForm(prop)}>{prop.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1"><MapPin size={12}/> {prop.location?.area || 'N/A'}, {prop.location?.city}</p>
                  <div className="flex justify-between items-center mb-5">
                    <span className="font-black text-slate-900 text-lg">${(prop.price || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{prop.isForSale ? 'Sale' : 'Rent'}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 gap-2">
                    <button onClick={() => openForm(prop)} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-blue-50/50 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
                      <Edit3 size={14}/> <span className="text-xs font-bold">Edit</span>
                    </button>
                    <button onClick={() => isPro ? alert("Stats Component Logic") : onUpgrade()} className="flex-1 flex justify-center items-center gap-1.5 p-2 bg-purple-50/50 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors">
                      {isPro ? <BarChart2 size={14}/> : <Lock size={12}/>} <span className="text-xs font-bold">Stats</span>
                    </button>
                    <button onClick={() => toggleStatus(prop)} className={`flex-1 flex justify-center items-center gap-1.5 p-2 rounded-xl transition-colors ${isSold ? 'bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50' : 'bg-orange-50/50 text-orange-600 hover:bg-orange-50'}`}>
                      {isSold ? <ArrowUpRight size={14}/> : <CheckCircle size={14}/>} <span className="text-xs font-bold">{isSold ? 'Relist' : 'Sold'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4"><Building size={32} /></div>
          <h3 className="text-lg font-black text-slate-900">No properties found</h3>
          <button onClick={() => canAdd ? openForm() : onUpgrade()} className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors">
            <Plus size={16} /> Add New Listing
          </button>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // VIEW: FORM (ADD / EDIT)
  // =========================================================================
  const renderForm = () => {
    if (!editingProp) return null;
    
    // Dynamic Form logic helpers based on type
    const isResidential = ['House', 'Apartment', 'Villa'].includes(editingProp.propertyType);
    const isCommercial = ['Office', 'Business', 'Mall'].includes(editingProp.propertyType);

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
        
        <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
          <ArrowLeft size={16} /> Back to Management
        </button>

        <form onSubmit={saveProperty} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8">
          <div className="flex justify-between items-center border-b border-slate-50 pb-6">
            <h2 className="text-2xl font-black text-slate-900">{editingProp.id ? 'Edit Property' : 'Add New Property'}</h2>
            <button type="submit" disabled={isSaving} className="bg-[#0065eb] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#0052c1] flex items-center gap-2">
              {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Save Property
            </button>
          </div>

          {/* 1. Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Building size={18} className="text-blue-500"/> Basic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
                <input required type="text" value={editingProp.title} onChange={e => setEditingProp({...editingProp, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Modern Villa in Downtown" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Transaction Type</label>
                <select value={editingProp.isForSale ? 'Sale' : 'Rent'} onChange={e => setEditingProp({...editingProp, isForSale: e.target.value === 'Sale'})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="Rent">For Rent</option>
                  <option value="Sale">For Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price ($)</label>
                <input required type="number" value={editingProp.price || ''} onChange={e => setEditingProp({...editingProp, price: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                <select value={editingProp.propertyType} onChange={e => setEditingProp({...editingProp, propertyType: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  {PROPERTY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Location */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City</label>
                <input required type="text" value={editingProp.location.city} onChange={e => setEditingProp({...editingProp, location: {...editingProp.location, city: e.target.value}})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Area / Neighborhood</label>
                <input required type="text" value={editingProp.location.area} onChange={e => setEditingProp({...editingProp, location: {...editingProp.location, area: e.target.value}})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {/* Pro Feature: GPS */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">GPS Coordinates (Optional)</label>
                <input disabled={!isPro} type="text" value={editingProp.location.gpsCoordinates || ''} onChange={e => setEditingProp({...editingProp, location: {...editingProp.location, gpsCoordinates: e.target.value}})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" placeholder={isPro ? "e.g. 9.5624, 44.0770" : "Upgrade to Pro to map GPS Pins"} />
                {!isPro && <Lock className="absolute right-3 top-10 text-slate-400" size={16} />}
              </div>
            </div>
          </div>

          {/* 3. Media Upload */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><ImageIcon size={18} className="text-purple-500"/> Media</h3>
            
            {/* Grid for existing and new images */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((img, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden group">
                  <Image src={img} alt="Property" fill className="object-cover" />
                  <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                </div>
              ))}
              {formImages.map((file, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden group">
                  <Image src={URL.createObjectURL(file)} alt="New" fill className="object-cover" />
                  <button type="button" onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                </div>
              ))}
              
              <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Upload size={20} className="mb-1" />
                <span className="text-xs font-bold">Upload</span>
              </button>
              <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
            {!isPro && <p className="text-xs text-rose-500 font-bold">Free Plan Limit: 1 Image Max.</p>}
          </div>

          {/* 4. Description & Dynamic Fields */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Description & Details</h3>
            <textarea required value={editingProp.description} onChange={e => setEditingProp({...editingProp, description: e.target.value})} rows={5} maxLength={isPro ? 5000 : 100} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Describe the property..."></textarea>
            <div className="flex justify-end">
              <span className={`text-xs font-bold ${!isPro && editingProp.description.length >= 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                {editingProp.description.length} / {isPro ? 'Unlimited' : '100 (Free Plan)'}
              </span>
            </div>

            {/* Dynamic Numeric Fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Size (m²)</label>
                <input type="number" value={editingProp.features.size || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, size: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
              </div>
              {isResidential && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bedrooms</label>
                    <input type="number" value={editingProp.features.bedrooms || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, bedrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bathrooms</label>
                    <input type="number" value={editingProp.features.bathrooms || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, bathrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                </>
              )}
              {isCommercial && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floors</label>
                  <input type="number" value={editingProp.features.floors || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, floors: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  };

  // --- RENDER CONTROLLER ---
  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-blue-600" /></div>;
  
  return (
    <div className="w-full">
      {viewMode === 'list' ? renderList() : renderForm()}
    </div>
  );
}