'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { auth, storage } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  BedDouble, Info, CheckCircle2, X, Plus, Trash2, 
  Settings, DollarSign, Image as ImageIcon, Users,
  List, ShieldCheck, Clock, Layers, Star, Video,
  Globe, Loader2, Save, Map, Coffee, CheckSquare, Square,
  ChevronDown, Lock
} from 'lucide-react';

// ============================================================================
// CONSTANTS & FREEMIUM MAPPINGS
// ============================================================================

const ROOM_CATEGORIES = [
  'Standard Room', 'Superior Room', 'Deluxe Room', 'Executive Room', 
  'Family Room', 'Junior Suite', 'Suite', 'Presidential Suite', 
  'Villa', 'Apartment', 'Hostel / Dormitory', 'Other'
];

const BED_TYPES = ['King', 'Queen', 'Double', 'Twin', 'Single', 'Bunk Bed', 'Sofa Bed', 'California King', 'Super King', 'Crib / Cot', 'Extra Bed'];
const PREMIUM_BEDS = ['Bunk Bed', 'Sofa Bed', 'California King', 'Super King', 'Crib / Cot', 'Extra Bed'];

const EXTRA_BED_TYPES = ['Sofa Bed', 'Single Bed', 'Rollaway', 'Cot'];
const CURRENCIES = ['USD', 'SOS', 'SLSH', 'KES', 'ETB', 'DJF', 'AED', 'SAR', 'EUR', 'GBP'];
const DISCOUNT_LABELS = ['None', 'Sale', 'Special Offer', 'Promotional Rate', 'Early Bird', 'Last Minute'];
const DEPOSIT_TYPES = ['No deposit', 'Fixed amount', 'Percentage'];
const PREMIUM_DEPOSITS = ['Percentage', 'Fixed amount'];

const ROOM_VIEWS = ['City View', 'Sea View', 'Ocean View', 'Garden View', 'Pool View', 'Mountain View', 'Landmark View', 'Courtyard View', 'Street View', 'No View'];
const PREMIUM_VIEWS = ['Sea View', 'Ocean View', 'Garden View', 'Pool View', 'Mountain View', 'Landmark View', 'Courtyard View'];

const OUTDOOR_SPACES = ['No Outdoor Space', 'Balcony', 'Private Balcony', 'Terrace', 'Private Terrace', 'Patio', 'Garden Access'];
const PREMIUM_OUTDOOR = ['Private Balcony', 'Private Terrace', 'Patio', 'Garden Access'];

const BATHROOM_TYPES = ['Private Ensuite', 'Shared Bathroom', 'Private Bathroom', 'Accessible Bathroom'];
const PREMIUM_BATH_TYPES = ['Accessible Bathroom'];

const BATHROOM_FEATURES = ['Shower', 'Rain Shower', 'Bathtub', 'Jacuzzi', 'Bidet', 'Hairdryer', 'Towels', 'Toiletries', 'Bathrobes', 'Slippers'];
const PREMIUM_BATH_FEATURES = ['Rain Shower', 'Bathtub', 'Jacuzzi', 'Bidet', 'Bathrobes', 'Slippers'];

const AMENITIES_CATEGORIES: Record<string, string[]> = {
  'Climate & Comfort': ['Air Conditioning', 'Central Heating', 'Portable Fan', 'Fireplace', 'Soundproofing', 'Blackout Curtains'],
  'Entertainment': ['Smart TV', 'TV', 'Cable / Satellite', 'Netflix / Streaming', 'Gaming Console', 'DVD Player', 'Bluetooth Speaker'],
  'Connectivity': ['Free Wi-Fi', 'High-Speed Wi-Fi', 'Ethernet Port', 'Telephone', 'USB Charging Ports'],
  'Kitchen & Refreshments': ['Minibar', 'Refrigerator', 'Coffee Maker', 'Tea / Coffee Facilities', 'Electric Kettle', 'Microwave', 'Toaster', 'Full Kitchen'],
  'Work & Storage': ['Work Desk', 'Office Chair', 'Wardrobe', 'Safe', 'Laptop Safe', 'Iron & Ironing Board', 'Luggage Rack'],
  'Accessibility': ['Wheelchair Accessible', 'Accessible Entrance', 'Accessible Bathroom', 'Grab Bars', 'Lowered Fixtures', 'Roll-in Shower'],
  'Safety': ['Smoke Detector', 'Fire Extinguisher', 'Electronic Safe', 'Emergency Information']
};

const PREMIUM_AMENITIES = [
  'Central Heating', 'Fireplace', 'Soundproofing', 'Blackout Curtains',
  'Smart TV', 'Cable / Satellite', 'Netflix / Streaming', 'Gaming Console', 'DVD Player', 'Bluetooth Speaker',
  'High-Speed Wi-Fi', 'Ethernet Port', 'Telephone', 'USB Charging Ports',
  'Minibar', 'Coffee Maker', 'Microwave', 'Toaster', 'Full Kitchen',
  'Work Desk', 'Office Chair', 'Safe', 'Laptop Safe', 'Iron & Ironing Board',
  'Wheelchair Accessible', 'Accessible Entrance', 'Accessible Bathroom', 'Grab Bars', 'Lowered Fixtures', 'Roll-in Shower',
  'Electronic Safe', 'Emergency Information'
];

const HIGHLIGHT_OPTIONS = [
  'King Bed', 'Sea View', 'Private Balcony', 'Bathtub', 'High-Speed Wi-Fi', 
  'Breakfast Available', 'Kitchenette', 'Pet Friendly', 'Soundproof', 'City Center View'
];

const CANCEL_POLICIES = ['Free Cancellation', 'Free Cancellation Until a Specified Time', 'Partially Refundable', 'Non-Refundable', 'Custom Policy'];
const PREMIUM_CANCEL = ['Free Cancellation Until a Specified Time', 'Partially Refundable', 'Custom Policy'];

