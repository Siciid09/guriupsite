'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth, storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Utensils, Store, MapPin, Phone, MessageSquare, PhoneCall,
  Clock, Calendar, ShieldCheck, Sparkles, Upload, X, Plus, Trash2,
  Check, Eye, Save, FileText, ChevronRight, Info, Globe, Building,
  Bed, CreditCard, Coffee, Layers, AlertCircle, Image as ImageIcon,
  CheckCircle2, DollarSign, Users, AlertTriangle, ChevronDown, CheckSquare, Square, Lock
} from 'lucide-react';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export interface ServicePeriod {
  id: string;
  open: string;
  close: string;
}

export interface DaySchedule {
  enabled: boolean;
  sameAsMonday: boolean;
  periods: ServicePeriod[];
}

export interface RestaurantFormData {
  id?: string;
  _id?: string;
  hotelId: string;

  // 1. Identity
  name: string;
  description: string;
  restaurantType: string;
  cuisines: string[];

  // 2. Guest-Facing Info
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  internalLocation: string;
  phone: string;
  whatsapp: string;
  roomExtension: string;

  // 3. Who Can Use This Restaurant?
  hotelGuests: {
    dineIn: boolean;
    roomService: boolean;
    chargeToRoom: boolean;
  };
  outsideGuests: {
    allowed: boolean;
    walkIns: boolean;
    reservations: boolean;
    takeaway: boolean;
    onlineOrdering: boolean;
  };

  // 4. Restaurant Hours
  operatingHours: {
    Monday: DaySchedule;
    Tuesday: DaySchedule;
    Wednesday: DaySchedule;
    Thursday: DaySchedule;
    Friday: DaySchedule;
    Saturday: DaySchedule;
    Sunday: DaySchedule;
  };
  specialHours: string;
  guestHoursNote: string;

  // 5. Dining Services
  mealServices: string[];
  diningOptions: string[];
  foodOptions: string[];

  // 6. Reservations
  reservationsEnabled: boolean;
  reservationRules: {
    maxPartySize: number;
    requirement: 'No' | 'Recommended' | 'Required';
    walkInsAccepted: boolean;
    noticeMinutes: number;
    maxAdvanceDays: number;
  };

  // 7. Room Service
  roomServiceEnabled: boolean;
  roomServiceDetails: {
    hoursType: 'Same as restaurant' | 'Custom hours';
    customHoursText: string;
    contact: string;
    guestOrdering: {
      orderFromGuriUp: boolean;
      chargeToRoom: boolean;
      paySeparately: boolean;
    };
    notes: string;
  };

  // 8. Ordering & Payments
  orderingMethods: string[];
  acceptedPayments: string[];
  chargeToRoomEnabled: boolean;

  // 9. Facilities
  facilities: string[];

  // 10. Media
  coverImage: string;
  galleryImages: string[];
  menuPdfUrl: string;
  menuExternalUrl: string;

  // 11. Public Listing
  status: 'Draft' | 'Published' | 'Temporarily Closed' | 'Hidden';
  temporaryClosureReason: string;
  publicDiscovery: {
    showOnGuriUp: boolean;
    allowPublicOrdering: boolean;
    allowPublicReservations: boolean;
  };
}

// Default Constants
const RESTAURANT_TYPES = [
  'Restaurant', 'Fine Dining', 'Casual Dining', 'Café', 'Bar & Lounge',
  'Buffet', 'Rooftop Restaurant', 'Poolside Restaurant', 'Specialty Restaurant',
  'Steakhouse', 'Seafood Restaurant', 'Other'
];

const CUISINE_OPTIONS = [
  'Somali', 'African', 'Arabic', 'International', 'Italian', 'Indian',
  'Asian', 'Seafood', 'Steakhouse', 'Fast Food', 'Café / Bakery', 'Vegetarian', 'Other'
];

const LOCATION_OPTIONS = [
  'Lobby', 'Ground Floor', 'First Floor', 'Rooftop', 'Poolside',
  'Garden', 'Beachfront', 'Basement', 'Other type'
];

