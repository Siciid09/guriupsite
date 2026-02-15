'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './../../../lib/firebase'; 

// --- ICONS ---
const Icons = {
  Verified: () => <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
  Location: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
  Phone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>,
  Chat: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Whatsapp: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.891-11.891 11.891-2.003 0-3.976-.505-5.717-1.46l-6.276 1.678zm6.29-4.15l.349.21c1.47.882 3.167 1.347 4.914 1.347 5.176 0 9.39-4.214 9.39-9.39 0-2.505-.974-4.86-2.744-6.628-1.77-1.77-4.122-2.744-6.628-2.744-5.176 0-9.39 4.214-9.39 9.39 0 1.83.533 3.613 1.54 5.143l.235.357-1.01 3.687 3.744-.982z"/></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>,
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>,
  Bed: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  Bath: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>,
  Square: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>,
  Star: () => <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>,
  BackArrow: () => <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
};

// --- DATA TYPES ---
interface AgentProfile {
  id: string;
  userid: string; 
  name: string;
  agencyName: string;
  bio: string;
  profileImageUrl: string;
  coverPhoto: string;
  phone: string;
  email: string;
  location: string;
  planTier: 'free' | 'pro' | 'premium';
  joinedDate: string;
  totalListings: number;
  propertiesSold: number;
  averageRating: number;
  languages: string[];
  specialties: string[];
}

interface Property {
  id: string;
  title: string;
  price: number;
  status: 'available' | 'rented_out' | 'sold';
  isForSale: boolean;
  images: string[];
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  planTier?: string;
  isArchived: boolean;
}

