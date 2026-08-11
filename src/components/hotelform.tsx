'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { auth, storage } from '../app/lib/firebase'; // Keep Auth client-side only for token generation
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  Building, MapPin, Phone, Info, Image as ImageIcon, CheckCircle, 
  X, Plus, Lock, Star, CreditCard, Video, Loader2, ShieldCheck, Settings, Accessibility
} from 'lucide-react';
// Google Maps Imports
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
// Location Selector Import
import LocationSelectorModal from '@/components/LocationSelectorModal';

const mapContainerStyle = { width: '100%', height: '300px' };
const defaultCenter = { lat: 9.560, lng: 44.068 };

// --- DATA CONSTANTS ---
const HOTEL_TYPES = [
  'Hotel', 'Luxury Hotel', 'Boutique Hotel', 'Business Hotel', 'City Hotel', 
  'Resort', 'Lodge', 'Motel', 'Inn', 'Hostel', 'Bed & Breakfast', 'Apartment Hotel',
  'Guesthouse', 'Villa', 'Eco Lodge', 'Other'
];

const AMENITIES_CATEGORIES: Record<string, string[]> = {
  'Connectivity': ['Free Wi-Fi', 'Wi-Fi in rooms', 'Wi-Fi in public areas', 'Paid Wi-Fi', 'Business internet'],
  'Food & Beverage': ['Restaurant', 'Bar / Lounge', 'Café', 'Breakfast available', 'Free breakfast', 'Paid breakfast', 'Room service', 'Breakfast buffet'],
  'Swimming & Wellness': ['Outdoor swimming pool', 'Indoor swimming pool', 'Spa', 'Sauna', 'Gym / Fitness center', 'Wellness center', 'Garden', 'Terrace'],
  'Parking & Transport': ['Free parking', 'Paid parking', 'Private parking', 'Valet parking', 'Airport shuttle', 'Airport transfer', 'Car rental', 'Bicycle rental'],
  'Guest Services': ['24-hour reception', 'Concierge', 'Luggage storage', 'Laundry service', 'Dry cleaning', 'Daily housekeeping', 'Currency exchange', 'Tour / excursion assistance', 'Wake-up service'],
  'Business & Events': ['Business center', 'Meeting rooms', 'Conference facilities', 'Banquet facilities', 'Event space'],
  'Accessibility': ['Wheelchair accessible', 'Accessible rooms', 'Accessible parking', 'Elevator', 'Accessible bathroom', 'Ground-floor rooms'],
  'Family': ['Family rooms', "Children's play area", "Children's meals", 'Baby cot available', 'Babysitting service']
};

interface HotelFormProps {
  hotelId?: string;
}

