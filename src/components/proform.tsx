'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { auth, storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  Save, ArrowLeft, Upload, MapPin, Building, Tags, 
  Phone, CheckCircle, Percent, Video, Home, Lock, 
  Image as ImageIcon, Users, X, RefreshCw,
  FileText
} from 'lucide-react';
import LocationSelectorModal from '@/components/LocationSelectorModal';

const mapContainerStyle = { width: '100%', height: '300px' };
const defaultCenter = { lat: 9.560, lng: 44.068 };

interface CompletePropertyFormProps {
  currentUserUid: string;
  existingProperty?: any; 
  userPlan: string;
  tenants: any[];
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function CompletePropertyForm({ currentUserUid, existingProperty, userPlan, tenants, onCancel, onSuccess }: CompletePropertyFormProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const isPro = ['pro', 'premium', 'agent_pro', 'admin'].includes(userPlan?.toLowerCase() || 'free');

  const [isSaving, setIsSaving] = useState(false);
  const [formImages, setFormImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [dragItem, setDragItem] = useState<{type: 'existing' | 'new', index: number} | null>(null);

  const [formData, setFormData] = useState({
    title: '', slug: '', transactionType: 'Rent', category: 'House',
    status: 'Available', price: 0, currency: 'USD', negotiable: false,
    location: { country: 'Somalia', city: '', area: '', address: '', gpsCoordinates: '', visibility: 'Exact' },
    details: { size: 0, bedrooms: 0, bathrooms: 0, livingRooms: 0, kitchen: 0, rooms: 0, floorLevel: 0, totalFloors: 0, parkingSpaces: 0, shopCount: 0, workspaceArea: 0, seatingCapacity: 0, roadAccess: 'Paved', yearBuilt: '', condition: 'New', furnishing: 'Unfurnished' },
    rentalDetails: { period: 'Monthly', deposit: 0, minPeriod: '', utilitiesIncluded: false, availableFrom: '', tenantId: '', tenantName: '', tenantPhone: '' },
    saleDetails: { pricePerSqm: 0, paymentTerms: '', ownershipStatus: '' },
    videoUrl: '', virtualTourUrl: '', floorPlanUrl: '',
    description: '', highlights: [] as string[],
    amenities: { general: [] as string[], utilities: [] as string[], security: [] as string[], parking: [] as string[], kitchen: [] as string[] },
    discount: { enabled: false, originalPrice: 0, percentage: 0 },
    contact: { person: '', phone: '', whatsapp: '', email: '', preferredMethod: 'Both' },
    documents: [] as any[],
    featured: false,
    boosted: false,
  });

  // Populate data on edit
  useEffect(() => {
    if (existingProperty) {
      setFormData(prev => ({
        ...prev,
        title: existingProperty.title || '',
        slug: existingProperty.slug || '',
        transactionType: existingProperty.isForSale ? 'Sale' : 'Rent',
        category: existingProperty.type || existingProperty.propertyType || 'House',
        price: existingProperty.price || 0,
        currency: existingProperty.currency || 'USD',
        negotiable: existingProperty.negotiable || false,
        description: existingProperty.description || '',
        videoUrl: existingProperty.videoUrl || '',
        location: {
          ...prev.location,
          city: existingProperty.location?.city || '',
          area: existingProperty.location?.area || '',
          gpsCoordinates: existingProperty.location?.gpsCoordinates || '',
          visibility: existingProperty.location?.visibility || 'Exact'
        },
        details: {
          ...prev.details,
          size: existingProperty.area || existingProperty.details?.size || existingProperty.features?.size || 0,
          bedrooms: existingProperty.bedrooms || existingProperty.details?.bedrooms || existingProperty.features?.bedrooms || 0,
          bathrooms: existingProperty.bathrooms || existingProperty.details?.bathrooms || existingProperty.features?.bathrooms || 0,
          rooms: existingProperty.features?.rooms || 0,
          floorLevel: existingProperty.features?.floorLevel || 0,
          totalFloors: existingProperty.features?.floors || 0,
          shopCount: existingProperty.features?.shopCount || 0,
          workspaceArea: existingProperty.features?.workspaceArea || 0,
          seatingCapacity: existingProperty.features?.seatingCapacity || 0,
          roadAccess: existingProperty.features?.roadAccess || 'Paved',
        },
        rentalDetails: {
          ...prev.rentalDetails,
          ...existingProperty.rentalDetails,
          tenantId: existingProperty.tenantId || '',
          tenantName: existingProperty.tenantName || '',
          tenantPhone: existingProperty.tenantPhone || '',
        },
        saleDetails: existingProperty.saleDetails || prev.saleDetails,
        contact: existingProperty.contact || prev.contact,
        discount: {
          enabled: existingProperty.hasDiscount || false,
          originalPrice: existingProperty.discountPrice || 0,
          percentage: 0
        },
        amenities: {
          general: ['Furnished', 'Balcony', 'Garden', 'Terrace', 'Pool'].filter(a => (existingProperty.amenities || []).includes(a)),
          utilities: ['Water Available', 'Electricity', 'Generator', 'Solar', 'Internet'].filter(a => (existingProperty.amenities || []).includes(a)),
          security: ['Gate', 'Security Guard', 'CCTV', 'Fenced Compound'].filter(a => (existingProperty.amenities || []).includes(a)),
          parking: ['Parking', 'Garage'].filter(a => (existingProperty.amenities || []).includes(a)),
          kitchen: [] 
        }
      }));
      setExistingImages(existingProperty.images || []);
    }
  }, [existingProperty]);

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex((ref) => ref === entry.target);
            if (index !== -1) {
              setActiveStep(index + 1);
            }
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' } 
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToStep = (stepId: number) => {
    const el = sectionRefs.current[stepId - 1];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for navbar
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDeleteExistingImage = async (url: string, index: number) => {
    try {
      if (url.includes('firebasestorage.googleapis.com')) {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      }
    } catch (error) { console.error("Error deleting image", error); }
    setExistingImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const currentTotal = formImages.length + existingImages.length;
      if (!isPro && currentTotal + filesArray.length > 1) {
        alert("Free plan is limited to 1 image. Please upgrade for unlimited uploads.");
        return;
      }
      setFormImages(prev => [...prev, ...filesArray]);
    }
  };

  const handleSave = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!isPro && formData.description.length > 100) {
      alert("Description too long for Free Plan (Max 100 chars).");
      return;
    }
    if (existingImages.length === 0 && formImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const uploadedUrls = [...existingImages];
      for (const file of formImages) {
        const fileRef = ref(storage, `property_images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
        await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(fileRef);
        uploadedUrls.push(downloadUrl);
      }

      const uploadedDocUrls = [];
      if (existingProperty?.documents && Array.isArray(existingProperty.documents)) {
        uploadedDocUrls.push(...existingProperty.documents);
      }
      for (const file of formData.documents) {
        if (file instanceof File) {
          const docRef = ref(storage, `property_docs/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
          await uploadBytes(docRef, file);
          const docUrl = await getDownloadURL(docRef);
          uploadedDocUrls.push({ name: file.name, url: docUrl });
        }
      }

      const payload = {
        ...(existingProperty?.id ? { id: existingProperty.id } : {}),
        ...formData,
        images: uploadedUrls,
        documents: uploadedDocUrls,
        agentId: currentUserUid,
        isForSale: formData.transactionType === 'Sale',
        isArchived: isDraft,
        tenantId: formData.rentalDetails.tenantId,
        tenantName: formData.rentalDetails.tenantName,
        tenantPhone: formData.rentalDetails.tenantPhone,
      };

      const endpoint = '/api/properties';
      const method = existingProperty?.id ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save property");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving property.");
    } finally {
      setIsSaving(false);
    }
  };

  const STEPS = [
    { id: 1, label: 'Basic Details', icon: Building },
    { id: 2, label: 'Location', icon: MapPin },
    { id: 3, label: 'Details', icon: Home },
    { id: 4, label: formData.transactionType === 'Rent' ? 'Rental Info' : 'Sale Info', icon: Tags },
    { id: 5, label: 'Media & Docs', icon: ImageIcon },
    { id: 6, label: 'Promo & Contact', icon: Phone },
    { id: 7, label: 'Review & Publish', icon: CheckCircle },
  ];

  const isResidential = ['House', 'Apartment', 'Villa', 'Studio'].includes(formData.category);
  const isCommercial = ['Office', 'Business', 'Mall'].includes(formData.category);
  const isHall = formData.category === 'Hall';
  const isLand = formData.category === 'Land';

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Header Actions */}
      <div className="flex justify-between items-center px-2">
        <button onClick={onCancel} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button type="button" onClick={(e) => handleSave(e, true)} disabled={isSaving} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
          Save Draft
        </button>
      </div>

      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-4 px-2 flex overflow-x-auto gap-2 no-scrollbar">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button 
              key={step.id} 
              type="button" 
              onClick={() => scrollToStep(step.id)} 
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive ? 'bg-[#0065eb] text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} />
              <span>{step.id}. {step.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Form Content */}
      <main className="flex-1 px-2">
        <form onSubmit={(e) => handleSave(e, false)} className="space-y-12">

          {/* STEP 1: Basic Details */}
          <section id="step-1" ref={(el) => { sectionRefs.current[0] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Building className="text-[#0065eb]" /> 1. Basic Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Property Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Modern 3 Bedroom House" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Transaction Type *</label>
                <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                  <option value="Rent">For Rent</option>
                  <option value="Sale">For Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category *</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none">
                  {['House', 'Apartment', 'Villa', 'Studio', 'Office', 'Business', 'Mall', 'Land', 'Hall'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price & Currency *</label>
                <div className="flex gap-2">
                  <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-1/3 bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none">
                    {['USD', 'SLSH', 'ETB', 'EUR', 'KES'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input required type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-2/3 bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Property Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Sold">Sold</option>
                  <option value="Rented">Rented</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price Negotiable?</label>
                <select value={formData.negotiable ? 'Yes' : 'No'} onChange={e => setFormData({...formData, negotiable: e.target.value === 'Yes'})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </section>

          {/* STEP 2: Location */}
          <section id="step-2" ref={(el) => { sectionRefs.current[1] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <MapPin className="text-[#0065eb]" /> 2. Location
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City & District *</label>
                  <button type="button" onClick={() => setIsLocationModalOpen(true)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-sm font-bold text-left flex justify-between items-center">
                    <span className={formData.location.city ? 'text-slate-900' : 'text-slate-400'}>
                      {formData.location.city ? `${formData.location.area}, ${formData.location.city}` : 'Select Location...'}
                    </span>
                    <MapPin size={18} className="text-[#0065eb]" />
                  </button>
                  <LocationSelectorModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSelect={(res) => setFormData({...formData, location: {...formData.location, country: res.country || 'Somalia', city: res.city || '', area: res.district || ''}})} lang="en" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Street Address / Landmark</label>
                  <input type="text" value={formData.location.address || ''} onChange={e => setFormData({...formData, location: {...formData.location, address: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. Near Mansoor Hotel (Optional)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location Visibility</label>
                  <select value={formData.location.visibility} onChange={e => setFormData({...formData, location: {...formData.location, visibility: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                    <option value="Exact">Exact Map Pin</option>
                    <option value="Approximate">Approximate Area Only</option>
                    <option value="Hide">Hide from Public</option>
                  </select>
                </div>
              </div>
              <div className="relative mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Exact Location (Tap Map to Drop Pin)</label>
                {!isPro ? (
                  <div className="w-full h-[300px] bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                    <Lock size={32} className="mb-2 text-slate-300" />
                    <span className="font-bold">Upgrade to Pro to map GPS Pins</span>
                  </div>
                ) : !isLoaded ? (
                  <div className="w-full h-[300px] bg-slate-100 rounded-xl flex items-center justify-center animate-pulse border-2 border-slate-200">Loading Map...</div>
                ) : (
                  <div className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm h-[300px]">
                    <GoogleMap 
                      mapContainerStyle={mapContainerStyle} 
                      center={formData.location.gpsCoordinates ? { lat: parseFloat(formData.location.gpsCoordinates.split(',')[0]), lng: parseFloat(formData.location.gpsCoordinates.split(',')[1]) } : defaultCenter} 
                      zoom={13}
                      onClick={(e) => { if (e.latLng) setFormData({...formData, location: {...formData.location, gpsCoordinates: `${e.latLng.lat()}, ${e.latLng.lng()}`}}); }}
                    >
                      {formData.location.gpsCoordinates && (
                        <Marker position={{ lat: parseFloat(formData.location.gpsCoordinates.split(',')[0]), lng: parseFloat(formData.location.gpsCoordinates.split(',')[1]) }} />
                      )}
                    </GoogleMap>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STEP 3: Details */}
          <section id="step-3" ref={(el) => { sectionRefs.current[2] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
             <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Home className="text-[#0065eb]" /> 3. Details
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Size (m²)</label>
                 <input type="number" value={formData.details.size || ''} onChange={e => setFormData({...formData, details: {...formData.details, size: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
               </div>
               
               {isResidential && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bedrooms</label>
                     <input type="number" value={formData.details.bedrooms || ''} onChange={e => setFormData({...formData, details: {...formData.details, bedrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bathrooms</label>
                     <input type="number" value={formData.details.bathrooms || ''} onChange={e => setFormData({...formData, details: {...formData.details, bathrooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rooms / Units</label>
                     <input type="number" value={formData.details.rooms || ''} onChange={e => setFormData({...formData, details: {...formData.details, rooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floor Level</label>
                     <input type="number" value={formData.details.floorLevel || ''} onChange={e => setFormData({...formData, details: {...formData.details, floorLevel: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="Ground = 0" />
                   </div>
                 </>
               )}

               {isCommercial && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Floors</label>
                     <input type="number" value={formData.details.totalFloors || ''} onChange={e => setFormData({...formData, details: {...formData.details, totalFloors: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Shop Count</label>
                     <input type="number" value={formData.details.shopCount || ''} onChange={e => setFormData({...formData, details: {...formData.details, shopCount: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Workspace Area (m²)</label>
                     <input type="number" value={formData.details.workspaceArea || ''} onChange={e => setFormData({...formData, details: {...formData.details, workspaceArea: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                 </>
               )}

               {isHall && (
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Seating Capacity</label>
                   <input type="number" value={formData.details.seatingCapacity || ''} onChange={e => setFormData({...formData, details: {...formData.details, seatingCapacity: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                 </div>
               )}

               {isResidential && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Living Rooms</label>
                     <input type="number" value={formData.details.livingRooms || ''} onChange={e => setFormData({...formData, details: {...formData.details, livingRooms: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Kitchen</label>
                     <input type="number" value={formData.details.kitchen || ''} onChange={e => setFormData({...formData, details: {...formData.details, kitchen: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                   </div>
                 </>
               )}
               
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Parking Spaces</label>
                 <input type="number" value={formData.details.parkingSpaces || ''} onChange={e => setFormData({...formData, details: {...formData.details, parkingSpaces: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year Built</label>
                 <input type="text" value={formData.details.yearBuilt || ''} onChange={e => setFormData({...formData, details: {...formData.details, yearBuilt: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. 2022" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Condition</label>
                 <select value={formData.details.condition} onChange={e => setFormData({...formData, details: {...formData.details, condition: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                   <option value="New">New</option>
                   <option value="Good">Good</option>
                   <option value="Needs Renovation">Needs Renovation</option>
                 </select>
               </div>
               {isResidential && (
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Furnishing</label>
                   <select value={formData.details.furnishing} onChange={e => setFormData({...formData, details: {...formData.details, furnishing: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                     <option value="Unfurnished">Unfurnished</option>
                     <option value="Semi-Furnished">Semi-Furnished</option>
                     <option value="Furnished">Furnished</option>
                   </select>
                 </div>
               )}

               {(isCommercial || isLand) && (
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Road Access</label>
                   <select value={formData.details.roadAccess} onChange={e => setFormData({...formData, details: {...formData.details, roadAccess: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                     <option value="Paved">Paved</option>
                     <option value="Gravel">Gravel</option>
                     <option value="Dirt">Dirt</option>
                   </select>
                 </div>
               )}

               <div className="col-span-2 md:col-span-4 mt-6 pt-6 border-t border-slate-100">
                 <h3 className="font-bold text-slate-900 mb-4">Features & Amenities</h3>
                 <div className="flex flex-wrap gap-2">
                   {[
                     { cat: 'general', items: ['Furnished', 'Balcony', 'Garden', 'Terrace', 'Pool'] },
                     { cat: 'utilities', items: ['Water Available', 'Electricity', 'Generator', 'Solar', 'Internet'] },
                     { cat: 'security', items: ['Gate', 'Security Guard', 'CCTV', 'Fenced Compound'] },
                     { cat: 'parking', items: ['Parking', 'Garage'] }
                   ].map(group => (
                     group.items.map(item => {
                       const isSelected = formData.amenities[group.cat as keyof typeof formData.amenities].includes(item);
                       return (
                         <button
                           key={item} type="button"
                           onClick={() => {
                             setFormData(prev => {
                               const current = prev.amenities[group.cat as keyof typeof formData.amenities] as string[];
                               return {
                                 ...prev,
                                 amenities: {
                                   ...prev.amenities,
                                   [group.cat]: isSelected ? current.filter(i => i !== item) : [...current, item]
                                 }
                               };
                             });
                           }}
                           className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                             isSelected ? 'bg-blue-50 border-blue-200 text-[#0065eb]' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                           }`}
                         >
                           {item}
                         </button>
                       );
                     })
                   ))}
                 </div>
               </div>
             </div>
          </section>

          {/* STEP 4: Rental / Sale Info */}
          <section id="step-4" ref={(el) => { sectionRefs.current[3] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Tags className="text-[#0065eb]" /> 4. {formData.transactionType === 'Rent' ? 'Rental Info' : 'Sale Info'}
            </h2>
            <div className="space-y-6">
              {formData.transactionType === 'Rent' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Rental Period</label>
                      <select value={formData.rentalDetails.period} onChange={e => setFormData({...formData, rentalDetails: {...formData.rentalDetails, period: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none">
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Security Deposit</label>
                      <input type="number" value={formData.rentalDetails.deposit || ''} onChange={e => setFormData({...formData, rentalDetails: {...formData.rentalDetails, deposit: Number(e.target.value)}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Min. Rental Period</label>
                      <input type="text" value={formData.rentalDetails.minPeriod || ''} onChange={e => setFormData({...formData, rentalDetails: {...formData.rentalDetails, minPeriod: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. 6 Months" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available From</label>
                      <input type="date" value={formData.rentalDetails.availableFrom || ''} onChange={e => setFormData({...formData, rentalDetails: {...formData.rentalDetails, availableFrom: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" />
                    </div>
                    <div className="col-span-2 flex items-center gap-3 mt-2">
                      <input type="checkbox" id="utilities" checked={formData.rentalDetails.utilitiesIncluded} onChange={e => setFormData({...formData, rentalDetails: {...formData.rentalDetails, utilitiesIncluded: e.target.checked}})} className="w-5 h-5 rounded text-[#0065eb]" />
                      <label htmlFor="utilities" className="text-sm font-bold text-slate-700 cursor-pointer">Utilities Included (Water/Electricity)</label>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Assign to Existing Tenant (Optional)</label>
                    {isPro ? (
                      <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select 
                          value={formData.rentalDetails.tenantId || ''} 
                          onChange={e => {
                            const tId = e.target.value;
                            const selectedTenant = tenants.find(t => t.id === tId);
                            setFormData({...formData, rentalDetails: {...formData.rentalDetails, tenantId: tId, tenantName: selectedTenant?.name || '', tenantPhone: selectedTenant?.phone || ''}});
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none appearance-none"
                        >
                          <option value="">-- No Tenant Assigned --</option>
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-slate-400 bg-white p-4 rounded-xl border border-slate-200">
                        <Lock size={18}/>
                        <span className="font-bold text-sm">Upgrade to Pro to manage tenants directly from listings</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price per m²</label>
                    <div className="w-full bg-slate-100 rounded-xl p-4 text-sm font-bold text-slate-500">
                      {formData.price > 0 && formData.details.size > 0 
                        ? `${formData.currency} ${(formData.price / formData.details.size).toLocaleString(undefined, {maximumFractionDigits: 2})}` 
                        : 'Auto-calculated'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Terms</label>
                    <input type="text" value={formData.saleDetails.paymentTerms} onChange={e => setFormData({...formData, saleDetails: {...formData.saleDetails, paymentTerms: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. Installments allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ownership Status</label>
                    <input type="text" value={formData.saleDetails.ownershipStatus} onChange={e => setFormData({...formData, saleDetails: {...formData.saleDetails, ownershipStatus: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. Freehold" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* STEP 5: Media & Docs */}
          <section id="step-5" ref={(el) => { sectionRefs.current[4] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <ImageIcon className="text-[#0065eb]" /> 5. Media & Docs
            </h2>
            <div className="space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingImages.map((img, i) => (
                  <div 
                    key={`exist-${i}`} draggable 
                    onDragStart={() => setDragItem({ type: 'existing', index: i })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragItem?.type === 'existing') {
                        const newArr = [...existingImages];
                        const [moved] = newArr.splice(dragItem.index, 1);
                        newArr.splice(i, 0, moved);
                        setExistingImages(newArr);
                      }
                    }}
                    className="relative h-24 rounded-xl overflow-hidden group border border-slate-200 cursor-move hover:ring-2 hover:ring-[#0065eb] transition-all"
                  >
                    <img src={img} alt="Property" className="object-cover w-full h-full pointer-events-none" />
                    {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#0065eb]/90 text-white text-[9px] font-black uppercase text-center py-1">Cover Photo</div>}
                    <button type="button" onClick={() => handleDeleteExistingImage(img, i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500"><X size={14}/></button>
                  </div>
                ))}
                {formImages.map((file, i) => (
                  <div 
                    key={`new-${i}`} draggable 
                    onDragStart={() => setDragItem({ type: 'new', index: i })}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragItem?.type === 'new') {
                        const newArr = [...formImages];
                        const [moved] = newArr.splice(dragItem.index, 1);
                        newArr.splice(i, 0, moved);
                        setFormImages(newArr);
                      }
                    }}
                    className="relative h-24 rounded-xl overflow-hidden group border border-slate-200 cursor-move hover:ring-2 hover:ring-[#0065eb] transition-all"
                  >
                    <img src={URL.createObjectURL(file)} alt="New" className="object-cover w-full h-full pointer-events-none" />
                    {i === 0 && existingImages.length === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#0065eb]/90 text-white text-[9px] font-black uppercase text-center py-1">Cover Photo</div>}
                    <button type="button" onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500"><X size={14}/></button>
                  </div>
                ))}
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-[#0065eb] hover:border-[#0065eb] hover:bg-blue-50 transition-colors">
                  <Upload size={20} className="mb-2" />
                  <span className="text-xs font-bold">Upload</span>
                </button>
                <input type="file" hidden multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} />
              </div>
              {!isPro && <p className="text-xs text-rose-500 font-bold">Free Plan Limit: 1 Image Max.</p>}

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Video Tour URL</label>
                {isPro ? (
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={formData.videoUrl || ''} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-slate-50 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none" placeholder="YouTube, TikTok, or MP4 link" />
                  </div>
                ) : (
                  <div className="relative opacity-60">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" disabled className="w-full bg-slate-100 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none cursor-not-allowed" placeholder="Upgrade to PRO to embed video tours" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Virtual Tour URL (3D/Matterport)</label>
                {isPro ? (
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={formData.virtualTourUrl || ''} onChange={e => setFormData({...formData, virtualTourUrl: e.target.value})} className="w-full bg-slate-50 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none" placeholder="Link to 3D Virtual Tour" />
                  </div>
                ) : (
                  <div className="relative opacity-60">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" disabled className="w-full bg-slate-100 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none cursor-not-allowed" placeholder="Upgrade to Premium for Virtual Tours" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Floor Plan Image URL</label>
                {isPro ? (
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={formData.floorPlanUrl || ''} onChange={e => setFormData({...formData, floorPlanUrl: e.target.value})} className="w-full bg-slate-50 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none" placeholder="Link to Floor Plan (Optional)" />
                  </div>
                ) : (
                  <div className="relative opacity-60">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" disabled className="w-full bg-slate-100 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none cursor-not-allowed" placeholder="Upgrade to PRO to add Floor Plans" />
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  Private Documents (Optional)
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-4">Upload property ownership or verification documents. These will NOT be visible to the public.</p>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.doc,.docx,image/*" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFormData(prev => ({ ...prev, documents: [...prev.documents, ...Array.from(e.target.files as FileList)] }));
                    }
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 transition-colors"
                />
                {formData.documents.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.documents.map((doc: any, idx: number) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        {doc.name}
                        <button type="button" onClick={() => setFormData(prev => ({...prev, documents: prev.documents.filter((_: any, i: number) => i !== idx)}))} className="hover:text-rose-500"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* STEP 6: Promo & Contact */}
          <section id="step-6" ref={(el) => { sectionRefs.current[5] = el; }} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <Phone className="text-[#0065eb]" /> 6. Promo & Contact
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description *</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} maxLength={isPro ? 5000 : 100} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none resize-none" placeholder="Describe the property..."></textarea>
                <div className="flex justify-end mt-1">
                  <span className={`text-xs font-bold ${!isPro && formData.description.length >= 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {formData.description.length} / {isPro ? 'Unlimited' : '100 (Free Plan)'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Key Highlights (Comma Separated)</label>
                <input 
                  type="text" 
                  value={formData.highlights.join(', ')} 
                  onChange={e => setFormData({...formData, highlights: e.target.value.split(',').map(h => h.trim()).filter(h => h.length > 0)})} 
                  className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" 
                  placeholder="e.g. Newly renovated, Close to main road, Large compound" 
                />
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-sm text-slate-900">Enable Discount Pricing</p>
                    <p className="text-xs text-slate-500 font-medium">Show a crossed-out original price to attract buyers.</p>
                  </div>
                  {isPro ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.discount.enabled} onChange={e => setFormData({...formData, discount: {...formData.discount, enabled: e.target.checked}})} />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  ) : (
                    <Lock size={16} className="text-slate-400" />
                  )}
                </div>
                {formData.discount.enabled && isPro && (
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Original Price ($) - Will be crossed out</label>
                      <input type="number" value={formData.discount.originalPrice || ''} onChange={e => setFormData({...formData, discount: {...formData.discount, originalPrice: Number(e.target.value)}})} className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none" placeholder="e.g. 500" />
                    </div>
                    <div className="w-full md:w-48 bg-rose-50 text-rose-600 flex flex-col justify-center items-center h-[52px] rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Discount</span>
                      <span className="font-black text-sm">
                        {formData.discount.originalPrice && formData.price && formData.discount.originalPrice > formData.price 
                          ? `${Math.round(((formData.discount.originalPrice - formData.price) / formData.discount.originalPrice) * 100)}% OFF` 
                          : '0% OFF'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-amber-900">Featured Property</p>
                    <p className="text-xs text-amber-700/70 font-medium">Pin to the top of search results.</p>
                  </div>
                  {isPro ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.featured || false} onChange={e => setFormData({...formData, featured: e.target.checked})} />
                      <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  ) : (
                    <Lock size={16} className="text-amber-500" />
                  )}
                </div>

                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-purple-900">Boost Listing</p>
                    <p className="text-xs text-purple-700/70 font-medium">Highlight in recommendation emails.</p>
                  </div>
                  {isPro ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.boosted || false} onChange={e => setFormData({...formData, boosted: e.target.checked})} />
                      <div className="w-11 h-6 bg-purple-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-purple-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  ) : (
                    <Lock size={16} className="text-purple-500" />
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Contact Person</label>
                    <input type="text" value={formData.contact.person} onChange={e => setFormData({...formData, contact: {...formData.contact, person: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="Agent or Owner Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                    <input type="tel" value={formData.contact.phone} onChange={e => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="+252..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp Number</label>
                    <input type="tel" value={formData.contact.whatsapp} onChange={e => setFormData({...formData, contact: {...formData.contact, whatsapp: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="+252..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                    <input type="email" value={formData.contact.email} onChange={e => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none" placeholder="agent@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preferred Contact Method</label>
                    <select value={formData.contact.preferredMethod} onChange={e => setFormData({...formData, contact: {...formData.contact, preferredMethod: e.target.value}})} className="w-full bg-slate-50 rounded-xl p-4 text-sm font-bold outline-none cursor-pointer">
                      <option value="Both">Phone & WhatsApp</option>
                      <option value="Phone">Phone Only</option>
                      <option value="WhatsApp">WhatsApp Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STEP 7: Review & Publish */}
          <section id="step-7" ref={(el) => { sectionRefs.current[6] = el; }} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm scroll-mt-28">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center justify-center gap-3">
              <CheckCircle className="text-green-500" /> 7. Review & Publish
            </h2>
            <div className="space-y-8">
              <div className="bg-white rounded-[24px] overflow-hidden shadow-lg border border-slate-100 max-w-sm mx-auto">
                <div className="h-56 relative bg-slate-200">
                  {existingImages.length > 0 ? (
                    <img src={existingImages[0]} alt="Cover" className="object-cover w-full h-full" />
                  ) : formImages.length > 0 ? (
                    <img src={URL.createObjectURL(formImages[0])} alt="Cover" className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold">No Cover Image</div>
                  )}
                  <div className="absolute top-4 left-4 bg-[#0065eb] text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md">
                    For {formData.transactionType}
                  </div>
                  {formData.discount.enabled && formData.discount.originalPrice > formData.price && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md">
                      Discounted
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h4 className="font-black text-slate-900 text-lg mb-1 truncate">{formData.title || 'Untitled Property'}</h4>
                  <p className="text-xs text-slate-500 font-bold mb-4 flex items-center gap-1"><MapPin size={14} className="text-[#0065eb]"/> {formData.location.area || 'Area'}, {formData.location.city || 'City'}</p>
                  
                  <div className="flex justify-between items-end mb-4 border-b border-slate-50 pb-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-2xl">{formData.currency} {formData.price ? formData.price.toLocaleString() : '0'}</span>
                        {formData.discount.enabled && formData.discount.originalPrice > formData.price && (
                          <span className="text-xs text-slate-400 line-through font-bold">{formData.currency} {formData.discount.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-slate-600 font-bold text-xs">
                    {['House', 'Apartment', 'Villa'].includes(formData.category) && (
                      <>
                        <span className="flex items-center gap-1.5"><Home size={14} className="text-slate-400"/> {formData.details.bedrooms} Beds</span>
                      </>
                    )}
                    <span className="flex items-center gap-1.5"><Building size={14} className="text-slate-400"/> {formData.details.size} m²</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <button type="submit" disabled={isSaving} className="px-10 py-4 rounded-xl font-bold text-lg bg-[#0065eb] disabled:opacity-50 text-white shadow-xl shadow-blue-500/30 hover:bg-[#0052c1] transition-transform hover:scale-105 flex items-center gap-2">
                  {isSaving ? <RefreshCw size={24} className="animate-spin" /> : <CheckCircle size={24} />} Publish Property Now
                </button>
              </div>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}