// ============================================================================
// TYPES & INTERFACES (Cleaned of removed fields)
// ============================================================================

interface BedConfig {
  id: string;
  type: string;
  quantity: number;
}

interface RoomTypeFormData {
  roomTypeName: string; roomCategory: string; headline: string; roomSize: string; description: string;
  maxOccupancy: number; adults: number; children: number; infants: number;
  beds: BedConfig[]; extraBedAvailable: boolean; extraBedType: string; maxExtraBeds: number; extraBedFee: number;
  numberOfRooms: number; inventoryStatus: 'Draft' | 'Published' | 'Hidden' | 'Temporarily unavailable';
  availableForBooking: boolean; allowMultiplePerBooking: boolean;
  basePrice: number | ''; discountPrice: number | ''; discountLabel: string; weekendPrice: number | '';
  useBasePriceOnWeekends: boolean; currency: string; minStay: number; maxStay: number;
  minAdvanceNotice: number; maxAdvanceBooking: number; allowSameDay: boolean; depositType: string; depositAmount: number | '';
  taxIncluded: boolean; taxType: string; taxRate: number | ''; serviceFee: number | ''; tourismFee: number | ''; otherFee: number | ''; pricingNotes: string;
  views: string[]; outdoorSpaces: string[]; bathroomType: string; bathroomFeatures: string[];
  amenities: string[]; customAmenities: string[]; highlights: string[];
  images: string[]; videoUrl: string; tour360Url: string;
  smokingPolicy: string; petPolicy: string; childrenPolicy: string; extraGuestsPolicy: string; partyPolicy: string; quietHours: string;
  cancellationPolicy: string; cancellationTerms: string; bookingMethod: string; autoConfirm: boolean;
  checkInType: string; customCheckIn: string; checkOutType: string; customCheckOut: string; roomRestrictions: string[];
  internalCode: string; publicVisibility: string;
}

const INITIAL_DATA: RoomTypeFormData = {
  roomTypeName: '', roomCategory: 'Standard Room', headline: '', roomSize: '', description: '',
  maxOccupancy: 2, adults: 2, children: 0, infants: 0,
  beds: [{ id: '1', type: 'King', quantity: 1 }],
  extraBedAvailable: false, extraBedType: 'Rollaway', maxExtraBeds: 1, extraBedFee: 0,
  numberOfRooms: 1, inventoryStatus: 'Published', availableForBooking: true, allowMultiplePerBooking: true,
  basePrice: '', discountPrice: '', discountLabel: 'None', weekendPrice: '', useBasePriceOnWeekends: true,
  currency: 'USD', minStay: 1, maxStay: 30, minAdvanceNotice: 0, maxAdvanceBooking: 365,
  allowSameDay: true, depositType: 'No deposit', depositAmount: '',
  taxIncluded: true, taxType: 'VAT', taxRate: '', serviceFee: '', tourismFee: '', otherFee: '', pricingNotes: '',
  views: [], outdoorSpaces: [], bathroomType: 'Private Ensuite', bathroomFeatures: [],
  amenities: [], customAmenities: [], highlights: [],
  images: [], videoUrl: '', tour360Url: '',
  smokingPolicy: 'Non-Smoking', petPolicy: 'Pets Not Allowed', childrenPolicy: 'Children Allowed',
  extraGuestsPolicy: 'Not Allowed', partyPolicy: 'Not Allowed', quietHours: '',
  cancellationPolicy: 'Free Cancellation', cancellationTerms: '', bookingMethod: 'Instant Booking', autoConfirm: true,
  checkInType: 'Use Hotel Default', customCheckIn: '', checkOutType: 'Use Hotel Default', customCheckOut: '',
  roomRestrictions: [], internalCode: '', publicVisibility: 'Visible'
};