export default function HotelForm({ hotelId }: HotelFormProps) {
  const router = useRouter();
  const isEditing = !!hotelId;

  // Load Google Maps Script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  // --- STATE: UI & Loading ---
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  // --- STATE: User Plan ---
  const [userPlan, setUserPlan] = useState('free');
  const [userRole, setUserRole] = useState('user');
  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes(userPlan?.toLowerCase() || 'free') || userRole === 'admin';

  // --- STATE: Unified Form Data ---
  const [formData, setFormData] = useState({
    name: '', slug: '', type: 'Hotel', description: '', shortDescription: '',
    pricePerNight: '', roomsCount: '', rating: '3', videoUrl: '',
    location: { country: 'Somalia', city: '', area: '', address: '', landmark: '', lat: '', lng: '' },
    contact: { phoneCall: '', reservationsPhone: '', phoneWhatsapp: '', phoneManager: '', email: '', website: '', contactPreferences: ['Phone', 'WhatsApp'], receptionAvailability: '24-hour reception', receptionOpens: '', receptionCloses: '' },
    policies: { checkInTime: '02:00 PM', checkOutTime: '11:00 AM', earlyCheckIn: 'Available', lateCheckOut: 'Available', smokingPolicy: 'Non-smoking', petsPolicy: 'Pets not allowed', children: 'Children welcome', minCheckInAge: '18', idRequirement: 'Government-issued ID required', additionalRules: '' },
    cancellation: { defaultPolicy: 'Flexible', freeCancellationDays: '', cancellationCharge: '', noShowCharge: '', cancellationDetails: '' },
    payments: { acceptedMethods: ['Cash'], paymentAtProperty: 'Accepted', depositRequired: 'No', depositType: 'Percentage', depositAmount: '' },
    guestInfo: { languages: ['English', 'Somali'], highlights: [] as string[], nearbyAttractions: [] as string[] },
    accessibility: { notes: '', importantInfo: '' },
    settings: { visibility: 'Published', acceptBookings: 'Yes', instantBooking: 'Enabled', publicContactInfo: ['Reception phone', 'WhatsApp'] }
  });

  const [slugEdited, setSlugEdited] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({});
  
  // --- STATE: Media Files ---
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);
  const [logoFile, setLogoFile] = useState<{ file: File | null; preview: string }>({ file: null, preview: '' });
  const [coverFile, setCoverFile] = useState<{ file: File | null; preview: string }>({ file: null, preview: '' });
  const [paymentInput, setPaymentInput] = useState('');
  
  const galleryRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // --- STATE: Helpers ---
  const updateForm = (section: keyof typeof formData | null, field: string, value: any) => {
    if (section) {
      setFormData(f => ({ ...f, [section]: { ...(f[section as keyof typeof f] as any), [field]: value } }));
    } else {
      setFormData(f => ({ ...f, [field]: value }));
    }
  };

  const handleArrayToggle = (section: keyof typeof formData, field: string, value: string) => {
    const current = (formData[section] as any)[field] as string[];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    updateForm(section, field, updated);
  };

  // --- FETCH USER PLAN & HOTEL DATA VIA SECURE API ---
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("Not authenticated");
        const idToken = await user.getIdToken();

        // Fetch User Profile Plan/Role via API
        const userRes = await fetch(`/api/users?uid=${user.uid}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        const userData = await userRes.json();
        if (userData.success || userData.user) {
          const u = userData.user || userData;
          setUserPlan(u.planTier || 'free');
          setUserRole(u.role || 'user');
        }

        // Fetch Hotel Data if Editing
        if (isEditing && hotelId) {
          const hotelRes = await fetch(`/api/hotels?id=${hotelId}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const hotelDataJson = await hotelRes.json();
          const data = hotelDataJson.hotel || hotelDataJson;

          if (data && (data.name || data._id || data.id)) {
            setFormData(prev => ({
              ...prev,
              name: data.name || '', slug: data.slug || '', type: data.type || 'Hotel',
              description: data.description || '', shortDescription: data.shortDescription || '',
              pricePerNight: data.pricePerNight?.toString() || '', roomsCount: data.roomsCount?.toString() || '',
              videoUrl: data.videoUrl || '',
              location: { ...prev.location, ...data.location, lat: data.location?.latDisplay || '', lng: data.location?.lngDisplay || '' },
              contact: { ...prev.contact, ...data.contact },
              policies: { ...prev.policies, ...data.policies },
              cancellation: { ...prev.cancellation, ...data.cancellation },
              payments: { ...prev.payments, ...data.payments },
              guestInfo: { ...prev.guestInfo, ...data.guestInfo },
              accessibility: { ...prev.accessibility, ...data.accessibility },
              settings: { ...prev.settings, ...data.settings },
            }));
            setSlugEdited(true);
            setExistingImages(data.images || []);
            setSelectedAmenities(data.amenities || {});
            if(data.media?.logo) setLogoFile({ file: null, preview: data.media.logo });
            if(data.media?.coverPhoto) setCoverFile({ file: null, preview: data.media.coverPhoto });
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
    if (!slugEdited && formData.name) {
      setFormData(f => ({ ...f, slug: f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
    }
  }, [formData.name, slugEdited]);

  // --- HANDLERS ---
  const handleAddPaymentMethod = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (paymentInput.trim() && !formData.payments.acceptedMethods.includes(paymentInput.trim())) {
      updateForm('payments', 'acceptedMethods', [...formData.payments.acceptedMethods, paymentInput.trim()]);
      setPaymentInput('');
    }
  };

  const uploadSingleFile = async (fileObj: { file: File | null; preview: string }, path: string) => {
    if (!fileObj.file) return fileObj.preview; 
    const fileRef = ref(storage, `hotel_images/${path}_${Date.now()}_${fileObj.file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
    await uploadBytes(fileRef, fileObj.file);
    return await getDownloadURL(fileRef);
  };

  const handleDeleteExistingImage = async (url: string, index: number) => {
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      }
    } catch (error) {
      console.error("Error deleting image from Firebase", error);
    }
    setExistingImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Must be logged in");
      const idToken = await user.getIdToken();

      if (existingImages.length === 0 && newImages.length === 0 && !coverFile.preview) {
        throw new Error("Please add at least a cover photo or gallery image.");
      }

      let allowedNewImages = newImages;
      if (!isPro) allowedNewImages = newImages.slice(0, Math.max(0, 2 - existingImages.length)); // Free plan limit

      let finalImageUrls = [...existingImages];
      for (const img of allowedNewImages) {
        const fileRef = ref(storage, `hotel_images/gallery_${Date.now()}_${img.file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
        await uploadBytes(fileRef, img.file);
        finalImageUrls.push(await getDownloadURL(fileRef));
      }

      const logoUrl = await uploadSingleFile(logoFile, 'logo');
      const coverUrl = await uploadSingleFile(coverFile, 'cover');

      const cleanedAmenities = Object.fromEntries(Object.entries(selectedAmenities).filter(([_, v]) => v === true));

      const hotelPayload = {
        id: hotelId,
        ...formData,
        pricePerNight: parseInt(formData.pricePerNight) || 0,
        roomsCount: parseInt(formData.roomsCount) || 0,
        images: finalImageUrls,
        media: { logo: logoUrl, coverPhoto: coverUrl },
        location: {
          ...formData.location,
          latDisplay: isPro ? formData.location.lat : null,
          lngDisplay: isPro ? formData.location.lng : null,
          gpsCoordinates: (formData.location.lat && formData.location.lng) ? `${formData.location.lat}, ${formData.location.lng}` : null,
        },
        amenities: isPro ? cleanedAmenities : {},
        planTierAtUpload: userPlan,
      };

      const endpoint = '/api/hotels';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(hotelPayload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save hotel.");

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
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{isEditing ? 'Edit Your Hotel' : 'Add New Property'}</h1>
        <p className="text-slate-500 mt-2 text-lg">Complete your property's information so guests can discover, understand, and book.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-8 font-bold flex items-center gap-3 border border-red-100 shadow-sm">
           <Info size={24}/> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10">
        
        {/* 1. Property Information */}
        <Section title="1. Property Information" icon={Building}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Hotel Name *" value={formData.name} onChange={(e) => updateForm(null, 'name', e.target.value)} required />
            <Input label="URL Slug *" value={formData.slug} onChange={(e) => { updateForm(null, 'slug', e.target.value); setSlugEdited(true); }} required />
            <Select label="Hotel Type *" value={formData.type} onChange={(e) => updateForm(null, 'type', e.target.value)} options={HOTEL_TYPES} />
            <Input label="Total Rooms *" type="number" value={formData.roomsCount} onChange={(e) => updateForm(null, 'roomsCount', e.target.value)} required />
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Short Description (Preview)</label>
              <textarea value={formData.shortDescription} onChange={(e) => updateForm(null, 'shortDescription', e.target.value)} maxLength={150} rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all resize-none" placeholder="Brief intro for search cards..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Property Description *</label>
              <textarea value={formData.description} onChange={(e) => updateForm(null, 'description', e.target.value)} rows={5} required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all resize-none" placeholder="Detailed description of your property..." />
            </div>
          </div>
        </Section>

        {/* 2. Location */}
        <Section title="2. Location" icon={MapPin}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="flex flex-col">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Country, City & District *</label>
               <button type="button" onClick={() => setIsLocationModalOpen(true)} className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-left flex items-center justify-between transition-colors">
                 <span className={formData.location.city ? 'text-slate-900' : 'text-slate-400'}>{formData.location.city ? `${formData.location.area}, ${formData.location.city}, ${formData.location.country}` : 'Select Location...'}</span>
                 <MapPin size={18} className="text-slate-400" />
               </button>
               <LocationSelectorModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSelect={(res) => { updateForm('location', 'country', res.country || 'Somalia'); updateForm('location', 'city', res.city || ''); updateForm('location', 'area', res.district || ''); }} lang="en" />
             </div>
             <Input label="Street Address" value={formData.location.address} onChange={(e) => updateForm('location', 'address', e.target.value)} placeholder="e.g. Main Street 123" />
             <Input label="Landmark" value={formData.location.landmark} onChange={(e) => updateForm('location', 'landmark', e.target.value)} placeholder="Nearby well-known building or road" />
           </div>
           
           <div className={`p-5 rounded-3xl border-2 border-dashed ${isPro ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50 relative overflow-hidden'}`}>
             {!isPro && <ProOverlay text="Exact GPS Location Locked" />}
             <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Exact Location (Set on Map)</label>
             {!isPro ? (
               <div className="w-full h-[300px] bg-amber-100/50 rounded-2xl flex items-center justify-center text-amber-600 font-bold">Requires Pro Plan</div>
             ) : !isLoaded ? (
               <div className="w-full h-[300px] bg-slate-100 rounded-2xl animate-pulse"></div>
             ) : (
               <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm relative z-0">
                 <GoogleMap mapContainerStyle={mapContainerStyle} center={formData.location.lat ? { lat: parseFloat(formData.location.lat), lng: parseFloat(formData.location.lng) } : defaultCenter} zoom={14} onClick={(e) => { if (e.latLng) { updateForm('location', 'lat', e.latLng.lat().toString()); updateForm('location', 'lng', e.latLng.lng().toString()); } }}>
                   {formData.location.lat && <Marker position={{ lat: parseFloat(formData.location.lat), lng: parseFloat(formData.location.lng) }} />}
                 </GoogleMap>
               </div>
             )}
          </div>
        </Section>

        {/* 3. Contact & Reservations */}
        <Section title="3. Contact & Reservations" icon={Phone}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <Input label="Reception Phone *" value={formData.contact.phoneCall} onChange={(e) => updateForm('contact', 'phoneCall', e.target.value)} required />
             <Input label="Reservations Phone" value={formData.contact.reservationsPhone} onChange={(e) => updateForm('contact', 'reservationsPhone', e.target.value)} />
             <Input label="WhatsApp Number" value={formData.contact.phoneWhatsapp} onChange={(e) => updateForm('contact', 'phoneWhatsapp', e.target.value)} />
             <Input label="Manager Phone" value={formData.contact.phoneManager} onChange={(e) => updateForm('contact', 'phoneManager', e.target.value)} />
             <Input label="Official Email *" value={formData.contact.email} onChange={(e) => updateForm('contact', 'email', e.target.value)} required type="email" />
             <Input label="Website" value={formData.contact.website} onChange={(e) => updateForm('contact', 'website', e.target.value)} />
             
             <div className="md:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">How should guests contact you?</label>
               <div className="flex gap-4">
                 {['Phone', 'WhatsApp', 'Email'].map(method => (
                   <label key={method} className="flex items-center gap-2 cursor-pointer">
                     <input type="checkbox" checked={formData.contact.contactPreferences.includes(method)} onChange={() => handleArrayToggle('contact', 'contactPreferences', method)} className="w-4 h-4 text-blue-600 rounded" />
                     <span className="text-sm font-medium">{method}</span>
                   </label>
                 ))}
               </div>
             </div>

             <Select label="Reception Availability" value={formData.contact.receptionAvailability} onChange={(e) => updateForm('contact', 'receptionAvailability', e.target.value)} options={['24-hour reception', 'Limited hours']} />
             
             {formData.contact.receptionAvailability === 'Limited hours' && (
               <div className="grid grid-cols-2 gap-4">
                 <Input label="Opens At" type="time" value={formData.contact.receptionOpens} onChange={(e) => updateForm('contact', 'receptionOpens', e.target.value)} />
                 <Input label="Closes At" type="time" value={formData.contact.receptionCloses} onChange={(e) => updateForm('contact', 'receptionCloses', e.target.value)} />
               </div>
             )}
           </div>
        </Section>

        {/* 4. Hotel Media */}
        <Section title="4. Hotel Media" icon={ImageIcon}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Hotel Logo (Square)</label>
               <ImageUploader file={logoFile} setFile={setLogoFile} inputRef={logoRef} />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Cover Photo (Search Results Card) *</label>
               <ImageUploader file={coverFile} setFile={setCoverFile} inputRef={coverRef} />
             </div>
           </div>

           <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Hotel Gallery (Exterior, Rooms, Facilities)</label>
           <div className="flex flex-wrap gap-4 mb-6">
             {existingImages.map((url, i) => (
               <div key={`ext-${i}`} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200">
                 <Image src={url} alt="Hotel" fill className="object-cover" />
                 <button type="button" onClick={() => handleDeleteExistingImage(url, i)} className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow hover:bg-red-50 text-red-500"><X size={14}/></button>
               </div>
             ))}
             {newImages.map((img, i) => (
               <div key={`new-${i}`} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200">
                 <Image src={img.preview} alt="Upload" fill className="object-cover" />
                 <button type="button" onClick={() => setNewImages(newImages.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow hover:bg-red-50 text-red-500"><X size={14}/></button>
               </div>
             ))}
             <button type="button" onClick={() => galleryRef.current?.click()} className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-all bg-slate-50/50">
                <Plus size={28} />
                <span className="text-[10px] font-bold uppercase mt-2 tracking-wider">Add Photos</span>
             </button>
             <input type="file" multiple accept="image/*" className="hidden" ref={galleryRef} onChange={(e) => {
               if (e.target.files) setNewImages(prev => [...prev, ...Array.from(e.target.files!).map(file => ({ file, preview: URL.createObjectURL(file) }))]);
             }} />
           </div>

           <Input label="Optional Promo Video URL" value={formData.videoUrl} onChange={(e) => updateForm(null, 'videoUrl', e.target.value)} icon={<Video size={18}/>} placeholder="YouTube or Vimeo link" />
        </Section>

        {/* 5. Amenities & Facilities */}
        <Section title="5. Amenities & Facilities" icon={Star}>
           <div className={`relative ${!isPro ? 'opacity-60 pointer-events-none' : ''}`}>
             {!isPro && <ProOverlay text="Advanced Amenities Locked" />}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                {Object.entries(AMENITIES_CATEGORIES).map(([category, items]) => (
                  <div key={category} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h4 className="font-bold text-slate-900 mb-4">{category}</h4>
                    <div className="space-y-3">
                      {items.map(item => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" checked={selectedAmenities[item] || false} onChange={(e) => setSelectedAmenities(prev => ({ ...prev, [item]: e.target.checked }))} />
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </Section>

        {/* 6. Property Policies */}
        <Section title="6. Property Policies" icon={ShieldCheck}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <Select label="Check-In Time *" value={formData.policies.checkInTime} onChange={(e) => updateForm('policies', 'checkInTime', e.target.value)} options={['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 'Flexible']} />
             <Select label="Check-Out Time *" value={formData.policies.checkOutTime} onChange={(e) => updateForm('policies', 'checkOutTime', e.target.value)} options={['10:00 AM', '11:00 AM', '12:00 PM', 'Flexible']} />
             <Select label="Early Check-In" value={formData.policies.earlyCheckIn} onChange={(e) => updateForm('policies', 'earlyCheckIn', e.target.value)} options={['Available', 'On request', 'Not available']} />
             <Select label="Late Check-Out" value={formData.policies.lateCheckOut} onChange={(e) => updateForm('policies', 'lateCheckOut', e.target.value)} options={['Available', 'On request', 'Not available']} />
             <Select label="Smoking Policy *" value={formData.policies.smokingPolicy} onChange={(e) => updateForm('policies', 'smokingPolicy', e.target.value)} options={['Non-smoking', 'Smoking allowed', 'Designated smoking areas']} />
             <Select label="Pets" value={formData.policies.petsPolicy} onChange={(e) => updateForm('policies', 'petsPolicy', e.target.value)} options={['Pets not allowed', 'Pets allowed', 'Pets allowed with charges', 'Service animals only']} />
             <Select label="Children" value={formData.policies.children} onChange={(e) => updateForm('policies', 'children', e.target.value)} options={['Children welcome', 'Adults only (18+)']} />
             <Select label="ID Requirement" value={formData.policies.idRequirement} onChange={(e) => updateForm('policies', 'idRequirement', e.target.value)} options={['Government-issued ID required', 'Passport required for foreigners', 'No ID required']} />
           </div>
           <div className="mt-4">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Additional Property Rules</label>
             <textarea value={formData.policies.additionalRules} onChange={(e) => updateForm('policies', 'additionalRules', e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all resize-none" placeholder="Add any important rules guests should know..." />
           </div>
        </Section>

        {/* 7. Payment & Cancellation */}
        <Section title="7. Payment & Cancellation" icon={CreditCard}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-100">
             <Select label="Default Cancellation Policy *" value={formData.cancellation.defaultPolicy} onChange={(e) => updateForm('cancellation', 'defaultPolicy', e.target.value)} options={['Flexible', 'Moderate', 'Strict', 'Non-refundable', 'Custom']} />
             
             {formData.cancellation.defaultPolicy === 'Custom' && (
               <>
                 <Input label="Free cancellation until (Days)" value={formData.cancellation.freeCancellationDays} onChange={(e) => updateForm('cancellation', 'freeCancellationDays', e.target.value)} type="number" />
                 <Input label="Cancellation Charge (%)" value={formData.cancellation.cancellationCharge} onChange={(e) => updateForm('cancellation', 'cancellationCharge', e.target.value)} type="number" />
                 <Input label="No-Show Charge (%)" value={formData.cancellation.noShowCharge} onChange={(e) => updateForm('cancellation', 'noShowCharge', e.target.value)} type="number" />
                 <div className="md:col-span-2">
                   <Input label="Custom Cancellation Details" value={formData.cancellation.cancellationDetails} onChange={(e) => updateForm('cancellation', 'cancellationDetails', e.target.value)} placeholder="Explain additional conditions..." />
                 </div>
               </>
             )}

             <Input label="Base Price / Night ($) *" value={formData.pricePerNight} onChange={(e) => updateForm(null, 'pricePerNight', e.target.value)} required type="number" />
             <Select label="Deposit Required?" value={formData.payments.depositRequired} onChange={(e) => updateForm('payments', 'depositRequired', e.target.value)} options={['No', 'Yes']} />
             
             {formData.payments.depositRequired === 'Yes' && (
               <>
                 <Select label="Deposit Type" value={formData.payments.depositType} onChange={(e) => updateForm('payments', 'depositType', e.target.value)} options={['Percentage', 'Fixed amount']} />
                 <Input label="Deposit Amount" value={formData.payments.depositAmount} onChange={(e) => updateForm('payments', 'depositAmount', e.target.value)} type="number" />
               </>
             )}
           </div>
           
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Accepted Payment Methods *</label>
             <div className="flex flex-wrap gap-2 mb-4">
               {formData.payments.acceptedMethods.map(method => (
                 <span key={method} className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                    {method} <button type="button" onClick={() => updateForm('payments', 'acceptedMethods', formData.payments.acceptedMethods.filter(m => m !== method))}><X size={14}/></button>
                 </span>
               ))}
             </div>
             <div className="flex gap-3">
               <input type="text" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddPaymentMethod(e)} placeholder="e.g. ZAAD, E-Dahab, Credit Card..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
               <button type="button" onClick={handleAddPaymentMethod} className="bg-slate-900 text-white px-8 rounded-2xl font-bold hover:bg-slate-800 transition-colors">Add Method</button>
             </div>
           </div>
        </Section>

        {/* 8. Guest-Facing Information */}
        <Section title="8. Guest-Facing Information" icon={Info}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Languages Spoken by Staff</label>
              <div className="flex flex-wrap gap-4">
                {['English', 'Arabic', 'Somali', 'French', 'Swahili'].map(lang => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.guestInfo.languages.includes(lang)} onChange={() => handleArrayToggle('guestInfo', 'languages', lang)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Property Highlights (Select up to 3)</label>
              <div className="flex flex-wrap gap-4">
                {['Great location', 'Family-friendly', 'Business-friendly', 'Airport access', 'Beach access', 'City center', 'Excellent dining', 'Quiet property'].map(highlight => (
                  <label key={highlight} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" disabled={!formData.guestInfo.highlights.includes(highlight) && formData.guestInfo.highlights.length >= 3} checked={formData.guestInfo.highlights.includes(highlight)} onChange={() => handleArrayToggle('guestInfo', 'highlights', highlight)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm font-medium">{highlight}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 9. Extra Info & Settings */}
        <Section title="9. Settings & Accessibility" icon={Settings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Select label="Property Visibility" value={formData.settings.visibility} onChange={(e) => updateForm('settings', 'visibility', e.target.value)} options={['Published', 'Draft', 'Temporarily hidden']} />
            <Select label="Instant Booking" value={formData.settings.instantBooking} onChange={(e) => updateForm('settings', 'instantBooking', e.target.value)} options={['Enabled', 'Requires Approval']} />
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Accessibility size={16}/> Accessibility Notes & Important Info</label>
              <textarea value={formData.accessibility.notes} onChange={(e) => updateForm('accessibility', 'notes', e.target.value)} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all resize-none" placeholder="e.g. Construction taking place, specific elevator dimensions..." />
            </div>
          </div>
        </Section>

        {/* Action Bar */}
        <div className="sticky bottom-6 z-40 bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/60 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-500">
            <span className="font-black text-slate-900">{formData.name || 'Your Hotel'}</span> • {existingImages.length + newImages.length + (coverFile.preview ? 1 : 0)} Media Files • {Object.values(selectedAmenities).filter(Boolean).length} Amenities
          </div>
          <button type="submit" disabled={isLoading} className="w-full md:w-auto bg-blue-600 text-white px-12 py-4 rounded-2xl font-black text-lg hover:bg-blue-700 hover:scale-[1.02] shadow-[0_8px_30px_rgb(37,99,235,0.25)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100">
            {isLoading ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle size={24} />}
            {isEditing ? 'Save Changes' : 'Publish Property'}
          </button>
        </div>

      </form>
    </div>
  );
}

// --- SUB-COMPONENTS WITH STRICT INTERFACES ---

interface SectionProps {
  title: string;
  icon: React.ElementType<any>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100/60 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3.5 bg-blue-50/80 rounded-2xl text-blue-600"><Icon size={24} strokeWidth={2.5}/></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
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
          className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${icon ? 'pl-12' : ''}`} 
          {...props} 
        />
      </div>
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[];
}

function Select({ label, options, ...props }: SelectProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
      <select 
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer appearance-none" 
        {...props}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface FileObject {
  file: File | null;
  preview: string;
}

interface ImageUploaderProps {
  file: FileObject;
  setFile: React.Dispatch<React.SetStateAction<FileObject>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function ImageUploader({ file, setFile, inputRef }: ImageUploaderProps) {
  return (
    <div className="relative">
      {file.preview ? (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-slate-200 group">
          <Image src={file.preview} alt="Upload" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" onClick={() => setFile({ file: null, preview: '' })} className="bg-red-500 text-white p-2 rounded-full"><X size={20}/></button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-blue-500 transition-all bg-slate-50/50">
          <Plus size={32} className="mb-2 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Upload Image</span>
        </button>
      )}
      <input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={(e) => {
        if (e.target.files?.[0]) setFile({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) });
      }} />
    </div>
  );
}

interface ProOverlayProps {
  text: string;
}

function ProOverlay({ text }: ProOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-[2rem] border border-amber-200/50 m-2">
       <div className="bg-white p-4 rounded-full shadow-xl text-amber-500 mb-3 border border-amber-100"><Lock size={28}/></div>
       <p className="font-black text-lg text-slate-900">{text}</p>
       <p className="text-sm font-bold text-amber-600 underline cursor-pointer hover:text-amber-700 mt-2">Upgrade to Pro to Unlock</p>
    </div>
  );
}