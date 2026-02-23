'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, db, storage } from '../app/lib/firebase'; // Fixed path for src/components
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  serverTimestamp, 
  GeoPoint 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Building, MapPin, Phone, Info, Image as ImageIcon, CheckCircle, 
  X, Plus, Lock, Star, CreditCard, Video, Loader2
} from 'lucide-react';

// --- DATA CONSTANTS ---
const HOTEL_TYPES = [
  'Hotel', 'Luxury Hotel', 'Boutique Hotel', 'Business Hotel', 'City Hotel', 
  'Resort', 'Lodge', 'Motel', 'Inn', 'Hostel', 'Bed & Breakfast', 'Apartment'
];

const AMENITIES_CATEGORIES: Record<string, string[]> = {
  'Connectivity': ['Free Wi-Fi (Public Areas)', 'Paid Wi-Fi', 'Business Internet'],
  'Food & Beverage': ['Restaurant', 'Bar / Lounge', 'Coffee Shop / Café', 'Free Breakfast', 'Room Service'],
  'Leisure & Wellness': ['Outdoor Swimming Pool', 'Indoor Swimming Pool', 'Spa & Wellness Center', 'Gym'],
  'Parking & Transport': ['Free Parking', 'Valet Parking', 'Airport Shuttle'],
};

interface HotelFormProps {
  hotelId?: string;
}

