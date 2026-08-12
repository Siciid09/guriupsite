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
  ChevronDown
} from 'lucide-react';

// ============================================================================
// CONSTANTS & OPTIONS
// ============================================================================

const ROOM_CATEGORIES = [
  'Standard Room', 'Superior Room', 'Deluxe Room', 'Executive Room', 
  'Family Room', 'Junior Suite', 'Suite', 'Presidential Suite', 
  'Villa', 'Apartment', 'Hostel / Dormitory', 'Other'
];

const BED_TYPES = [
  'King', 'Queen', 'Double', 'Twin', 'Single', 
  'Bunk Bed', 'Sofa Bed', 'California King', 'Super King', 'Crib / Cot', 'Extra Bed'
];

const EXTRA_BED_TYPES = ['Sofa Bed', 'Single Bed', 'Rollaway', 'Cot'];

const DISCOUNT_LABELS = ['None', 'Sale', 'Special Offer', 'Promotional Rate', 'Early Bird', 'Last Minute'];

const DEPOSIT_TYPES = ['No deposit', 'Fixed amount', 'Percentage'];

const ROOM_VIEWS = [
  'City View', 'Sea View', 'Ocean View', 'Garden View', 
  'Pool View', 'Mountain View', 'Landmark View', 'Courtyard View', 'Street View', 'No View'
];

const OUTDOOR_SPACES = [
  'No Outdoor Space', 'Balcony', 'Private Balcony', 'Terrace', 
  'Private Terrace', 'Patio', 'Garden Access'
];

const BATHROOM_TYPES = ['Private Ensuite', 'Shared Bathroom', 'Private Bathroom', 'Accessible Bathroom'];

const BATHROOM_FEATURES = [
  'Shower', 'Rain Shower', 'Bathtub', 'Jacuzzi', 'Bidet', 
  'Hairdryer', 'Towels', 'Toiletries', 'Bathrobe', 'Slippers'
];

const AMENITIES_CATEGORIES = {
  'Climate & Comfort': ['Air Conditioning', 'Central Heating', 'Portable Fan', 'Fireplace', 'Soundproofing', 'Blackout Curtains'],
  'Entertainment': ['Smart TV', 'TV', 'Cable / Satellite', 'Netflix / Streaming', 'Gaming Console', 'DVD Player', 'Bluetooth Speaker'],
  'Connectivity': ['Free Wi-Fi', 'High-Speed Wi-Fi', 'Ethernet Port', 'Telephone', 'USB Charging Ports'],
  'Kitchen & Refreshments': ['Minibar', 'Refrigerator', 'Coffee Maker', 'Tea / Coffee Facilities', 'Electric Kettle', 'Microwave', 'Toaster', 'Full Kitchen'],
  'Work & Storage': ['Work Desk', 'Office Chair', 'Wardrobe', 'Safe', 'Laptop Safe', 'Iron & Ironing Board', 'Luggage Rack'],
  'Accessibility': ['Wheelchair Accessible', 'Accessible Entrance', 'Accessible Bathroom', 'Grab Bars', 'Lowered Fixtures', 'Roll-in Shower'],
  'Safety': ['Smoke Detector', 'Fire Extinguisher', 'Electronic Safe', 'Emergency Information']
};

const HIGHLIGHT_OPTIONS = [
  'King Bed', 'Sea View', 'Private Balcony', 'Bathtub', 'High-Speed Wi-Fi', 
  'Breakfast Available', 'Kitchenette', 'Pet Friendly', 'Soundproof', 'City Center View'
];

const CANCEL_POLICIES = [
  'Free Cancellation', 'Free Cancellation Until a Specified Time', 
  'Partially Refundable', 'Non-Refundable', 'Custom Policy'
];

// ============================================================================
// TYPES & INTERFACES
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
  internalCode: string; internalNotes: string; sortOrder: number; isFeatured: boolean; publicVisibility: string;
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
  roomRestrictions: [], internalCode: '', internalNotes: '', sortOrder: 1, isFeatured: false, publicVisibility: 'Visible'
};

