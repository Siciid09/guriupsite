'use client';

import { useState, useEffect, use, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  doc, getDoc, collection, query, where, limit, getDocs, addDoc, serverTimestamp, setDoc 
} from 'firebase/firestore';
// ⚠️ ENSURE THIS PATH POINTS TO YOUR FIREBASE CONFIG
import { db, auth } from '../../../lib/firebase'; 
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  MapPin, MessageSquare, Calendar, ChevronLeft, ChevronRight, X, 
  ShieldCheck, Share2, Heart, Phone, Home, Ruler, 
  Wifi, Waves, Loader2, CheckCircle, Lock, Eye
} from 'lucide-react';

// --- TYPES ---
interface Property {
  id: string;
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
    // Add other flexible features as needed
    [key: string]: any; 
  };
  type: string;
  isForSale: boolean;
  status: string;
  contactPhone?: string;
}

interface Agent {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  phone: string;
  agencyName?: string;
  planTier?: 'free' | 'pro' | 'premium' | 'agent_pro'; // Critical for Logic
}

// --- HELPER: CHECK PRO STATUS ---
const isAgentPro = (agent: Agent | null) => {
  if (!agent?.planTier) return false;
  return ['pro', 'premium', 'agent_pro'].includes(agent.planTier);
};

// =======================================================================
//  1. RESTRICTED FEATURE MODAL (Upsell/Protection)
// =======================================================================
const RestrictedModal = ({ isOpen, onClose, featureName }: { isOpen: boolean; onClose: () => void; featureName: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={16}/></button>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Restricted Access</h3>
          <p className="text-slate-500 text-sm mb-6">
            Direct {featureName} is disabled because this agent is not yet verified. For your safety, please use the <b>In-App Chat</b> or Request a Tour form.
          </p>
          <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Understood</button>
        </div>
      </div>
    </div>
  );
};