const MEAL_SERVICES_OPTIONS = ['Breakfast', 'Lunch', 'Dinner', 'All-day dining', 'Buffet', 'À la carte'];
const DINING_OPTIONS = ['Indoor dining', 'Outdoor dining', 'Private dining', 'Family dining', 'Bar seating', 'Rooftop dining', 'Poolside dining'];
const FOOD_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Kids menu', 'Special dietary options'];
const ORDERING_METHODS_OPTIONS = ['Dine-in', 'Room Service', 'Takeaway', 'Outside/Public Order'];
const PAYMENT_OPTIONS = ['Cash', 'Card', 'Mobile Money', 'Online Payment', 'Charge to Hotel Room'];
const FACILITIES_OPTIONS = ['Free Wi-Fi', 'Air conditioning', 'Wheelchair accessible', 'Parking', "Children's seating", 'High chairs', 'Restrooms', 'Outdoor seating', 'Private dining', 'Live entertainment'];

const DEFAULT_PERIOD = (): ServicePeriod => ({
  id: Math.random().toString(36).substring(2, 9),
  open: '06:30',
  close: '10:30'
});

const DEFAULT_EVENING_PERIOD = (): ServicePeriod => ({
  id: Math.random().toString(36).substring(2, 9),
  open: '17:00',
  close: '23:00'
});

const INITIAL_FORM_DATA: RestaurantFormData = {
  hotelId: '',
  name: '',
  description: '',
  restaurantType: 'Restaurant',
  cuisines: ['International'],
  priceLevel: '$$',
  internalLocation: 'Rooftop',
  phone: '',
  whatsapp: '',
  roomExtension: '',
  hotelGuests: { dineIn: true, roomService: true, chargeToRoom: true },
  outsideGuests: { allowed: true, walkIns: true, reservations: true, takeaway: true, onlineOrdering: false },
  operatingHours: {
    Monday: { enabled: true, sameAsMonday: false, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Tuesday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Wednesday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Thursday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Friday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Saturday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] },
    Sunday: { enabled: true, sameAsMonday: true, periods: [DEFAULT_PERIOD(), DEFAULT_EVENING_PERIOD()] }
  },
  specialHours: 'Friday: Dinner begins at 6:00 PM.',
  guestHoursNote: 'Breakfast is served daily from 6:30 AM to 10:30 AM.',
  mealServices: ['Breakfast', 'Lunch', 'Dinner'],
  diningOptions: ['Indoor dining', 'Outdoor dining'],
  foodOptions: ['Halal', 'Vegetarian'],
  reservationsEnabled: true,
  reservationRules: {
    maxPartySize: 10,
    requirement: 'Recommended',
    walkInsAccepted: true,
    noticeMinutes: 30,
    maxAdvanceDays: 30
  },
  roomServiceEnabled: true,
  roomServiceDetails: {
    hoursType: 'Same as restaurant',
    customHoursText: '',
    contact: '',
    guestOrdering: { orderFromGuriUp: true, chargeToRoom: true, paySeparately: false },
    notes: 'Orders placed after 10:30 PM are unavailable.'
  },
  orderingMethods: ['Dine-in', 'Room Service', 'Takeaway'],
  acceptedPayments: ['Cash', 'Card', 'Mobile Money', 'Charge to Hotel Room'],
  chargeToRoomEnabled: true,
  facilities: ['Free Wi-Fi', 'Air conditioning', 'Restrooms', 'Outdoor seating'],
  coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  galleryImages: [],
  menuPdfUrl: '',
  menuExternalUrl: '',
  status: 'Published',
  temporaryClosureReason: '',
  publicDiscovery: { showOnGuriUp: true, allowPublicOrdering: true, allowPublicReservations: true }
};

