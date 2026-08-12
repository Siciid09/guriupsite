'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Utensils, Info, DollarSign, Clock, ShoppingBag, Leaf,
  Settings, ChefHat, Image as ImageIcon, Eye, Save, X, Plus,
  FileText, ChevronDown, CheckSquare, Square, Upload, Sparkles,
  AlertCircle, CheckCircle2, Star, Flame, Wheat, Trash2
} from 'lucide-react';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface ChoiceGroup {
  id: string;
  groupName: string;
  options: string[];
}

export interface MenuItemFormData {
  id?: string;
  _id?: string;
  restaurantId: string;
  hotelId: string;

  // 1. Menu Assignment
  menuSection: string;
  category: string;

  // 2. Item Info
  name: string;
  description: string;
  price: number | '';
  comparePrice: number | '';
  currency: string;

  // 3. Preparation
  prepTimeMinutes: number | '';
  isAvailable: boolean;
  availabilitySchedule: string;

  // 4. Ordering Options
  availableFor: string[];
  roomServiceSamePrice: boolean;
  roomServicePrice: number | '';
  minimumOrder: number | '';

  // 5. Food Info
  dietaryInfo: string[];
  allergens: string[];
  spiceLevel: string;
  portion: string;

  // 6. Customization
  allowCustomization: boolean;
  addons: Addon[];
  requiredChoices: ChoiceGroup[];

  // 7. Kitchen Info
  kitchenCategory: string;
  prepNotes: string;

  // 8. Photo
  imageUrl: string;
  additionalPhotos: string[];

  // 9. Visibility
  status: 'Available' | 'Temporarily unavailable' | 'Hidden';
  isFeatured: boolean;
}

