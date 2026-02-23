'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, MapPin, ChevronLeft, ChevronRight, Share2, Heart, 
  CheckCircle, ArrowRight, X, Expand, MessageCircle, Phone, 
  Calendar, Users, Minus, Plus, MessageSquare, Download, 
  Briefcase, Building2, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, serverTimestamp, orderBy, limit 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import SharedChatComponent from '@/components/sharedchat';

// --- TYPES ---
interface Hotel {
  id: string;
  slug?: string;
  name: string;
  description: string;
  pricePerNight: number;
  images: string[];
  location: { city: string; area: string; address?: string, coordinates?: { latitude: number, longitude: number } } | any;
  rating: number;
  amenities: string[];
  phone: string;
isPro?: boolean;
isVerified?: boolean; // Added this
contact?: { phoneWhatsapp?: string; phoneCall?: string }; // Added this
contactPhone?: string;
  planTier?: string;
}

interface Room {
  id: string;
  roomTypeName: string;
  price: number;
  capacity: number;
  availableCount: number; 
  images?: string[];
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function HotelDetailPage() {
  const params = useParams();
  const id = (params?.id || params?.slug) as string;
  const router = useRouter();
  const { user } = useAuth();

  // --- STATE ---
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarHotels, setSimilarHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [currentImg, setCurrentImg] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('About');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Set Document Title for SEO
  useEffect(() => {
    if (hotel) document.title = `${hotel.name} | GuriUp`;
  }, [hotel]);
  
  // Booking Logic State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    name: user?.displayName || '',
    phone: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    adults: 1,
    children: 0,
    roomCount: 1
  });

  // --- FETCH DATA ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
       let docSnap: any = null;
        let data: any = null;

        // PRIORITY 1: Search by Slug
        const slugQuery = query(collection(db, 'hotels'), where('slug', '==', id), limit(1));
        const slugDocs = await getDocs(slugQuery);

        if (!slugDocs.empty) {
          docSnap = slugDocs.docs[0];
          data = { id: docSnap.id, ...docSnap.data() } as Hotel;
        } else {
          // PRIORITY 2: Fallback to direct ID fetch
          const docRef = doc(db, 'hotels', id);
          docSnap = await getDoc(docRef);
          if (docSnap.exists()) data = { id: docSnap.id, ...docSnap.data() } as Hotel;
        }
        
        if (data) {
          setHotel(data);

          const [roomsSnap, reviewsSnap] = await Promise.all([
            getDocs(collection(db, 'hotels', id, 'rooms')),
            getDocs(query(collection(db, 'hotels', id, 'reviews'), orderBy('createdAt', 'desc'), limit(10)))
          ]);

          setRooms(roomsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
          setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));

          if (data.location?.city) {
            const simSnap = await getDocs(query(collection(db, 'hotels'), where('location.city', '==', data.location.city), limit(4)));
            setSimilarHotels(simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Hotel)).filter(h => h.id !== id));
          }
        }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // --- HANDLERS ---
  const handleBookingChange = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const adjustCount = (field: 'adults' | 'children' | 'roomCount', delta: number) => {
    setBookingData(prev => {
      const newVal = prev[field] + delta;
      if (newVal < 0) return prev;
      if (field === 'adults' && newVal < 1) return prev;
      if (field === 'roomCount' && newVal < 1) return prev;
      return { ...prev, [field]: newVal };
    });
  };

  const confirmBooking = async () => {
    if (!hotel) return;
    try {
      await addDoc(collection(db, 'bookings'), {
        hotelId: hotel.id,
        hotelName: hotel.name,
        userId: user?.uid || 'guest',
        ...bookingData,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'whatsapp_redirect'
      });
    } catch (e) { console.error("Booking save error", e); }

    const selectedRoom = rooms.find(r => r.id === bookingData.roomId);
    const roomName = selectedRoom ? selectedRoom.roomTypeName : 'Standard Room';
    const totalPrice = selectedRoom ? selectedRoom.price * bookingData.roomCount : hotel.pricePerNight;

    const message = `Hello, I would like to book a stay at *${hotel.name}*.\n\n` +
      `👤 *Name:* ${bookingData.name}\n` +
      `📱 *Phone:* ${bookingData.phone}\n` +
      `🏨 *Room:* ${roomName} (${bookingData.roomCount} room${bookingData.roomCount > 1 ? 's' : ''})\n` +
      `📅 *Dates:* ${bookingData.checkIn} to ${bookingData.checkOut}\n` +
      `👥 *Guests:* ${bookingData.adults} Adults, ${bookingData.children} Kids\n` +
      `💰 *Est. Price:* $${totalPrice}/night\n\n` +
      `Please confirm availability.`;

   const isPro = hotel.planTier?.toLowerCase().includes('pro') || hotel.isVerified === true;
    const rawP = hotel.contact?.phoneWhatsapp || hotel.contact?.phoneCall || hotel.contactPhone || hotel.phone;
    const finalPhone = isPro && rawP ? rawP : '+252653227084';
    let finalCleanPhone = finalPhone.replace(/[^0-9]/g, '');
    if (finalCleanPhone.startsWith('63') && finalCleanPhone.length === 9) {
      finalCleanPhone = '252' + finalCleanPhone;
    }
    window.open(`https://wa.me/${finalCleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    setShowBookingModal(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse text-slate-400 font-bold tracking-widest uppercase">Loading Experience...</div>;
  if (!hotel) return <div className="h-screen flex items-center justify-center font-bold">Hotel Not Found</div>;

  // SILENT INTERCEPT: Pro/Premium uses real number, Free/Unverified uses your number
  const isVerified = hotel.planTier?.toLowerCase().includes('pro') || hotel.isVerified === true;
  const rawTarget = hotel.contact?.phoneWhatsapp || hotel.contact?.phoneCall || hotel.contactPhone || hotel.phone;
  const targetPhone = isVerified && rawTarget ? rawTarget : '+252653227084';
  // 3. Add 252 country code to Hargeisa 63 numbers
  let cleanTargetPhone = targetPhone.replace(/[^0-9]/g, '');
  if (cleanTargetPhone.startsWith('63') && cleanTargetPhone.length === 9) {
    cleanTargetPhone = '252' + cleanTargetPhone;
  }

  return (
    // FIX 1: pt-28 pushes the content down to clear the global nav, no overlapping.
    <div className="bg-[#fafbfc] min-h-screen pb-20 font-sans text-slate-900 pt-10">
      
      {/* ================= HEADER SECTION (STATIC) ================= */}
      {/* Removed 'sticky' so it scrolls with the page, fixing the overlap issue */}
      <div className="bg-white border-b border-slate-100 mb-8 relative z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Left: Title & Address */}
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{hotel.name}</h1>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium mt-2">
              <MapPin size={16} className="text-[#0065eb]" />
              {typeof hotel.location === 'object' ? `${hotel.location.area}, ${hotel.location.city}` : hotel.location}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
              <Share2 size={20} />
            </button>
            <button className="hidden md:flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-slate-900">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              {hotel.rating} <span className="text-slate-400 font-normal">Rate</span>
            </button>
            <button onClick={() => setIsSaved(!isSaved)} className={`p-3 rounded-full transition-colors ${isSaved ? 'bg-red-50 text-red-500' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}>
              <Heart size={20} className={isSaved ? "fill-current" : ""} />
            </button>
            <button onClick={() => setShowBookingModal(true)} className="flex-1 md:flex-none bg-[#0065eb] hover:bg-[#0052c1] text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">
              Book Stay
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-6 space-y-4">
        
        {/* ================= SECTION 1: HERO (65% / 35%) ================= */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT SIDE: GALLERY (65%) --- */}
          <div className="w-full lg:w-[65%] space-y-4">
            {/* Main Viewer */}
            <div className="relative h-[300px] md:h-[500px] w-full rounded-[2.5rem] overflow-hidden group bg-slate-900 shadow-2xl">
              <Image 
                src={hotel.images?.[currentImg] || '/placeholder.jpg'} 
                alt={hotel.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-105" 
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

              {/* Back Button */}
              <button onClick={() => router.back()} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10 z-20">
                <ChevronLeft size={20} />
              </button>

              {/* Full View Button */}
              <button onClick={() => setShowGalleryModal(true)} className="absolute top-6 right-6 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all border border-white/10 z-20 flex items-center gap-2">
                <Expand size={14} /> Full View
              </button>

              {/* Centered Navigation */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 p-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl z-20">
                <button onClick={() => setCurrentImg(prev => (prev === 0 ? (hotel.images?.length || 1) - 1 : prev - 1))} className="p-3 bg-white/20 rounded-full text-white hover:bg-white hover:text-black transition-all">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-white text-xs font-black tracking-widest min-w-[40px] text-center">
                  {currentImg + 1} / {(hotel.images?.length || 1)}
                </span>
                <button onClick={() => setCurrentImg(prev => (prev === (hotel.images?.length || 1) - 1 ? 0 : prev + 1))} className="p-3 bg-white/20 rounded-full text-white hover:bg-white hover:text-black transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {(hotel.images || []).slice(0, 8).map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => idx === 7 ? setShowGalleryModal(true) : setCurrentImg(idx)}
                  className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${currentImg === idx ? 'ring-2 ring-[#0065eb] ring-offset-2' : 'hover:opacity-80'}`}
                >
                  <Image src={img || '/placeholder.jpg'} alt="" fill className="object-cover" />
                  {idx === 7 && (hotel.images?.length || 0) > 8 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-black text-sm">
                      +{(hotel.images?.length || 0) - 7}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* --- RIGHT SIDE: ACTION CARDS (35%) --- */}
          <div className="w-full lg:w-[35%] flex flex-col gap-5">
            
            {/* Card 1: Pricing & Book */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden flex-1 flex flex-col justify-center">
               <div className="flex items-end gap-2 mb-8">
                 <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Starting Price</p>
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">${hotel.pricePerNight}</h3>
                 </div>
                 <span className="text-slate-500 font-bold mb-2">/ night</span>
               </div>
               
               <button onClick={() => setShowBookingModal(true)} className="w-full py-5 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group">
                 Book Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </button>
               
               <p className="text-center text-xs text-slate-400 mt-6 font-bold flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" /> Secure Booking
               </p>
            </div>

            {/* Card 2: Contact Actions */}
            <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-3 gap-3">
               <a href={`https://wa.me/${cleanTargetPhone}`} target="_blank" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors cursor-pointer group">
                  <MessageCircle size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase tracking-wide">WhatsApp</span>
               </a>
               <a href={`tel:${targetPhone}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer group">
                  <Phone size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase tracking-wide">Call</span>
               </a>
               <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer group">
                  <MessageSquare size={24} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase tracking-wide">Chat</span>
               </button>
            </div>

            {/* Card 3: Amenities Preview */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
               <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Top Amenities</h4>
               <div className="flex flex-wrap gap-2">
                  {(Array.isArray(hotel.amenities) ? hotel.amenities : ["Free Wifi", "AC", "Security"]).slice(0, 5).map((am, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                       {am}
                    </span>
                  ))}
                  <span className="text-[10px] font-bold text-[#0065eb] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                     +More
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: TABS & MAP (60% / 40%) ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* --- LEFT: TABS (60%) --- */}
          <div className="w-full lg:w-[60%] bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 h-fit">
             {/* Tab Header - FIX: ADDED GALLERY */}
             <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2">
                {['About', 'Rooms', 'Reviews', 'Gallery'].map(tab => (
                   <button 
                     key={tab} 
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                   >
                     {tab}
                   </button>
                ))}
             </div>

             {/* Tab Body */}
             <div className="min-h-[300px]">
                {activeTab === 'About' && (
                   <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight">Welcome to <br/>{hotel.name}</h3>
                      <p className="text-slate-500 text-sm leading-loose whitespace-pre-line mb-6">
                         {hotel.description}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                         {(Array.isArray(hotel.amenities) ? hotel.amenities : []).slice(0, 6).map((am, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                               <CheckCircle size={14} className="text-[#0065eb]" /> {am}
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {activeTab === 'Rooms' && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {rooms.length > 0 ? rooms.map(room => (
                         <div key={room.id} onClick={() => { setBookingData(prev => ({...prev, roomId: room.id})); setShowBookingModal(true); }} className="group border border-slate-100 rounded-2xl p-3 hover:border-[#0065eb] transition-all cursor-pointer flex gap-3">
                            <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden relative shrink-0">
                               <Image src={room.images?.[0] || hotel.images?.[0] || '/placeholder.jpg'} alt="" fill className="object-cover" />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                               <h4 className="font-bold text-slate-900 text-sm">{room.roomTypeName}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase">Max {room.capacity} Guests</p>
                               <div className="mt-1 flex justify-between items-center">
                                  <span className="text-[#0065eb] font-black">${room.price}</span>
                                  <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-lg group-hover:bg-[#0065eb] transition-colors">Select</span>
                               </div>
                            </div>
                         </div>
                      )) : <p className="text-slate-400 text-sm font-bold">No rooms listed.</p>}
                   </div>
                )}

                {activeTab === 'Reviews' && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {reviews.length > 0 ? reviews.map(review => (
                         <div key={review.id} className="bg-slate-50 p-4 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                               <h5 className="font-bold text-slate-900 text-sm">{review.userName}</h5>
                               <div className="flex text-yellow-400"><Star size={10} className="fill-current"/> {review.rating}</div>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">"{review.comment}"</p>
                         </div>
                      )) : <p className="text-slate-400 text-sm font-bold">No reviews yet.</p>}
                   </div>
                )}

                {/* FIX: ADDED GALLERY CONTENT */}
               {activeTab === 'Gallery' && (
                   <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {(hotel.images || []).map((img, i) => (
                         <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                            <Image src={img || '/placeholder.jpg'} alt="" fill className="object-cover" />
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>

         {/* --- RIGHT: MAP (40%) --- */}
          <div className="w-full lg:w-[40%] bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative group min-h-[400px]">
             {(isVerified && hotel.location?.coordinates) ? (
               <iframe
                 width="100%"
                 height="100%"
                 style={{ border: 0, minHeight: '400px' }}
                 loading="lazy"
                 allowFullScreen
                 referrerPolicy="no-referrer-when-downgrade"
                 src={`https://maps.google.com/maps?q=${hotel.location.coordinates.latitude},${hotel.location.coordinates.longitude}&hl=en&z=15&output=embed`}
               ></iframe>
             ) : (
               <>
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700"></div>
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-4 rounded-full shadow-2xl mb-4 animate-bounce">
                       <MapPin size={32} className="text-[#0065eb] fill-[#0065eb]" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2 relative z-10">Explore Area</h4>
                    <p className="text-sm text-slate-700 font-bold max-w-[200px] relative z-10">{hotel.location?.area || 'City Center'}, {hotel.location?.city}</p>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(hotel.location?.city || '')}`} target="_blank" rel="noreferrer" className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#0065eb] transition-colors relative z-10">
                       Open Map
                    </a>
                 </div>
               </>
             )}
          </div>
        </div>

        {/* ================= SECTION 3: MARKETING & NEARBY (65% / 35%) ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
           
           {/* --- LEFT: MARKETING (65%) --- */}
           <div className="w-full lg:w-[65%] relative rounded-[2.5rem] overflow-hidden bg-[#0a0c10] min-h-[400px] flex items-center p-8 lg:p-12 order-1">
              {/* Background Art */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#0065eb]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

              <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                 {/* Text */}
                 <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-4 w-fit backdrop-blur-md">
                        GuriUp Ecosystem
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tight">
                        Grow Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-blue-400">Business Today.</span>
                    </h2>
                    <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed max-w-sm">
                        Download our app for exclusive mobile deals, or join our network to grow your business.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                        <button className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-colors group">
                           <Download size={20} className="group-hover:translate-y-1 transition-transform" />
                           <div className="text-left leading-none">
                              <span className="text-[9px] font-black uppercase text-slate-500 block mb-1">Get App</span>
                              <span className="text-sm">Download</span>
                           </div>
                        </button>
                    </div>
                 </div>

                 {/* Cards */}
                 <div className="grid grid-cols-2 gap-4">
                     <Link href="/join/agent" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all group cursor-pointer text-center">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-3 mx-auto group-hover:scale-110 transition-transform">
                           <Briefcase size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm">Become Agent</h4>
                     </Link>
                     <Link href="/join/hotel" className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md hover:bg-white/10 transition-all group cursor-pointer text-center translate-y-6">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-3 mx-auto group-hover:scale-110 transition-transform">
                           <Building2 size={20} />
                        </div>
                        <h4 className="text-white font-bold text-sm">List Hotel</h4>
                     </Link>
                 </div>
              </div>
           </div>

           {/* --- RIGHT: NEARBY STAYS (35%) --- */}
           <div className="w-full lg:w-[35%] bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col min-h-[400px] order-2">
             <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-slate-900 text-lg">Nearby Stays</h4>
                <Link href="/hotels" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#0065eb] hover:text-white transition-colors">
                   <ArrowRight size={18} />
                </Link>
             </div>
             <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar">
                {similarHotels.map(sim => (
                   <Link key={sim.id} href={`/hotels/${sim.slug || sim.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-3xl transition-colors group border border-transparent hover:border-slate-100">
                      <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden relative shrink-0">
                         <Image src={sim.images?.[0] || '/placeholder.jpg'} alt="" fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h5 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#0065eb] transition-colors">{sim.name}</h5>
                         <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10}/> {sim.location?.area}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-sm font-black text-slate-900 block">${sim.pricePerNight}</span>
                      </div>
                   </Link>
                ))}
                {similarHotels.length === 0 && <div className="flex flex-col items-center justify-center h-full text-slate-300 font-bold"><Briefcase size={40} className="mb-2 opacity-50"/>No nearby hotels found.</div>}
             </div>
           </div>

        </div>

      </main>

      {/* ================= BOOKING MODAL ================= */}
      {showBookingModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)}></div>
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               {/* Header */}
               <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                  <div>
                     <h2 className="text-xl font-black text-slate-900">Complete Reservation</h2>
                     <p className="text-xs text-slate-500 font-bold mt-1">{hotel.name}</p>
                  </div>
                  <button onClick={() => setShowBookingModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                     <X size={20} />
                  </button>
               </div>

               {/* Scrollable Form */}
               <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Full Name</label>
                        <input type="text" value={bookingData.name} onChange={(e) => handleBookingChange('name', e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="Your Name" />
                     </div>
                     <div className="col-span-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Phone Number</label>
                        <input type="tel" value={bookingData.phone} onChange={(e) => handleBookingChange('phone', e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="+252..." />
                     </div>
                  </div>

                  {/* Room Selection */}
                  <div>
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Select Room</label>
                     <div className="grid grid-cols-1 gap-2">
                        {rooms.map(room => (
                           <div key={room.id} onClick={() => handleBookingChange('roomId', room.id)} className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${bookingData.roomId === room.id ? 'border-[#0065eb] bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                              <div><p className="font-bold text-sm text-slate-900">{room.roomTypeName}</p><p className="text-xs text-slate-500">Max {room.capacity} Guests</p></div>
                              <span className="font-black text-sm text-[#0065eb]">${room.price}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Check-in</label><div className="relative"><Calendar size={16} className="absolute top-4 left-4 text-slate-400" /><input type="date" onChange={(e) => handleBookingChange('checkIn', e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" /></div></div>
                     <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Check-out</label><div className="relative"><Calendar size={16} className="absolute top-4 left-4 text-slate-400" /><input type="date" onChange={(e) => handleBookingChange('checkOut', e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" /></div></div>
                  </div>

                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-4">
                     {['adults', 'children', 'roomCount'].map(field => (
                        <div key={field} className="bg-slate-50 p-3 rounded-xl flex flex-col items-center">
                           <span className="text-[10px] font-black uppercase text-slate-400 mb-2">{field.replace('roomCount', 'Rooms')}</span>
                           <div className="flex items-center gap-3">
                              <button onClick={() => adjustCount(field as any, -1)} className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"><Minus size={12}/></button>
                              <span className="font-black text-sm">{(bookingData as any)[field]}</span>
                              <button onClick={() => adjustCount(field as any, 1)} className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center"><Plus size={12}/></button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Footer */}
               <div className="p-6 border-t border-slate-100 bg-white">
                  <button onClick={confirmBooking} className="w-full py-4 bg-[#25D366] hover:bg-[#1dbf57] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2">
                     <MessageCircle size={20} /> Confirm via WhatsApp
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-300">
           <button onClick={() => setShowGalleryModal(false)} className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all z-20"><X size={24} /></button>
           <div className="flex-1 overflow-y-auto p-4 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(hotel.images || []).map((img, i) => (
                 <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                    <Image src={img || '/placeholder.jpg'} alt="" fill className="object-contain" />
                 </div>
              ))}
           </div>
        </div>
      )}
      {isChatOpen && (
        <SharedChatComponent 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          recipientId={hotel.id} 
          recipientName={hotel.name} 
        />
      )}
    </div>
  );
}