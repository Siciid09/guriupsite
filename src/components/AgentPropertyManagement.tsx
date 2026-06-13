'use client';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  collection, query, where, getDocs, doc, addDoc,
  updateDoc, deleteDoc, serverTimestamp, onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './.././../src/app/lib/firebase'; 
import { 
  Search, Plus, MapPin, Edit3, Trash2, X, Upload,
  BarChart2, MoreVertical, Archive, RefreshCw,
  Building, CheckCircle, ArrowUpRight, Lock, Image as ImageIcon,
  Save, ArrowLeft, Eye, Star, TrendingUp, Clock, Phone,
  Users, Video, Tag, Percent
} from 'lucide-react';
import LocationSelectorModal, { LocationResult } from '@/components/LocationSelectorModal';

const mapContainerStyle = { width: '100%', height: '300px' };
const defaultCenter = { lat: 9.560, lng: 44.068 };

// --- TYPES ---
interface Property {
  id?: string;
  title: string;
  price: number;
  views?: number;           
  favoritedBy?: string[];   
  clicks?: number;          
  status: string;
  images: string[];
  videoUrl?: string;
  location: { country?: string; city: string; area: string; address?: string; gpsCoordinates?: string };
  propertyType: string; 
  isForSale: boolean;
  tenantName?: string;
  tenantPhone?: string;
  tenantId?: string;
  isArchived: boolean;
  hasDiscount?: boolean;
  discountPrice?: number;
  description: string;
  features: Record<string, any>;
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
const PROPERTY_CATEGORIES = ['House', 'Apartment', 'Villa', 'Studio', 'Office', 'Business', 'Mall', 'Land', 'Hall'];
const FREE_LIMIT = 3;

export default function CompletePropertyManagement({ 
  currentUserUid, 
  userPlan, 
  onUpgrade 
}: AgentPropertyManagementProps) {
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<any[]>([]); // To populate tenant dropdown
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false); 
  const [statsProp, setStatsProp] = useState<Property | null>(null); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPro = ['pro', 'premium', 'agent_pro'].includes(userPlan?.toLowerCase() || 'free');