const MENU_SECTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts', 'Kids Menu', 'Room Service', 'Specials', 'Main Menu'];
const CATEGORIES = ['Starters', 'Main Course', 'Seafood', 'Meat', 'Chicken', 'Pasta', 'Rice', 'Pizza', 'Burgers', 'Salad', 'Dessert', 'Drinks', 'Coffee', 'Other'];
const SCHEDULES = ['All day', 'Breakfast', 'Lunch', 'Dinner', 'Custom hours'];
const ORDERING_OPTIONS = ['Dine-in', 'Room Service', 'Takeaway', 'Public Orders'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Dairy-free', 'Nut-free'];
const ALLERGENS = ['Milk', 'Eggs', 'Fish', 'Shellfish', 'Peanuts', 'Tree nuts', 'Wheat / Gluten', 'Soy', 'Other'];
const SPICE_LEVELS = ['Not spicy', 'Mild', 'Medium', 'Hot', 'Very hot'];
const PORTIONS = ['Small', 'Regular', 'Large', 'Family'];
const KITCHEN_CATEGORIES = ['Main Kitchen', 'Bar', 'Bakery', 'Grill', 'Dessert Station'];

const INITIAL_DATA: MenuItemFormData = {
  restaurantId: '',
  hotelId: '',
  menuSection: 'Main Menu',
  category: 'Main Course',
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  currency: 'USD',
  prepTimeMinutes: 20,
  isAvailable: true,
  availabilitySchedule: 'All day',
  availableFor: ['Dine-in', 'Room Service', 'Takeaway', 'Public Orders'],
  roomServiceSamePrice: true,
  roomServicePrice: '',
  minimumOrder: '',
  dietaryInfo: [],
  allergens: [],
  spiceLevel: 'Not spicy',
  portion: 'Regular',
  allowCustomization: false,
  addons: [],
  requiredChoices: [],
  kitchenCategory: 'Main Kitchen',
  prepNotes: '',
  imageUrl: '',
  additionalPhotos: [],
  status: 'Available',
  isFeatured: false
};

interface MenuFormProps {
  hotelId: string;
  itemId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MenuForm({ hotelId, itemId, onSuccess, onCancel }: MenuFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>({ ...INITIAL_DATA, hotelId });
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const mainPhotoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [mainUploading, setMainUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Fetch Restaurants & Existing Item
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const headers = { 'Authorization': `Bearer ${idToken}` };

        // Fetch Restaurants
        const resRests = await fetch(`/api/restaurants?hotelId=${hotelId}`, { headers });
        if (resRests.ok) {
          const rests = await resRests.json();
          setRestaurants(rests);
          if (rests.length > 0 && !formData.restaurantId) {
            setFormData(prev => ({ ...prev, restaurantId: rests[0].id || rests[0]._id }));
          }
        }

        // Fetch Item if editing
        if (itemId) {
          const resItem = await fetch(`/api/restaurants?entity=menu_item&hotelId=${hotelId}`, { headers });
          if (resItem.ok) {
            const items = await resItem.json();
            const existing = items.find((i: any) => i.id === itemId || i._id === itemId);
            if (existing) {
              setFormData(prev => ({ ...prev, ...existing, hotelId }));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [hotelId, itemId]);

  // Array toggler
  const toggleArrayItem = (key: keyof MenuItemFormData, item: string) => {
    const current = (formData[key] as string[]) || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    setFormData({ ...formData, [key]: updated });
  };

  // Image Uploaders
  const handleFileUpload = async (file: File, path: string): Promise<string | null> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (e) {
      alert("Failed to upload image.");
      return null;
    }
  };

  const handleMainPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setMainUploading(true);
    const url = await handleFileUpload(e.target.files[0], 'menus/main');
    if (url) setFormData(prev => ({ ...prev, imageUrl: url }));
    setMainUploading(false);
  };

  const handleGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setGalleryUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const url = await handleFileUpload(e.target.files[i], 'menus/gallery');
      if (url) urls.push(url);
    }
    setFormData(prev => ({ ...prev, additionalPhotos: [...prev.additionalPhotos, ...urls] }));
    setGalleryUploading(false);
  };

  // Dynamic Add-ons & Choices
  const addAddon = () => setFormData(p => ({
    ...p, addons: [...p.addons, { id: Date.now().toString(), name: '', price: 0 }]
  }));
  const updateAddon = (id: string, field: string, val: any) => setFormData(p => ({
    ...p, addons: p.addons.map(a => a.id === id ? { ...a, [field]: val } : a)
  }));
  const removeAddon = (id: string) => setFormData(p => ({
    ...p, addons: p.addons.filter(a => a.id !== id)
  }));

  const addChoiceGroup = () => setFormData(p => ({
    ...p, requiredChoices: [...p.requiredChoices, { id: Date.now().toString(), groupName: '', options: [''] }]
  }));
  const updateChoiceGroup = (id: string, groupName: string) => setFormData(p => ({
    ...p, requiredChoices: p.requiredChoices.map(c => c.id === id ? { ...c, groupName } : c)
  }));
  const updateChoiceOption = (groupId: string, optIdx: number, val: string) => setFormData(p => ({
    ...p, requiredChoices: p.requiredChoices.map(c => {
      if (c.id !== groupId) return c;
      const newOpts = [...c.options];
      newOpts[optIdx] = val;
      return { ...c, options: newOpts };
    })
  }));
  const addChoiceOption = (groupId: string) => setFormData(p => ({
    ...p, requiredChoices: p.requiredChoices.map(c => c.id === groupId ? { ...c, options: [...c.options, ''] } : c)
  }));
  const removeChoiceGroup = (id: string) => setFormData(p => ({
    ...p, requiredChoices: p.requiredChoices.filter(c => c.id !== id)
  }));

  // Save Data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.restaurantId || formData.price === '') {
      return alert("Please fill in the required fields (Name, Price, Restaurant).");
    }
    setIsSaving(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const method = (formData.id || formData._id) ? 'PATCH' : 'POST';
      const payload = { ...formData, entity: 'menu_item' };

      const res = await fetch('/api/restaurants', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save menu item.");
      if (onSuccess) onSuccess();
      else alert("Menu item saved successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="py-20 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#0065eb] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold">Loading configuration...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 py-4 px-6 mb-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Utensils size={20} /></span>
            <h1 className="text-2xl font-black text-slate-900">{(formData.id || formData._id) ? 'Edit Menu Item' : 'Add Menu Item'}</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Customers will see this information when ordering.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold mr-2">
            <button type="button" onClick={() => setActiveTab('form')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'form' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'}`}>Form</button>
            <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'}`}><Eye size={14} /> Preview</button>
          </div>
          <button type="button" disabled={isSaving} onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-[#0065eb] hover:bg-[#0052c1] text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />} Save Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM AREA */}
        <div className={`lg:col-span-8 space-y-8 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <form id="menu-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. MENU ASSIGNMENT */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">1</span>
                <div><h2 className="text-lg font-black text-slate-900">Menu Assignment</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Restaurant <span className="text-red-500">*</span></label>
                  <select required value={formData.restaurantId} onChange={e => setFormData({...formData, restaurantId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    <option value="" disabled>Select Restaurant</option>
                    {restaurants.map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Menu Section <span className="text-red-500">*</span></label>
                  <select required value={formData.menuSection} onChange={e => setFormData({...formData, menuSection: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    {MENU_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Category <span className="text-red-500">*</span></label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* 2. ITEM INFORMATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">2</span>
                <div><h2 className="text-lg font-black text-slate-900">Item Information</h2></div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Item Name <span className="text-red-500">*</span></label>
                  <input required type="text" placeholder="Example: Chicken Alfredo Pasta" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Description <span className="text-red-500">*</span></label>
                  <textarea required rows={2} placeholder="Example: Creamy pasta with grilled chicken, parmesan, and herbs." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                      <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || ''})} className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Compare-at Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                      <input type="number" step="0.01" value={formData.comparePrice} onChange={e => setFormData({...formData, comparePrice: parseFloat(e.target.value) || ''})} className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Currency</label>
                    <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                      <option value="USD">USD</option>
                      <option value="SOS">SOS</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. PREPARATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">3</span>
                <div><h2 className="text-lg font-black text-slate-900">Preparation</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Preparation Time (minutes)</label>
                  <input type="number" value={formData.prepTimeMinutes} onChange={e => setFormData({...formData, prepTimeMinutes: parseInt(e.target.value) || ''})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Availability Schedule</label>
                  <select value={formData.availabilitySchedule} onChange={e => setFormData({...formData, availabilitySchedule: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    {SCHEDULES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 italic">Useful when an item is only available during certain services.</p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">Item currently available</span>
                      <span className="text-[10px] text-slate-500">Toggle off if temporarily out of stock.</span>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})} className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${formData.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${formData.isAvailable ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. ORDERING OPTIONS */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">4</span>
                <div><h2 className="text-lg font-black text-slate-900">Ordering Options</h2></div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-3">Available For</label>
                  <div className="flex flex-wrap gap-3">
                    {ORDERING_OPTIONS.map(opt => {
                      const checked = formData.availableFor.includes(opt);
                      return (
                        <button key={opt} type="button" onClick={() => toggleArrayItem('availableFor', opt)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          {checked ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-400" />} {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black uppercase text-slate-500">Same price for Room Service</label>
                      <button type="button" onClick={() => setFormData({...formData, roomServiceSamePrice: !formData.roomServiceSamePrice})} className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${formData.roomServiceSamePrice ? 'bg-blue-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.roomServiceSamePrice ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    {!formData.roomServiceSamePrice && (
                      <input type="number" step="0.01" placeholder="Custom Room Service Price" value={formData.roomServicePrice} onChange={e => setFormData({...formData, roomServicePrice: parseFloat(e.target.value) || ''})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none mt-2" />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Minimum Order (Optional)</label>
                    <input type="number" step="0.01" placeholder="e.g. 2" value={formData.minimumOrder} onChange={e => setFormData({...formData, minimumOrder: parseFloat(e.target.value) || ''})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* 5. FOOD INFORMATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">5</span>
                <div><h2 className="text-lg font-black text-slate-900">Food Information</h2></div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-3">Dietary Information</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map(opt => (
                      <button key={opt} type="button" onClick={() => toggleArrayItem('dietaryInfo', opt)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.dietaryInfo.includes(opt) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-3">Allergens</label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map(opt => (
                      <button key={opt} type="button" onClick={() => toggleArrayItem('allergens', opt)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.allergens.includes(opt) ? 'bg-red-50 border-red-400 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Spice Level</label>
                    <select value={formData.spiceLevel} onChange={e => setFormData({...formData, spiceLevel: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                      {SPICE_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 mb-2">Portion Size</label>
                    <select value={formData.portion} onChange={e => setFormData({...formData, portion: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                      {PORTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. CUSTOMIZATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">6</span>
                  <div><h2 className="text-lg font-black text-slate-900">Customization</h2></div>
                </div>
                <button type="button" onClick={() => setFormData({...formData, allowCustomization: !formData.allowCustomization})} className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${formData.allowCustomization ? 'bg-green-500' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${formData.allowCustomization ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {formData.allowCustomization && (
                <div className="space-y-8 animate-in slide-in-from-top-2">
                  {/* Add-ons */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-black uppercase text-slate-500">Add-ons (Optional extras)</label>
                      <button type="button" onClick={addAddon} className="text-xs font-bold text-[#0065eb] flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"><Plus size={14}/> Add Option</button>
                    </div>
                    <div className="space-y-3">
                      {formData.addons.map(addon => (
                        <div key={addon.id} className="flex gap-3">
                          <input type="text" placeholder="e.g. Extra Cheese" value={addon.name} onChange={e => updateAddon(addon.id, 'name', e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                          <div className="relative w-32">
                            <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                            <input type="number" step="0.01" placeholder="0.00" value={addon.price || ''} onChange={e => updateAddon(addon.id, 'price', parseFloat(e.target.value) || 0)} className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                          </div>
                          <button type="button" onClick={() => removeAddon(addon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                        </div>
                      ))}
                      {formData.addons.length === 0 && <p className="text-xs text-slate-400 italic">No add-ons created.</p>}
                    </div>
                  </div>

                  {/* Required Choices */}
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-black uppercase text-slate-500">Required Choices</label>
                      <button type="button" onClick={addChoiceGroup} className="text-xs font-bold text-[#0065eb] flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"><Plus size={14}/> Add Choice Group</button>
                    </div>
                    <div className="space-y-4">
                      {formData.requiredChoices.map(group => (
                        <div key={group.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                          <div className="flex gap-3 mb-3">
                            <input type="text" placeholder="e.g. Choose your side" value={group.groupName} onChange={e => updateChoiceGroup(group.id, e.target.value)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold" />
                            <button type="button" onClick={() => removeChoiceGroup(group.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
                          </div>
                          <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                            {group.options.map((opt, idx) => (
                              <input key={idx} type="text" placeholder={`Option ${idx + 1} (e.g. Fries)`} value={opt} onChange={e => updateChoiceOption(group.id, idx, e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                            ))}
                            <button type="button" onClick={() => addChoiceOption(group.id)} className="text-xs font-bold text-slate-500 hover:text-slate-800"> + Add another option</button>
                          </div>
                        </div>
                      ))}
                      {formData.requiredChoices.length === 0 && <p className="text-xs text-slate-400 italic">This allows the customer to customize the item before submitting.</p>}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 7. KITCHEN INFORMATION */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">7</span>
                <div><h2 className="text-lg font-black text-slate-900">Kitchen Information</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Kitchen Category</label>
                  <select value={formData.kitchenCategory} onChange={e => setFormData({...formData, kitchenCategory: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    {KITCHEN_CATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Preparation Notes</label>
                  <input type="text" placeholder="Internal kitchen instructions..." value={formData.prepNotes} onChange={e => setFormData({...formData, prepNotes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" />
                  <p className="text-[10px] text-slate-400 mt-1 italic">This information is NOT shown to customers.</p>
                </div>
              </div>
            </section>

            {/* 8. ITEM PHOTO */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">8</span>
                <div><h2 className="text-lg font-black text-slate-900">Item Photo</h2></div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Main Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shrink-0">
                      {formData.imageUrl ? <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="m-auto text-slate-300 inset-0 absolute" size={24} />}
                    </div>
                    <div>
                      <input type="file" ref={mainPhotoRef} hidden accept="image/*" onChange={handleMainPhoto} />
                      <button type="button" disabled={mainUploading} onClick={() => mainPhotoRef.current?.click()} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2">
                        {mainUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />} Upload Photo
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Additional Photos</label>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {formData.additionalPhotos.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData({...formData, additionalPhotos: formData.additionalPhotos.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                      </div>
                    ))}
                    <button type="button" disabled={galleryUploading} onClick={() => galleryRef.current?.click()} className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 shrink-0">
                      <Plus size={16} />
                    </button>
                    <input type="file" ref={galleryRef} hidden multiple accept="image/*" onChange={handleGalleryPhotos} />
                  </div>
                </div>
              </div>
            </section>

            {/* 9. VISIBILITY */}
            <section className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-black text-sm flex items-center justify-center">9</span>
                <div><h2 className="text-lg font-black text-slate-900">Visibility</h2></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 mb-2">Item Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none">
                    <option value="Available">Available</option>
                    <option value="Temporarily unavailable">Temporarily unavailable</option>
                    <option value="Hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60 h-full">
                    <div>
                      <span className="text-sm font-bold text-slate-800 block flex items-center gap-1"><Star size={14} className="text-amber-400 fill-amber-400"/> Featured Item</span>
                      <span className="text-[10px] text-slate-500">Shows in Featured dishes / Popular</span>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})} className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${formData.isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 italic">Popular Item status should preferably be calculated automatically from orders, rather than manually selected.</p>
            </section>
          </form>
        </div>

        {/* 10. CUSTOMER PREVIEW */}
        <div className={`lg:col-span-4 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Eye size={14} /> Customer Preview</h3>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl overflow-hidden group max-w-sm mx-auto w-full">
              <div className="h-48 relative bg-slate-100 overflow-hidden">
                <img src={formData.imageUrl || 'https://images.unsplash.com/photo-1621996316565-e315ea2f2226?auto=format&fit=crop&w=800&q=80'} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {formData.isFeatured && (
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-amber-600 shadow-sm flex items-center gap-1">
                    <Star size={10} className="fill-amber-500" /> Popular
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{formData.name || 'Chicken Alfredo Pasta'}</h3>
                    <p className="text-lg font-black text-[#0065eb]">${formData.price || '12.00'}</p>
                  </div>
                  {formData.comparePrice && <p className="text-xs font-bold text-slate-400 line-through text-right">${formData.comparePrice}</p>}
                  <p className="text-xs font-medium text-slate-500 leading-snug mt-1">{formData.description || 'Creamy pasta with grilled chicken, parmesan, and herbs.'}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1"><Clock size={12}/> {formData.prepTimeMinutes || '20'} min</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1"><Leaf size={12}/> Veg: {formData.dietaryInfo.includes('Vegetarian') ? 'Yes' : 'No'}</span>
                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 flex items-center gap-1"><CheckCircle2 size={12}/> Halal: {formData.dietaryInfo.includes('Halal') ? 'Yes' : 'No'}</span>
                  {formData.spiceLevel !== 'Not spicy' && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center gap-1"><Flame size={12}/> {formData.spiceLevel}</span>
                  )}
                </div>

                <button type="button" className="w-full py-3 bg-[#0065eb] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 hover:bg-[#0052c1] transition-colors mt-2">
                  Add to Order
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-500 font-medium">
              This interactive card shows exactly what customers will see on the app.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}