'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { auth } from '../../app/lib/firebase'; 
import { supabase } from '@/app/lib/supabase';
import { onAuthStateChanged, User } from 'firebase/auth';
import SharedChatComponent from '@/components/sharedchat';
import { 
  MapPin, MessageSquare, Calendar, ChevronLeft, ChevronRight, X, 
  ShieldCheck, Share2, Heart, Phone, Home, Ruler, 
  Loader2, CheckCircle, Lock, Download, 
  Briefcase, Building2, Expand, Star, 
  Video, BedDouble, Bath, Car, Sofa, CookingPot, CalendarDays,
  Activity, Bookmark, Info, AlertTriangle, Layers,
  Box, Zap, ShieldAlert, ListChecks, ArrowRight, Map
} from 'lucide-react';

// --- VERIFIED TYPES ---
// Strictly mapped to the proform.tsx submission payload and existing DB schema
export interface Property {
  id: string;
  slug?: string;
  title: string;
  price: number;
  currency?: string; 
  videoUrl?: string; 
  virtualTourUrl?: string;
  floorPlanUrl?: string;
  description: string;
  images: string[];
  agentId: string;
  location: { 
    country?: string; 
    city: string; 
    area: string; 
    address?: string; 
    lat?: number; 
    lng?: number; 
    gpsCoordinates?: string;
    visibility?: string;
  };
  features?: any; // Fallback for old schema
  details?: {
    size?: number; bedrooms?: number; bathrooms?: number; livingRooms?: number; 
    kitchen?: number; rooms?: number; floorLevel?: number; totalFloors?: number; 
    parkingSpaces?: number; shopCount?: number; workspaceArea?: number; 
    seatingCapacity?: number; roadAccess?: string; yearBuilt?: string; 
    condition?: string; furnishing?: string;
  };
  rentalDetails?: {
    period?: string; deposit?: number; minPeriod?: string; utilitiesIncluded?: boolean; availableFrom?: string;
  };
  saleDetails?: {
    pricePerSqm?: number; paymentTerms?: string; ownershipStatus?: string;
  };
  amenities?: {
    general?: string[]; utilities?: string[]; security?: string[]; parking?: string[]; kitchen?: string[];
  } | string[]; // Fallback for old schema
  type: string;
  category?: string;
  transactionType?: string;
  isForSale: boolean;
  status: string;
  contactPhone?: string;
  createdAt?: any;
}

export interface Agent {
  uid: string;
  slug?: string;
  name: string;
  email: string;
  photoUrl: string;
  phone: string;
  agencyName?: string;
  planTier?: 'free' | 'pro' | 'premium' | 'agent_pro';
}

// --- HELPER: CHECK PRO STATUS ---
const isAgentPro = (agent: Agent | null) => {
  if (!agent?.planTier) return false;
  return ['pro', 'premium', 'agent_pro'].includes(agent.planTier);
};

// =======================================================================
//  MODALS
// =======================================================================
const RestrictedModal = ({ isOpen, onClose, featureName }: { isOpen: boolean; onClose: () => void; featureName: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20}/></button>
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 mx-auto"><Lock size={28} /></div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Restricted Access</h3>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Direct {featureName} is disabled because this agent is not yet verified. Please use the <b>Request a Tour</b> form.</p>
        <button onClick={onClose} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-black transition-colors">Understood</button>
      </div>
    </div>
  );
};

