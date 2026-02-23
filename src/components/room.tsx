'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, db, storage } from './../app/lib/firebase'; // FIXED IMPORT PATH
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  serverTimestamp,
  getCountFromServer // Added for Free plan room limits
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  DollarSign, Image as ImageIcon, 
  Info, Users, Settings, Plus, X, Loader2, CheckCircle, 
  Wifi, Trash2, Video, Globe, Tags, Lock, Star // Added Lock and Star for Pro UI
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth'; // Added for User Plan checking

// ============================================================================
// CONSTANTS & SCHEMAS
// ============================================================================

// --- ADDED: Plan Limits ---
const PLAN_LIMITS = {
  free: { maxRooms: 3, maxImages: 1 },
  pro: { maxRooms: 9999, maxImages: 50 }
};
const PRO_AMENITIES = ['Entertainment', 'Views & Outdoor']; // Categories locked for free users

const ROOM_CATEGORIES = ['Standard', 'Deluxe', 'Executive', 'Suite', 'Penthouse', 'Villa', 'Dormitory', 'Family'];
const BED_TYPES = ['King', 'Queen', 'Double', 'Twin', 'Single', 'Bunk', 'Sofa Bed', 'Murphy Bed'];
const ROOM_STATUSES = ['Available', 'Occupied', 'Maintenance', 'Cleaning', 'Out of Service'];
const CLEANING_STATUSES = ['Cleaned', 'Dirty', 'In-Progress', 'Inspected'];

const AMENITIES_MAP: Record<string, string[]> = {
  'Climate Control': ['AC', 'Central Heating', 'Portable Fan', 'Fireplace'],
  'Entertainment': ['Smart TV', 'Cable/Satellite', 'Netflix/Streaming', 'Gaming Console', 'DVD Player'],
  'Connectivity': ['High-speed Wi-Fi', 'Ethernet Port', 'Telephone'],
  'Bathroom': ['Ensuite', 'Shared Bathroom', 'Bathtub', 'Rain Shower', 'Bidet', 'Hairdryer', 'Bathrobe', 'Slippers', 'Toiletries'],
  'Kitchen & Food': ['Minibar', 'Coffee/Tea Maker', 'Electric Kettle', 'Microwave', 'Toaster', 'Fridge', 'Full Kitchen', 'Dining Table'],
  'Work & Storage': ['Desk', 'Office Chair', 'Safe (Laptop size)', 'Wardrobe', 'Iron & Ironing Board'],
  'Views & Outdoor': ['Balcony', 'Terrace', 'City View', 'Sea View', 'Pool View', 'Garden View', 'No View'],
  'Safety & Accessibility': ['Smoke Detector', 'Fire Extinguisher', 'First Aid Kit', 'Wheelchair Accessible', 'Grab bars in bathroom', 'Lowered counters']
};

interface AddEditRoomProps {
  hotelId: string;
  roomId?: string; // If null, we are in Add Mode
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function AddEditRoom({ hotelId, roomId }: AddEditRoomProps) {
  const router = useRouter();
  const isEditing = !!roomId;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Changed to true to await user plan
  const [error, setError] = useState<string | null>(null);

  // --- ADDED: User Plan State ---
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [currentRoomCount, setCurrentRoomCount] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState(''); // Added to allow linking images

  // --- FORM STATE ---
  // 1. Basic Info
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [internalId, setInternalId] = useState('');
  const [category, setCategory] = useState('Standard');
  const [floor, setFloor] = useState('');
  const [wing, setWing] = useState('');
  const [roomSize, setRoomSize] = useState('');

  // 2. Capacity & Bedding
  const [maxOccupancy, setMaxOccupancy] = useState('2');
  const [adultLimit, setAdultLimit] = useState('2');
  const [childrenLimit, setChildrenLimit] = useState('0');
  const [infantLimit, setInfantLimit] = useState('0');
  const [beds, setBeds] = useState<{ type: string; count: number }[]>([{ type: 'Queen', count: 1 }]);
  const [allowExtraBed, setAllowExtraBed] = useState(false);
  const [maxExtraBeds, setMaxExtraBeds] = useState('0');
  const [extraBedCharge, setExtraBedCharge] = useState('0');

  // 3. Pricing & Rules
  const [basePrice, setBasePrice] = useState('');
  const [weekendPrice, setWeekendPrice] = useState('');
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [depositRequired, setDepositRequired] = useState('');
  const [minStay, setMinStay] = useState('1');
  const [maxStay, setMaxStay] = useState('30');
  const [allowInstantBooking, setAllowInstantBooking] = useState(true);

  // 4. Amenities & Tags
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 5. Media
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [tour360Url, setTour360Url] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 6. Descriptions & Rules
  const [headline, setHeadline] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);