const InputStyles = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all placeholder:text-slate-400";
const SelectStyles = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10";

export default function AddEditRoomType({ hotelId, roomTypeId }: { hotelId: string; roomTypeId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = roomTypeId || searchParams.get('id'); // Grabs ID from URL to fix blank edit screen
  const isEditing = !!editId;

  const [formData, setFormData] = useState<RoomTypeFormData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        if (isEditing && editId) {
          const res = await fetch(`/api/rooms?hotelId=${hotelId}&id=${editId}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const data = await res.json();
          
          if (res.ok && data) {
            // FIX 1: Safely extract the object if the API returns an array
            const roomData = Array.isArray(data) ? data[0] : data;
            
            if (roomData) {
              // FIX 2: Safely merge data and protect arrays so the UI doesn't crash if DB fields are null
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
            throw new Error(data.error || 'Failed to fetch room type data');
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
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageObjects = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
      setNewImages(prev => [...prev, ...imageObjects]);
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
    // Only enforce required fields if they are Publishing
    if (saveStatus === 'Published') {
      if (!formData.roomTypeName) {
        setError("Please fill in the Room Type Name.");
        const el = document.getElementById('roomTypeName');
        if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }
      if (!formData.numberOfRooms) {
        setError("Please specify the Number of Units.");
        const el = document.getElementById('numberOfRooms');
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
      for (const img of newImages) {
        const fileRef = ref(storage, `room_types/${Date.now()}_${img.file.name}`);
        await uploadBytes(fileRef, img.file);
        uploadedUrls.push(await getDownloadURL(fileRef));
      }

      // CLEANUP: Convert empty strings to null or 0 for the database
      const cleanData = { ...formData };
      const numericFields: (keyof RoomTypeFormData)[] = [
        'basePrice', 'discountPrice', 'weekendPrice', 'depositAmount', 
        'taxRate', 'serviceFee', 'tourismFee', 'otherFee'
      ];
      
      numericFields.forEach(field => {
        if (cleanData[field] === '') {
          (cleanData as any)[field] = 0; // or use null if your DB prefers null
        }
      });

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

      // SHOW ANIMATED SUCCESS & REDIRECT
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard/hotel?tab=rooms';
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="animate-spin text-blue-600 w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-transparent pb-36 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
      
        {/* INLINE TITLE CARD */}
        <div className="relative bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50 shadow-inner shrink-0">
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
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold flex items-start gap-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Info size={20} className="shrink-0 mt-0.5"/> <p>{error}</p>
          </div>
        )}

        {/* 1. ROOM TYPE INFORMATION */}
        <FormCard number="1" title="Room Type Information" description="Identity and guest-facing details.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Room Type Name *" hint="Example: Deluxe King Room">
              <input id="roomTypeName" type="text" value={formData.roomTypeName} onChange={e => updateField('roomTypeName', e.target.value)} className={InputStyles} />
            </Field>
            <Field label="Room Category *">
              <div className="relative">
                <select value={formData.roomCategory} onChange={e => updateField('roomCategory', e.target.value)} className={SelectStyles}>
                  {ROOM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-3">
              <Field label="Guest-Facing Headline" hint="Example: Spacious king room with a private balcony.">
                <input type="text" value={formData.headline} onChange={e => updateField('headline', e.target.value)} className={InputStyles}/>
              </Field>
            </div>
            <Field label="Room Size (m²)">
              <input type="text" value={formData.roomSize} onChange={e => updateField('roomSize', e.target.value)} className={InputStyles} placeholder="45"/>
            </Field>
          </div>
          <Field label="Room Description *">
            <textarea rows={4} value={formData.description} onChange={e => updateField('description', e.target.value)} className={`${InputStyles} py-4 resize-none`} placeholder="Describe the room, atmosphere, and key features..."/>
          </Field>
        </FormCard>

        {/* 2. CAPACITY & BEDDING */}
        <FormCard number="2" title="Capacity & Bedding" description="How many people and beds fit in this room?">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <Field label="Maximum Occupancy *">
              <input type="number" min="1" value={formData.maxOccupancy} onChange={e => updateField('maxOccupancy', parseInt(e.target.value)||1)} className={`${InputStyles} text-center font-black text-lg text-blue-700`}/>
            </Field>
            <Field label="Adults">
              <input type="number" min="0" value={formData.adults} onChange={e => updateField('adults', parseInt(e.target.value)||0)} className={`${InputStyles} text-center`}/>
            </Field>
            <Field label="Children">
              <input type="number" min="0" value={formData.children} onChange={e => updateField('children', parseInt(e.target.value)||0)} className={`${InputStyles} text-center`}/>
            </Field>
            <Field label="Infants">
              <input type="number" min="0" value={formData.infants} onChange={e => updateField('infants', parseInt(e.target.value)||0)} className={`${InputStyles} text-center`}/>
            </Field>
          </div>

          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 mb-8">
            <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Bed Configuration *</label>
            <div className="space-y-3">
              {formData.beds.map((bed, idx) => (
                <div key={bed.id} className="flex gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-blue-300">
                  <div className="relative flex-1">
                    <select value={bed.type} onChange={e => {
                      const newBeds = [...formData.beds];
                      newBeds[idx].type = e.target.value;
                      updateField('beds', newBeds);
                    }} className={`${SelectStyles} border-none shadow-none bg-transparent py-2 focus:ring-0`}>
                      {BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                  </div>
                  <div className="w-20 sm:w-28 relative border-l border-slate-100 pl-3">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">Qty:</span>
                     <input type="number" min="1" value={bed.quantity} onChange={e => {
                      const newBeds = [...formData.beds];
                      newBeds[idx].quantity = parseInt(e.target.value)||1;
                      updateField('beds', newBeds);
                    }} className={`${InputStyles} border-none shadow-none bg-transparent py-2 pl-12 pr-2 text-center focus:ring-0`}/>
                  </div>
                  {formData.beds.length > 1 && (
                    <button type="button" onClick={() => updateField('beds', formData.beds.filter(b => b.id !== bed.id))} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => updateField('beds', [...formData.beds, { id: Date.now().toString(), type: 'Single', quantity: 1 }])} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 mt-4">
              <Plus size={16}/> Add Bed
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 bg-white">
            <Toggle label="Extra Bed Available" checked={formData.extraBedAvailable} onChange={v => updateField('extraBedAvailable', v)}/>
            {formData.extraBedAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5 pt-5 border-t border-slate-100">
                <Field label="Extra Bed Type">
                  <div className="relative">
                    <select value={formData.extraBedType} onChange={e => updateField('extraBedType', e.target.value)} className={SelectStyles}>
                      {EXTRA_BED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                  </div>
                </Field>
                <Field label="Max Extra Beds">
                  <input type="number" min="1" value={formData.maxExtraBeds} onChange={e => updateField('maxExtraBeds', parseInt(e.target.value)||1)} className={InputStyles}/>
                </Field>
                <Field label="Extra Bed Fee ($)">
                  <input type="number" min="0" value={formData.extraBedFee} onChange={e => updateField('extraBedFee', parseFloat(e.target.value)||0)} className={InputStyles}/>
                </Field>
              </div>
            )}
          </div>
        </FormCard>

        {/* 3. INVENTORY */}
        <FormCard number="3" title="Inventory" description="How many physical rooms belong to this room type?">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-6 rounded-3xl border border-blue-100 shadow-sm">
              <Field label="Number of Units (Rooms) *">
                <input id="numberOfRooms" type="number" min="1" value={formData.numberOfRooms} onChange={e => updateField('numberOfRooms', parseInt(e.target.value)||1)} className={`${InputStyles} text-3xl font-black text-blue-700 py-4`}/>
              </Field>
              <p className="text-[13px] text-slate-500 mt-3 font-medium leading-relaxed">Example: If you have 10 identical Deluxe King Rooms, enter 10. You will assign specific room numbers (101, 102) later.</p>
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
            <Field label="Base Price / Night *">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input id="basePrice" type="number" value={formData.basePrice} onChange={e => updateField('basePrice', parseFloat(e.target.value)||'')} className={`${InputStyles} pl-8 font-black text-slate-900 text-lg`} />
              </div>
            </Field>
            <Field label="Discounted Price">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                <input type="number" value={formData.discountPrice} onChange={e => updateField('discountPrice', parseFloat(e.target.value)||'')} className={`${InputStyles} pl-8`}/>
              </div>
            </Field>
            <Field label="Discount Label">
              <div className="relative">
                <select value={formData.discountLabel} onChange={e => updateField('discountLabel', e.target.value)} className={SelectStyles}>
                  {DISCOUNT_LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Currency">
              <div className="relative">
                <select value={formData.currency} onChange={e => updateField('currency', e.target.value)} className={SelectStyles}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SOS">SOS (Shilling)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/2">
              <Field label="Weekend Price / Night">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <input type="number" disabled={formData.useBasePriceOnWeekends} value={formData.useBasePriceOnWeekends ? formData.basePrice : formData.weekendPrice} onChange={e => updateField('weekendPrice', parseFloat(e.target.value)||'')} className={`${InputStyles} pl-8 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100`}/>
                </div>
              </Field>
            </div>
            <div className="w-full md:w-1/2 pt-2 md:pt-6">
              <Toggle label="Use Base Price on Weekends" checked={formData.useBasePriceOnWeekends} onChange={v => updateField('useBasePriceOnWeekends', v)}/>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8 border-t border-slate-100 pt-8">
            <Field label="Min Stay (Nights)"><input type="number" value={formData.minStay} onChange={e => updateField('minStay', parseInt(e.target.value)||1)} className={InputStyles}/></Field>
            <Field label="Max Stay (Nights)"><input type="number" value={formData.maxStay} onChange={e => updateField('maxStay', parseInt(e.target.value)||30)} className={InputStyles}/></Field>
            <Field label="Min Advance Notice (Days)"><input type="number" value={formData.minAdvanceNotice} onChange={e => updateField('minAdvanceNotice', parseInt(e.target.value)||0)} className={InputStyles}/></Field>
            <Field label="Max Advance Booking (Days)"><input type="number" value={formData.maxAdvanceBooking} onChange={e => updateField('maxAdvanceBooking', parseInt(e.target.value)||365)} className={InputStyles}/></Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 items-start">
             <div className="pt-3"><Toggle label="Allow Same-Day Booking" checked={formData.allowSameDay} onChange={v => updateField('allowSameDay', v)}/></div>
             <Field label="Deposit Requirement">
               <div className="relative">
                 <select value={formData.depositType} onChange={e => updateField('depositType', e.target.value)} className={SelectStyles}>
                   {DEPOSIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
               </div>
             </Field>
             {formData.depositType !== 'No deposit' && (
                <Field label={`Amount (${formData.depositType === 'Percentage' ? '%' : '$'})`}>
                  <input type="number" value={formData.depositAmount} onChange={e => updateField('depositAmount', parseFloat(e.target.value)||'')} className={InputStyles}/>
                </Field>
             )}
          </div>
        </FormCard>

        {/* 5. TAXES & FEES */}
        <FormCard number="5" title="Taxes & Additional Fees" description="Break down the final cost for the guest.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="pt-3"><Toggle label="Taxes Included in Displayed Price?" checked={formData.taxIncluded} onChange={v => updateField('taxIncluded', v)}/></div>
            <Field label="Tax Type (e.g. VAT)"><input type="text" value={formData.taxType} onChange={e => updateField('taxType', e.target.value)} className={InputStyles}/></Field>
            <Field label="Tax Rate (%)"><input type="number" value={formData.taxRate} onChange={e => updateField('taxRate', parseFloat(e.target.value)||'')} className={InputStyles}/></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-100 pt-8">
            <Field label="Service Fee ($)"><input type="number" value={formData.serviceFee} onChange={e => updateField('serviceFee', parseFloat(e.target.value)||'')} className={InputStyles}/></Field>
            <Field label="Tourism / City Fee ($)"><input type="number" value={formData.tourismFee} onChange={e => updateField('tourismFee', parseFloat(e.target.value)||'')} className={InputStyles}/></Field>
            <Field label="Other Fee ($)"><input type="number" value={formData.otherFee} onChange={e => updateField('otherFee', parseFloat(e.target.value)||'')} className={InputStyles}/></Field>
          </div>
        </FormCard>

        {/* 6. ROOM VIEWS & PHYSICAL */}
        <FormCard number="6" title="Room Views & Physical Features" description="What makes this room structurally unique?">
          <div className="space-y-8">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Room Views (Select all that apply)</label>
              <div className="flex flex-wrap gap-2.5">
                {ROOM_VIEWS.map(view => <Chip key={view} label={view} selected={formData.views.includes(view)} onClick={() => toggleArrayItem('views', view)}/>)}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Outdoor Space</label>
              <div className="flex flex-wrap gap-2.5">
                {OUTDOOR_SPACES.map(space => <Chip key={space} label={space} selected={formData.outdoorSpaces.includes(space)} onClick={() => toggleArrayItem('outdoorSpaces', space)}/>)}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div>
                  <Field label="Bathroom Type">
                    <div className="relative">
                      <select value={formData.bathroomType} onChange={e => updateField('bathroomType', e.target.value)} className={SelectStyles}>
                        {BATHROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                    </div>
                  </Field>
               </div>
               <div className="md:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Bathroom Features</label>
                  <div className="flex flex-wrap gap-2.5">
                    {BATHROOM_FEATURES.map(feat => <Chip key={feat} label={feat} selected={formData.bathroomFeatures.includes(feat)} onClick={() => toggleArrayItem('bathroomFeatures', feat)}/>)}
                  </div>
               </div>
            </div>
          </div>
        </FormCard>

        {/* 7. AMENITIES & FEATURES */}
        <FormCard number="7" title="Amenities & Features" description="Everything inside the room.">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {Object.entries(AMENITIES_CATEGORIES).map(([cat, items]) => (
               <div key={cat} className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/60 shadow-sm">
                 <h4 className="font-black text-xs text-slate-900 mb-5 uppercase tracking-wider">{cat}</h4>
                 <div className="space-y-3.5">
                   {items.map(item => (
                     <label key={item} className="flex items-start gap-3.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input type="checkbox" checked={formData.amenities.includes(item)} onChange={() => toggleArrayItem('amenities', item)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"/>
                          <CheckCircle2 size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3]"/>
                        </div>
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight pt-0.5">{item}</span>
                     </label>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        </FormCard>

        {/* 8. GUEST HIGHLIGHTS */}
        <FormCard number="8" title="Guest Highlights" description="Select up to 6 key features to display prominently on the booking card.">
           <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 p-6 sm:p-8 rounded-3xl shadow-sm">
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
                     className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${isSelected ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30 scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:shadow-sm'}`}>
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
             <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 border-dashed">
                <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-5">Room Gallery *</label>
                <div className="flex flex-wrap gap-4 mb-5">
                  {formData.images.map((url) => (
                    <div key={url} className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
                      <Image src={url} alt="Room" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"><X size={16}/></button>
                    </div>
                  ))}
                  {newImages.map((img, i) => (
                    <div key={i} className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
                      <Image src={img.preview} alt="New" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-white/90 text-red-500 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition-colors backdrop-blur-sm"><X size={16}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-600 font-bold hover:bg-blue-50 transition-colors bg-white hover:border-blue-500 group">
                    <Plus size={28} className="mb-2 text-blue-400 group-hover:text-blue-600 transition-colors" /> 
                    <span className="text-sm">Add Photos</span>
                  </button>
                  <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                </div>
                <p className="text-xs text-slate-500 font-medium bg-white inline-block px-4 py-2 rounded-xl border border-slate-100 shadow-sm">💡 Recommended: Main bedroom, Bathroom, Balcony/View, Sitting Area.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Field label="Video Walkthrough URL (YouTube/Vimeo)">
                 <div className="relative">
                   <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input type="text" value={formData.videoUrl} onChange={e => updateField('videoUrl', e.target.value)} className={`${InputStyles} pl-11`} placeholder="https://..."/>
                 </div>
               </Field>
               <Field label="360° Virtual Tour (Matterport)">
                 <div className="relative">
                   <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input type="text" value={formData.tour360Url} onChange={e => updateField('tour360Url', e.target.value)} className={`${InputStyles} pl-11`} placeholder="https://..."/>
                 </div>
               </Field>
             </div>
           </div>
        </FormCard>

        {/* 10. GUEST POLICIES */}
        <FormCard number="10" title="Guest Policies" description="Rules applied specifically to this room type.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Field label="Smoking Policy">
              <div className="relative">
                <select value={formData.smokingPolicy} onChange={e => updateField('smokingPolicy', e.target.value)} className={SelectStyles}>
                  {['Non-Smoking', 'Smoking Allowed', 'Smoking Area Only'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Pet Policy">
              <div className="relative">
                <select value={formData.petPolicy} onChange={e => updateField('petPolicy', e.target.value)} className={SelectStyles}>
                  {['Pets Not Allowed', 'Pets Allowed', 'Pets Allowed With Fee'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Children">
              <div className="relative">
                <select value={formData.childrenPolicy} onChange={e => updateField('childrenPolicy', e.target.value)} className={SelectStyles}>
                  {['Children Allowed', 'Children Not Allowed'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Extra Guests">
              <div className="relative">
                <select value={formData.extraGuestsPolicy} onChange={e => updateField('extraGuestsPolicy', e.target.value)} className={SelectStyles}>
                  {['Allowed', 'Not Allowed'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Party / Event Policy">
              <div className="relative">
                <select value={formData.partyPolicy} onChange={e => updateField('partyPolicy', e.target.value)} className={SelectStyles}>
                  {['Not Allowed', 'Allowed With Approval'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
              </div>
            </Field>
            <Field label="Quiet Hours">
              <input type="text" value={formData.quietHours} onChange={e => updateField('quietHours', e.target.value)} className={InputStyles} placeholder="e.g. 10:00 PM – 7:00 AM"/>
            </Field>
          </div>
        </FormCard>

        {/* 11. CANCELLATION & BOOKING POLICY */}
        <FormCard number="11" title="Cancellation & Booking Policy" description="How bookings are confirmed and cancelled.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             <Field label="Cancellation Policy *">
               <div className="relative">
                 <select value={formData.cancellationPolicy} onChange={e => updateField('cancellationPolicy', e.target.value)} className={SelectStyles}>
                   {CANCEL_POLICIES.map(o => <option key={o} value={o}>{o}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
               </div>
             </Field>
             <Field label="Booking Method">
               <div className="relative">
                 <select value={formData.bookingMethod} onChange={e => updateField('bookingMethod', e.target.value)} className={SelectStyles}>
                   {['Instant Booking', 'Booking Request / Hotel Approval'].map(o => <option key={o} value={o}>{o}</option>)}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
               </div>
             </Field>
           </div>
           <Field label="Cancellation Terms (Details)">
             <textarea rows={2} value={formData.cancellationTerms} onChange={e => updateField('cancellationTerms', e.target.value)} className={`${InputStyles} py-4 resize-none`} placeholder="Example: Free cancellation up to 24 hours before check-in..."/>
           </Field>
           <div className="pt-6 border-t border-slate-100 mt-8">
             <Toggle label="Automatically Confirm Eligible Bookings" checked={formData.autoConfirm} onChange={v => updateField('autoConfirm', v)}/>
           </div>
        </FormCard>

        {/* 12. CHECK-IN & STAY RULES */}
        <FormCard number="12" title="Check-In & Stay Rules" description="Overrides for hotel-level defaults.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
               <Field label="Check-In Time">
                 <div className="relative">
                   <select value={formData.checkInType} onChange={e => updateField('checkInType', e.target.value)} className={SelectStyles}>
                     <option value="Use Hotel Default">Use Hotel Default</option>
                     <option value="Custom">Custom Check-In</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                 </div>
               </Field>
               {formData.checkInType === 'Custom' && <input type="time" value={formData.customCheckIn} onChange={e => updateField('customCheckIn', e.target.value)} className={InputStyles}/>}
             </div>
             <div className="space-y-4">
               <Field label="Check-Out Time">
                 <div className="relative">
                   <select value={formData.checkOutType} onChange={e => updateField('checkOutType', e.target.value)} className={SelectStyles}>
                     <option value="Use Hotel Default">Use Hotel Default</option>
                     <option value="Custom">Custom Check-Out</option>
                   </select>
                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                 </div>
               </Field>
               {formData.checkOutType === 'Custom' && <input type="time" value={formData.customCheckOut} onChange={e => updateField('customCheckOut', e.target.value)} className={InputStyles}/>}
             </div>
           </div>
        </FormCard>

        {/* 13. INTERNAL SETTINGS */}
        <FormCard number="13" title="Internal Room-Type Settings" description="Not shown to guests.">
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
             <Field label="Internal Room-Type Code (SKU)"><input type="text" value={formData.internalCode} onChange={e => updateField('internalCode', e.target.value)} className={InputStyles} placeholder="DLX-KING"/></Field>
             <Field label="Sort Order (List Priority)"><input type="number" value={formData.sortOrder} onChange={e => updateField('sortOrder', parseInt(e.target.value)||1)} className={InputStyles}/></Field>
             <Field label="Public Visibility">
               <div className="relative">
                 <select value={formData.publicVisibility} onChange={e => updateField('publicVisibility', e.target.value)} className={SelectStyles}>
                   <option value="Visible">Visible</option>
                   <option value="Hidden">Hidden</option>
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
               </div>
             </Field>
           </div>
           <Field label="Internal Notes"><textarea rows={2} value={formData.internalNotes} onChange={e => updateField('internalNotes', e.target.value)} className={`${InputStyles} py-4 resize-none`} placeholder="Notes for hotel staff..."/></Field>
           <div className="mt-8 bg-gradient-to-r from-slate-50 to-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
             <div>
               <span className="font-black text-sm text-slate-900 block flex items-center gap-2">
                 <div className="p-1.5 bg-amber-100 rounded-lg"><Star size={16} className="text-amber-500 fill-amber-500"/></div>
                 Featured Room Type
               </span>
               <span className="text-xs text-slate-500 font-medium mt-1 block">Show this room at the top of your property page.</span>
             </div>
             <Toggle label="" checked={formData.isFeatured} onChange={v => updateField('isFeatured', v)}/>
           </div>
        </FormCard>

        {/* FLOATING ACTION DOCK (STICKY INSIDE FORM CONTAINER) */}
        <div className="sticky bottom-6 z-[100] mt-8 flex justify-center w-full pointer-events-none animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-2.5 rounded-2xl flex items-center gap-3 pointer-events-auto">
            <button 
              type="button" disabled={isLoading} onClick={() => handleSubmit('Draft')}
              className="px-6 py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all focus:ring-4 focus:ring-slate-100 disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button 
              type="button" disabled={isLoading} onClick={() => handleSubmit('Published')}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:hover:bg-blue-600"
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

function FormCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-10 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg flex items-center justify-center shrink-0 border border-blue-100/50 shadow-inner">
          {number}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-2 font-medium ml-1">{hint}</p>}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button 
      type="button" 
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2 ${selected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'}`}
    >
      {selected ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-400" />} {label}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-3.5 cursor-pointer group w-max">
      <div className="relative shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="block w-12 h-7 rounded-full transition-colors bg-slate-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-500/20 shadow-inner"></div>
        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform shadow-sm border border-slate-100/50 ${checked ? 'transform translate-x-5' : ''}`}></div>
      </div>
      {label && <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 select-none transition-colors">{label}</span>}
    </label>
  );
}