export default function AddEditRoomType({ hotelId, roomTypeId }: { hotelId: string; roomTypeId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = roomTypeId || searchParams.get('id');
  const isEditing = !!editId;

  const [formData, setFormData] = useState<RoomTypeFormData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradeModalFeature, setUpgradeModalFeature] = useState<string | null>(null);
  
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FREEMIUM STATE ---
  const [userPlan, setUserPlan] = useState('free');
  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes(userPlan?.toLowerCase() || 'free');

  const triggerUpgrade = (feature: string) => {
    if (!isPro) setUpgradeModalFeature(feature);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        // 1. Fetch User Plan
        const userRes = await fetch(`/api/users?uid=${user.uid}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
        const userData = await userRes.json();
        if (userData.success || userData.user) {
          const u = userData.user || userData;
          setUserPlan(u.planTier || 'free');
        }

        // 2. Fetch Room Data if Editing
        if (isEditing && editId) {
          const res = await fetch(`/api/rooms?hotelId=${hotelId}&id=${editId}`, { headers: { 'Authorization': `Bearer ${idToken}` } });
          const data = await res.json();
          
          if (res.ok && data) {
            const roomData = Array.isArray(data) ? data[0] : data;
            if (roomData) {
              setFormData(prev => ({ 
                ...prev, 
                ...roomData,
                beds: roomData.beds || prev.beds,
                images: roomData.images || [],
                amenities: roomData.amenities || [],
                views: roomData.views || [],
                outdoorSpaces: roomData.outdoorSpaces || [],
                bathroomFeatures: roomData.bathroomFeatures || [],
                highlights: roomData.highlights || []
              }));
            }
          } else {
            throw new Error(data.error || 'Failed to fetch room data');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) loadData();
      else setIsFetching(false);
    });

    return () => unsubscribe();
  }, [hotelId, roomTypeId, isEditing]);

  const updateField = (field: keyof RoomTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof RoomTypeFormData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const exists = current.includes(value);
      return { ...prev, [field]: exists ? current.filter(i => i !== value) : [...current, value] };
    });
  };

  const handleHighlightToggle = (highlight: string) => {
    if (!isPro) {
      triggerUpgrade("Guest Highlights");
      return;
    }
    setFormData(prev => {
      const current = prev.highlights;
      if (current.includes(highlight)) {
        return { ...prev, highlights: current.filter(h => h !== highlight) };
      }
      if (current.length >= 6) {
        alert("You can only select up to 6 guest highlights.");
        return prev;
      }
      return { ...prev, highlights: [...current, highlight] };
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // FREEMIUM STRICT CHECK: 1 Photo for Free users
    const totalCurrent = formData.images.length + newImages.length;
    if (!isPro && totalCurrent >= 1) {
      triggerUpgrade("Unlimited Photo Gallery (Free Tier Limited to 1 Photo)");
      return;
    }

    const availableSlots = isPro ? 50 : Math.max(0, 1 - totalCurrent);
    const allowedFiles = files.slice(0, availableSlots);
    
    if (allowedFiles.length > 0) {
      const imageObjects = allowedFiles.map(file => ({ file, preview: URL.createObjectURL(file) }));
      setNewImages(prev => [...prev, ...imageObjects]);
    } else if (!isPro) {
      triggerUpgrade("Unlimited Photo Gallery (Free Tier Limited to 1 Photo)");
    }
  };

  const removeExistingImage = async (url: string) => {
    try {
      if (url.includes('firebasestorage')) {
        await deleteObject(ref(storage, url));
      }
      updateField('images', formData.images.filter(img => img !== url));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleSubmit = async (saveStatus: 'Draft' | 'Published') => {
    if (saveStatus === 'Published') {
      if (!formData.roomTypeName) {
        setError("Please fill in the Room Type Name.");
        const el = document.getElementById('roomTypeName');
        if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      if (!formData.basePrice) {
        setError("Please set a Base Price.");
        const el = document.getElementById('basePrice');
        if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      
      let uploadedUrls = [...formData.images];
      let allowedNewImages = isPro ? newImages : newImages.slice(0, Math.max(0, 1 - formData.images.length));

      for (const img of allowedNewImages) {
        const fileRef = ref(storage, `room_types/${Date.now()}_${img.file.name}`);
        await uploadBytes(fileRef, img.file);
        uploadedUrls.push(await getDownloadURL(fileRef));
      }

      const cleanData = { ...formData };
      const numericFields: (keyof RoomTypeFormData)[] = [
        'basePrice', 'discountPrice', 'weekendPrice', 'depositAmount', 
        'taxRate', 'serviceFee', 'tourismFee', 'otherFee'
      ];
      
      numericFields.forEach(field => {
        if (cleanData[field] === '') {
          (cleanData as any)[field] = 0; 
        }
      });

      // Strip non-pro fields to protect backend
      if (!isPro) {
        cleanData.headline = '';
        cleanData.children = 0;
        cleanData.infants = 0;
        cleanData.discountPrice = 0;
        cleanData.weekendPrice = 0;
        cleanData.taxRate = 0;
        cleanData.serviceFee = 0;
        cleanData.tourismFee = 0;
        cleanData.otherFee = 0;
        cleanData.videoUrl = '';
        cleanData.tour360Url = '';
        cleanData.highlights = [];
        cleanData.amenities = cleanData.amenities.filter(a => !PREMIUM_AMENITIES.includes(a));
      }

      const payload = { ...cleanData, images: uploadedUrls, hotelId, inventoryStatus: saveStatus };
      const endpoint = isEditing ? `/api/rooms?id=${editId}` : `/api/rooms`;
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save room type.");
      }

      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard/hotel?tab=rooms';
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-[#0055FF] w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
      
      {/* SUCCESS ANIMATION OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 20, scale: 1 }} 
            exit={{ opacity: 0, y: -50, scale: 0.9 }} 
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black border border-emerald-400"
          >
            <CheckCircle2 size={24} className="animate-bounce" />
            {isEditing ? 'Successfully Updated!' : 'Successfully Added!'} Redirecting...
          </motion.div>
        )}
      </AnimatePresence>

      {/* UPGRADE MODAL */}
      {upgradeModalFeature && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0055FF] w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden border-4 border-[#0055FF]">
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
            <button onClick={() => setUpgradeModalFeature(null)} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={24}/></button>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
                <Lock size={32} className="text-[#0055FF]" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Unlock {upgradeModalFeature}</h3>
              <p className="text-blue-100 font-medium mb-8">
                Free plan members are limited to basic features and 1 room photo. Upgrade to Pro for advanced pricing, unlimited galleries, and complete control.
              </p>
              <button onClick={() => router.push('/dashboard/subscription')} className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-[#0055FF] rounded-2xl font-black text-lg transition-transform hover:scale-105 shadow-lg">
                Upgrade to Pro Now
              </button>
              <button onClick={() => setUpgradeModalFeature(null)} className="mt-4 text-white/70 hover:text-white font-bold text-sm">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
      
        {/* INLINE TITLE CARD */}
        <div className="relative bg-white rounded-[2rem] border-2 border-[#CCE0FF] p-6 sm:p-8 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F5FF] text-[#0055FF] border-2 border-[#CCE0FF] flex items-center justify-center shrink-0">
            <BedDouble size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Room Type' : 'Add New Room Type'}
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Create a room category that guests can view and book.</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold flex items-start gap-3 border border-red-200 shadow-sm">
            <Info size={20} className="shrink-0 mt-0.5"/> <p>{error}</p>
          </div>
        )}

        {/* 1. ROOM TYPE INFORMATION */}
        <FormCard number="1" title="Room Type Information" description="Identity and guest-facing details.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input id="roomTypeName" label="Room Type Name *" value={formData.roomTypeName} onChange={e => updateField('roomTypeName', e.target.value)} placeholder="Example: Deluxe King Room" />
            <Select label="Room Category *" value={formData.roomCategory} onChange={e => updateField('roomCategory', e.target.value)} options={ROOM_CATEGORIES} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-3">
              <Input label="Guest-Facing Headline" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Guest Headlines")} value={formData.headline} onChange={e => updateField('headline', e.target.value)} placeholder="Example: Spacious king room with a private balcony." />
            </div>
            <Input label="Room Size (m²)" value={formData.roomSize} onChange={e => updateField('roomSize', e.target.value)} placeholder="45" type="number" />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-2.5 ml-1">Room Description *</label>
            <textarea rows={4} value={formData.description} onChange={e => updateField('description', e.target.value)} className="w-full p-4 bg-[#F0F5FF] border-2 border-[#CCE0FF] rounded-2xl font-bold text-slate-900 outline-none focus:border-[#0055FF] transition-all resize-none" placeholder="Describe the room, atmosphere, and key features..."/>
          </div>
        </FormCard>

        {/* 2. CAPACITY & BEDDING */}
        <FormCard number="2" title="Capacity & Bedding" description="How many people and beds fit in this room?">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <Input label="Max Occupancy *" type="number" min="1" value={formData.maxOccupancy} onChange={e => updateField('maxOccupancy', parseInt(e.target.value)||1)} />
            <Input label="Adults" type="number" min="0" value={formData.adults} onChange={e => updateField('adults', parseInt(e.target.value)||0)} />
            <Input label="Children" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Children Capacity")} type="number" min="0" value={formData.children} onChange={e => updateField('children', parseInt(e.target.value)||0)} />
            <Input label="Infants" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Infants Capacity")} type="number" min="0" value={formData.infants} onChange={e => updateField('infants', parseInt(e.target.value)||0)} />
          </div>

          <div className="bg-[#F0F5FF] p-5 rounded-2xl border-2 border-[#CCE0FF] mb-8">
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-4">Bed Configuration *</label>
            <div className="space-y-3">
              {formData.beds.map((bed, idx) => (
                <div key={bed.id} className="flex gap-3 items-center bg-white p-2.5 rounded-xl border-2 border-[#CCE0FF] shadow-sm transition-all hover:border-[#0055FF]">
                  <div className="relative flex-1">
                    <select 
                      value={bed.type} 
                      onChange={e => {
                        if (PREMIUM_BEDS.includes(e.target.value) && !isPro) {
                          triggerUpgrade("Premium Bed Types");
                          return;
                        }
                        const newBeds = [...formData.beds];
                        newBeds[idx].type = e.target.value;
                        updateField('beds', newBeds);
                      }} 
                      className="w-full px-4 py-2 bg-transparent text-sm font-bold text-slate-900 outline-none appearance-none cursor-pointer"
                    >
                      {BED_TYPES.map(t => {
                        const isPrem = PREMIUM_BEDS.includes(t);
                        return <option key={t} value={t}>{t} {isPrem && !isPro ? '(PRO)' : ''}</option>
                      })}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0055FF] pointer-events-none" size={16}/>
                  </div>
                  <div className="w-20 sm:w-28 relative border-l-2 border-[#CCE0FF] pl-3">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">Qty:</span>
                     <input type="number" min="1" value={bed.quantity} onChange={e => {
                      const newBeds = [...formData.beds];
                      newBeds[idx].quantity = parseInt(e.target.value)||1;
                      updateField('beds', newBeds);
                    }} className="w-full bg-transparent py-2 pl-12 pr-2 text-center font-bold outline-none focus:ring-0 text-slate-900"/>
                  </div>
                  {formData.beds.length > 1 && (
                    <button type="button" onClick={() => updateField('beds', formData.beds.filter(b => b.id !== bed.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => {
                if (!isPro) { triggerUpgrade("Multiple Bed Configurations"); return; }
                updateField('beds', [...formData.beds, { id: Date.now().toString(), type: 'Single', quantity: 1 }])
              }} 
              className={`text-sm font-black mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${isPro ? 'text-[#0055FF] hover:bg-[#F0F5FF]' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Plus size={16}/> Add Bed {!isPro && <Lock size={12} className="ml-1 text-amber-500" />}
            </button>
          </div>

          <div className="border-2 border-[#CCE0FF] rounded-2xl p-5 bg-white">
            <Toggle label="Extra Bed Available" checked={formData.extraBedAvailable} onChange={v => updateField('extraBedAvailable', v)}/>
            {formData.extraBedAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 pt-5 border-t-2 border-[#CCE0FF]">
                <Select label="Extra Bed Type" value={formData.extraBedType} onChange={e => updateField('extraBedType', e.target.value)} options={EXTRA_BED_TYPES} />
                <Input label="Max Extra Beds" type="number" min="1" value={formData.maxExtraBeds} onChange={e => updateField('maxExtraBeds', parseInt(e.target.value)||1)} />
                <Input label="Extra Bed Fee ($)" type="number" min="0" value={formData.extraBedFee} onChange={e => updateField('extraBedFee', parseFloat(e.target.value)||0)} />
              </div>
            )}
          </div>
        </FormCard>

        {/* 3. INVENTORY */}
        <FormCard number="3" title="Inventory" description="How many physical rooms belong to this room type?">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-[#F0F5FF] p-6 rounded-3xl border-2 border-[#CCE0FF] shadow-sm">
              <Input id="numberOfRooms" label="Number of Units (Rooms) *" type="number" min="1" value={formData.numberOfRooms} onChange={e => updateField('numberOfRooms', parseInt(e.target.value)||1)} className="text-2xl text-[#0055FF]" />
              <p className="text-[13px] text-slate-500 mt-3 font-bold leading-relaxed">Example: If you have 10 identical Deluxe King Rooms, enter 10.</p>
            </div>
            <div className="space-y-6">
              <Toggle label="Available for Online Booking" checked={formData.availableForBooking} onChange={v => updateField('availableForBooking', v)}/>
              <Toggle label="Allow Multiple Rooms Per Booking" checked={formData.allowMultiplePerBooking} onChange={v => updateField('allowMultiplePerBooking', v)}/>
            </div>
          </div>
        </FormCard>

        {/* 4. PRICING & RATES */}
        <FormCard number="4" title="Pricing & Rates" description="Set your standard prices and booking windows.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <Input id="basePrice" label="Base Price / Night *" type="number" value={formData.basePrice} onChange={e => updateField('basePrice', parseFloat(e.target.value)||'')} prefix="$ " />
            <Select label="Currency" value={formData.currency} onChange={e => updateField('currency', e.target.value)} options={CURRENCIES} />
          </div>

          <div className="relative group mb-8">
             {!isPro && <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] rounded-2xl cursor-pointer" onClick={() => triggerUpgrade("Discounts & Weekend Rates")}></div>}
             <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 bg-[#F0F5FF] rounded-2xl border-2 border-[#CCE0FF] ${!isPro ? 'opacity-50' : ''}`}>
                <Input label="Discounted Price" isPremium={true} isPro={isPro} type="number" value={formData.discountPrice} onChange={e => updateField('discountPrice', parseFloat(e.target.value)||'')} prefix="$ " />
                <Select label="Discount Label" isPremium={true} isPro={isPro} value={formData.discountLabel} onChange={e => updateField('discountLabel', e.target.value)} options={DISCOUNT_LABELS} />
                <Input label="Weekend Price / Night" isPremium={true} isPro={isPro} type="number" disabled={formData.useBasePriceOnWeekends} value={formData.useBasePriceOnWeekends ? formData.basePrice : formData.weekendPrice} onChange={e => updateField('weekendPrice', parseFloat(e.target.value)||'')} prefix="$ " />
                <div className="sm:col-span-3 pt-2">
                  <Toggle label="Use Base Price on Weekends" checked={formData.useBasePriceOnWeekends} onChange={v => updateField('useBasePriceOnWeekends', v)}/>
                </div>
             </div>
          </div>

          <div className="relative group mb-8 border-t-2 border-[#CCE0FF] pt-8">
             {!isPro && <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] cursor-pointer mt-8" onClick={() => triggerUpgrade("Advanced Booking Rules")}></div>}
             <div className={`grid grid-cols-2 md:grid-cols-4 gap-5 ${!isPro ? 'opacity-50' : ''}`}>
                <Input label="Min Stay (Nights)" isPremium={true} isPro={isPro} type="number" value={formData.minStay} onChange={e => updateField('minStay', parseInt(e.target.value)||1)} />
                <Input label="Max Stay (Nights)" isPremium={true} isPro={isPro} type="number" value={formData.maxStay} onChange={e => updateField('maxStay', parseInt(e.target.value)||30)} />
                <Input label="Min Advance Notice" isPremium={true} isPro={isPro} type="number" value={formData.minAdvanceNotice} onChange={e => updateField('minAdvanceNotice', parseInt(e.target.value)||0)} />
                <Input label="Max Advance Booking" isPremium={true} isPro={isPro} type="number" value={formData.maxAdvanceBooking} onChange={e => updateField('maxAdvanceBooking', parseInt(e.target.value)||365)} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t-2 border-[#CCE0FF] items-start">
             <div className="pt-3"><Toggle label="Allow Same-Day Booking" checked={formData.allowSameDay} onChange={v => updateField('allowSameDay', v)}/></div>
             <Select label="Deposit Requirement" value={formData.depositType} onChange={e => updateField('depositType', e.target.value)} options={DEPOSIT_TYPES} premiumOptions={PREMIUM_DEPOSITS} isPro={isPro} onUpgrade={() => triggerUpgrade("Deposit Requirements")} />
             {formData.depositType !== 'No deposit' && (
                <Input label={`Amount (${formData.depositType === 'Percentage' ? '%' : '$'})`} type="number" value={formData.depositAmount} onChange={e => updateField('depositAmount', parseFloat(e.target.value)||'')} />
             )}
          </div>
        </FormCard>

        {/* 5. TAXES & FEES */}
        <FormCard number="5" title="Taxes & Additional Fees" description="Break down the final cost for the guest." isEntirelyLocked={!isPro} onUpgrade={() => triggerUpgrade("Taxes & Custom Fees")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="pt-3"><Toggle label="Taxes Included in Displayed Price?" checked={formData.taxIncluded} onChange={v => updateField('taxIncluded', v)}/></div>
            <Input label="Tax Type (e.g. VAT)" value={formData.taxType} onChange={e => updateField('taxType', e.target.value)} />
            <Input label="Tax Rate (%)" type="number" value={formData.taxRate} onChange={e => updateField('taxRate', parseFloat(e.target.value)||'')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t-2 border-[#CCE0FF] pt-8">
            <Input label="Service Fee ($)" type="number" value={formData.serviceFee} onChange={e => updateField('serviceFee', parseFloat(e.target.value)||'')} />
            <Input label="Tourism / City Fee ($)" type="number" value={formData.tourismFee} onChange={e => updateField('tourismFee', parseFloat(e.target.value)||'')} />
            <Input label="Other Fee ($)" type="number" value={formData.otherFee} onChange={e => updateField('otherFee', parseFloat(e.target.value)||'')} />
          </div>
        </FormCard>

        {/* 6. ROOM VIEWS & PHYSICAL */}
        <FormCard number="6" title="Room Views & Physical Features" description="What makes this room structurally unique?">
          <div className="space-y-8">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-4">Room Views</label>
              <div className="flex flex-wrap gap-2.5">
                {ROOM_VIEWS.map(view => <Chip key={view} label={view} selected={formData.views.includes(view)} isPrem={PREMIUM_VIEWS.includes(view)} isPro={isPro} onClick={() => { if(PREMIUM_VIEWS.includes(view) && !isPro) triggerUpgrade(view); else toggleArrayItem('views', view); }}/>)}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-4">Outdoor Space</label>
              <div className="flex flex-wrap gap-2.5">
                {OUTDOOR_SPACES.map(space => <Chip key={space} label={space} selected={formData.outdoorSpaces.includes(space)} isPrem={PREMIUM_OUTDOOR.includes(space)} isPro={isPro} onClick={() => { if(PREMIUM_OUTDOOR.includes(space) && !isPro) triggerUpgrade(space); else toggleArrayItem('outdoorSpaces', space); }}/>)}
              </div>
            </div>
            <div className="border-t-2 border-[#CCE0FF] pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div>
                  <Select label="Bathroom Type" value={formData.bathroomType} onChange={e => updateField('bathroomType', e.target.value)} options={BATHROOM_TYPES} premiumOptions={PREMIUM_BATH_TYPES} isPro={isPro} onUpgrade={() => triggerUpgrade("Accessible Bathrooms")}/>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-4">Bathroom Features</label>
                  <div className="flex flex-wrap gap-2.5">
                    {BATHROOM_FEATURES.map(feat => <Chip key={feat} label={feat} selected={formData.bathroomFeatures.includes(feat)} isPrem={PREMIUM_BATH_FEATURES.includes(feat)} isPro={isPro} onClick={() => { if(PREMIUM_BATH_FEATURES.includes(feat) && !isPro) triggerUpgrade(feat); else toggleArrayItem('bathroomFeatures', feat); }}/>)}
                  </div>
               </div>
            </div>
          </div>
        </FormCard>

        {/* 7. AMENITIES & FEATURES */}
        <FormCard number="7" title="Amenities & Features" description="Everything inside the room.">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
             {Object.entries(AMENITIES_CATEGORIES).map(([cat, items]) => (
               <div key={cat} className="bg-[#F0F5FF] p-5 rounded-3xl border-2 border-[#CCE0FF]">
                 <h4 className="font-black text-xs text-[#0055FF] mb-5 uppercase tracking-widest">{cat}</h4>
                 <div className="space-y-3.5">
                   {items.map(item => {
                     const isPrem = PREMIUM_AMENITIES.includes(item);
                     return (
                       <label key={item} className={`flex items-start gap-3.5 cursor-pointer group ${isPrem && !isPro ? 'opacity-60' : ''}`} onClick={(e) => { if(isPrem && !isPro) { e.preventDefault(); triggerUpgrade(`Premium Amenity: ${item}`); } }}>
                          <div className="relative flex items-center justify-center mt-0.5">
                            <input type="checkbox" readOnly={isPrem && !isPro} checked={formData.amenities.includes(item)} onChange={() => { if(!isPrem || isPro) toggleArrayItem('amenities', item); }} className={`peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-[#0055FF] checked:border-[#0055FF] transition-colors ${isPrem && !isPro ? 'bg-slate-200 cursor-not-allowed' : 'cursor-pointer'}`}/>
                            <CheckCircle2 size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]"/>
                          </div>
                          <span className="text-sm font-bold text-slate-700 flex items-center pt-0.5">
                            {item}
                            {isPrem && !isPro && <Lock size={12} className="ml-2 text-amber-500"/>}
                          </span>
                       </label>
                     );
                   })}
                 </div>
               </div>
             ))}
           </div>
        </FormCard>

        {/* 8. GUEST HIGHLIGHTS */}
        <FormCard number="8" title="Guest Highlights" description="Select up to 6 key features to display prominently on the booking card." isEntirelyLocked={!isPro} onUpgrade={() => triggerUpgrade("Guest Highlights")}>
           <div className="bg-amber-50 border-2 border-amber-200 p-6 sm:p-8 rounded-3xl">
             <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100/50 px-3 py-1.5 rounded-full border border-amber-200">
                  Selected: {formData.highlights.length} / 6
                </span>
             </div>
             <div className="flex flex-wrap gap-3">
               {HIGHLIGHT_OPTIONS.map(opt => {
                 const isSelected = formData.highlights.includes(opt);
                 return (
                   <button key={opt} type="button" onClick={() => handleHighlightToggle(opt)} 
                     className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-[1.02]' : 'bg-white text-slate-700 border-[#CCE0FF] hover:border-amber-300'}`}>
                     {opt}
                   </button>
                 )
               })}
             </div>
           </div>
        </FormCard>

        {/* 9. PHOTOS & MEDIA */}
        <FormCard number="9" title="Photos & Media" description="Upload high-quality images of this specific room type.">
           <div className="space-y-8">
             <div className="bg-[#F0F5FF] p-6 sm:p-8 rounded-3xl border-2 border-[#CCE0FF] border-dashed">
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-5 flex items-center">
                  Room Gallery *
                  {!isPro && <span className="ml-3 text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-black border border-amber-300">LIMIT: 1 PHOTO</span>}
                </label>
                <div className="flex flex-wrap gap-4 mb-5">
                  {formData.images.map((url) => (
                    <div key={url} className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-sm border-2 border-[#CCE0FF] group">
                      <Image src={url} alt="Room" fill className="object-cover" />
                      <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1.5 shadow hover:bg-red-600 hover:text-white transition-colors"><X size={16}/></button>
                    </div>
                  ))}
                  {newImages.map((img, i) => (
                    <div key={i} className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-sm border-2 border-[#CCE0FF] group">
                      <Image src={img.preview} alt="New" fill className="object-cover" />
                      <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1.5 shadow hover:bg-red-600 hover:text-white transition-colors"><X size={16}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-dashed border-[#0055FF] flex flex-col items-center justify-center text-[#0055FF] font-bold hover:bg-white transition-colors bg-[#F0F5FF]">
                    <Plus size={28} className="mb-2" /> 
                    <span className="text-[10px] font-black uppercase text-center px-2">{isPro ? "Add Photos" : "Add Photo (Max 1)"}</span>
                  </button>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Input label="Video Walkthrough URL (YouTube)" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Video Walkthroughs")} value={formData.videoUrl} onChange={e => updateField('videoUrl', e.target.value)} icon={<Video size={18}/>} placeholder="https://..." />
               <Input label="360° Virtual Tour (Matterport)" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("360 Virtual Tours")} value={formData.tour360Url} onChange={e => updateField('tour360Url', e.target.value)} icon={<Globe size={18}/>} placeholder="https://..." />
             </div>
           </div>
        </FormCard>

        {/* 10. GUEST POLICIES */}
        <FormCard number="10" title="Guest Policies" description="Rules applied specifically to this room type.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Select label="Smoking Policy" value={formData.smokingPolicy} onChange={e => updateField('smokingPolicy', e.target.value)} options={['Non-Smoking', 'Smoking Allowed', 'Smoking Area Only']} premiumOptions={['Smoking Area Only']} isPro={isPro} onUpgrade={() => triggerUpgrade("Smoking Area Policy")} />
            <Select label="Pet Policy" value={formData.petPolicy} onChange={e => updateField('petPolicy', e.target.value)} options={['Pets Not Allowed', 'Pets Allowed', 'Pets Allowed With Fee']} premiumOptions={['Pets Allowed', 'Pets Allowed With Fee']} isPro={isPro} onUpgrade={() => triggerUpgrade("Pet Policies")} />
            <Select label="Children" value={formData.childrenPolicy} onChange={e => updateField('childrenPolicy', e.target.value)} options={['Children Allowed', 'Children Not Allowed']} premiumOptions={['Children Not Allowed']} isPro={isPro} onUpgrade={() => triggerUpgrade("Adults Only Settings")} />
            <Select label="Extra Guests" value={formData.extraGuestsPolicy} onChange={e => updateField('extraGuestsPolicy', e.target.value)} options={['Allowed', 'Not Allowed']} premiumOptions={['Allowed']} isPro={isPro} onUpgrade={() => triggerUpgrade("Extra Guests Policy")} />
            <Select label="Party / Event Policy" value={formData.partyPolicy} onChange={e => updateField('partyPolicy', e.target.value)} options={['Not Allowed', 'Allowed With Approval']} premiumOptions={['Allowed With Approval']} isPro={isPro} onUpgrade={() => triggerUpgrade("Event Policies")} />
            <Input label="Quiet Hours" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Quiet Hours Enforcement")} value={formData.quietHours} onChange={e => updateField('quietHours', e.target.value)} placeholder="e.g. 10 PM – 7 AM" />
          </div>
        </FormCard>

        {/* 11. CANCELLATION & BOOKING POLICY */}
        <FormCard number="11" title="Cancellation & Booking Policy" description="How bookings are confirmed and cancelled.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <Select label="Cancellation Policy *" value={formData.cancellationPolicy} onChange={e => updateField('cancellationPolicy', e.target.value)} options={CANCEL_POLICIES} premiumOptions={PREMIUM_CANCEL} isPro={isPro} onUpgrade={() => triggerUpgrade("Custom Cancellation Policies")} />
             <Select label="Booking Method" value={formData.bookingMethod} onChange={e => updateField('bookingMethod', e.target.value)} options={['Instant Booking', 'Booking Request / Hotel Approval']} premiumOptions={['Booking Request / Hotel Approval']} isPro={isPro} onUpgrade={() => triggerUpgrade("Manual Booking Approvals")} />
           </div>
           <div className="md:col-span-2">
             <Input label="Cancellation Terms (Details)" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Custom Cancellation Terms")} value={formData.cancellationTerms} onChange={e => updateField('cancellationTerms', e.target.value)} placeholder="Example: Free cancellation up to 24 hours before check-in..." />
           </div>
           <div className="pt-6 border-t-2 border-[#CCE0FF] mt-8">
             <Toggle label="Automatically Confirm Eligible Bookings" checked={formData.autoConfirm} onChange={v => updateField('autoConfirm', v)}/>
           </div>
        </FormCard>

        {/* 12. CHECK-IN & STAY RULES */}
        <FormCard number="12" title="Check-In & Stay Rules" description="Overrides for hotel-level defaults.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <Select label="Check-In Time" value={formData.checkInType} onChange={e => updateField('checkInType', e.target.value)} options={['Use Hotel Default', 'Custom']} premiumOptions={['Custom']} isPro={isPro} onUpgrade={() => triggerUpgrade("Custom Check-In Times")} />
               {formData.checkInType === 'Custom' && <Input label="Custom Check-In" type="time" value={formData.customCheckIn} onChange={e => updateField('customCheckIn', e.target.value)} />}
             </div>
             <div className="space-y-4">
               <Select label="Check-Out Time" value={formData.checkOutType} onChange={e => updateField('checkOutType', e.target.value)} options={['Use Hotel Default', 'Custom']} premiumOptions={['Custom']} isPro={isPro} onUpgrade={() => triggerUpgrade("Custom Check-Out Times")} />
               {formData.checkOutType === 'Custom' && <Input label="Custom Check-Out" type="time" value={formData.customCheckOut} onChange={e => updateField('customCheckOut', e.target.value)} />}
             </div>
           </div>
        </FormCard>

        {/* 13. INTERNAL SETTINGS */}
        <FormCard number="13" title="Internal Settings" description="Hidden from public view.">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Input label="Internal Room-Type Code (SKU)" isPremium={true} isPro={isPro} onUpgrade={() => triggerUpgrade("Internal SKUs")} value={formData.internalCode} onChange={e => updateField('internalCode', e.target.value)} placeholder="DLX-KING" />
             <Select label="Public Visibility" value={formData.publicVisibility} onChange={e => updateField('publicVisibility', e.target.value)} options={['Visible', 'Hidden']} />
           </div>
        </FormCard>

        {/* FLOATING ACTION DOCK */}
        <div className="sticky bottom-6 z-[100] mt-8 flex justify-center w-full pointer-events-none animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-white/95 backdrop-blur-xl border-2 border-[#CCE0FF] shadow-[0_20px_50px_rgba(0,85,255,0.15)] p-2.5 rounded-3xl flex items-center gap-3 pointer-events-auto">
            <button 
              type="button" disabled={isLoading} onClick={() => handleSubmit('Draft')}
              className="px-6 py-4 rounded-2xl border-2 border-[#CCE0FF] text-slate-800 font-black text-sm hover:bg-[#F0F5FF] transition-all focus:ring-4 focus:ring-[#CCE0FF] disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button 
              type="button" disabled={isLoading} onClick={() => handleSubmit('Published')}
              className="px-8 py-4 rounded-2xl bg-[#0055FF] hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-[#CCE0FF] disabled:opacity-70 disabled:hover:bg-[#0055FF]"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
              {isLoading ? 'Saving...' : 'Publish Room Type'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// UI WRAPPERS & COMPONENTS
// ============================================================================

function ProBadge() {
  return (
    <span className="ml-2 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase inline-flex items-center">
      <Lock size={10} className="mr-1 mb-0.5"/> Pro
    </span>
  );
}

interface SectionProps {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
  isEntirelyLocked?: boolean;
  onUpgrade?: () => void;
}

function FormCard({ number, title, description, children, isEntirelyLocked, onUpgrade }: SectionProps) {
  const content = (
    <section className="bg-white rounded-[2rem] border-2 border-[#CCE0FF] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,85,255,0.04)] relative overflow-hidden mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b-2 border-[#F0F5FF] mb-8">
        <div className="w-14 h-14 rounded-2xl bg-[#F0F5FF] border-2 border-[#CCE0FF] text-[#0055FF] font-black text-xl flex items-center justify-center shrink-0">
          {number}
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            {title} {isEntirelyLocked && <ProBadge />}
          </h2>
          <p className="text-sm text-slate-500 font-bold mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );

  if (isEntirelyLocked && onUpgrade) {
    return (
      <div className="relative group">
        <div className="opacity-40 pointer-events-none select-none filter grayscale-[30%] blur-[1px]">
          {content}
        </div>
        <div className="absolute inset-0 z-10 cursor-pointer flex flex-col items-center justify-center transition-transform group-hover:scale-[1.01]" onClick={onUpgrade}>
           <div className="bg-white p-4 rounded-full shadow-2xl text-amber-500 mb-3 border-4 border-amber-100"><Lock size={32}/></div>
           <p className="font-black text-xl text-slate-900 bg-white/90 px-6 py-2 rounded-xl backdrop-blur border border-slate-200">Click to Unlock {title}</p>
        </div>
      </div>
    );
  }

  return content;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  prefix?: string;
  isPremium?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
}

function Input({ label, icon, prefix, isPremium, isPro, onUpgrade, ...props }: InputProps) {
  const locked = isPremium && !isPro;
  return (
    <div>
      <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-2.5 ml-1 flex items-center">
        {label} {locked && <ProBadge />}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">{prefix}</span>}
        <input 
          readOnly={locked}
          onClick={(e) => { if (locked && onUpgrade) { e.preventDefault(); onUpgrade(); } }}
          className={`w-full p-4 bg-[#F0F5FF] border-2 border-[#CCE0FF] rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-[#0055FF] transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${icon ? 'pl-12' : ''} ${prefix ? 'pl-9' : ''} ${locked ? 'cursor-pointer select-none text-slate-400' : ''}`} 
          {...props} 
        />
      </div>
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
  premiumOptions?: string[];
  isPremium?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
}

function Select({ label, options, premiumOptions, isPremium, isPro, onUpgrade, ...props }: SelectProps) {
  const locked = isPremium && !isPro;
  return (
    <div>
      <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wide mb-2.5 ml-1 flex items-center">
        {label} {locked && <ProBadge />}
      </label>
      <div className="relative" onClickCapture={(e) => { if (locked && onUpgrade) { e.preventDefault(); e.stopPropagation(); onUpgrade(); } }}>
        <select 
          disabled={locked}
          className={`w-full p-4 bg-[#F0F5FF] border-2 border-[#CCE0FF] rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-[#0055FF] transition-all appearance-none pr-10 ${locked ? 'opacity-60 cursor-pointer' : 'cursor-pointer'}`} 
          {...props}
          onChange={(e) => {
            if (premiumOptions?.includes(e.target.value) && !isPro && onUpgrade) {
              onUpgrade();
              return;
            }
            if (props.onChange) props.onChange(e);
          }}
        >
          {options.map(o => {
            const isPrem = premiumOptions?.includes(o);
            return (
              <option key={o} value={o}>
                {o} {isPrem && !isPro ? '(PRO)' : ''}
              </option>
            )
          })}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0055FF] pointer-events-none" size={18}/>
      </div>
    </div>
  );
}

function Chip({ label, selected, isPrem, isPro, onClick }: { label: string; selected: boolean; isPrem?: boolean; isPro?: boolean; onClick: () => void }) {
  const locked = isPrem && !isPro;
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 ${selected ? 'bg-[#0055FF] border-[#0055FF] text-white shadow-md' : (locked ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-70' : 'bg-[#F0F5FF] border-[#CCE0FF] text-slate-700 hover:border-[#0055FF]')}`}
    >
      {selected ? <CheckSquare size={16} /> : (locked ? <Lock size={16} className="text-amber-500" /> : <Square size={16} className="text-[#0055FF]" />)} 
      {label}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3.5 cursor-pointer group w-max">
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="block w-12 h-7 rounded-full transition-colors bg-[#CCE0FF] peer-checked:bg-[#0055FF] peer-focus:ring-4 peer-focus:ring-blue-500/20 shadow-inner"></div>
        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm border border-slate-100/50 ${checked ? 'transform translate-x-5' : ''}`}></div>
      </div>
      {label && <span className="text-sm font-bold text-slate-800 group-hover:text-slate-900 select-none transition-colors">{label}</span>}
    </label>
  );
}