// =======================================================================
//  MAIN COMPONENT
// =======================================================================
export default function PropertyDetailView({ initialProperty, initialAgent }: { initialProperty: Property; initialAgent: Agent | null; }) {
  const [activeImg, setActiveImg] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [property] = useState<Property>(initialProperty);
  const [agent] = useState<Agent | null>(initialAgent);
  const [related, setRelated] = useState<Property[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [tourLoading, setTourLoading] = useState(false);
  const [tourSuccess, setTourSuccess] = useState(false);
  const [tourData, setTourData] = useState({ name: '', phone: '', date: '', time: '' });

  const hasTrackedView = useRef(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const u = onAuthStateChanged(auth, (user) => setCurrentUser(user)); return () => u(); }, []);

  // API Analytics
  useEffect(() => {
    if (property && !hasTrackedView.current) {
      hasTrackedView.current = true;
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'view_property', agentId: property.agentId, propertyId: property.id })
      }).catch(err => console.error("Analytics View Error:", err));
    }
  }, [property]);

  const trackClick = (type: string) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: type, agentId: property.agentId, propertyId: property.id })
    }).catch(err => console.error("Analytics Click Error:", err));
  };

  // Fetch Related Properties (Same Transaction Type & City)
  useEffect(() => {
    if (property?.location?.city) {
      const fetchRelated = async () => {
        try {
          let { data: relatedData } = await supabase
            .from('properties')
            .select('*')
            .eq('location->>city', property.location.city)
            .eq('isForSale', property.isForSale)
            .in('status', ['Available', 'available', 'rented_out'])
            .limit(7);

          if (!relatedData || relatedData.length === 0) {
            const { data: altRelated } = await supabase
              .from('property')
              .select('*')
              .eq('location->>city', property.location.city)
              .limit(7);
            relatedData = altRelated;
          }

          if (relatedData) {
            setRelated(relatedData.map((d: any) => ({ id: d.id || d._id, ...d } as Property)).filter((p: Property) => p.id !== property.id).slice(0, 4));
          }
        } catch (e) { console.error("Error fetching related properties:", e); }
      }; 
      fetchRelated();
    }
  }, [property]);

  // Gallery Sliding Logic
  useEffect(() => { startSlideTimer(); return () => stopSlideTimer(); }, [activeImg]);
  const startSlideTimer = () => { stopSlideTimer(); autoSlideRef.current = setInterval(() => { setActiveImg(prev => (prev === (property.images?.length || 1) - 1 ? 0 : prev + 1)); }, 4000); };
  const stopSlideTimer = () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  const handleManualSlide = (idx: number) => { stopSlideTimer(); setActiveImg(idx); setTimeout(startSlideTimer, 5000); };
  const scroll = (direction: 'up' | 'down') => { if (scrollRef.current) { const amount = 320; scrollRef.current.scrollBy({ left: direction === 'down' ? amount : -amount, behavior: 'smooth' }); } };

  // Booking Submit Logic (Verified endpoint)
  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTourLoading(true);
    try {
      const generatedId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      const { error: tourError } = await supabase.from('tour_requests').insert([{
        _id: generatedId,
        propertyId: property.id,
        propertyName: property.title,
        agentId: property.agentId,
        userName: tourData.name,
        userPhone: tourData.phone,
        userId: currentUser?.uid || 'anonymous_web',
        date: tourData.date,
        time: tourData.time,
        timestamp: new Date().toISOString(),
        status: 'pending'
      }]);
      if (tourError) throw tourError;

      const agentPhone = isAgentPro(agent) ? (property.contactPhone || agent?.phone || "+252653227084") : "+252653227084";
      const msg = `Salaam, waxan rabaa inan dalbado booqasho guri: '${property.title}'.\nTaariikhda: ${tourData.date}\nSaacada: ${tourData.time}\nMagacaygu waa: ${tourData.name}`;
      window.open(`https://wa.me/${agentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      setTourSuccess(true);
      setTimeout(() => setTourSuccess(false), 5000);
      setTourData({ name: '', phone: '', date: '', time: '' });
    } catch (error) { 
      alert("Failed to submit booking."); 
    } finally { 
      setTourLoading(false); 
    }
  };

  // Safe Extractors mapped strictly to CompletePropertyForm details structure
  const details = property.details || {};
  const flatFeatures = property.features || {}; 
  
  // Safe Amenities Extractor
  const parseAmenities = () => {
    if (Array.isArray(property.amenities)) {
      return { utilities: [], security: [], propertyFeatures: property.amenities };
    }
    const am = property.amenities || {};
    return {
      utilities: am.utilities || [],
      security: am.security || [],
      propertyFeatures: [...(am.general || []), ...(am.parking || []), ...(am.kitchen || [])]
    };
  };
  const categorizedAmenities = parseAmenities();
  
  const images = property.images?.length ? property.images : ['https://placehold.co/800x600?text=No+Image'];
  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency || 'USD', maximumFractionDigits: 0 }).format(property.price || 0);
  const isVerified = isAgentPro(agent);

  if (!property || !property.id) return null; // Failsafe for invalid direct loads

  return (
    <div className="bg-[#FAFBFC] min-h-screen font-sans text-slate-900 pb-20 pt-[180px]">
       
      <RestrictedModal isOpen={!!restrictedFeature} onClose={() => setRestrictedFeature(null)} featureName={restrictedFeature || ''} />

      {/* ================= 1. PROPERTY HEADER ================= */}
      <div className="w-full bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm mb-6 -mt-[150px] relative z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col w-full md:w-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${property.isForSale ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {property.transactionType || (property.isForSale ? 'Sale' : 'Rent')}
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                {property.status || 'Available'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 truncate max-w-full md:max-w-2xl leading-tight">{property.title}</h1>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wide mt-1">
              <MapPin size={12} className="text-[#0065eb]" /> {property.location.area}, {property.location.city}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
             <button onClick={() => { navigator.share?.({ title: property.title, url: window.location.href }); }} className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 shadow-sm transition-colors"><Share2 size={18} /></button>
             <button onClick={() => setIsSaved(!isSaved)} className={`p-3 rounded-full border shadow-sm transition-colors ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}><Heart size={18} className={isSaved ? "fill-current" : ""} /></button>
          </div>
        </div>
      </div>

      {/* ================= MAIN 2-COLUMN LAYOUT ================= */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 mt-6">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start w-full">
          
          {/* ---------------------------------------------------------
              LEFT COLUMN (Property Information) 
          --------------------------------------------------------- */}
          <div className="w-full lg:w-[65%] flex flex-col gap-6 md:gap-8">
            
            {/* ROW 2 (Left): PROPERTY GALLERY */}
            <div className="bg-white rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              <div className="relative w-full h-[350px] md:h-[450px] rounded-[1.5rem] overflow-hidden group bg-slate-900 shadow-inner">
                <Image src={images[activeImg]} alt="Property Cover" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                
                {/* Media Tags Verified against proform.tsx */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 text-[10px] font-bold shadow-lg w-max">
                     <Image src="/camera-icon.svg" width={12} height={12} alt="photos" className="w-3 h-3 invert" /> {images.length} Photos
                   </span>
                   {property.videoUrl && (
                     <button onClick={() => setShowVideoModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0065eb]/90 text-white backdrop-blur-md border border-white/10 text-[10px] font-bold shadow-lg w-max hover:bg-[#0065eb] transition-colors">
                       <Video size={12} /> Video Tour
                     </button>
                   )}
                   {property.virtualTourUrl && (
                     <button onClick={() => window.open(property.virtualTourUrl, '_blank')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/90 text-white backdrop-blur-md border border-white/10 text-[10px] font-bold shadow-lg w-max hover:bg-purple-600 transition-colors">
                       <Box size={12} /> 3D Virtual Tour
                     </button>
                   )}
                   {property.floorPlanUrl && (
                     <button onClick={() => window.open(property.floorPlanUrl, '_blank')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 text-white backdrop-blur-md border border-white/10 text-[10px] font-bold shadow-lg w-max hover:bg-black transition-colors">
                       <Map size={12} /> Floor Plan
                     </button>
                   )}
                </div>

                {/* Arrows */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                  <button onClick={() => handleManualSlide(activeImg === 0 ? images.length - 1 : activeImg - 1)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/20 shadow-lg"><ChevronLeft size={18} /></button>
                  <button onClick={() => handleManualSlide(activeImg === images.length - 1 ? 0 : activeImg + 1)} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/20 shadow-lg"><ChevronRight size={18} /></button>
                </div>

                <div className="absolute bottom-6 right-6 z-20 hidden sm:block">
                  <button onClick={() => setShowGalleryModal(true)} className="px-5 py-2.5 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black/60 transition-all border border-white/10 shadow-xl"><Expand size={14}/> View Gallery</button>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 h-16 sm:h-20">
                {images.slice(0, 5).map((img, idx) => (
                  <div key={idx} onClick={() => handleManualSlide(idx)} className={`relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${activeImg === idx ? 'border-[#0065eb] ring-2 ring-[#0065eb]/20' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <Image src={img} alt="" fill className="object-cover" />
                  </div>
                ))}
                {images.length > 5 && (
                  <div onClick={() => setShowGalleryModal(true)} className="relative rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center cursor-pointer border-2 border-transparent hover:bg-slate-200 transition-colors hidden sm:flex">
                    <span className="text-slate-600 font-black text-sm">+{images.length - 5}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ROW 3 (Left): PROPERTY DETAILS & ABOUT */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Home size={20} className="text-[#0065eb]"/> Property Details</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                {/* Dynamically render ONLY verified existing values. Cards made 50% smaller. */}
                {(details.bedrooms || flatFeatures.bedrooms) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><BedDouble size={12}/> Bedrooms</span><span className="font-black text-slate-900 text-sm">{details.bedrooms || flatFeatures.bedrooms}</span></div>}
                {(details.bathrooms || flatFeatures.bathrooms) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Bath size={12}/> Bathrooms</span><span className="font-black text-slate-900 text-sm">{details.bathrooms || flatFeatures.bathrooms}</span></div>}
                {(details.size || flatFeatures.size) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Ruler size={12}/> Area (m²)</span><span className="font-black text-slate-900 text-sm">{details.size || flatFeatures.size}</span></div>}
                {((details.floorLevel || flatFeatures.floorLevel) ?? 0) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Layers size={12}/> Floor</span><span className="font-black text-slate-900 text-sm">{details.floorLevel || flatFeatures.floorLevel}</span></div>}
                {(details.totalFloors ?? 0) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Building2 size={12}/> Total Floors</span><span className="font-black text-slate-900 text-sm">{details.totalFloors}</span></div>}
                {(details.livingRooms ?? 0) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Sofa size={12}/> Living Rooms</span><span className="font-black text-slate-900 text-sm">{details.livingRooms}</span></div>}
                {(details.kitchen ?? 0) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><CookingPot size={12}/> Kitchens</span><span className="font-black text-slate-900 text-sm">{details.kitchen}</span></div>}
                {(details.parkingSpaces ?? 0) > 0 && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Car size={12}/> Parking</span><span className="font-black text-slate-900 text-sm">{details.parkingSpaces}</span></div>}
                {(details.yearBuilt) && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><CalendarDays size={12}/> Year Built</span><span className="font-black text-slate-900 text-sm">{details.yearBuilt}</span></div>}
                {(details.condition) && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Activity size={12}/> Condition</span><span className="font-black text-slate-900 text-sm leading-tight mt-0.5 truncate">{details.condition}</span></div>}
                {(details.furnishing) && <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5 border border-slate-100"><span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"><Sofa size={12}/> Furnishing</span><span className="font-black text-slate-900 text-sm leading-tight mt-0.5 truncate">{details.furnishing}</span></div>}
              </div>

              <hr className="border-slate-100 my-8" />
              
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">About This Home</h4>
              {property.description ? (
                <p className="text-slate-600 text-sm md:text-base leading-relaxed md:leading-loose whitespace-pre-line font-medium">
                  {property.description}
                </p>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-100 text-slate-500 font-medium text-sm rounded-2xl flex flex-col items-center justify-center text-center">
                  <Info size={24} className="mb-2 text-slate-300" />
                  No property description provided by the agent.
                </div>
              )}
            </div>

            {/* ROW 4 (Left): AMENITIES */}
            {(categorizedAmenities.utilities.length > 0 || categorizedAmenities.security.length > 0 || categorizedAmenities.propertyFeatures.length > 0) && (
              <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><ListChecks size={20} className="text-[#0065eb]"/> Amenities & Features</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {categorizedAmenities.utilities.length > 0 && (
                    <div>
                      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Zap size={14}/> Utilities</h4>
                      <ul className="space-y-3">
                        {categorizedAmenities.utilities.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={16} className="text-[#0065eb]"/> {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {categorizedAmenities.security.length > 0 && (
                    <div>
                      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Security</h4>
                      <ul className="space-y-3">
                        {categorizedAmenities.security.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={16} className="text-green-500"/> {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {categorizedAmenities.propertyFeatures.length > 0 && (
                    <div>
                      <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Box size={14}/> Features</h4>
                      <ul className="space-y-3">
                        {categorizedAmenities.propertyFeatures.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={16} className="text-[#0065eb]"/> {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ROW 5 (Left): AGENT PROFILE */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Briefcase size={20} className="text-[#0065eb]"/> About the Agent</h3>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 relative overflow-hidden border-2 border-slate-100 shrink-0 shadow-md">
                   {agent?.photoUrl ? <Image src={agent.photoUrl} alt={agent.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-3xl">{agent?.name?.[0]}</div>}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2 justify-center md:justify-start">
                    <h4 className="font-black text-slate-900 text-xl">{agent?.name || 'Loading...'}</h4>
                    {isVerified && <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-100 w-max mx-auto md:mx-0"><ShieldCheck size={12}/> Verified Agent</span>}
                  </div>
                  <p className="text-sm text-slate-500 font-bold mb-4">{agent?.agencyName || 'GuriUp Independent Agent'}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><MapPin size={14} className="text-slate-400"/> {property.location.city}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button onClick={() => { trackClick('click_whatsapp'); window.open(`https://wa.me/${(isVerified ? (property.contactPhone || agent?.phone) : '+252653227084')?.replace(/[^0-9]/g, '')}`, '_blank'); }} className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"><MessageSquare size={14} /> WhatsApp</button>
                    <button onClick={() => { trackClick('click_call'); window.open(`tel:${isVerified ? (property.contactPhone || agent?.phone) : '+252653227084'}`); }} className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2"><Phone size={14} /> Call</button>
                    <button onClick={() => { trackClick('click_chat'); setIsChatOpen(true); }} className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-50 text-[#0065eb] hover:bg-blue-100 transition-all flex items-center gap-2"><MessageSquare size={14} /> Chat</button>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-center md:justify-end">
                <Link href={`/agents/${agent?.slug || agent?.uid || property.agentId}`} className="text-xs font-black uppercase tracking-widest text-[#0065eb] hover:text-blue-700 flex items-center gap-1 group">
                  View Full Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* ROW 6 (Left): VERIFICATION */}
            <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><ShieldCheck size={18} className="text-[#0065eb]"/> Verification</h3>
              <ul className="space-y-4">
                <li className={`flex items-center gap-3 text-sm font-bold p-4 rounded-xl border ${isVerified ? 'text-slate-700 bg-green-50 border-green-100' : 'text-slate-500 bg-slate-50 border-slate-100'}`}>
                  <CheckCircle size={18} className={`${isVerified ? 'text-green-500' : 'text-slate-300'} shrink-0`}/> 
                  {isVerified ? 'Agent Identity Verified' : 'Agent Identity Unverified'}
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <CheckCircle size={18} className="text-[#0065eb] shrink-0"/> 
                  Listing Information Reviewed
                </li>
                {isVerified && (
                  <li className="flex items-center gap-3 text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <CheckCircle size={18} className="text-[#0065eb] shrink-0"/> 
                    Contact Details Confirmed
                  </li>
                )}
              </ul>
            </div>

          </div>


          {/* ---------------------------------------------------------
              RIGHT COLUMN (Actions & Data) 
          --------------------------------------------------------- */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6 md:gap-8">
            
            {/* ROW 2 (Right): AGENT / PRICE CARD (Sticky removed to prevent overlap) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-8 relative z-20">
               <div className="flex items-center gap-2 mb-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${property.isForSale ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{property.transactionType || (property.isForSale ? 'For Sale' : 'For Rent')}</span>
               </div>
               <div className="flex items-baseline gap-2 flex-wrap mb-2">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{formattedPrice}</h2>
                 {!property.isForSale && property.rentalDetails?.period && <span className="text-slate-500 font-bold text-sm">/ {property.rentalDetails.period}</span>}
                 {!property.isForSale && !property.rentalDetails?.period && <span className="text-slate-500 font-bold text-sm">/ month</span>}
               </div>
               <p className="text-xs text-slate-400 font-bold mb-6">Property ID: #{property.id.slice(-6).toUpperCase()}</p>
               
               <hr className="border-slate-100 my-6" />
               
               <Link href={`/agents/${agent?.slug || agent?.uid || property.agentId}`} className="flex items-center gap-4 mb-6 group cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-2xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 relative overflow-hidden border border-slate-200 shrink-0">
                     {agent?.photoUrl ? <Image src={agent.photoUrl} alt={agent.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">{agent?.name?.[0]}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                     <h3 className="font-black text-slate-900 text-sm truncate group-hover:text-[#0065eb] transition-colors">{agent?.name || 'Loading...'}</h3>
                     <p className="text-xs text-slate-500 font-bold truncate flex items-center gap-1">{isVerified ? <><ShieldCheck size={12} className="text-blue-500"/> Verified Agent</> : 'Unverified Agent'}</p>
                  </div>
               </Link>

               <div className="grid grid-cols-2 gap-2 mb-3">
                   <button onClick={() => { trackClick('click_whatsapp'); window.open(`https://wa.me/${(isVerified ? (property.contactPhone || agent?.phone) : '+252653227084')?.replace(/[^0-9]/g, '')}`, '_blank'); }} className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-md bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-green-500/20"><MessageSquare size={14} /> WA</button>
                   <button onClick={() => { trackClick('click_call'); window.open(`tel:${isVerified ? (property.contactPhone || agent?.phone) : '+252653227084'}`); }} className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:-translate-y-0.5 shadow-md bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"><Phone size={14} /> Call</button>
               </div>
               <button onClick={() => setIsChatOpen(true)} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm bg-blue-50 text-[#0065eb] hover:bg-blue-100 mb-3"><MessageSquare size={14} /> Chat In-App</button>
               
               <div className="mt-4 pt-4 border-t border-slate-100 text-center flex gap-2">
                 <button onClick={() => setIsSaved(!isSaved)} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"><Bookmark size={12} className={isSaved ? "fill-red-500 text-red-500" : ""}/> Save</button>
                 <button onClick={() => { navigator.share?.({ title: property.title, url: window.location.href }); }} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"><Share2 size={12}/> Share</button>
               </div>
            </div>

            {/* ROW 3 (Right): LOCATION MAP */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2 overflow-hidden flex flex-col h-[350px]">
              <div className="px-4 pt-4 pb-2"><h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><MapPin size={16} className="text-[#0065eb]"/> Location</h3><p className="text-xs font-bold text-slate-500 truncate">{property.location.address ? `${property.location.address}, ` : ''}{property.location.area}, {property.location.city}</p></div>
              <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-100 group">
                {(() => {
                  const gpsParts = property.location?.gpsCoordinates?.split(',') || [];
                  const lat = gpsParts[0]?.trim();
                  const lng = gpsParts[1]?.trim();
                  // Checked strictly against form visibility logic
                  const showExact = isVerified && property.location.visibility === 'Exact' && lat && lng;

                  return (
                    <>
                      {showExact ? (
                        <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}></iframe>
                      ) : (
                        <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200" alt="Map" fill className="object-cover blur-[2px] opacity-70" />
                      )}
                      
                      {!showExact && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-sm">
                           <div className="bg-white p-3 rounded-full shadow-lg mb-3"><Lock size={20} className="text-amber-500" /></div>
                           <h4 className="text-white text-base font-black drop-shadow-md mb-1">Location Hidden</h4>
                           <p className="text-white/80 font-bold text-[10px] drop-shadow-md mb-4 px-2">Contact agent to arrange a viewing.</p>
                        </div>
                      )}

                      {showExact && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[90%]">
                           <button onClick={() => window.open(`https://maps.google.com/maps?q=${lat},${lng}`, '_blank')} className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-slate-100 hover:bg-[#0065eb] hover:text-white transition-colors">
                               Open in Google Maps
                           </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* ROW 4 (Right): RENTAL / SALE INFORMATION */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Info size={18} className="text-[#0065eb]"/> {property.isForSale ? 'Sale Information' : 'Rental Information'}</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-500">Price</span>
                  <span className="text-sm font-black text-slate-900">{formattedPrice} {!property.isForSale && property.rentalDetails?.period ? `/ ${property.rentalDetails.period}` : ''}</span>
                </div>
                
                {property.isForSale ? (
                  <>
                    {(property.saleDetails?.pricePerSqm ?? 0) > 0 && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Price per m²</span>
                        <span className="text-sm font-black text-slate-900">{property.currency} {property.saleDetails?.pricePerSqm}</span>
                      </div>
                    )}
                    {property.saleDetails?.paymentTerms && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Payment Terms</span>
                        <span className="text-sm font-black text-slate-900 text-right w-1/2">{property.saleDetails.paymentTerms}</span>
                      </div>
                    )}
                    {property.saleDetails?.ownershipStatus && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Ownership</span>
                        <span className="text-sm font-black text-slate-900 text-right w-1/2">{property.saleDetails.ownershipStatus}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {(property.rentalDetails?.deposit ?? 0) > 0 && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Security Deposit</span>
                        <span className="text-sm font-black text-slate-900">{property.currency} {property.rentalDetails?.deposit}</span>
                      </div>
                    )}
                    {property.rentalDetails?.minPeriod && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Min. Rental Period</span>
                        <span className="text-sm font-black text-slate-900">{property.rentalDetails.minPeriod}</span>
                      </div>
                    )}
                    {property.rentalDetails?.availableFrom && (
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-500">Available From</span>
                        <span className="text-sm font-black text-slate-900">{property.rentalDetails.availableFrom}</span>
                      </div>
                    )}
                    {property.rentalDetails?.utilitiesIncluded !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Utilities Included</span>
                        <span className="text-sm font-black text-slate-900">{property.rentalDetails?.utilitiesIncluded ? 'Yes' : 'No'}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ROW 5 (Right): SCHEDULE A TOUR */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><Calendar size={18} className="text-[#0065eb]"/> Schedule a Viewing</h3>
              
              {tourSuccess ? (
                <div className="text-center py-8 animate-in fade-in">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                  <h4 className="text-xl font-black text-slate-900 mb-2">Request Sent!</h4>
                  <p className="text-xs text-slate-500 font-bold mb-4">The agent has been notified.</p>
                  <button onClick={() => setTourSuccess(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest w-full transition-colors">Submit Another</button>
                </div>
              ) : (
                <form onSubmit={handleTourSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Date</label>
                      <input required type="date" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-3.5 font-bold text-sm outline-none transition-all" onChange={e => setTourData({...tourData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Time</label>
                      <input required type="time" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-3.5 font-bold text-sm outline-none transition-all" onChange={e => setTourData({...tourData, time: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Your Name</label>
                    <input required type="text" placeholder="John Doe" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-3.5 font-bold text-sm outline-none transition-all" onChange={e => setTourData({...tourData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Phone Number</label>
                    <input required type="tel" placeholder="+252..." className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-3.5 font-bold text-sm outline-none transition-all" onChange={e => setTourData({...tourData, phone: e.target.value})} />
                  </div>
                  <button disabled={tourLoading} type="submit" className="mt-2 w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
                    {tourLoading ? <Loader2 className="animate-spin" /> : 'Request a Tour'}
                  </button>
                </form>
              )}
            </div>

            {/* ROW 6 (Right): IMPORTANT INFO */}
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2"><AlertTriangle size={18} className="text-rose-400"/> Before You Visit</h3>
              <ul className="space-y-4 relative z-10">
                 <li className="flex items-start gap-3 text-sm font-bold text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div> Confirm availability directly with the agent.</li>
                 <li className="flex items-start gap-3 text-sm font-bold text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div> Do not send payment before viewing and verifying ownership.</li>
                 <li className="flex items-start gap-3 text-sm font-bold text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div> Double check rental terms and minimum lease periods.</li>
                 <li className="flex items-start gap-3 text-sm font-bold text-slate-300"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div> Confirm which utilities are actually included.</li>
              </ul>
            </div>

          </div>
        </div>
        
        {/* =======================================================================
            FULL WIDTH SECTIONS (Bottom)
        ======================================================================= */}
        
        {/* SIMILAR PROPERTIES */}
        {related.length > 0 && (
          <div className="mt-16 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h4 className="font-black text-slate-900 text-2xl mb-2">Similar Properties</h4>
                  <p className="text-sm text-slate-500 font-bold">Similar homes for {property.isForSale ? 'sale' : 'rent'} in {property.location.city}</p>
               </div>
               <div className="hidden sm:flex gap-2">
                  <button onClick={() => scroll('up')} className="p-3 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-[#0065eb] hover:text-white transition-all shadow-sm"><ChevronLeft size={18}/></button>
                  <button onClick={() => scroll('down')} className="p-3 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-[#0065eb] hover:text-white transition-all shadow-sm"><ChevronRight size={18}/></button>
               </div>
            </div>
            
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory">
               {related.map((p, i) => (
                  <Link href={`/properties/${p.slug || p.id}`} key={p.id} className="snap-start min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] group flex flex-col rounded-[2rem] border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all cursor-pointer bg-slate-50 overflow-hidden">
                     <div className="w-full h-48 bg-slate-200 relative overflow-hidden shrink-0 shadow-inner">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700"/>}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-900 border border-slate-200/50 shadow-sm">{p.currency || 'USD'} {p.price?.toLocaleString()}</div>
                     </div>
                     <div className="p-5 flex flex-col justify-between min-w-0 bg-white flex-1">
                        <div>
                          <h5 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-[#0065eb] transition-colors mb-1">{p.title}</h5>
                          <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 mb-4"><MapPin size={10} className="text-[#0065eb]"/> {p.location.area}, {p.location.city}</p>
                        </div>
                        <div className="flex gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100">
                           {p.details?.bedrooms && <span>{p.details.bedrooms} Beds</span>}
                           {p.details?.bathrooms && <span>{p.details.bathrooms} Baths</span>}
                           {p.details?.size && <span>{p.details.size} m²</span>}
                        </div>
                     </div>
                  </Link>
               ))}
            </div>
          </div>
        )}

        {/* PROMOTION CARD */}
        <div className="mt-8 relative rounded-[2.5rem] overflow-hidden bg-[#0a0c10] px-8 py-16 md:p-16 flex items-center min-h-[400px] shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0065eb]/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>
          
          <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-10">
             <div className="max-w-xl text-center lg:text-left">
               <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-blue-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-6 shadow-inner shadow-white/5"><Star size={10} className="fill-current"/> GuriUp Ecosystem</span>
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tight">Grow Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-cyan-300">Business Today.</span></h2>
               <p className="text-slate-400 text-sm font-medium leading-relaxed mb-0">Download our app for exclusive mobile deals, or join our network to manage your listings and grow your real estate business exponentially.</p>
             </div>
             <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center lg:justify-end">
                 <button className="flex items-center gap-4 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] group w-full sm:w-auto justify-center"><Download size={24} className="group-hover:translate-y-1 transition-transform" /><div className="text-left leading-none"><span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Get App</span><span className="text-base">Download</span></div></button>
                 <Link href="/join/agent" className="w-full sm:w-auto text-white font-bold text-sm hover:text-blue-400 transition-colors flex items-center justify-center gap-3 px-6 py-4 border border-white/20 hover:bg-white/5 rounded-2xl"><Briefcase size={18}/> Become Agent</Link>
                 <Link href="/join/hotel" className="w-full sm:w-auto text-white font-bold text-sm hover:text-blue-400 transition-colors flex items-center justify-center gap-3 px-6 py-4 border border-white/20 hover:bg-white/5 rounded-2xl"><Building2 size={18}/> List Hotel</Link>
             </div>
          </div>
        </div>

      </main>

      {/* =======================================================================
          GLOBAL OVERLAYS (Gallery, Video, Chat)
      ======================================================================= */}
      
      {/* VIDEO PLAYER MODAL */}
      {showVideoModal && property.videoUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all z-50 border border-white/10"><X size={24} /></button>
           <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 mx-4">
              <video src={property.videoUrl} controls autoPlay className="w-full h-full object-contain" playsInline />
           </div>
        </div>
      )}

      {/* FULL SCREEN GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-300">
           <button onClick={() => setShowGalleryModal(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all z-50 border border-white/10"><X size={24} /></button>
           <div className="flex-1 overflow-y-auto p-4 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
              {images.map((img, i) => (
                 <div key={i} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
                    <Image src={img} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* CHAT */}
      {isChatOpen && (
        <SharedChatComponent 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          recipientId={agent?.uid || property.agentId} 
          recipientName={agent?.name || 'Agent'} 
          propertyId={property.id} 
          propertyTitle={property.title} 
        />
      )}
    </div>
  );
}