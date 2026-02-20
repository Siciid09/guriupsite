'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  doc, getDoc, collection, query, where, limit, getDocs, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../app/lib/firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth';
import SharedChatComponent from '@/components/sharedchat';
import { 
  MapPin, MessageSquare, Calendar, ChevronLeft, ChevronRight, X, 
  ShieldCheck, Share2, Heart, Phone, Home, Ruler, 
  Wifi, Waves, Loader2, CheckCircle, Lock, Download, 
  Briefcase, Building2, ArrowUp, ArrowDown, Expand, Star, ChevronUp, ChevronDown
} from 'lucide-react';

// --- TYPES ---
export interface Property {
  id: string;
  slug?: string;
  title: string;
  price: number;
  description: string;
  images: string[];
  agentId: string;
  location: { city: string; area: string; address?: string; lat?: number; lng?: number };
  features: { 
    bedrooms?: number; 
    bathrooms?: number; 
    size?: number; 
    isFurnished?: boolean; 
    hasPool?: boolean; 
    hasGate?: boolean;
    [key: string]: any; 
  };
  type: string;
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

const BookingModal = ({ isOpen, onClose, property, agent }: { isOpen: boolean; onClose: () => void; property: Property; agent: Agent | null; }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', time: '' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => { const u = onAuthStateChanged(auth, (user) => setCurrentUser(user)); return () => u(); }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'tour_requests'), {
        propertyId: property.id, propertyName: property.title, agentId: property.agentId,
        userName: formData.name, userPhone: formData.phone, userId: currentUser?.uid || 'anonymous_web',
        date: formData.date, time: formData.time, timestamp: serverTimestamp(), status: 'pending', platform: 'web'
      });
      const agentPhone = isAgentPro(agent) ? (property.contactPhone || agent?.phone || "+252653227084") : "+252653227084";
      const msg = `Salaam, waxan rabaa inan dalbado booqasho guri: '${property.title}'.\nTaariikhda: ${formData.date}\nSaacada: ${formData.time}\nMagacaygu waa: ${formData.name}`;
      window.open(`https://wa.me/${agentPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      onClose();
    } catch (error) { alert("Failed to submit booking."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20}/></button>
        {success ? (
          <div className="text-center py-8 animate-in fade-in">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Request Sent!</h3>
            <button onClick={onClose} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold w-full mt-4">Close</button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-black text-slate-900 mb-6">Schedule a Tour</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Full Name</label>
                <input required type="text" placeholder="John Doe" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-4 font-bold text-sm outline-none transition-all" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Phone Number</label>
                <input required type="tel" placeholder="+252..." className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-4 font-bold text-sm outline-none transition-all" onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Date</label>
                  <input required type="date" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-4 font-bold text-sm outline-none transition-all" onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Time</label>
                  <input required type="time" className="w-full bg-slate-50 focus:bg-white border-2 border-slate-50 focus:border-[#0065eb] rounded-xl p-4 font-bold text-sm outline-none transition-all" onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} type="submit" className="mt-2 w-full bg-[#0065eb] hover:bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20">
                {loading ? <Loader2 className="animate-spin" /> : (isAgentPro(agent) ? 'Confirm & Open WhatsApp' : 'Submit Request')}
              </button>
            </form>
          </>
        )}
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
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [property] = useState<Property>(initialProperty);
  const [agent] = useState<Agent | null>(initialAgent);
  const [related, setRelated] = useState<Property[]>([]);

  useEffect(() => {
    if (property) document.title = `${property.title} | GuriUp`;
  }, [property]);

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (property?.location?.city) {
      const fetchRelated = async () => {
        try {
          const q = query(collection(db, 'property'), where('location.city', '==', property.location.city), where('status', 'in', ['available', 'rented_out']), limit(6));
          const relatedSnap = await getDocs(q);
          setRelated(relatedSnap.docs.map(d => ({ id: d.id, ...d.data() } as Property)).filter(p => p.id !== property.id));
        } catch (e) { console.error(e); }
      }; fetchRelated();
    }
  }, [property]);

  useEffect(() => { startSlideTimer(); return () => stopSlideTimer(); }, [activeImg]);

  const startSlideTimer = () => { stopSlideTimer(); autoSlideRef.current = setInterval(() => { setActiveImg(prev => (prev === (property.images?.length || 1) - 1 ? 0 : prev + 1)); }, 3000); };
  const stopSlideTimer = () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  const handleManualSlide = (idx: number) => { stopSlideTimer(); setActiveImg(idx); setTimeout(startSlideTimer, 5000); };
  const scroll = (direction: 'up' | 'down') => { if (scrollRef.current) { const amount = 200; scrollRef.current.scrollBy({ top: direction === 'down' ? amount : -amount, behavior: 'smooth' }); } };
  const handleRestrictedAction = (action: string, callback: () => void) => { if (isAgentPro(agent)) { callback(); } else { setRestrictedFeature(action); } };

  const images = property.images?.length ? property.images : ['https://placehold.co/800x600?text=No+Image'];
  const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.price);
  const isVerified = isAgentPro(agent);

  return (
    // FIX 1: INCREASED PADDING TOP TO PUSH CONTENT DOWN (pt-[150px])
    <div className="bg-[#FAFBFC] min-h-screen font-sans text-slate-900 pb-20 pt-[180px]">
       
      {/* MODALS */}
      <BookingModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} property={property} agent={agent} />
      <RestrictedModal isOpen={!!restrictedFeature} onClose={() => setRestrictedFeature(null)} featureName={restrictedFeature || ''} />

      {/* ================= SECTION 1: STATIC SLIM HEADER ================= */}
      {/* This is intentionally NOT fixed/sticky as per previous requests, 
          but sitting nicely below the spacing provided by pt-[150px] */}
      <div className="w-full bg-white border-b border-slate-200 px-4 md:px-6 py-4 shadow-sm mb-6 -mt-[150px] relative z-30">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 truncate max-w-full md:max-w-lg leading-tight">{property.title}</h1>
            <div className="flex items-center gap-1 text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wide mt-1"><MapPin size={12} className="text-[#0065eb]" /> {property.location.area}, {property.location.city}</div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
             <button onClick={() => { navigator.share?.({ title: property.title, url: window.location.href }); }} className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100 shadow-sm"><Share2 size={18} /></button>
             <button onClick={() => setIsSaved(!isSaved)} className={`p-3 rounded-full border shadow-sm ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}><Heart size={18} className={isSaved ? "fill-current" : ""} /></button>
             <button onClick={() => setIsBookingOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-full font-bold text-xs uppercase tracking-wide shadow-lg shadow-blue-500/20 transition-all"><Calendar size={16} /> Book Tour</button>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 space-y-8 mt-6">

        {/* ================= SECTION 2: HERO (70% Gallery / 30% Agent) ================= */}
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[580px]">
           
          {/* --- LEFT: GALLERY --- */}
          <div className="w-full lg:w-[70%] flex flex-col gap-4 h-[400px] lg:h-full">
            <div className="relative flex-1 rounded-[2.5rem] overflow-hidden group bg-slate-900 shadow-2xl">
              <Image src={images[activeImg]} alt="Property" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
              
              {/* MOBILE FULL SCREEN ICON (LEFT TOP) */}
              <button onClick={() => setShowGalleryModal(true)} className="lg:hidden absolute top-6 left-6 z-30 p-2.5 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 shadow-lg hover:bg-black/60">
                 <Expand size={18} />
              </button>

              {/* STATUS BADGE - MOVED TO RIGHT ON MOBILE TO AVOID OVERLAP */}
              <div className="absolute top-6 right-6 lg:left-6 lg:right-auto flex gap-2 z-10">
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xl border border-white/10 shadow-lg ${property.isForSale ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'}`}>{property.isForSale ? 'For Sale' : 'For Rent'}</span>
              </div>

              {/* CENTER BOTTOM CONTROLS (SMALLER ON MOBILE) */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 z-20">
                <button onClick={() => handleManualSlide(activeImg === 0 ? images.length - 1 : activeImg - 1)} className="p-2 md:p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/20 shadow-lg group"><ChevronLeft size={20} className="md:w-6 md:h-6 group-hover:scale-110 transition-transform"/></button>
                <button onClick={() => handleManualSlide(activeImg === images.length - 1 ? 0 : activeImg + 1)} className="p-2 md:p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/20 shadow-lg group"><ChevronRight size={20} className="md:w-6 md:h-6 group-hover:scale-110 transition-transform"/></button>
              </div>

              {/* VIEW ALL BUTTON (DESKTOP ONLY) */}
              <button onClick={() => setShowGalleryModal(true)} className="hidden lg:flex absolute bottom-8 right-8 px-5 py-2.5 bg-black/40 backdrop-blur-md text-white rounded-full text-xs font-bold items-center gap-2 hover:bg-black/60 transition-all border border-white/10 shadow-xl"><Expand size={14}/> View Gallery</button>
            </div>

            {/* MOBILE THUMBNAILS (Max 4 + 1) */}
            <div className="grid lg:hidden grid-cols-5 gap-2 mt-2 h-16 sm:h-20">
              {images.slice(0, 4).map((img, idx) => (
                <div key={idx} onClick={() => handleManualSlide(idx)} className={`relative rounded-xl overflow-hidden cursor-pointer border-2 ${activeImg === idx ? 'border-[#0065eb]' : 'border-transparent'}`}>
                   <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
              {images.length > 4 ? (
                <div onClick={() => setShowGalleryModal(true)} className="relative rounded-xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center cursor-pointer border-2 border-transparent">
                   <span className="text-[#0065eb] font-black text-sm">+{images.length - 4}</span>
                </div>
              ) : images.length === 5 && (
                 // If exactly 5 images, show the 5th one instead of +1 card if desired, or stick to pattern. 
                 // Logic above covers showing 4. If length is 5, >4 is true, shows +1.
                 null
              )}
            </div>

            {/* DESKTOP THUMBNAILS (Max 9) */}
            <div className="hidden lg:grid h-[90px] grid-cols-9 gap-3">
              {images.slice(0, 9).map((img, idx) => (
                <div key={idx} onClick={() => handleManualSlide(idx)} className={`relative rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${activeImg === idx ? 'border-[#0065eb] ring-2 ring-[#0065eb]/20' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <Image src={img} alt="" fill className="object-cover" />
                  {idx === 8 && images.length > 9 && <div onClick={(e) => { e.stopPropagation(); setShowGalleryModal(true); }} className="absolute inset-0 bg-black/70 flex items-center justify-center text-white font-black text-sm z-10 hover:bg-black/80 backdrop-blur-sm">+{images.length - 9}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT: AGENT & PRICE --- */}
          <div className="w-full lg:w-[30%] bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col justify-between h-auto lg:h-full relative overflow-hidden">
             <div className="animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2 mb-2"><div className={`w-2 h-2 rounded-full animate-pulse ${property.isForSale ? 'bg-blue-500' : 'bg-green-500'}`}></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{property.isForSale ? 'For Sale' : 'For Rent'}</span></div>
                <div className="flex items-baseline gap-2 flex-wrap"><h2 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tighter">{formattedPrice}</h2>{!property.isForSale && <span className="text-slate-500 font-bold text-sm">/month</span>}</div>
             </div>
             
             <hr className="border-slate-100 my-8" />
             
             <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right duration-700 delay-100">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Agent Information</span>
                
                {/* FIX 2: CLICKABLE AGENT LINK */}
                <Link href={`/agents/${agent?.slug || agent?.uid || property.agentId}`} className="flex items-center gap-4 mb-6 group cursor-pointer hover:bg-slate-50 p-3 -ml-3 rounded-2xl transition-all">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 relative overflow-hidden border border-slate-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {agent?.photoUrl ? <Image src={agent.photoUrl} alt={agent.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xl">{agent?.name?.[0]}</div>}
                      {isVerified && <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0065eb] text-white flex items-center justify-center rounded-tl-xl"><CheckCircle size={14} fill="white" className="text-[#0065eb]"/></div>}
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-black text-slate-900 leading-tight text-sm truncate group-hover:text-[#0065eb] transition-colors">{agent?.name || 'Loading...'}</h3>
                      <p className="text-xs text-slate-500 font-bold mb-2 truncate">{isVerified ? (agent?.agencyName || 'Verified Agent') : 'Unverified Agent'}</p>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border shadow-sm ${isVerified ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{isVerified ? <><ShieldCheck size={10}/> Verified</> : 'Unverified'}</span>
                   </div>
                </Link>

                <div className="grid grid-cols-3 gap-2 mb-3">
                    <button onClick={() => window.open(`https://wa.me/${(isVerified ? (property.contactPhone || agent?.phone) : '+252653227084')?.replace(/[^0-9]/g, '')}`, '_blank')} className="flex items-center justify-center gap-1.5 py-4 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-green-500/20"><MessageSquare size={16} /> WA</button>
                    <button onClick={() => window.open(`tel:${isVerified ? (property.contactPhone || agent?.phone) : '+252653227084'}`)} className="flex items-center justify-center gap-1.5 py-4 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"><Phone size={16} /> Call</button>
                    <button onClick={() => setIsChatOpen(true)} className="flex items-center justify-center gap-1.5 py-4 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all hover:-translate-y-1 shadow-lg bg-blue-50 text-[#0065eb] hover:bg-blue-100"><MessageSquare size={16} /> Chat</button>
                </div>
                {/* REQUEST TOUR WITH SHADOW */}
                <button onClick={() => setIsBookingOpen(true)} className="w-full py-5 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/40"><Calendar size={18} /> Request a Tour</button>
             </div>
             
             <div className="mt-8 pt-4 border-t border-slate-100 text-center animate-in slide-in-from-bottom duration-700 delay-200"><p className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5"><ShieldCheck size={12} className="text-green-500" /> No fees charged until you confirm.</p></div>
          </div>
        </div>

        {/* ================= SECTION 3: DETAILS & MAP ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* LEFT: DETAILS */}
           <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm flex flex-col h-full">
             <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Property Details</h3>
             <div className="grid grid-cols-3 gap-4 mb-10">
                 <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center group"><Home size={24} className="mx-auto text-slate-300 group-hover:text-[#0065eb] mb-3 transition-colors"/><span className="block font-black text-slate-900 text-2xl mb-1">{property.features.bedrooms || 0}</span><span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Beds</span></div>
                 <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center group"><Waves size={24} className="mx-auto text-slate-300 group-hover:text-[#0065eb] mb-3 transition-colors"/><span className="block font-black text-slate-900 text-2xl mb-1">{property.features.bathrooms || 0}</span><span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Baths</span></div>
                 <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center group"><Ruler size={24} className="mx-auto text-slate-300 group-hover:text-[#0065eb] mb-3 transition-colors"/><span className="block font-black text-slate-900 text-2xl mb-1">{property.features.size || 0}</span><span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">M²</span></div>
             </div>
             <div className="mb-8"><h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">About this home</h4><p className="text-slate-600 text-sm leading-8 whitespace-pre-line font-medium">{property.description}</p></div>
             <div className="mt-auto"><h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Amenities</h4><div className="flex flex-wrap gap-2.5">{Object.entries(property.features).filter(([key, val]) => val === true && !['bedrooms','bathrooms','size'].includes(key)).map(([key], i) => (<span key={i} className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"><CheckCircle size={14} className="text-[#0065eb]"/> {key.replace(/([A-Z])/g, ' $1').trim()}</span>))}<span className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"><Wifi size={14} className="text-[#0065eb]"/> Internet Ready</span></div></div>
           </div>
           {/* RIGHT: MAP */}
           <div className="relative bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden min-h-[400px] lg:min-h-full group">
             {(isVerified && property.location.lat && property.location.lng) ? (
               <iframe width="100%" height="100%" style={{ border: 0, minHeight: '400px' }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=$${property.location.lat},${property.location.lng}&hl=en&z=15&output=embed`}></iframe>
             ) : (
               <Image src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1200" alt="Map" fill className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${!isVerified ? 'blur-sm opacity-60' : ''}`} />
             )}
             <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none backdrop-blur-[2px] ${!isVerified ? 'bg-black/30' : 'bg-transparent'}`}>
                <div className="bg-white p-5 rounded-full shadow-2xl animate-bounce mb-6">{isVerified ? <MapPin size={32} className="text-[#0065eb] fill-[#0065eb]" /> : <Lock size={32} className="text-amber-500" />}</div>
                <h4 className="text-white text-3xl font-black drop-shadow-lg mb-2">{isVerified ? property.location.city : 'Location Hidden'}</h4>
                <p className="text-white/90 font-bold text-sm drop-shadow-md mb-8 bg-white/10 px-4 py-1 rounded-full backdrop-blur-md border border-white/10">{isVerified ? property.location.area : 'Unverified Agent'}</p>
                <button onClick={() => handleRestrictedAction("Map", () => window.open(`https://maps.google.com/?q=${property.location.area},${property.location.city}`, '_blank'))} className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-[#0065eb] hover:text-white transition-all transform hover:-translate-y-1 hover:scale-105">{isVerified ? 'Open in Google Maps' : 'Unlock Location'}</button>
             </div>
           </div>
        </div>

        {/* ================= SECTION 4: MARKETING & RELATED ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
           {/* LEFT: ECOSYSTEM CARD */}
           <div className="w-full lg:w-[60%] relative rounded-[2.5rem] overflow-hidden bg-[#0a0c10] px-8 py-12 md:p-14 flex items-center min-h-[450px] shadow-2xl">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0065eb]/20 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3"></div>
             <div className="relative z-10 w-full">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-blue-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md mb-8 shadow-inner shadow-white/5"><Star size={10} className="fill-current"/> GuriUp Ecosystem</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-[0.9] tracking-tight">Grow Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-cyan-300">Business Today.</span></h2>
                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md mb-10">Download our app for exclusive mobile deals, or join our network to grow your business exponentially.</p>
                <div className="flex flex-wrap gap-5 items-center">
                   <button className="flex items-center gap-4 px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] group"><Download size={24} className="group-hover:translate-y-1 transition-transform" /><div className="text-left leading-none"><span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Get App</span><span className="text-base">Download</span></div></button>
                   <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                   <Link href="/join/agent" className="text-white font-bold text-sm hover:text-blue-400 transition-colors flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl"><Briefcase size={18}/> Become Agent</Link>
                   <Link href="/join/hotel" className="text-white font-bold text-sm hover:text-blue-400 transition-colors flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl"><Building2 size={18}/> List Hotel</Link>
                </div>
             </div>
           </div>

           {/* RIGHT: RELATED PROPERTIES */}
           <div className="w-full lg:w-[40%] bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col h-[500px] lg:h-auto relative shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <div><h4 className="font-black text-slate-900 text-lg">Related Properties</h4><p className="text-xs text-slate-400 font-bold mt-1">Similar homes in {property.location.city}</p></div>
                <div className="flex flex-col gap-2">
                   {/* CUSTOM VERTICAL CONTROLS */}
                   <button onClick={() => scroll('up')} className="p-2 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-[#0065eb] hover:text-white hover:border-[#0065eb] transition-all shadow-sm group"><ChevronUp size={16}/></button>
                   <button onClick={() => scroll('down')} className="p-2 bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:bg-[#0065eb] hover:text-white hover:border-[#0065eb] transition-all shadow-sm group"><ChevronDown size={16}/></button>
                </div>
             </div>
             <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth space-y-4 relative pb-4">
                {related.map((p, i) => (
                   <Link href={`/properties/${p.slug || p.id}`} key={p.id} className="group flex gap-4 p-4 rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                      <div className="w-24 h-24 bg-slate-200 rounded-2xl relative overflow-hidden shrink-0 shadow-inner">
                         {p.images[0] && <Image src={p.images[0]} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700"/>}
                      </div>
                      <div className="flex-1 py-1 flex flex-col justify-between min-w-0">
                         <div><h5 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-[#0065eb] transition-colors">{p.title}</h5><p className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={10} /> {p.location.area}</p></div>
                         <div className="flex justify-between items-end"><span className="font-black text-slate-900 text-sm">${p.price}</span></div>
                      </div>
                   </Link>
                ))}
                {related.length === 0 && <div className="text-center p-10 text-slate-400 text-xs font-bold">No similar properties found.</div>}
             </div>
           </div>
        </div>
      </main>

      {/* FULL SCREEN GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in duration-300">
           <button onClick={() => setShowGalleryModal(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all z-50 border border-white/10"><X size={24} /></button>
           <div className="flex-1 overflow-y-auto p-4 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
              {images.map((img, i) => (
                 <div key={i} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
                    <Image src={img} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                 </div>
              ))}
           </div>
        </div>
      )}
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