export default function HotelForm({ hotelId }: HotelFormProps) {
  const router = useRouter();
  const isEditing = !!hotelId;

  // --- STATE: UI & Loading ---
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // --- STATE: User Plan ---
  const [userPlan, setUserPlan] = useState('free');
  const [userRole, setUserRole] = useState('user');
  const isPro = userPlan === 'pro' || userPlan === 'premium' || userRole === 'admin';

  // --- STATE: Form Data ---
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [type, setType] = useState('Hotel');
  const [description, setDescription] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [roomsCount, setRoomsCount] = useState('');
  const [rating, setRating] = useState('3');
  const [videoUrl, setVideoUrl] = useState('');

  // Location
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Contact
  const [phoneCall, setPhoneCall] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [phoneManager, setPhoneManager] = useState('');
  const [website, setWebsite] = useState('');

  // Policies
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [cancellation, setCancellation] = useState('');
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [paymentInput, setPaymentInput] = useState('');

  // Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});

  // Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH USER PLAN & HOTEL DATA ---
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserPlan(userDoc.data().planTier || 'free');
          setUserRole(userDoc.data().role || 'user');
        }

        if (isEditing && hotelId) {
          const hotelDoc = await getDoc(doc(db, 'hotels', hotelId));
          if (hotelDoc.exists()) {
            const data = hotelDoc.data();
            setName(data.name || '');
            setSlug(data.slug || '');
            setSlugEdited(true); 
            setType(data.type || 'Hotel');
            setDescription(data.description || '');
            setPricePerNight(data.pricePerNight?.toString() || '');
            setRoomsCount(data.roomsCount?.toString() || '');
            setRating(data.rating?.toString() || '3');
            setVideoUrl(data.videoUrl || '');
            
            setCity(data.location?.city || '');
            setArea(data.location?.area || '');
            setLat(data.location?.latDisplay || '');
            setLng(data.location?.lngDisplay || '');

            setPhoneCall(data.contact?.phoneCall || '');
            setPhoneWhatsapp(data.contact?.phoneWhatsapp || '');
            setPhoneManager(data.contact?.phoneManager || '');
            setWebsite(data.contact?.website || '');

            setCheckInTime(data.policies?.checkInTime || '');
            setCheckOutTime(data.policies?.checkOutTime || '');
            setCancellation(data.policies?.cancellation || '');
            setPaymentMethods(data.policies?.paymentMethodsList || []);

            setExistingImages(data.images || []);
            setSelectedAmenities(data.amenities || {});
          } else {
            setError("Hotel not found.");
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load data.");
      } finally {
        setIsFetching(false);
      }
    };

    fetchContext();
  }, [hotelId, isEditing]);

  // --- AUTO SLUG ---
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [name, slugEdited]);

  // --- HANDLERS ---
  const handleAddPaymentMethod = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const val = paymentInput.trim();
    if (val && !paymentMethods.includes(val)) {
      setPaymentMethods([...paymentMethods, val]);
      setPaymentInput('');
    }
  };

  const removePaymentMethod = (method: string) => {
    setPaymentMethods(paymentMethods.filter(m => m !== method));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setSelectedAmenities(prev => ({ ...prev, [amenity]: checked }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const currentTotal = existingImages.length + newImages.length;
      
      if (!isPro && currentTotal + files.length > 1) {
        alert("Free plan is limited to 1 image. Please upgrade to Pro.");
        const allowed = files.slice(0, Math.max(0, 1 - currentTotal));
        if (allowed.length > 0) addNewImages(allowed);
      } else {
        addNewImages(files);
      }
    }
  };

  const addNewImages = (files: File[]) => {
    const imageObjects = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewImages(prev => [...prev, ...imageObjects]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Must be logged in");

      if (existingImages.length === 0 && newImages.length === 0) {
        throw new Error("Please add at least one hotel photo.");
      }

      const hotelRef = isEditing ? doc(db, 'hotels', hotelId!) : doc(collection(db, 'hotels'));

      let finalImageUrls = [...existingImages];
      for (const img of newImages) {
        const ext = img.file.name.split('.').pop();
        const sRef = ref(storage, `hotel_images/${hotelRef.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`);
        await uploadBytes(sRef, img.file);
        const url = await getDownloadURL(sRef);
        finalImageUrls.push(url);
      }

      const geoPoint = (lat && lng) ? new GeoPoint(parseFloat(lat), parseFloat(lng)) : null;
      
      const cleanedAmenities = Object.fromEntries(
        Object.entries(selectedAmenities).filter(([_, v]) => v === true)
      );

      const hotelData = {
        name: name.trim(),
        slug: slug.trim(),
        type,
        description: description.trim(),
        pricePerNight: parseInt(pricePerNight) || 0,
        roomsCount: parseInt(roomsCount) || 0,
        rating: parseFloat(rating) || 3,
        images: finalImageUrls,
        videoUrl: videoUrl.trim(),
        
        location: {
          city: city.trim(),
          area: area.trim(),
          coordinates: geoPoint,
          latDisplay: isPro ? lat : null,
          lngDisplay: isPro ? lng : null,
        },
        
        amenities: isPro ? cleanedAmenities : {},
        
        contact: {
          phoneCall: phoneCall.trim(),
          phoneWhatsapp: phoneWhatsapp.trim(),
          phoneManager: phoneManager.trim(),
          website: website.trim(),
        },
        
        policies: {
          checkInTime: checkInTime.trim(),
          checkOutTime: checkOutTime.trim(),
          cancellation: cancellation.trim(),
          paymentMethodsList: paymentMethods,
          paymentMethods: paymentMethods.join(', '),
        },
        lastUpdated: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(hotelRef, hotelData);
      } else {
        await setDoc(hotelRef, {
          ...hotelData,
          createdAt: serverTimestamp(),
          ownerId: userRole === 'admin' ? null : user.uid,
          hotelAdminId: userRole === 'admin' ? null : user.uid,
          featured: false,
          planTierAtUpload: userPlan,
        });

        if (userRole !== 'admin') {
          await updateDoc(doc(db, 'users', user.uid), {
            managedHotelId: hotelRef.id,
            isHotelOwner: true,
            role: userRole === 'user' ? 'hoadmin' : userRole
          });
        }
      }

      alert(isEditing ? "Hotel Updated!" : "Hotel Published Successfully!");
      router.push('/dashboard'); 

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-10 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900">{isEditing ? 'Edit Your Hotel' : 'List Your Hotel'}</h1>
        <p className="text-slate-500">Complete the details below to make your property live on GuriUp.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-bold flex items-center gap-2 border border-red-100">
           <Info size={20}/> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        <Section title="Basic Information" icon={Building}>
          <div className="space-y-4">
            <Input label="Hotel Name *" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
            <Input label="URL Slug *" value={slug} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSlug(e.target.value); setSlugEdited(true); }} required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hotel Type *</label>
                 <select value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all">
                   {HOTEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </div>
               <Input label="Star Rating" type="number" min="1" max="5" value={rating} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRating(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Input label="Price per Night ($) *" type="number" value={pricePerNight} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPricePerNight(e.target.value)} required />
               <Input label="Total Rooms *" type="number" value={roomsCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomsCount(e.target.value)} required />
            </div>
          </div>
        </Section>

        <Section title="Description" icon={Info}>
           <div className="relative">
             <textarea 
               value={description} 
               onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
               maxLength={!isPro ? 150 : undefined}
               rows={4} 
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 transition-all resize-none"
               placeholder="Tell guests about your property..."
               required
             />
             {!isPro && (
               <div className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-1">
                 <Lock size={12}/> Free Plan: Max 150 characters. <span className="underline cursor-pointer">Upgrade to Pro</span>
               </div>
             )}
           </div>
        </Section>

        <Section title="Location" icon={MapPin}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <Input label="City *" value={city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)} required />
             <Input label="Area (e.g. Downtown) *" value={area} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setArea(e.target.value)} required />
           </div>

           <div className={`p-4 rounded-xl border-2 border-dashed ${isPro ? 'border-slate-300 bg-slate-50' : 'border-amber-200 bg-amber-50/50 relative overflow-hidden'}`}>
              {!isPro && <ProOverlay text="GPS Coordinates Locked" />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Input label="Latitude" value={lat} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLat(e.target.value)} disabled={!isPro} placeholder="9.5623" />
                 <Input label="Longitude" value={lng} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLng(e.target.value)} disabled={!isPro} placeholder="44.0653" />
              </div>
           </div>
        </Section>

        <Section title="Contact Info" icon={Phone}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Reception Phone *" value={phoneCall} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneCall(e.target.value)} required />
             <Input label="WhatsApp Number *" value={phoneWhatsapp} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneWhatsapp(e.target.value)} required />
             <Input label="Manager Phone *" value={phoneManager} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneManager(e.target.value)} required />
             <Input label="Website / Email" value={website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWebsite(e.target.value)} />
           </div>
        </Section>

        <Section title="Hotel Gallery" icon={ImageIcon}>
           <div className="flex flex-wrap gap-4 mb-4">
             {existingImages.map((url, i) => (
               <div key={`ext-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                 <Image src={url} alt="Hotel" fill className="object-cover" />
                 <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500"><X size={14}/></button>
               </div>
             ))}
             {newImages.map((img, i) => (
               <div key={`new-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                 <Image src={img.preview} alt="New Upload" fill className="object-cover" />
                 <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50 text-red-500"><X size={14}/></button>
               </div>
             ))}
             <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-500 transition-all">
                <Plus size={24} />
                <span className="text-[10px] font-bold uppercase mt-1">Upload</span>
             </button>
             <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
           </div>
           
           {!isPro && <div className="text-xs font-bold text-amber-600 mb-4 flex items-center gap-1"><Lock size={12}/> Free Plan: Limited to 1 photo.</div>}

           <Input label="Video URL (YouTube/Vimeo) - Optional" value={videoUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVideoUrl(e.target.value)} icon={<Video size={16}/>} />
        </Section>

        <Section title="Amenities & Facilities" icon={Star}>
           <div className={`relative ${!isPro ? 'opacity-60 pointer-events-none' : ''}`}>
             {!isPro && <ProOverlay text="Amenities Locked" />}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(AMENITIES_CATEGORIES).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-bold text-slate-900 mb-3">{category}</h4>
                    <div className="space-y-2">
                      {items.map(item => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={selectedAmenities[item] || false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmenityChange(item, e.target.checked)}
                          />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </Section>

        <Section title="Policies & Payment" icon={CreditCard}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <Input label="Check-In Time *" value={checkInTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckInTime(e.target.value)} placeholder="e.g. 12:00 PM" required />
             <Input label="Check-Out Time *" value={checkOutTime} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOutTime(e.target.value)} placeholder="e.g. 10:00 AM" required />
           </div>
           <Input label="Cancellation Policy *" value={cancellation} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancellation(e.target.value)} required />
           
           <div className="mt-6">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Accepted Payment Methods *</label>
             <div className="flex flex-wrap gap-2 mb-3">
               {paymentMethods.map(method => (
                 <span key={method} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                   {method} <button type="button" onClick={() => removePaymentMethod(method)}><X size={14}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={paymentInput}
                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentInput(e.target.value)}
                 onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAddPaymentMethod(e)}
                 placeholder="e.g. Zaad, E-Dahab, Cash"
                 className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500"
               />
               <button type="button" onClick={handleAddPaymentMethod} className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-slate-800 transition-colors">Add</button>
             </div>
           </div>
        </Section>

        <div className="pt-6 border-t border-slate-200 flex justify-end">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading ? <Loader2 className="animate-spin"/> : <CheckCircle />}
            {isEditing ? 'UPDATE HOTEL' : 'PUBLISH HOTEL'}
          </button>
        </div>

      </form>
    </div>
  );
}

// --- SUB-COMPONENTS WITH STRICT TYPES ---

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Icon size={20} strokeWidth={2.5}/></div>
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

function Input({ label, icon, ...props }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input 
          className={`w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 disabled:opacity-60 disabled:cursor-not-allowed ${icon ? 'pl-11' : ''}`}
          {...props} 
        />
      </div>
    </div>
  );
}

function ProOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-[2px] rounded-xl border border-amber-200 m-2">
       <div className="bg-white p-3 rounded-full shadow-lg text-amber-500 mb-2"><Lock size={24}/></div>
       <p className="font-black text-slate-900">{text}</p>
       <p className="text-xs font-bold text-amber-600 underline cursor-pointer hover:text-amber-700 mt-1">Upgrade to Premium</p>
    </div>
  );
}