const AgentProfilePage = () => {
  const params = useParams();
  const agentDocId = params.id as string; 

  // State
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [isContactModalOpen, setContactModalOpen] = useState(false);

  useEffect(() => {
    if (!agentDocId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Agent Profile
        const agentDocRef = doc(db, 'agents', agentDocId);
        const agentSnap = await getDoc(agentDocRef);

        if (!agentSnap.exists()) {
          setError('Agent not found');
          setLoading(false);
          return;
        }

        const data = agentSnap.data();
        
        let joinedString = 'Recently';
        if (data.joinDate) {
            const date = (data.joinDate as Timestamp).toDate();
            joinedString = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        const plan = data.planTier ?? 'free';
        const linkedUserId = data.userid || agentSnap.id; 

        const agentData: AgentProfile = {
          id: agentSnap.id,
          userid: linkedUserId,
          name: data.name ?? 'Unknown Agent',
          agencyName: data.agencyName || 'Independent Agent',
          bio: data.bio ?? 'No bio provided.',
          profileImageUrl: data.profileImageUrl ?? '',
          coverPhoto: data.coverPhoto ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          location: data.city ?? 'Hargeisa, Somaliland',
          planTier: plan,
          joinedDate: joinedString,
          totalListings: data.totalListings ?? 0,
          propertiesSold: data.propertiesSold ?? 0,
          averageRating: data.averageRating ?? 0,
          languages: data.languages ?? [],
          specialties: data.specialties ?? [],
        };

        setAgent(agentData);

        // 2. Fetch Properties
        const q = query(
            collection(db, 'property'),
            where('agentId', '==', linkedUserId), 
            where('isArchived', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const fetchedProperties: Property[] = [];

        querySnapshot.forEach((doc) => {
            const pData = doc.data();
            
            // Filter drafts
            if (pData.status === 'draft') return;

            // --- FIX: Location Formatting ---
            let locString = 'Unknown Location';
            if (pData.location) {
                if (typeof pData.location === 'string') locString = pData.location;
                else if (typeof pData.location === 'object') {
                    const area = pData.location.area || '';
                    const city = pData.location.city || '';
                    if(area && city) locString = `${area}, ${city}`;
                    else locString = city || area || 'Unknown Location';
                }
            }

            // --- FIX: Robust Bed/Bath/Area Reading ---
            // Checking both root level and nested 'features' map used in some app versions
            const beds = pData.bedrooms ?? pData.features?.bedrooms ?? 0;
            const baths = pData.bathrooms ?? pData.features?.bathrooms ?? 0;
            const size = pData.size ?? pData.area ?? pData.features?.area ?? pData.features?.size ?? 0;

            fetchedProperties.push({
                id: doc.id,
                title: pData.title ?? 'Untitled Property',
                price: pData.price ?? 0,
                status: pData.status ?? 'available',
                isForSale: pData.isForSale ?? false,
                images: pData.images ?? [],
                location: locString,
                bedrooms: Number(beds),
                bathrooms: Number(baths),
                area: Number(size),
                planTier: pData.planTier,
                isArchived: pData.isArchived ?? false,
            });
        });

        setProperties(fetchedProperties);

      } catch (err) {
        console.error("Error fetching agent details:", err);
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentDocId]);

  const isVerified = agent?.planTier === 'pro' || agent?.planTier === 'premium';

  // Sort properties: Sold last, Rented last
  const sortedProperties = [...properties].sort((a, b) => {
      if (a.status === 'sold') return 1;
      if (b.status === 'sold') return -1;
      return 0;
  });

  const handleContactAction = (type: 'call' | 'whatsapp') => {
    if (!agent) return;
    if (!isVerified) {
      setContactModalOpen(true);
      return;
    }
    if (!agent.phone) {
        alert("No phone number available");
        return;
    }
    if (type === 'call') {
      window.open(`tel:${agent.phone}`);
    } else {
      const cleanPhone = agent.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-[#0065eb] rounded-full animate-spin"></div>
    </div>
  );

  if (error || !agent) return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Agent Not Found</h2>
        <Link href="/agents" className="text-blue-600 font-bold hover:underline">Go back to Agents</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-20">
      
      {/* ================= HERO HEADER ================= */}
      <div className="relative w-full h-[320px] md:h-[400px] bg-slate-900 overflow-hidden group">
        {/* Cover Photo */}
        {agent.coverPhoto ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" style={{ backgroundImage: `url('${agent.coverPhoto}')` }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0065eb] to-[#004bb5]">
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          </div>
        )}

        {/* Back Button */}
        <div className="absolute top-28 left-6 z-20">
            <Link href="/agents" className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all">
                <Icons.BackArrow />
            </Link>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10 -mt-24 md:-mt-32">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* ================= LEFT SIDE: PROFILE CARD ================= */}
            <div className="w-full md:w-[380px] shrink-0">
                <div className="bg-white rounded-[32px] shadow-xl p-8 relative overflow-hidden border border-gray-100">
                    
                    {/* Verification Badge */}
                    {isVerified ? (
                        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                            <Icons.Verified />
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Verified</span>
                        </div>
                    ) : (
                        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Basic</span>
                        </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-full p-1.5 bg-white shadow-xl ring-4 ring-gray-50 mx-auto md:mx-0 overflow-hidden">
                            <img 
                                src={agent.profileImageUrl || `https://ui-avatars.com/api/?background=random&name=${agent.name}`} 
                                alt={agent.name} 
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=random&name=${agent.name}`; }}
                            />
                        </div>
                    </div>

                    {/* Name & Details */}
                    <div className="text-center md:text-left mb-8">
                        <h1 className="text-3xl font-black text-slate-900 mb-1 leading-tight">{agent.name}</h1>
                        <p className="text-sm font-bold text-gray-500 mb-4">{agent.agencyName}</p>
                        
                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-600 font-medium">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                                <Icons.Location />
                                <span>{agent.location}</span>
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 font-bold uppercase tracking-wide md:text-left">
                            Joined {agent.joinedDate}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="bg-gray-50 p-5 rounded-3xl text-center border border-gray-100 flex flex-col items-center justify-center">
                            <div className="text-3xl font-black text-slate-900 mb-1">{agent.totalListings}</div>
                            <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Listings</div>
                        </div>
                        <div className="bg-gray-50 p-5 rounded-3xl text-center border border-gray-100 flex flex-col items-center justify-center">
                            <div className="text-3xl font-black text-slate-900 mb-1">{agent.propertiesSold}</div>
                            <div className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Sold</div>
                        </div>
                        <div className="col-span-2 bg-[#F0F7FF] p-5 rounded-3xl flex items-center justify-between border border-blue-100">
                            <div className="flex flex-col items-start">
                                <div className="text-2xl font-black text-slate-900">{agent.averageRating}</div>
                                <div className="text-[10px] uppercase font-black text-blue-600 tracking-widest">Rating</div>
                            </div>
                            <div className="flex gap-1">
                                {/* FIX: Using 5 Stars instead of ticks */}
                                {[1,2,3,4,5].map(i => <Icons.Star key={i} />)}
                            </div>
                        </div>
                    </div>

                    {/* Contact Actions */}
                    <div className="space-y-3">
                        <button className="w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                            <Icons.Chat />
                            Start Secure Chat
                        </button>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleContactAction('call')}
                                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${isVerified ? 'border-gray-100 hover:border-black hover:bg-black hover:text-white bg-white text-slate-700' : 'bg-gray-50 text-gray-400 border-transparent cursor-not-allowed'}`}
                            >
                                {isVerified ? <Icons.Phone /> : <Icons.Lock />}
                                Call
                            </button>
                            <button 
                                onClick={() => handleContactAction('whatsapp')}
                                className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all active:scale-95 ${isVerified ? 'border-gray-100 hover:border-[#25D366] hover:text-[#25D366] bg-white text-slate-700' : 'bg-gray-50 text-gray-400 border-transparent cursor-not-allowed'}`}
                            >
                                {isVerified ? <Icons.Whatsapp /> : <Icons.Lock />}
                                WhatsApp
                            </button>
                        </div>
                    </div>

                    {/* Bio & Specialties */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Specialties</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {agent.specialties.length > 0 ? agent.specialties.map((s, i) => (
                                <span key={i} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 uppercase">{s}</span>
                            )) : (
                                <span className="text-sm text-gray-400 italic">No specialties listed</span>
                            )}
                        </div>

                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3">About</h3>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">
                            {agent.bio}
                        </p>
                    </div>
                </div>
            </div>

            {/* ================= RIGHT SIDE: PROPERTIES ================= */}
            <div className="flex-1 w-full mt-8 md:mt-0">
                {/* Header (Replaces Tab) */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-200">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-wide">Active Listings</span>
                        <span className="ml-2 bg-blue-100 text-[#0065eb] px-2 py-0.5 rounded-full text-xs font-bold">{sortedProperties.length}</span>
                    </div>
                </div>

                {/* Properties Grid */}
                {sortedProperties.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {sortedProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-[32px] border border-gray-100 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Properties Found</h3>
                        <p className="text-gray-400 font-medium text-sm">This agent has no properties listed.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* ================= UNVERIFIED MODAL ================= */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setContactModalOpen(false)}></div>
            <div className="bg-white rounded-[40px] p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
                    <Icons.Lock />
                </div>
                <h3 className="text-2xl font-black text-center text-slate-900 mb-3">Restricted Access</h3>
                <p className="text-gray-500 text-center text-sm font-medium mb-8 leading-relaxed">
                    This agent is unverified. Direct contact details are hidden for your safety. Please use the secure In-App Chat.
                </p>
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => { setContactModalOpen(false); /* Trigger Chat */ }}
                        className="w-full bg-[#0065eb] hover:bg-[#0052c1] text-white py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        Open Secure Chat
                    </button>
                    <button 
                        onClick={() => setContactModalOpen(false)}
                        className="w-full text-gray-400 py-4 font-bold hover:text-slate-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

// --- MINI PROPERTY CARD COMPONENT ---
const PropertyCard = ({ property }: { property: Property }) => {
    // Determine colors based on status
    const isSold = property.status === 'sold';
    const isRented = property.status === 'rented_out';
    
    let statusLabel = property.isForSale ? 'For Sale' : 'For Rent';
    let statusColor = property.isForSale ? 'bg-[#0065eb]' : 'bg-slate-900';

    if (isSold) {
        statusLabel = 'Sold';
        statusColor = 'bg-red-500';
    } else if (isRented) {
        statusLabel = 'Rented';
        statusColor = 'bg-red-500';
    }

    return (
        <Link href={`/properties/${property.id}`} className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full">
            <div className="relative h-56 overflow-hidden">
                <img 
                    src={property.images && property.images.length > 0 ? property.images[0] : "https://via.placeholder.com/400x300"} 
                    alt={property.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Status Badge */}
                <div className={`absolute top-4 left-4 ${statusColor} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg`}>
                    {statusLabel}
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-slate-900 font-black text-sm shadow-lg">
                    ${property.price.toLocaleString()}
                    {!property.isForSale && <span className="text-xs font-bold text-gray-400 ml-1">/mo</span>}
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-slate-900 mb-1 truncate leading-tight group-hover:text-[#0065eb] transition-colors">{property.title}</h3>
                <p className="text-xs font-bold text-gray-400 mb-5 truncate flex items-center gap-1">
                    <Icons.Location />
                    {property.location}
                </p>
                
                <div className="mt-auto flex items-center gap-4 border-t border-gray-50 pt-4 text-gray-500">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Icons.Bed />
                        <span className="text-slate-900 text-sm">{property.bedrooms}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200"></div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Icons.Bath />
                        <span className="text-slate-900 text-sm">{property.bathrooms}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200"></div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Icons.Square />
                        <span className="text-slate-900 text-sm">{property.area}</span> m²
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default AgentProfilePage;