// =======================================================================
//  2. BOOKING MODAL (Logic Split: Pro vs Free)
// =======================================================================
const BookingModal = ({ 
  isOpen, 
  onClose, 
  property, 
  agent 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  property: Property;
  agent: Agent | null;
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', date: '', time: '' });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user for the ID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to Firestore (Matches Flutter 'tour_requests')
      await addDoc(collection(db, 'tour_requests'), {
        propertyId: property.id,
        propertyName: property.title,
        agentId: property.agentId,
        userName: formData.name,
        userPhone: formData.phone,
        userId: currentUser?.uid || 'anonymous_web',
        date: formData.date,
        time: formData.time,
        timestamp: serverTimestamp(),
        status: 'pending',
        platform: 'web'
      });

      // 2. CONDITIONAL LOGIC BASED ON AGENT TIER
      if (isAgentPro(agent)) {
        // --- PRO AGENT: Direct WhatsApp Redirect ---
        const agentPhone = property.contactPhone || agent?.phone || "252633227084"; // Fallback to admin if missing
        const msg = `Salaam, waxan rabaa inan dalbado booqasho guri: '${property.title}'.\nTaariikhda: ${formData.date}\nSaacada: ${formData.time}\nMagacaygu waa: ${formData.name}`;
        const cleanPhone = agentPhone.replace(/[^0-9]/g, '');
        
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        onClose(); // Close modal immediately as they are leaving site
      } else {
        // --- FREE AGENT: Show Success Popup Only ---
        setSuccess(true);
      }

    } catch (error) {
      console.error("Error booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
        
        {success ? (
          <div className="text-center py-10 animate-in fade-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Tour Requested!</h3>
            <p className="text-slate-500 mb-8">The agent has been notified within the app and will review your request shortly.</p>
            <button onClick={onClose} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold w-full">Close</button>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-black text-slate-900 mb-6">Schedule a Tour</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Your Name</label>
                <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:border-blue-500" 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 ml-1">Phone Number</label>
                <input required type="tel" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:border-blue-500" 
                  onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Date</label>
                  <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:border-blue-500" 
                    onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 ml-1">Time</label>
                  <input required type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:border-blue-500" 
                    onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} type="submit" className="mt-4 w-full bg-[#0065eb] hover:bg-blue-700 text-white py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
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
//  3. AGENT SIDEBAR (Locks & Verification)
// =======================================================================
const AgentSidebar = ({ 
  agent, 
  property, 
  onBookTour, 
  onRestricted 
}: { 
  agent: Agent | null, 
  property: Property, 
  onBookTour: () => void,
  onRestricted: (feature: string) => void
}) => {
    const [isSaved, setIsSaved] = useState(false);
    const isPro = isAgentPro(agent);

    useEffect(() => {
      const saved = localStorage.getItem('favorites');
      if (saved && JSON.parse(saved).includes(property.id)) setIsSaved(true);
    }, [property.id]);

    const toggleSave = () => {
      const saved = JSON.parse(localStorage.getItem('favorites') || '[]');
      let newSaved;
      if (isSaved) {
        newSaved = saved.filter((id: string) => id !== property.id);
      } else {
        newSaved = [...saved, property.id];
      }
      localStorage.setItem('favorites', JSON.stringify(newSaved));
      setIsSaved(!isSaved);
    };

    const handleWhatsApp = () => {
        if (!isPro) {
          onRestricted("WhatsApp");
          return;
        }
        const phone = property.contactPhone || agent?.phone;
        if (!phone) return;
        const msg = `Hi, I am interested in ${property.title}`;
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleCall = () => {
      if (!isPro) {
        onRestricted("Direct Calling");
        return;
      }
      const phone = property.contactPhone || agent?.phone;
      if (phone) window.open(`tel:${phone}`);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: property.title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
        }
    };

    const formattedPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.price);

    return (
        <div className="flex flex-col gap-4 sticky top-28">
             <div className="flex justify-end gap-2">
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full font-bold text-[10px] uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md">
                    <Share2 size={12} /> Share
                </button>
                <button onClick={toggleSave} className={`flex items-center gap-2 px-4 py-2 border rounded-full font-bold text-[10px] uppercase tracking-wider transition-all shadow-md ${isSaved ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'}`}>
                    <Heart size={12} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? 'Saved' : 'Save'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-xl shadow-slate-200/50">
                 <div className="mb-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${property.isForSale ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {property.isForSale ? 'For Sale' : 'For Rent'}
                    </span>
                 </div>
                 <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{formattedPrice}</div>
                 {!property.isForSale && <div className="text-slate-400 font-bold mb-6 text-sm">/month</div>}
                 
                 <div className="w-full h-px bg-slate-100 my-6"></div>

                 <div className="flex flex-col gap-4 mb-6">
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Agent Information</span>
                     
                     {agent ? (
                         <div className="flex items-center gap-3 group">
                             <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100">
                                 {agent.photoUrl ? (
                                     <Image src={agent.photoUrl} alt={agent.name} fill className="object-cover" />
                                 ) : (
                                     <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-400">{agent.name?.[0]}</div>
                                 )}
                             </div>
                             <div>
                                 <h3 className="text-base font-black text-slate-900 leading-tight flex gap-1 items-center">
                                    {agent.name}
                                    {isPro && <ShieldCheck size={14} className="text-blue-500" />}
                                 </h3>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                   {isPro ? (agent.agencyName || 'Verified Agent') : 'Unverified Agent'}
                                 </p>
                             </div>
                         </div>
                      ) : (
                        <div className="p-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-lg animate-pulse">Loading agent...</div>
                      )}

                      {agent && (
                          <div className="space-y-2 mt-1">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                  <MapPin size={14} className="text-slate-400" /> {property.location.city}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                  <Phone size={14} className="text-slate-400" /> 
                                  {isPro ? (property.contactPhone || agent.phone) : <span className="text-slate-300">Hidden (Unverified)</span>}
                              </div>
                          </div>
                      )}
                 </div>

                 {/* CONTACT BUTTONS - BLURRED/LOCKED IF NOT PRO */}
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <button 
                        onClick={handleWhatsApp}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors relative overflow-hidden
                          ${!isPro ? 'bg-gray-100 text-gray-400' : 'bg-[#25D366] text-white hover:bg-[#20bd5a]'}
                        `}
                    >
                        {!isPro && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center"><Lock size={14} className="text-slate-500"/></div>}
                        <MessageSquare size={16} /> WhatsApp
                    </button>
                    
                    <button 
                      onClick={handleCall}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors relative overflow-hidden
                        ${!isPro ? 'bg-gray-100 text-gray-400' : 'bg-slate-900 text-white hover:bg-slate-800'}
                      `}
                    >
                        {!isPro && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center"><Lock size={14} className="text-slate-500"/></div>}
                        <Phone size={16} /> Call
                    </button>
                 </div>

                 <button onClick={onBookTour} className="w-full py-4 bg-[#0065eb] text-white rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mb-3">
                    <Calendar size={16} /> Request a Tour
                 </button>
                 <p className="text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
                    <ShieldCheck size={10} /> No fees charged until you confirm.
                 </p>
            </div>
        </div>
    );
}

// =======================================================================
//  4. MAIN PAGE COMPONENT
// =======================================================================
export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // States
  const [property, setProperty] = useState<Property | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [related, setRelated] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<string | null>(null);
  
  // UI
  const [selectedImage, setSelectedImage] = useState(0);
  const analyticsFired = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Property
        const propertyRef = doc(db, 'property', slug);
        const propertySnap = await getDoc(propertyRef);

        if (propertySnap.exists()) {
          const propData = { id: propertySnap.id, ...propertySnap.data() } as Property;
          setProperty(propData);

          // 2. Fetch Agent
          if (propData.agentId) {
            const agentRef = doc(db, 'users', propData.agentId);
            const agentSnap = await getDoc(agentRef);
            if (agentSnap.exists()) {
              setAgent(agentSnap.data() as Agent);
            }
          }

          // 3. Analytics (Record View) - Matches Flutter 'analytics' collection
          if (propData.agentId && !analyticsFired.current) {
             analyticsFired.current = true;
             // Fire and forget
             addDoc(collection(db, 'analytics'), {
               type: 'view_property',
               propertyId: propData.id,
               agentId: propData.agentId,
               viewerId: auth.currentUser?.uid || 'anonymous_web',
               timestamp: serverTimestamp(),
               city: propData.location.city || 'Unknown'
             }).catch(err => console.error("Analytics error", err));
          }

          // 4. Fetch Related
          if (propData.location?.city) {
            const q = query(
                collection(db, 'property'),
                where('location.city', '==', propData.location.city),
                where('status', 'in', ['available', 'rented_out']),
                limit(4)
            );
            const relatedSnap = await getDocs(q);
            const relatedList = relatedSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Property))
                .filter(p => p.id !== propData.id);
            setRelated(relatedList);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC]"><Loader2 className="w-10 h-10 animate-spin text-slate-900"/></div>;
  if (!property) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Property not found.</div>;

  const isPro = isAgentPro(agent);

  return (
    <main className="min-h-screen bg-[#FAFBFC] font-sans pb-20 pt-36">
      
      {/* MODALS */}
      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        property={property} 
        agent={agent}
      />
      <RestrictedModal 
        isOpen={!!restrictedFeature} 
        onClose={() => setRestrictedFeature(null)} 
        featureName={restrictedFeature || ''} 
      />

      <div className="max-w-[1400px] mx-auto px-6 md:px-8">
        
        {/* HEADER & GALLERY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-4">
            <div className="lg:col-span-8">
                 <div className="mb-6">
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                        {property.title}
                    </h1>
                    <p className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <MapPin size={16} className="text-[#0065eb]" /> 
                        {property.location.area}, {property.location.city}
                    </p>
                </div>
                
                {/* GALLERY */}
                <div className="relative w-full h-[320px] md:h-[450px] bg-slate-200 rounded-[24px] overflow-hidden group cursor-pointer border border-slate-200 mb-3">
                   {property.images.length > 0 ? (
                       <Image src={property.images[selectedImage]} alt={property.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
                   ) : (
                       <div className="flex items-center justify-center h-full text-slate-400">No Images</div>
                   )}
                   {/* Nav Buttons */}
                   <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-10">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === 0 ? property.images.length - 1 : prev - 1) }} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black"><ChevronLeft size={20}/></button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === property.images.length - 1 ? 0 : prev + 1) }} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black"><ChevronRight size={20}/></button>
                   </div>
                </div>
                {/* Thumbnails */}
                <div className="grid grid-cols-5 md:grid-cols-6 gap-2">
                    {property.images.map((img, idx) => (
                        <div key={idx} onClick={() => setSelectedImage(idx)} className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${selectedImage === idx ? 'ring-2 ring-black opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                            <Image src={img} alt="thumb" fill className="object-cover" />
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                      <h3 className="text-xl font-black text-slate-900 mb-4">About this Home</h3>
                      <p className="text-slate-600 leading-7 text-sm font-medium whitespace-pre-line max-w-3xl">
                          {property.description}
                      </p>
                </div>
            </div>

            <div className="lg:col-span-4">
                <AgentSidebar 
                  agent={agent} 
                  property={property} 
                  onBookTour={() => setIsBookingOpen(true)} 
                  onRestricted={(feature) => setRestrictedFeature(feature)}
                />
            </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="flex flex-col lg:flex-row gap-8 mt-12">
            <div className="w-full lg:w-[40%] flex flex-col gap-8">
                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-4">Property Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                           <Home size={20} className="text-[#0065eb] mb-2 mx-auto" />
                           <div className="text-sm font-black">{property.type}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Type</div>
                        </div>
                        <div className="p-4 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                           <Ruler size={20} className="text-[#0065eb] mb-2 mx-auto" />
                           <div className="text-sm font-black">{property.features?.size || 'N/A'} m²</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Size</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-black text-slate-900 mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 gap-3">
                         {property.features?.isFurnished && <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white"><div className="w-8 h-8 rounded-full bg-blue-50 text-[#0065eb] flex items-center justify-center"><Home size={16}/></div><span className="text-xs font-bold text-slate-900">Furnished</span></div>}
                         {property.features?.hasPool && <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white"><div className="w-8 h-8 rounded-full bg-blue-50 text-[#0065eb] flex items-center justify-center"><Waves size={16}/></div><span className="text-xs font-bold text-slate-900">Swimming Pool</span></div>}
                         {property.features?.hasGate && <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white"><div className="w-8 h-8 rounded-full bg-blue-50 text-[#0065eb] flex items-center justify-center"><ShieldCheck size={16}/></div><span className="text-xs font-bold text-slate-900">Gated</span></div>}
                         <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-transparent bg-slate-50 opacity-60"><div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center"><Wifi size={16}/></div><span className="text-xs font-bold text-slate-500">Internet Ready</span></div>
                    </div>
                </div>
            </div>

            {/* MAP SECTION - BLURRED IF NOT PRO */}
            <div className="w-full lg:w-[60%]">
                 <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                   Location 
                   {!isPro && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md">Locked</span>}
                 </h3>
                 
                 <div className="relative w-full h-[400px] bg-slate-200 rounded-[32px] overflow-hidden flex items-center justify-center group">
                      {/* Map Image/Component */}
                      <Image 
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000" 
                        alt="Map" 
                        fill 
                        className={`object-cover ${!isPro ? 'blur-md opacity-50 scale-105' : ''}`} 
                      />
                      
                      {isPro ? (
                        <div className="bg-white px-6 py-3 rounded-full shadow-xl relative z-10 font-bold flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                            <MapPin size={16} className="text-[#0065eb]" /> 
                            Open Interactive Map
                        </div>
                      ) : (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/10">
                           <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center max-w-xs">
                              <Lock size={32} className="text-amber-500 mb-3" />
                              <h4 className="font-black text-slate-900 mb-1">Location Hidden</h4>
                              <p className="text-xs text-slate-500 mb-4">Exact location is hidden because this agent is unverified.</p>
                              <button onClick={() => setRestrictedFeature("Detailed Map")} className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">
                                Learn More
                              </button>
                           </div>
                        </div>
                      )}
                 </div>
            </div>
        </div>

        {/* RELATED PROPERTIES */}
        {related.length > 0 && (
            <div className="mt-20 mb-12">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Similar Properties in {property.location.city}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {related.map(prop => (
                        <Link href={`/properties/${prop.id}`} key={prop.id} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden hover:shadow-xl transition-all block group">
                             <div className="relative h-48 bg-slate-200 overflow-hidden">
                                 {prop.images[0] && <Image src={prop.images[0]} alt={prop.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />}
                             </div>
                             <div className="p-4">
                                 <h4 className="font-bold text-slate-900 truncate">{prop.title}</h4>
                                 <p className="text-xs text-slate-500 font-bold mt-1">${prop.price.toLocaleString()}</p>
                             </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

      </div>
    </main>
  );
}