interface RestaurantFormProps {
  hotelId: string;
  restaurantId?: string;
  initialData?: Partial<RestaurantFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RestaurantForm({ hotelId, restaurantId, initialData, onSuccess, onCancel }: RestaurantFormProps) {
  const [formData, setFormData] = useState<RestaurantFormData>({ ...INITIAL_FORM_DATA, hotelId });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- FREEMIUM STATE ---
  const [userPlan, setUserPlan] = useState('free');
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes(userPlan.toLowerCase());

  const triggerUpgrade = (feature: string) => {
    if (!isPro) setUpgradeModalFeature(feature);
  };
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [activeSection, setActiveSection] = useState<string>('identity');

  // File uploading references
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Load existing restaurant data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData, hotelId }));
    } else if (restaurantId) {
      fetchExistingRestaurant();
    }
  }, [restaurantId, initialData, hotelId]);

  const fetchExistingRestaurant = async () => {
    setIsLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      
      // Fetch User Plan
      const userRes = await fetch(`/api/users?uid=${auth.currentUser?.uid}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
      const userData = await userRes.json();
      const currentPlan = userData.user?.planTier || userData.planTier || 'free';
      setUserPlan(currentPlan);

      const res = await fetch(`/api/restaurants?hotelId=${hotelId}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const list = await res.json();
        
        // 1 Restaurant Limit for Free Users
        if (!restaurantId && !['pro', 'premium', 'agent_pro', 'admin'].includes(currentPlan.toLowerCase()) && list.length >= 1) {
           alert("Free plan is limited to 1 restaurant. Please upgrade to Pro.");
           if (onCancel) onCancel();
           return;
        }

        const existing = list.find((r: any) => r.id === restaurantId || r._id === restaurantId);
        if (existing) {
          setFormData(prev => ({ ...prev, ...existing, hotelId }));
        }
      }
    } catch (e) {
      console.error("Failed to load restaurant:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle helpers
  const toggleArrayItem = (key: keyof RestaurantFormData, item: string) => {
    const current = (formData[key] as string[]) || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    setFormData({ ...formData, [key]: updated });
  };

  // Image Upload Handler
  const handleFileUpload = async (file: File, path: string): Promise<string | null> => {
    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (e) {
      console.error("Upload error:", e);
      alert("Failed to upload image.");
      return null;
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setCoverUploading(true);
    const url = await handleFileUpload(e.target.files[0], 'restaurants/covers');
    if (url) setFormData(prev => ({ ...prev, coverImage: url }));
    setCoverUploading(false);
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (!isPro) {
      triggerUpgrade("Unlimited Photo Gallery (Free Tier Limited to 1 Cover Photo)");
      return;
    }
    setGalleryUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const url = await handleFileUpload(e.target.files[i], 'restaurants/gallery');
      if (url) urls.push(url);
    }
    setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ...urls] }));
    setGalleryUploading(false);
  };

  // Operating Hours dynamic handlers
  const handleAddPeriod = (day: keyof RestaurantFormData['operatingHours']) => {
    setFormData(prev => {
      const dayData = prev.operatingHours[day];
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...dayData,
            periods: [...dayData.periods, DEFAULT_PERIOD()]
          }
        }
      };
    });
  };

  const handleRemovePeriod = (day: keyof RestaurantFormData['operatingHours'], periodId: string) => {
    setFormData(prev => {
      const dayData = prev.operatingHours[day];
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...dayData,
            periods: dayData.periods.filter(p => p.id !== periodId)
          }
        }
      };
    });
  };

  const handlePeriodChange = (day: keyof RestaurantFormData['operatingHours'], periodId: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => {
      const dayData = prev.operatingHours[day];
      return {
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [day]: {
            ...dayData,
            periods: dayData.periods.map(p => p.id === periodId ? { ...p, [field]: value } : p)
          }
        }
      };
    });
  };

  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  };

  // Save Function
  const handleSubmit = async (saveStatus: 'Draft' | 'Published') => {
    if (!formData.name.trim()) {
      alert("Restaurant Name is required.");
      return;
    }
    if (!formData.description.trim()) {
      alert("Restaurant Description is required.");
      return;
    }

    setIsSaving(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const method = (formData.id || formData._id) ? 'PATCH' : 'POST';
      const payload = {
        ...formData,
        status: saveStatus,
        hotelId,
        entity: 'restaurant'
      };

      const res = await fetch('/api/restaurants', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save restaurant");
      }

      if (onSuccess) onSuccess();
      else alert(`Restaurant ${saveStatus === 'Draft' ? 'draft saved' : 'published'} successfully!`);
    } catch (e: any) {
      alert(e.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold">Loading restaurant configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* UPGRADE MODAL */}
      {upgradeModalFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0055FF] w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden border-4 border-[#0055FF]">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
            <button onClick={() => setUpgradeModalFeature(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={24}/></button>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                <Lock size={32} className="text-[#0055FF]" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Unlock {upgradeModalFeature}</h3>
              <p className="text-blue-100 font-medium mb-8">
                Free plan members are limited to basic features and 1 restaurant. Upgrade to Pro for complete control, advanced policies, and unlimited media uploads.
              </p>
              <button onClick={() => window.location.href = '/dashboard/subscription'} className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-[#0055FF] rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-lg">
                Upgrade to Pro Now
              </button>
              <button onClick={() => setUpgradeModalFeature(null)} className="mt-4 text-white/70 hover:text-white font-bold text-sm">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 mb-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-[#0065eb] rounded-xl"><Utensils size={20} /></span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {(formData.id || formData._id) ? 'Edit Restaurant' : 'Add New Premium Restaurant'}
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Create a restaurant that guests and the public can discover, reserve, and order from.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Form / Preview Toggle on Mobile */}
          <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'form' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
            >
              <Eye size={14} /> Live Preview
            </button>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit('Draft')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <FileText size={14} /> Save Draft
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit('Published')}
            className="px-6 py-2.5 rounded-xl bg-[#0065eb] hover:bg-[#0052c1] text-white font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={14} />}
            Save Restaurant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FORM MAIN AREA */}
        <div className={`lg:col-span-8 space-y-8 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* SECTION 1: RESTAURANT IDENTITY */}
          <section id="identity" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">1</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Restaurant Identity</h2>
                <p className="text-xs text-slate-500 font-medium">Core branding and positioning</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Example: Ocean View Restaurant"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the restaurant, atmosphere, and dining experience... Example: A modern all-day restaurant serving local and international cuisine with ocean views."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.restaurantType}
                    onChange={e => setFormData({ ...formData, restaurantType: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none appearance-none transition-all"
                  >
                    {RESTAURANT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 pointer-events-none text-slate-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Cuisine <span className="text-red-500">*</span> <span className="text-slate-400 font-normal lowercase">(Select one or multiple)</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {CUISINE_OPTIONS.map(cuisine => {
                    const selected = formData.cuisines.includes(cuisine);
                    return (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => toggleArrayItem('cuisines', cuisine)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {selected && <Check size={12} className="inline mr-1" />}
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: GUEST-FACING INFORMATION */}
          <section id="guest-info" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">2</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Guest-Facing Information</h2>
                <p className="text-xs text-slate-500 font-medium">Pricing indicator and location contacts</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Price Range <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { level: '$', label: 'Budget' },
                    { level: '$$', label: 'Moderate' },
                    { level: '$$$', label: 'Upscale' },
                    { level: '$$$$', label: 'Premium' }
                  ].map(item => (
                    <button
                      key={item.level}
                      type="button"
                      onClick={() => setFormData({ ...formData, priceLevel: item.level as any })}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        formData.priceLevel === item.level
                          ? 'border-[#0065eb] bg-blue-50/50 text-[#0065eb] ring-2 ring-blue-500/20 font-black'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="text-base font-black">{item.level}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">{item.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 italic">This is an indication for guests, not the price of individual menu items.</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.internalLocation}
                    onChange={e => setFormData({ ...formData, internalLocation: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none appearance-none transition-all"
                  >
                    {LOCATION_OPTIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 pointer-events-none text-slate-400" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Restaurant Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+252 XX XXX XXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+252 XX XXX XXX"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Internal Extension
                  </label>
                  <input
                    type="text"
                    placeholder="Extension e.g. 501"
                    value={formData.roomExtension}
                    onChange={e => setFormData({ ...formData, roomExtension: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Optional. Hotel telephone system.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: WHO CAN USE THIS RESTAURANT? */}
          <section id="access" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">3</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Who Can Use This Restaurant?</h2>
                <p className="text-xs text-slate-500 font-medium">Access controls and channel permissions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hotel Guests */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bed className="text-[#0065eb]" size={18} />
                  <h3 className="font-black text-slate-900 text-sm">Hotel Guests</h3>
                </div>

                {[
                  { key: 'dineIn', label: 'Dine-in' },
                  { key: 'roomService', label: 'Room Service' },
                  { key: 'chargeToRoom', label: 'Charge orders to room' }
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        hotelGuests: { ...formData.hotelGuests, [opt.key]: !(formData.hotelGuests as any)[opt.key] }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        (formData.hotelGuests as any)[opt.key] ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        (formData.hotelGuests as any)[opt.key] ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Outside Guests */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="text-[#0065eb]" size={18} />
                  <h3 className="font-black text-slate-900 text-sm">Outside Guests</h3>
                </div>

                {[
                  { key: 'allowed', label: 'Outside guests allowed' },
                  { key: 'walkIns', label: 'Walk-ins accepted' },
                  { key: 'reservations', label: 'Table reservations' },
                  { key: 'takeaway', label: 'Takeaway' },
                  { key: 'onlineOrdering', label: 'Online ordering' }
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        outsideGuests: { ...formData.outsideGuests, [opt.key]: !(formData.outsideGuests as any)[opt.key] }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        (formData.outsideGuests as any)[opt.key] ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        (formData.outsideGuests as any)[opt.key] ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 italic">
              These settings determine what GuriUp displays and which ordering/reservation options are available.
            </p>
          </section>

          {/* SECTION 4: RESTAURANT HOURS */}
          <section id="hours" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">4</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Restaurant Operating Hours</h2>
                <p className="text-xs text-slate-500 font-medium">Configure flexible service shifts and notes</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                  Do NOT use only one Open/Close hour if the restaurant serves split shifts (e.g. breakfast, closes, then reopens for dinner).
                </p>
              </div>

              {/* Day-by-Day Schedule Configurator */}
              <div className="space-y-4">
                {(Object.keys(formData.operatingHours) as Array<keyof RestaurantFormData['operatingHours']>).map(day => {
                  const dayData = formData.operatingHours[day];
                  return (
                    <div key={day} className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={dayData.enabled}
                            onChange={e => setFormData(prev => ({
                              ...prev,
                              operatingHours: {
                                ...prev.operatingHours,
                                [day]: { ...dayData, enabled: e.target.checked }
                              }
                            }))}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-black text-slate-900 text-sm">{day}</span>
                        </div>

                        {day !== 'Monday' && dayData.enabled && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              operatingHours: {
                                ...prev.operatingHours,
                                [day]: {
                                  ...dayData,
                                  sameAsMonday: !dayData.sameAsMonday,
                                  periods: !dayData.sameAsMonday ? [...prev.operatingHours.Monday.periods] : dayData.periods
                                }
                              }
                            }))}
                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                              dayData.sameAsMonday ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-600'
                            }`}
                          >
                            Same as Monday
                          </button>
                        )}
                      </div>

                      {dayData.enabled && !dayData.sameAsMonday && (
                        <div className="space-y-3 pl-7">
                          {dayData.periods.map(period => (
                            <div key={period.id} className="flex items-center gap-3">
                              <input
                                type="time"
                                value={period.open}
                                onChange={e => handlePeriodChange(day, period.id, 'open', e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-slate-400 font-bold text-xs">–</span>
                              <input
                                type="time"
                                value={period.close}
                                onChange={e => handlePeriodChange(day, period.id, 'close', e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                              />
                              {dayData.periods.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePeriod(day, period.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddPeriod(day)}
                            className="text-xs font-bold text-[#0065eb] hover:underline flex items-center gap-1 pt-1"
                          >
                            <Plus size={14} /> Add service period
                          </button>
                        </div>
                      )}

                      {dayData.enabled && dayData.sameAsMonday && day !== 'Monday' && (
                        <div className="pl-7 text-xs font-semibold text-slate-500 italic">
                          Mirrors Monday hours
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-2">
                  Special Hours {!isPro && <Lock size={12} className="text-amber-500" />}
                </label>
                <input
                  type="text"
                  readOnly={!isPro}
                  onClick={(e) => { if (!isPro) { e.preventDefault(); triggerUpgrade("Special Hours & Custom Notes"); } }}
                  placeholder={isPro ? "Example: Friday: Dinner begins at 6:00 PM." : "Locked on Free Plan"}
                  value={formData.specialHours}
                  onChange={e => setFormData({ ...formData, specialHours: e.target.value })}
                  className={`w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all ${!isPro ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0065eb]'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-2">
                  Guest Hours Note {!isPro && <Lock size={12} className="text-amber-500" />}
                </label>
                <input
                  type="text"
                  readOnly={!isPro}
                  onClick={(e) => { if (!isPro) { e.preventDefault(); triggerUpgrade("Special Hours & Custom Notes"); } }}
                  placeholder={isPro ? "Example: Breakfast is served daily from 6:30 AM to 10:30 AM." : "Locked on Free Plan"}
                  value={formData.guestHoursNote}
                  onChange={e => setFormData({ ...formData, guestHoursNote: e.target.value })}
                  className={`w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none transition-all ${!isPro ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#0065eb]'}`}
                />
                <p className="text-[11px] text-slate-400 mt-2">
                  The system generates standard hours automatically; use this note for explicit guest clarification.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 5: DINING SERVICES */}
          <section id="services" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">5</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Dining Services</h2>
                <p className="text-xs text-slate-500 font-medium">Select everything the restaurant offers</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Meal Services</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MEAL_SERVICES_OPTIONS.map(item => {
                    const checked = formData.mealServices.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('mealServices', item)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                          checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Dining Options</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DINING_OPTIONS.map(item => {
                    const checked = formData.diningOptions.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('diningOptions', item)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                          checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Food Options</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FOOD_OPTIONS.map(item => {
                    const checked = formData.foodOptions.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleArrayItem('foodOptions', item)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                          checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: RESERVATIONS */}
          <section id="reservations" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">6</span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Reservations</h2>
                  <p className="text-xs text-slate-500 font-medium">Table booking requirements and limits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isPro) { triggerUpgrade("Advanced Table Reservations"); return; }
                  setFormData({ ...formData, reservationsEnabled: !formData.reservationsEnabled });
                }}
                className={`w-14 h-7 rounded-full transition-colors relative p-0.5 ${
                  formData.reservationsEnabled ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  formData.reservationsEnabled ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {formData.reservationsEnabled && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Maximum Party Size
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.reservationRules.maxPartySize}
                      onChange={e => setFormData({
                        ...formData,
                        reservationRules: { ...formData.reservationRules, maxPartySize: parseInt(e.target.value) || 1 }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Reservation Required?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['No', 'Recommended', 'Required'] as const).map(req => (
                        <button
                          key={req}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            reservationRules: { ...formData.reservationRules, requirement: req }
                          })}
                          className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            formData.reservationRules.requirement === req
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {req}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Reservation Notice
                    </label>
                    <select
                      value={formData.reservationRules.noticeMinutes}
                      onChange={e => setFormData({
                        ...formData,
                        reservationRules: { ...formData.reservationRules, noticeMinutes: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Maximum Advance Booking
                    </label>
                    <select
                      value={formData.reservationRules.maxAdvanceDays}
                      onChange={e => setFormData({
                        ...formData,
                        reservationRules: { ...formData.reservationRules, maxAdvanceDays: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
                    >
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-500 font-medium">
                  💡 Advanced table availability, table maps, seating capacity, and live reservation management should be handled in the <strong>Restaurant Reservations module</strong>.
                </div>
              </div>
            )}
          </section>

          {/* SECTION 7: ROOM SERVICE */}
          <section id="roomservice" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">7</span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Room Service</h2>
                  <p className="text-xs text-slate-500 font-medium">In-room dining capabilities</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isPro) { triggerUpgrade("Room Service Integration"); return; }
                  setFormData({ ...formData, roomServiceEnabled: !formData.roomServiceEnabled });
                }}
                className={`w-14 h-7 rounded-full transition-colors relative p-0.5 ${
                  formData.roomServiceEnabled ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${
                  formData.roomServiceEnabled ? 'translate-x-7' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {formData.roomServiceEnabled && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Room Service Hours
                    </label>
                    <div className="flex gap-2">
                      {(['Same as restaurant', 'Custom hours'] as const).map(ht => (
                        <button
                          key={ht}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            roomServiceDetails: { ...formData.roomServiceDetails, hoursType: ht }
                          })}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            formData.roomServiceDetails.hoursType === ht
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {ht}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Room Service Contact
                    </label>
                    <input
                      type="text"
                      placeholder="Phone or extension"
                      value={formData.roomServiceDetails.contact}
                      onChange={e => setFormData({
                        ...formData,
                        roomServiceDetails: { ...formData.roomServiceDetails, contact: e.target.value }
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Room Service Notes
                  </label>
                  <input
                    type="text"
                    placeholder="Example: Orders placed after 10:30 PM are unavailable."
                    value={formData.roomServiceDetails.notes}
                    onChange={e => setFormData({
                      ...formData,
                      roomServiceDetails: { ...formData.roomServiceDetails, notes: e.target.value }
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </section>

          {/* SECTION 8: ORDERING & PAYMENTS */}
          <section id="payments" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">8</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Ordering & Payments</h2>
                <p className="text-xs text-slate-500 font-medium">Fulfillment and settlement options</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Available Ordering Methods</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ORDERING_METHODS_OPTIONS.map(method => {
                    const checked = formData.orderingMethods.includes(method);
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => toggleArrayItem('orderingMethods', method)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                          checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                        {method}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">Accepted Payments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PAYMENT_OPTIONS.map(pay => {
                    const checked = formData.acceptedPayments.includes(pay);
                    return (
                      <button
                        key={pay}
                        type="button"
                        onClick={() => toggleArrayItem('acceptedPayments', pay)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                          checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                        }`}
                      >
                        {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                        {pay}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={20} className="text-[#0065eb] shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-blue-900 leading-relaxed">
                  <strong>Charge to Room:</strong> Only authenticated hotel guests with a valid active stay should be allowed to charge restaurant orders to their room.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 9: RESTAURANT FACILITIES */}
          <section id="facilities" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">9</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Restaurant Facilities</h2>
                <p className="text-xs text-slate-500 font-medium">Amenities available at the location</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FACILITIES_OPTIONS.map(fac => {
                const checked = formData.facilities.includes(fac);
                return (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => toggleArrayItem('facilities', fac)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2.5 ${
                      checked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    {checked ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-slate-400" />}
                    {fac}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 10: RESTAURANT MEDIA */}
          <section id="media" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">10</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Restaurant Media</h2>
                <p className="text-xs text-slate-500 font-medium">Cover images, gallery photos, and menu preview</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Cover Image <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shrink-0">
                    {formData.coverImage ? (
                      <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="m-auto text-slate-400 inset-0 absolute" size={24} />
                    )}
                  </div>
                  <div>
                    <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={handleCoverChange} />
                    <button
                      type="button"
                      disabled={coverUploading}
                      onClick={() => coverInputRef.current?.click()}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2"
                    >
                      {coverUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                      Upload Cover Image
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">Recommended size: 1200x800px</p>
                  </div>
                </div>
              </div>

              {/* Gallery Photos */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Gallery
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {formData.galleryImages.map((img, idx) => (
                    <div key={idx} className="h-20 bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, galleryImages: formData.galleryImages.filter((_, i) => i !== idx) })}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={galleryUploading}
                    onClick={() => galleryInputRef.current?.click()}
                    className="h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] font-bold mt-1">Add Photos</span>
                  </button>
                  <input type="file" ref={galleryInputRef} hidden multiple accept="image/*" onChange={handleGalleryChange} />
                </div>
              </div>

              {/* Menu Preview */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Menu Preview (Optional)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="url"
                    readOnly={!isPro}
                    onClick={(e) => { if (!isPro) { e.preventDefault(); triggerUpgrade("Digital Menu Links"); } }}
                    placeholder={isPro ? "External Menu URL (e.g. https://...)" : "External Menu URL (Locked)"}
                    value={formData.menuExternalUrl}
                    onChange={e => setFormData({ ...formData, menuExternalUrl: e.target.value })}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white ${!isPro ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                  <input
                    type="text"
                    readOnly={!isPro}
                    onClick={(e) => { if (!isPro) { e.preventDefault(); triggerUpgrade("Digital Menu Links"); } }}
                    placeholder={isPro ? "Menu PDF Download URL" : "Menu PDF Download URL (Locked)"}
                    value={formData.menuPdfUrl}
                    onChange={e => setFormData({ ...formData, menuPdfUrl: e.target.value })}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white ${!isPro ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50'}`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 italic">
                  Note: Actual digital menus should still be managed through <strong>Menu Management</strong>, not this upload.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 11: PUBLIC LISTING */}
          <section id="listing" className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-[#0065eb] font-black text-sm flex items-center justify-center">11</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Public Listing & Status</h2>
                <p className="text-xs text-slate-500 font-medium">Visibility and discovery controls</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                  Restaurant Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0065eb]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Temporarily Closed">Temporarily Closed</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>

              {formData.status === 'Temporarily Closed' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Reason / Guest Message
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Example: Restaurant is temporarily unavailable due to renovations."
                    value={formData.temporaryClosureReason}
                    onChange={e => setFormData({ ...formData, temporaryClosureReason: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Public Discovery</h3>
                {[
                  { key: 'showOnGuriUp', label: 'Show restaurant on GuriUp marketplace' },
                  { key: 'allowPublicOrdering', label: 'Allow public online ordering' },
                  { key: 'allowPublicReservations', label: 'Allow public table reservations' }
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <span className="text-xs font-bold text-slate-800">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPro) { triggerUpgrade("Advanced Public Discovery"); return; }
                        setFormData({
                          ...formData,
                          publicDiscovery: {
                            ...formData.publicDiscovery,
                            [item.key]: !(formData.publicDiscovery as any)[item.key]
                          }
                        });
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                        (formData.publicDiscovery as any)[item.key] ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        (formData.publicDiscovery as any)[item.key] ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* SECTION 12: PREVIEW PANEL (STICKY ON DESKTOP) */}
        <div className={`lg:col-span-4 ${activeTab === 'form' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye size={14} /> Live Public Card Preview
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Real-time</span>
            </div>

            {/* PREVIEW CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden group">
              {/* Cover Image */}
              <div className="h-48 relative bg-slate-100 overflow-hidden">
                <img
                  src={formData.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'}
                  alt="Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-green-700 shadow-sm flex items-center gap-1">
                  <CheckCircle2 size={12} /> {formData.status}
                </div>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-bold">
                  {formData.priceLevel}
                </div>
              </div>

              {/* Details Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {formData.name || 'Ocean View Restaurant'}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    {formData.cuisines.join(' • ') || 'Seafood • International'} • {formData.restaurantType}
                  </p>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-600 border-t border-b border-slate-100 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#0065eb]" />
                    <span>📍 {formData.internalLocation || 'Rooftop'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#0065eb]" />
                    <span>🕐 Open today: {formData.guestHoursNote || '6:30 AM – 10:30 PM'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee size={14} className="text-[#0065eb]" />
                    <span>🍽 {formData.mealServices.join(' • ') || 'Breakfast • Lunch • Dinner'}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.hotelGuests.dineIn && (
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700">
                      🏨 Hotel guests welcome
                    </span>
                  )}
                  {formData.outsideGuests.allowed && (
                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700">
                      👥 Outside guests welcome
                    </span>
                  )}
                  {formData.hotelGuests.roomService && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                      🛎 Room service available
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="w-full py-3 bg-[#0065eb] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 hover:bg-[#0052c1] transition-colors"
                >
                  Preview Restaurant
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs text-slate-500 font-medium">
              This interactive card dynamically updates to show hotel guests and the public how your listing appears on GuriUp.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}