  // 7. Operations (Internal)
  const [roomStatus, setRoomStatus] = useState('Available');
  const [cleaningStatus, setCleaningStatus] = useState('Cleaned');
  const [cleaningDuration, setCleaningDuration] = useState('30');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [housekeepingNotes, setHousekeepingNotes] = useState('');

  // ============================================================================
  // FETCH EXISTING DATA & USER PLAN
  // ============================================================================
  useEffect(() => {
    // ADDED: Fetch User Plan & Room Limits
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserPlan(userDoc.data().planTier === 'pro' ? 'pro' : 'free');
          }
          
          if (!isEditing && hotelId) {
            const snapshot = await getCountFromServer(collection(db, 'hotels', hotelId, 'rooms'));
            setCurrentRoomCount(snapshot.data().count);
          }
        } catch (err) {
          console.error("Error fetching user data", err);
        }
      }
    });

    const fetchRoom = async () => {
      if (!isEditing || !roomId || !hotelId) {
        setIsFetching(false);
        return;
      }
      try {
        const docRef = doc(db, 'hotels', hotelId, 'rooms', roomId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          
          // Basic
          setRoomName(data.roomName || '');
          setRoomNumber(data.roomNumber || '');
          setInternalId(data.internalId || '');
          setCategory(data.category || 'Standard');
          setFloor(data.floor || '');
          setWing(data.wing || '');
          setRoomSize(data.roomSize || '');

          // Capacity
          setMaxOccupancy(data.maxOccupancy?.toString() || '2');
          setAdultLimit(data.adultLimit?.toString() || '2');
          setChildrenLimit(data.childrenLimit?.toString() || '0');
          setInfantLimit(data.infantLimit?.toString() || '0');
          setBeds(data.beds || [{ type: 'Queen', count: 1 }]);
          setAllowExtraBed(data.allowExtraBed || false);
          setMaxExtraBeds(data.maxExtraBeds?.toString() || '0');
          setExtraBedCharge(data.extraBedCharge?.toString() || '0');

          // Pricing
          setBasePrice(data.basePrice?.toString() || '');
          setWeekendPrice(data.weekendPrice?.toString() || '');
          setTaxIncluded(data.taxIncluded ?? true);
          setDepositRequired(data.depositRequired?.toString() || '');
          setMinStay(data.minStay?.toString() || '1');
          setMaxStay(data.maxStay?.toString() || '30');
          setAllowInstantBooking(data.allowInstantBooking ?? true);

          // Amenities & Tags
          setSelectedAmenities(data.amenities || {});
          setCustomTags(data.customTags || []);

          // Media
          setExistingImages(data.images || []);
          setVideoUrl(data.videoUrl || '');
          setTour360Url(data.tour360Url || '');

          // Text
          setHeadline(data.headline || '');
          setFullDescription(data.fullDescription || '');
          setPetsAllowed(data.petsAllowed || false);
          setSmokingAllowed(data.smokingAllowed || false);

          // Internal
          setRoomStatus(data.roomStatus || 'Available');
          setCleaningStatus(data.cleaningStatus || 'Cleaned');
          setCleaningDuration(data.cleaningDuration?.toString() || '30');
          setMaintenanceNotes(data.maintenanceNotes || '');
          setHousekeepingNotes(data.housekeepingNotes || '');
        }
      } catch (err: any) {
        console.error("Fetch error", err);
        setError("Failed to load room data.");
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchRoom();
    return () => unsubscribe();
  }, [hotelId, roomId, isEditing]);

  const limits = PLAN_LIMITS[userPlan];
  const isPro = userPlan === 'pro';
  const totalImagesCount = existingImages.length + newImages.length;

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAddBed = () => setBeds([...beds, { type: 'Single', count: 1 }]);
  
  const handleUpdateBed = (index: number, field: string, value: string | number) => {
    const newBeds = [...beds];
    newBeds[index] = { ...newBeds[index], [field]: value };
    setBeds(newBeds);
  };
  
  const handleRemoveBed = (index: number) => setBeds(beds.filter((_, i) => i !== index));

  const handleAddTag = () => {
    const val = tagInput.trim();
    if (val && !customTags.includes(val)) {
      setCustomTags([...customTags, val]);
      setTagInput('');
    }
  };

  // ADDED: Handler to add an image by URL instead of file upload
  const handleAddImageUrl = () => {
    if (totalImagesCount >= limits.maxImages) {
      alert(`Free plan limit reached (${limits.maxImages} image). Upgrade to Pro.`);
      return;
    }
    if (imageUrlInput.trim() !== '') {
      setExistingImages([...existingImages, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ADDED: Freemium Limit Check
    if (userPlan === 'free' && totalImagesCount >= limits.maxImages) {
      alert(`Free plan limit reached (${limits.maxImages} image). Upgrade to Pro.`);
      return;
    }

    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // ADDED: Calculate remaining slots
      const remainingSlots = isPro ? 99 : limits.maxImages - totalImagesCount;
      const allowedFiles = files.slice(0, remainingSlots);

      const imageObjects = allowedFiles.map(file => ({
        file, preview: URL.createObjectURL(file)
      }));
      setNewImages(prev => [...prev, ...imageObjects]);
    }
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // ADDED: Check room limits for Free Plan
    if (!isEditing && !isPro && currentRoomCount >= limits.maxRooms) {
      setError(`Free plan limit reached (${limits.maxRooms} rooms). Please upgrade to Pro.`);
      setIsLoading(false);
      return;
    }

    try {
      if (!roomName || !basePrice) throw new Error("Room Name and Base Price are required.");
      if (existingImages.length === 0 && newImages.length === 0) throw new Error("Please upload at least one image.");

      const roomRef = isEditing 
        ? doc(db, 'hotels', hotelId, 'rooms', roomId!) 
        : doc(collection(db, 'hotels', hotelId, 'rooms'));

      // 1. Upload Images
      let finalImageUrls = [...existingImages];
      for (const img of newImages) {
        const ext = img.file.name.split('.').pop();
        const sRef = ref(storage, `hotel_rooms/${hotelId}/${roomRef.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
        await uploadBytes(sRef, img.file);
        finalImageUrls.push(await getDownloadURL(sRef));
      }

      // 2. Clean Amenities (remove false)
      const cleanedAmenities = Object.fromEntries(
        Object.entries(selectedAmenities).filter(([_, v]) => v === true)
      );

      // 3. Build Payload
      const payload = {
        roomName, roomNumber, internalId, category, floor, wing, roomSize,
        maxOccupancy: Number(maxOccupancy), 
        adultLimit: Number(adultLimit), 
        childrenLimit: Number(childrenLimit), 
        infantLimit: Number(infantLimit),
        beds, 
        allowExtraBed, 
        maxExtraBeds: Number(maxExtraBeds), 
        extraBedCharge: Number(extraBedCharge),
        basePrice: Number(basePrice), 
        weekendPrice: Number(weekendPrice) || Number(basePrice),
        taxIncluded, 
        depositRequired: Number(depositRequired) || 0,
        minStay: Number(minStay), 
        maxStay: Number(maxStay), 
        allowInstantBooking,
        amenities: cleanedAmenities, 
        customTags,
        images: finalImageUrls, 
        videoUrl: isPro ? videoUrl : '', // ADDED: Restrict video for free
        tour360Url: isPro ? tour360Url : '', // ADDED: Restrict tour for free
        headline, 
        fullDescription, 
        petsAllowed, 
        smokingAllowed,
        roomStatus, 
        cleaningStatus, 
        cleaningDuration: Number(cleaningDuration),
        maintenanceNotes, 
        housekeepingNotes,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(roomRef, payload);
      } else {
        await setDoc(roomRef, { ...payload, createdAt: serverTimestamp(), hotelId });
      }

      alert(`Room successfully ${isEditing ? 'updated' : 'added'}!`);
      router.back(); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32 font-sans">
      
      {/* ADDED: Freemium Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Room Profile' : 'Add New Room'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Complete the details below to list this space.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl flex flex-col items-center ${isPro ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
          <span className="text-xs font-bold uppercase tracking-wider">Current Plan: {userPlan}</span>
          {!isPro && (
            <span className="text-[10px] opacity-80 mt-1">{currentRoomCount} / {limits.maxRooms} Rooms Created</span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-8 font-bold flex items-center gap-3 border border-red-100">
           <Info size={20}/> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ================================================================
            1. BASIC IDENTIFICATION
        ================================================================ */}
        <Section title="1. Basic Identification" icon={Info}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Room Name / Title *" value={roomName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomName(e.target.value)} placeholder="e.g. The Presidential Suite" required />
            <Select label="Room Category *" value={category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)} options={ROOM_CATEGORIES} />
            <Input label="Room Number" value={roomNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)} placeholder="101" />
            <Input label="Internal SKU/ID" value={internalId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInternalId(e.target.value)} placeholder="R-101-PREZ" />
            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <Input label="Floor" value={floor} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFloor(e.target.value)} placeholder="1st" />
              <Input label="Wing/Building" value={wing} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWing(e.target.value)} placeholder="East Wing" />
              <Input label="Room Size (m²)" type="number" value={roomSize} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomSize(e.target.value)} placeholder="45" />
            </div>
          </div>
        </Section>

        {/* ================================================================
            2. CAPACITY & BEDDING
        ================================================================ */}
        <Section title="2. Capacity & Bedding" icon={Users}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Input label="Max Occupancy *" type="number" value={maxOccupancy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxOccupancy(e.target.value)} required />
            <Input label="Adults Limit" type="number" value={adultLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdultLimit(e.target.value)} />
            <Input label="Children Limit" type="number" value={childrenLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChildrenLimit(e.target.value)} />
            <Input label="Infant Limit" type="number" value={infantLimit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInfantLimit(e.target.value)} />
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
            <h4 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Bed Configuration</h4>
            {beds.map((bed, idx) => (
              <div key={idx} className="flex items-center gap-4 mb-3">
                <Select className="flex-1" value={bed.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateBed(idx, 'type', e.target.value)} options={BED_TYPES} />
                <Input type="number" value={bed.count} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateBed(idx, 'count', Number(e.target.value))} className="w-24" min="1" />
                <button type="button" onClick={() => handleRemoveBed(idx)} className="p-3.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={20}/></button>
              </div>
            ))}
            <button type="button" onClick={handleAddBed} className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline mt-2"><Plus size={16}/> Add Bed Type</button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 border border-slate-100 rounded-2xl">
            <Toggle label="Allow Extra Beds?" checked={allowExtraBed} onChange={setAllowExtraBed} />
            {allowExtraBed && (
              <div className="flex gap-4 flex-1 w-full">
                <Input label="Max Extra Beds" type="number" value={maxExtraBeds} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxExtraBeds(e.target.value)} className="flex-1" />
                <Input label="Charge per Bed ($)" type="number" value={extraBedCharge} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExtraBedCharge(e.target.value)} className="flex-1" />
              </div>
            )}
          </div>
        </Section>

        {/* ================================================================
            3. PRICING & RULES
        ================================================================ */}
        <Section title="3. Pricing & Business Rules" icon={DollarSign}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input label="Base Price / Night ($) *" type="number" value={basePrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasePrice(e.target.value)} required className="text-xl" />
            <Input label="Weekend Price ($)" type="number" value={weekendPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeekendPrice(e.target.value)} placeholder="Leave blank to use base" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Input label="Deposit Required ($ or %)" type="number" value={depositRequired} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositRequired(e.target.value)} placeholder="0" />
            <Input label="Minimum Stay (Nights)" type="number" value={minStay} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinStay(e.target.value)} min="1" />
            <Input label="Maximum Stay (Nights)" type="number" value={maxStay} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxStay(e.target.value)} />
          </div>
          <div className="flex gap-8 border-t border-slate-100 pt-6">
            <Toggle label="Price Includes Taxes" checked={taxIncluded} onChange={setTaxIncluded} />
            <Toggle label="Allow Instant Booking" checked={allowInstantBooking} onChange={setAllowInstantBooking} />
          </div>
        </Section>

        {/* ================================================================
            4. DESCRIPTION & MEDIA
        ================================================================ */}
        <Section title="4. Marketing & Media" icon={ImageIcon}>
          <div className="space-y-6">
            <Input label="Room Headline (Catchy Title)" value={headline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeadline(e.target.value)} placeholder="Wake up to ocean views in our luxury suite..." />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detailed Description</label>
              <textarea 
                rows={4} 
                value={fullDescription} 
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFullDescription(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" 
                placeholder="Sell the experience..."
              />
            </div>

            {/* IMAGE UPLOADER */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Room Image Gallery *</label>
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs text-slate-500">
                    {totalImagesCount} / {isPro ? 'Unlimited' : limits.maxImages} Images
                 </span>
                 {!isPro && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-bold">Free Limit: 1 Image</span>}
              </div>
              
              {/* ADDED: Link Input alongside Upload Button */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={!isPro && totalImagesCount >= limits.maxImages}
                  className="flex-1 rounded-xl border-2 border-dashed border-blue-300 py-3 flex items-center justify-center text-blue-500 font-bold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white"
                >
                  <Plus size={18} className="mr-2" /> Upload from Computer
                </button>
                <div className="flex-1 flex gap-2">
                  <Input 
                     placeholder="Or paste image URL link..." 
                     value={imageUrlInput} 
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrlInput(e.target.value)}
                     className="flex-1"
                  />
                  <button 
                     type="button"
                     onClick={handleAddImageUrl}
                     disabled={!isPro && totalImagesCount >= limits.maxImages}
                     className="bg-slate-900 text-white px-4 rounded-xl font-bold disabled:opacity-50"
                  >
                    Add Link
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {existingImages.map((url, i) => (
                  <div key={`ext-${i}`} className="relative w-28 h-28 rounded-xl overflow-hidden shadow-sm">
                    <Image src={url} alt="Room" fill className="object-cover" />
                    <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:scale-110"><X size={12}/></button>
                  </div>
                ))}
                {newImages.map((img, i) => (
                  <div key={`new-${i}`} className="relative w-28 h-28 rounded-xl overflow-hidden shadow-sm">
                    <Image src={img.preview} alt="New" fill className="object-cover" />
                    <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:scale-110"><X size={12}/></button>
                  </div>
                ))}
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
               {!isPro && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center flex-col border border-slate-200 shadow-sm">
                   <Lock size={24} className="text-amber-500 mb-2"/>
                   <span className="font-bold text-slate-800">Video Walkthroughs Locked</span>
                   <span className="text-xs text-slate-500 mt-1">Upgrade to Pro to add video links.</span>
                 </div>
               )}
               <Input label="YouTube/Vimeo Walkthrough URL" disabled={!isPro} icon={<Video size={16}/>} value={videoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(e.target.value)} placeholder="https://..." />
               <Input label="360° Virtual Tour URL" disabled={!isPro} icon={<Globe size={16}/>} value={tour360Url} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTour360Url(e.target.value)} placeholder="https://matterport..." />
            </div>
          </div>
        </Section>

        {/* ================================================================
            5. AMENITIES & TAGS
        ================================================================ */}
        <Section title="5. Comprehensive Amenities" icon={Wifi}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {Object.entries(AMENITIES_MAP).map(([category, items]) => {
              // ADDED: Pro amenity logic
              const isLocked = !isPro && PRO_AMENITIES.includes(category);

              return (
                <div key={category} className={`relative p-3 rounded-xl transition-all ${isLocked ? 'bg-slate-50' : ''}`}>
                  {isLocked && (
                     <div className="absolute top-3 right-3">
                        <Star size={14} className="text-amber-400 fill-amber-400"/>
                     </div>
                  )}
                  <h4 className={`font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2 ${isLocked ? 'opacity-50' : ''}`}>{category}</h4>
                  <div className="space-y-2">
                    {items.map(item => (
                      <label key={item} className={`flex items-start gap-3 cursor-pointer group ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input 
                          type="checkbox" 
                          disabled={isLocked}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                          checked={selectedAmenities[item] || false}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedAmenities(prev => ({ ...prev, [item]: e.target.checked }))}
                        />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 leading-tight">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 relative">
             {!isPro && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center flex-col border border-slate-200">
                   <Lock size={20} className="text-amber-500 mb-1"/>
                   <span className="font-bold text-sm text-slate-800">Custom Tags Locked</span>
                   <span className="text-[10px] text-slate-500 mt-1">Upgrade to Pro</span>
                 </div>
             )}
             <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Tags size={18} className="text-blue-600"/> Custom Tags / Unique Features</h4>
             <p className="text-xs text-slate-500 mb-4">Add unique selling points not listed above (e.g. "Private Butler", "Gold Faucets")</p>
             <div className="flex flex-wrap gap-2 mb-3">
               {customTags.map(tag => (
                 <span key={tag} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                   {tag} <button type="button" onClick={() => setCustomTags(customTags.filter(t => t !== tag))}><X size={14}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={tagInput}
                 disabled={!isPro}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                 onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                       e.preventDefault();
                       handleAddTag();
                    }
                 }}
                 placeholder="Type and press Enter or Add"
                 className="flex-1 p-3.5 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 shadow-sm disabled:bg-slate-100"
               />
               <button type="button" disabled={!isPro} onClick={handleAddTag} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50">Add</button>
             </div>
          </div>
        </Section>

        {/* ================================================================
            6. OPERATIONS & INTERNAL (ADMIN ONLY)
        ================================================================ */}
        <Section title="6. Operations & Housekeeping (Internal)" icon={Settings}>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Select label="Room Status" value={roomStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoomStatus(e.target.value)} options={ROOM_STATUSES} />
              <Select label="Cleaning Status" value={cleaningStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCleaningStatus(e.target.value)} options={CLEANING_STATUSES} />
              <Input label="Cleaning Duration (Mins)" type="number" value={cleaningDuration} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCleaningDuration(e.target.value)} />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Maintenance Log</label>
                <textarea 
                  rows={3} 
                  value={maintenanceNotes} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMaintenanceNotes(e.target.value)} 
                  className="w-full p-4 bg-amber-50/30 border border-amber-100 rounded-xl outline-none focus:border-amber-400 text-sm" 
                  placeholder="e.g. AC replaced Jan 2026..."
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Housekeeping Notes</label>
                <textarea 
                  rows={3} 
                  value={housekeepingNotes} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHousekeepingNotes(e.target.value)} 
                  className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-xl outline-none focus:border-blue-400 text-sm" 
                  placeholder="e.g. Guest prefers extra pillows..."
                />
             </div>
           </div>
           <div className="flex gap-8 border-t border-slate-100 pt-6">
              <Toggle label="Pets Allowed" checked={petsAllowed} onChange={setPetsAllowed} />
              <Toggle label="Smoking Allowed" checked={smokingAllowed} onChange={setSmokingAllowed} />
           </div>
        </Section>

        {/* ================================================================
            SUBMIT BUTTON
        ================================================================ */}
        <div className="pt-6 flex justify-end sticky bottom-6 z-40">
          <button 
            type="submit" 
            disabled={isLoading || (!isPro && currentRoomCount >= limits.maxRooms && !isEditing)}
            className="w-full md:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 hover:-translate-y-1 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? <Loader2 className="animate-spin"/> : <CheckCircle size={24}/>}
            {isEditing ? 'SAVE ROOM CHANGES' : 'PUBLISH ROOM TO HOTEL'}
          </button>
        </div>

      </form>
    </div>
  );
}

// ============================================================================
// UI HELPER COMPONENTS WITH STRICT TYPES
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Icon size={24} strokeWidth={2.5}/></div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({ label, icon, className = '', onChange, ...props }: InputProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input 
          className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 disabled:opacity-50 disabled:bg-slate-100 ${icon ? 'pl-11' : ''}`}
          onChange={onChange}
          {...props} 
        />
      </div>
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: string[];
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

function Select({ label, options, className = '', onChange, ...props }: SelectProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">{label}</label>}
      <div className="relative">
        <select 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-10"
          onChange={onChange}
          {...props}
        >
          {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)} />
        <div className={`block w-12 h-7 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${checked ? 'transform translate-x-5' : ''}`}></div>
      </div>
      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 select-none">{label}</span>
    </label>
  );
}