  useEffect(() => {
    if (!currentUserUid) return;
    setIsLoading(true);

    // Fetch Properties
    const qProps = query(collection(db, 'property'), where('agentId', '==', currentUserUid));
    // Fetch Analytics
    const qAnalytics = query(collection(db, 'analytics_views'), where('agentId', '==', currentUserUid));
    // Fetch Tenants
    const qTenants = query(collection(db, 'tenants'), where('agentId', '==', currentUserUid));

    let rawProperties: Property[] = [];
    let analyticsMap: Record<string, { views: number, clicks: number }> = {};

    const updateMergedState = () => {
      const merged = rawProperties.map(p => ({
        ...p,
        views: analyticsMap[p.id!]?.views || 0,
        clicks: analyticsMap[p.id!]?.clicks || 0,
      }));
      
      merged.sort((a: Property, b: Property) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setProperties(merged);

      setStatsProp(prevStatsProp => {
        if (!prevStatsProp) return null;
        const updatedProp = merged.find((p: Property) => p.id === prevStatsProp.id);
        return updatedProp || prevStatsProp;
      });
      
      setIsLoading(false);
    };

    const unsubProps = onSnapshot(qProps, (snap: any) => {
      rawProperties = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Property));
      updateMergedState();
    }, (error: any) => {
      console.error("Error fetching properties:", error);
      setIsLoading(false);
    });

    const unsubAnalytics = onSnapshot(qAnalytics, (snap: any) => {
      analyticsMap = {};
      snap.docs.forEach((doc: any) => {
        const data = doc.data();
        const pid = data.listingId;
        if (!pid) return;

        if (!analyticsMap[pid]) analyticsMap[pid] = { views: 0, clicks: 0 };

        if (data.type === 'view_property') {
          analyticsMap[pid].views++;
        } else if (data.type && data.type.startsWith('click_')) {
          analyticsMap[pid].clicks++; 
        }
      });
      updateMergedState();
    });

    const unsubTenants = onSnapshot(qTenants, (snap: any) => {
      setTenants(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProps();
      unsubAnalytics();
      unsubTenants();
    };
  }, [currentUserUid]);

  const toggleStatus = async (prop: Property) => {
    const isAvailable = prop.status.toLowerCase() === 'available' || prop.status.toLowerCase() === 'active';
    const newStatus = isAvailable ? 'sold' : 'available';
    
    if (!window.confirm(`Are you sure you want to mark this property as ${newStatus.toUpperCase()}?`)) return;
    
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
      const lastEdit = prop.updatedAt?.toDate?.() || new Date(prop.updatedAt || prop.createdAt);
      const diffHours = (new Date().getTime() - lastEdit.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        alert(`Editing Locked: You can edit this listing again in ${Math.ceil(24 - diffHours)} hours. Upgrade to Pro for unlimited edits.`);
        return;
      }
    }
    
    setEditingProp(prop || {
      title: '', price: 0, status: 'available', images: [], 
      location: { country: 'Somalia', city: 'Hargeisa', area: '', address: '' }, 
      propertyType: 'House', isForSale: false, isArchived: false,
      hasDiscount: false, discountPrice: 0, videoUrl: '',
      description: '', agentId: currentUserUid,
      features: {
        size: 0, bedrooms: 0, bathrooms: 0, floorLevel: 0, rooms: 0,
        isFurnished: false, hasBalcony: false, hasGarden: false, hasPool: false,
        isSingleFloor: false, hasPorch: false, hasKitchenette: false, hasGate: false,
        waterAvailable: false, hasParking: false, kitchenIncluded: false, openPlan: false,
        hasLaundry: false, hasMeetingRoom: false, hasInternet: false, hasFence: false,
        hasShopfront: false, hasStorage: false, hasRestroom: false, hasAirConditioning: false,
        hasFoodCourt: false, hasSecurity: false, hasElevators: false, hasStage: false,
        roadAccess: 'Paved'
      }
    });
    setFormImages([]);
    setExistingImages(prop?.images || []);
    setViewMode('form');
  };

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
      const uploadedUrls = [];
      for (const file of formImages) {
        const storageRef = ref(storage, `property_images/${currentUserUid}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      const payload = {
        ...editingProp,
        images: finalImages,
        updatedAt: serverTimestamp(),
        planTier: userPlan || 'free', 
        planTierAtUpload: userPlan || 'free',
      };

      if (editingProp.id) {
        await updateDoc(doc(db, 'property', editingProp.id), payload);
        setProperties(prev => prev.map(p => p.id === editingProp.id ? { ...p, ...payload } as Property : p));
      } else {
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

  const toggleFeature = (key: string) => {
    if (!editingProp || !isPro) return;
    setEditingProp({
      ...editingProp,
      features: { ...editingProp.features, [key]: !editingProp.features[key] }
    });
  };

  const FeatureChip = ({ label, featureKey }: { label: string, featureKey: string }) => {
    const isSelected = editingProp?.features?.[featureKey] || false;
    return (
      <button
        type="button"
        onClick={() => toggleFeature(featureKey)}
        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
          isSelected ? 'bg-blue-50 border-blue-200 text-[#0065eb]' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
        }`}
      >
        {label}
      </button>
    );
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
    return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
  });

  const canAdd = isPro || properties.length < FREE_LIMIT;

  const renderList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
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

      {filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map(prop => {
            const isSold = prop.status.toLowerCase() === 'sold';
            return (
              <div key={prop.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group relative">
                <div className="h-48 relative bg-slate-200 cursor-pointer" onClick={() => openForm(prop)}>
                  <Image src={prop.images?.[0] || 'https://placehold.co/600x400'} alt={prop.title} fill className={`object-cover transition-transform duration-500 group-hover:scale-110 ${isSold || prop.isArchived ? 'grayscale opacity-80' : ''}`} />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${prop.isArchived ? 'bg-slate-800' : isSold ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      {prop.isArchived ? 'Archived' : isSold ? 'Sold' : 'Active'}
                    </span>
                  </div>
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

                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-[15px] truncate mb-1 cursor-pointer hover:text-blue-600" onClick={() => openForm(prop)}>{prop.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-4 flex items-center gap-1"><MapPin size={12}/> {prop.location?.area || 'N/A'}, {prop.location?.city}</p>
                  <div className="flex justify-between items-center mb-5">
                    <span className="font-black text-slate-900 text-lg">${(prop.price || 0).toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase">{prop.isForSale ? 'Sale' : 'Rent'}</span>
                  </div>

                  {!prop.isForSale && prop.tenantName && (
                    <div className="mb-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Assigned Tenant</p>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{prop.tenantName}</p>
                      </div>
                      {prop.tenantPhone && (
                        <a href={`tel:${prop.tenantPhone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm hover:scale-105 transition-transform">
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap pt-4 border-t border-slate-50 gap-2">
                    <button onClick={() => openForm(prop)} className="flex-1 min-w-[80px] flex justify-center items-center gap-1.5 p-2 bg-blue-50/50 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors">
                      <Edit3 size={14}/> <span className="text-xs font-bold">Edit</span>
                    </button>
                    <button onClick={() => isPro ? setStatsProp(prop) : onUpgrade()} className="flex-1 min-w-[80px] flex justify-center items-center gap-1.5 p-2 bg-purple-50/50 text-purple-600 rounded-xl hover:bg-purple-50 active:scale-95 transition-all">
                      {isPro ? <BarChart2 size={14}/> : <Lock size={12}/>} <span className="text-xs font-bold">Stats</span>
                    </button>
                    <button onClick={() => toggleStatus(prop)} className={`flex-1 min-w-[80px] flex justify-center items-center gap-1.5 p-2 rounded-xl transition-colors ${isSold ? 'bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50' : 'bg-orange-50/50 text-orange-600 hover:bg-orange-50'}`}>
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

      {statsProp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-900 truncate pr-4">{statsProp.title}</h3>
              <button onClick={() => setStatsProp(null)} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center text-center">
                  <div className="text-blue-500 mb-2 bg-white p-2 rounded-xl shadow-sm"><Eye size={20}/></div>
                  <h4 className="text-2xl font-black text-slate-900">{statsProp.views || 0}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Views</p>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center text-center">
                  <div className="text-rose-500 mb-2 bg-white p-2 rounded-xl shadow-sm"><Star size={20}/></div>
                  <h4 className="text-2xl font-black text-slate-900">{statsProp.favoritedBy?.length || 0}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Favorites</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center text-center">
                  <div className="text-emerald-500 mb-2 bg-white p-2 rounded-xl shadow-sm"><TrendingUp size={20}/></div>
                  <h4 className="text-2xl font-black text-slate-900">{statsProp.clicks || 0}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Inquiries</p>
                </div>
                <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl flex flex-col items-center text-center">
                  <div className="text-purple-500 mb-2 bg-white p-2 rounded-xl shadow-sm"><Clock size={20}/></div>
                  <h4 className="text-2xl font-black text-slate-900">
                      {statsProp.createdAt ? Math.max(1, Math.floor((new Date().getTime() - (statsProp.createdAt?.toMillis?.() || new Date().getTime())) / (1000 * 3600 * 24))) : 1}
                  </h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Days Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderForm = () => {
    if (!editingProp) return null;
    
    const isResidential = ['House', 'Apartment', 'Villa', 'Bungalow'].includes(editingProp.propertyType);
    const isStudio = editingProp.propertyType === 'Studio';
    const isCommercial = ['Office', 'Business', 'Mall', 'Building'].includes(editingProp.propertyType);
    const isLand = editingProp.propertyType === 'Land';
    const isHall = editingProp.propertyType === 'Hall';

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
        
        <button onClick={() => setViewMode('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-4">
          <ArrowLeft size={16} /> Back to Management
        </button>

        <form onSubmit={saveProperty} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-8">
          <div className="flex justify-between items-center border-b border-slate-50 pb-6">
            <h2 className="text-2xl font-black text-slate-900">{editingProp.id ? 'Edit Property' : 'Add New Property'}</h2>
            <div className="flex items-center gap-3">
              {editingProp.id && (
                <button 
                  type="button" 
                  onClick={() => setEditingProp({...editingProp, isArchived: !editingProp.isArchived})} 
                  className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${editingProp.isArchived ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <Archive size={16} /> {editingProp.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              )}
              <button type="submit" disabled={isSaving} className="bg-[#0065eb] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#0052c1] flex items-center gap-2">
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} Save Property
              </button>
            </div>
          </div>

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

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin size={18} className="text-emerald-500"/> Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City & District *</label>
                <button 
                  type="button" 
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-xl p-3 text-sm font-bold text-left flex items-center justify-between transition-colors"
                >
                  <span className={editingProp.location.city ? 'text-slate-900' : 'text-slate-400'}>
                    {editingProp.location.city && editingProp.location.area 
                      ? `${editingProp.location.area}, ${editingProp.location.city}` 
                      : 'Select Location...'}
                  </span>
                  <MapPin size={16} className="text-[#0065eb]" />
                </button>
                
                <LocationSelectorModal 
                  isOpen={isLocationModalOpen}
                  onClose={() => setIsLocationModalOpen(false)}
                  onSelect={(res) => setEditingProp({
                    ...editingProp, 
                    location: {
                      ...editingProp.location, 
                      country: res.country || 'Somalia',
                      city: res.city || '', 
                      area: res.district || ''
                    }
                  })}
                  lang="en"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Street Address / Landmark (Optional)</label>
                <input 
                  type="text" 
                  value={editingProp.location.address || ''} 
                  onChange={e => setEditingProp({...editingProp, location: {...editingProp.location, address: e.target.value}})} 
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300" 
                  placeholder="e.g. Near Mansoor Hotel" 
                />
              </div>
              
              <div className="md:col-span-2 relative mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Exact Location (Tap Map to Drop Pin)</label>
                
                {!isPro ? (
                  <div className="w-full h-[300px] bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                    <Lock size={32} className="mb-2 text-slate-300" />
                    <span className="font-bold">Upgrade to Pro to map GPS Pins</span>
                  </div>
                ) : !isLoaded ? (
                  <div className="w-full h-[300px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold animate-pulse border-2 border-slate-200">
                    Loading Interactive Map...
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm relative z-0">
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={
                        editingProp.location?.gpsCoordinates 
                          ? { 
                              lat: parseFloat(editingProp.location.gpsCoordinates.split(',')[0]), 
                              lng: parseFloat(editingProp.location.gpsCoordinates.split(',')[1]) 
                            }
                          : defaultCenter
                      }
                      zoom={13}
                      onClick={(e) => {
                        if (e.latLng) {
                          const lat = e.latLng.lat();
                          const lng = e.latLng.lng();
                          setEditingProp({
                            ...editingProp, 
                            location: {
                              ...editingProp.location, 
                              gpsCoordinates: `${lat}, ${lng}`
                            }
                          });
                        }
                      }}
                    >
                      {editingProp.location?.gpsCoordinates && (
                        <Marker 
                          position={{
                            lat: parseFloat(editingProp.location.gpsCoordinates.split(',')[0]),
                            lng: parseFloat(editingProp.location.gpsCoordinates.split(',')[1])
                          }} 
                        />
                      )}
                    </GoogleMap>
                  </div>
                )}
                
                {editingProp.location?.gpsCoordinates && isPro && (
                  <p className="text-xs text-blue-600 font-bold mt-3 flex items-center gap-1 bg-blue-50 w-fit px-3 py-1.5 rounded-lg border border-blue-100">
                    <MapPin size={14} /> 
                    Pin Dropped: {editingProp.location.gpsCoordinates}
                  </p>
                )}
              </div>
            </div>
          </div>

          {!editingProp.isForSale && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Tenant Assignment</h3>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Assign to Existing Tenant</label>
                {isPro ? (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={editingProp.tenantId || ''} 
                        onChange={e => {
                          const tId = e.target.value;
                          const selectedTenant = tenants.find(t => t.id === tId);
                          setEditingProp({
                            ...editingProp, 
                            tenantId: tId || undefined, 
                            tenantName: selectedTenant?.name, 
                            tenantPhone: selectedTenant?.phone
                          });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#0065eb] appearance-none"
                      >
                        <option value="">-- No Tenant Assigned --</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => alert("Please navigate to the 'Tenants' tab on your dashboard to create a new tenant profile.")} className="px-6 py-3.5 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors whitespace-nowrap">
                      + Add New Tenant
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Lock size={18}/>
                      <span className="font-bold text-sm">Upgrade to Pro to manage tenants</span>
                    </div>
                    <button type="button" onClick={onUpgrade} className="px-4 py-2 bg-[#0065eb] text-white rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform">Upgrade</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><ImageIcon size={18} className="text-purple-500"/> Media</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {existingImages.map((img, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden group border border-slate-200">
                  <Image src={img} alt="Property" fill className="object-cover" />
                  <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"><X size={14}/></button>
                </div>
              ))}
              {formImages.map((file, i) => (
                <div key={i} className="relative h-24 rounded-xl overflow-hidden group border border-slate-200">
                  <Image src={URL.createObjectURL(file)} alt="New" fill className="object-cover" />
                  <button type="button" onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"><X size={14}/></button>
                </div>
              ))}
              
              <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-[#0065eb] hover:border-[#0065eb] hover:bg-blue-50 transition-colors">
                <Upload size={20} className="mb-2" />
                <span className="text-xs font-bold">Upload Photos</span>
              </button>
              <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
            {!isPro && <p className="text-xs text-rose-500 font-bold">Free Plan Limit: 1 Image Max.</p>}

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Video Tour URL</label>
              {isPro ? (
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={editingProp.videoUrl || ''} onChange={e => setEditingProp({...editingProp, videoUrl: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500" placeholder="YouTube, TikTok, or MP4 link" />
                </div>
              ) : (
                <div className="relative opacity-60">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" disabled className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none cursor-not-allowed" placeholder="Upgrade to PRO to embed video tours" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900">Description & Details</h3>
            <textarea required value={editingProp.description} onChange={e => setEditingProp({...editingProp, description: e.target.value})} rows={5} maxLength={isPro ? 5000 : 100} className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed" placeholder="Describe the property..."></textarea>
            <div className="flex justify-end">
              <span className={`text-xs font-bold ${!isPro && editingProp.description.length >= 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                {editingProp.description.length} / {isPro ? 'Unlimited' : '100 (Free Plan)'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Size (m²)</label>
                <input type="number" value={editingProp.features.size || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, size: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
              </div>
              
              {isResidential || isStudio ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bedrooms</label>
                    <input type="number" value={editingProp.features.bedrooms || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, bedrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bathrooms</label>
                    <input type="number" value={editingProp.features.bathrooms || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, bathrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rooms/Units</label>
                    <input type="number" value={editingProp.features.rooms || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, rooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floor Level</label>
                    <input type="number" value={editingProp.features.floorLevel || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, floorLevel: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="Ground = 0" />
                  </div>
                </>
              ) : null}

              {isCommercial && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Floors</label>
                    <input type="number" value={editingProp.features.floors || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, floors: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Shop Count</label>
                    <input type="number" value={editingProp.features.shopCount || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, shopCount: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Workspace (m²)</label>
                    <input type="number" value={editingProp.features.workspaceArea || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, workspaceArea: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floor Level</label>
                    <input type="number" value={editingProp.features.floorLevel || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, floorLevel: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="Ground = 0" />
                  </div>
                </>
              )}

              {isHall && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seating Capacity</label>
                  <input type="number" value={editingProp.features.seatingCapacity || ''} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, seatingCapacity: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-3 text-sm font-bold outline-none" placeholder="0" />
                </div>
              )}

              {(isCommercial || isLand) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Road Access</label>
                  <select value={editingProp.features.roadAccess || 'Paved'} onChange={e => setEditingProp({...editingProp, features: {...editingProp.features, roadAccess: e.target.value}})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none cursor-pointer">
                    <option value="Paved">Paved</option>
                    <option value="Gravel">Gravel</option>
                    <option value="Dirt">Dirt</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Tag size={18} className="text-teal-500"/> Features & Amenities</h3>
              {!isPro && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-black uppercase flex items-center gap-1"><Lock size={10}/> Pro Feature</span>}
            </div>
            
            <div className={`flex flex-wrap gap-2 p-6 rounded-2xl border ${isPro ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none'}`}>
              {isResidential && (
                <>
                  <FeatureChip label="Furnished" featureKey="isFurnished" />
                  <FeatureChip label="Balcony" featureKey="hasBalcony" />
                  <FeatureChip label="Garden" featureKey="hasGarden" />
                  <FeatureChip label="Pool" featureKey="hasPool" />
                  <FeatureChip label="Single Floor" featureKey="isSingleFloor" />
                  <FeatureChip label="Porch" featureKey="hasPorch" />
                  <FeatureChip label="Kitchenette" featureKey="hasKitchenette" />
                  <FeatureChip label="Gate" featureKey="hasGate" />
                  <FeatureChip label="Water Available" featureKey="waterAvailable" />
                  <FeatureChip label="Parking" featureKey="hasParking" />
                </>
              )}
              {isStudio && (
                <>
                  <FeatureChip label="Furnished" featureKey="isFurnished" />
                  <FeatureChip label="Kitchen Included" featureKey="kitchenIncluded" />
                  <FeatureChip label="Open Plan" featureKey="openPlan" />
                  <FeatureChip label="Balcony" featureKey="hasBalcony" />
                  <FeatureChip label="AC" featureKey="hasAirConditioning" />
                  <FeatureChip label="WiFi" featureKey="hasInternet" />
                  <FeatureChip label="Water Available" featureKey="waterAvailable" />
                  <FeatureChip label="Security Gate" featureKey="hasGate" />
                  <FeatureChip label="Elevator" featureKey="hasElevators" />
                  <FeatureChip label="Laundry" featureKey="hasLaundry" />
                  <FeatureChip label="Parking" featureKey="hasParking" />
                </>
              )}
              {isCommercial && (
                <>
                  <FeatureChip label="Meeting Room" featureKey="hasMeetingRoom" />
                  <FeatureChip label="Internet" featureKey="hasInternet" />
                  <FeatureChip label="Parking" featureKey="hasParking" />
                  <FeatureChip label="Fence" featureKey="hasFence" />
                  <FeatureChip label="Shopfront" featureKey="hasShopfront" />
                  <FeatureChip label="Storage" featureKey="hasStorage" />
                  <FeatureChip label="Restroom" featureKey="hasRestroom" />
                  <FeatureChip label="AC" featureKey="hasAirConditioning" />
                  <FeatureChip label="Food Court" featureKey="hasFoodCourt" />
                  <FeatureChip label="Security" featureKey="hasSecurity" />
                  <FeatureChip label="Elevators" featureKey="hasElevators" />
                </>
              )}
              {isLand && (
                <>
                  <FeatureChip label="Fence" featureKey="hasFence" />
                  <FeatureChip label="Water Available" featureKey="waterAvailable" />
                </>
              )}
              {isHall && (
                <>
                  <FeatureChip label="Stage" featureKey="hasStage" />
                  <FeatureChip label="AC" featureKey="hasAirConditioning" />
                  <FeatureChip label="Parking" featureKey="hasParking" />
                  <FeatureChip label="Restroom" featureKey="hasRestroom" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Percent size={18} className="text-rose-500"/> Pricing & Promotion</h3>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900">Enable Discount Pricing</p>
                  <p className="text-xs text-slate-500 font-medium">Show a crossed-out original price to attract buyers.</p>
                </div>
                {isPro ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={editingProp.hasDiscount || false} onChange={e => setEditingProp({...editingProp, hasDiscount: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                ) : (
                  <Lock size={16} className="text-slate-400" />
                )}
              </div>
              
              {editingProp.hasDiscount && isPro && (
                <div className="pt-4 border-t border-slate-200 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Discounted Amount ($)</label>
                  <input type="number" value={editingProp.discountPrice || ''} onChange={e => setEditingProp({...editingProp, discountPrice: Number(e.target.value)})} className="w-full md:w-1/2 bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500" placeholder="e.g. 450" />
                </div>
              )}
            </div>
          </div>

        </form>
      </div>
    );
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center"><RefreshCw className="w-10 h-10 animate-spin text-blue-600" /></div>;
  
  return (
    <div className="w-full">
      {viewMode === 'list' ? renderList() : renderForm()}
    </div>
  );
}