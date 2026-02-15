'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // CHANGED: Added useParams
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, MapPin, ChevronLeft, ChevronRight, 
  Wifi, Droplets, Dumbbell, Utensils, 
  Share2, Heart, CheckCircle, 
  Calendar, Users, ArrowRight, Lock, X, Expand, MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  doc, getDoc, collection, query, where, getDocs, 
  addDoc, serverTimestamp, orderBy, limit 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// =======================================================================
//  0. TYPES
// =======================================================================

interface LocationData {
  city: string;
  area: string;
  coordinates: { latitude: number; longitude: number };
  address?: string;
}

interface HotelAmenities {
  hasWifi: boolean;
  hasPool: boolean;
  hasGym: boolean;
  hasRestaurant: boolean;
}

interface Hotel {
  id: string;
  name: string;
  description: string;
  pricePerNight: number;
  images: string[];
  location: LocationData | any;
  rating: number;
  amenities: HotelAmenities;
  planTier?: 'free' | 'pro' | 'premium';
  hotelAdminId?: string;
}

interface Room {
  id: string;
  roomTypeName: string;
  price: number;
  capacity: number;
  features?: string[];
  images?: string[];
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

// =======================================================================
//  1. HELPER COMPONENTS
// =======================================================================

const FeatureCard = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group cursor-default">
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0065eb] group-hover:text-white transition-colors mb-2">
        {icon}
    </div>
    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-900">{label}</span>
  </div>
);

const ReviewCard = ({ review }: { review: Review }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-[#0065eb]">
               {review.userName.charAt(0)}
            </div>
            <div>
               <p className="font-bold text-slate-900 text-sm">{review.userName}</p>
               <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"} />
                  ))}
               </div>
            </div>
            <span className="ml-auto text-xs text-slate-400 font-bold">
              {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Recent'}
            </span>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">"{review.comment}"</p>
    </div>
);

// =======================================================================
//  2. MAIN PAGE COMPONENT
// =======================================================================

export default function HotelDetailPage() {
  // --- CHANGED: Use useParams hook instead of props ---
  const params = useParams();
  // Support both 'id' and 'slug' depending on your folder name
  const id = (params?.id || params?.slug) as string;

  const router = useRouter();
  const { user } = useAuth();

  // 2. State
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedHotels, setRelatedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // UI State
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState('About');
  const [isSaved, setIsSaved] = useState(false);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [nights, setNights] = useState(1);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Review Form State
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // 3. Fetch Data
  useEffect(() => {
    // Safety check: if ID is missing, stop loading immediately
    if (!id) {
        setLoading(false);
        setErrorMsg("Invalid URL: No Hotel ID found.");
        return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching Hotel ID:", id); // Debug Log

        // A. Fetch Hotel
        const docRef = doc(db, 'hotels', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const hotelData = { id: docSnap.id, ...docSnap.data() } as Hotel;
          setHotel(hotelData);

          // B. Fetch Rooms (Subcollection)
          try {
            const roomsRef = collection(db, 'hotels', id, 'rooms');
            const roomsSnap = await getDocs(roomsRef);
            setRooms(roomsSnap.docs.map(d => ({ 
              id: d.id, 
              roomTypeName: d.data().name || d.data().roomTypeName || 'Room',
              price: d.data().price || d.data().pricePerNight || 0,
              capacity: d.data().capacity || d.data().maxOccupancy || 2,
              ...d.data() 
            } as Room)));
          } catch (e) { console.log("No rooms found or permission error"); }

          // C. Fetch Reviews
          try {
            const reviewsRef = collection(db, 'hotels', id, 'reviews');
            const qReviews = query(reviewsRef, orderBy('createdAt', 'desc'), limit(5));
            const reviewsSnap = await getDocs(qReviews);
            setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
          } catch (e) { console.log("No reviews found"); }

          // D. Fetch Related (Same City)
          try {
             if (hotelData.location && hotelData.location.city) {
                 const qRelated = query(
                    collection(db, 'hotels'), 
                    where('location.city', '==', hotelData.location.city),
                    limit(4)
                 );
                 const relatedSnap = await getDocs(qRelated);
                 setRelatedHotels(relatedSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as Hotel))
                    .filter(h => h.id !== id));
             }
          } catch (e) { console.log("No related hotels"); }
        } else {
            setErrorMsg("Hotel not found in database.");
        }
      } catch (error) { 
        console.error("Critical Error fetching hotel:", error); 
        setErrorMsg("Connection Error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- LOGIC: MAP SECURITY ---
  const isPro = hotel?.planTier === 'pro' || hotel?.planTier === 'premium';

  // --- LOGIC: CHAT ---
  const handleChat = async () => {
    if (!user) return alert("Please login to chat");
    if (!hotel?.hotelAdminId) return alert("Chat unavailable for this hotel");

    try {
      await addDoc(collection(db, 'chats'), {
        participants: [user.uid, hotel.hotelAdminId],
        hotelId: hotel.id,
        hotelName: hotel.name,
        lastMessage: 'Interested in booking',
        updatedAt: serverTimestamp(),
      });
      alert("Chat started! Check your messages.");
    } catch (e) {
      console.error(e);
    }
  };

  // --- LOGIC: BOOKING ---
  const openBooking = (room: Room | null = null) => {
    if (!user) {
      if(confirm("Please log in to book.")) router.push('/login');
      return;
    }
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hotel) return;
    setIsBookingLoading(true);

    const price = selectedRoom ? selectedRoom.price : hotel.pricePerNight;
    
    try {
      await addDoc(collection(db, 'bookings'), {
        hotelId: hotel.id,
        hotelName: hotel.name,
        roomId: selectedRoom?.id || 'general',
        roomName: selectedRoom?.roomTypeName || 'General Room',
        userId: user.uid,
        userName: user.displayName || 'Guest',
        checkInDate: bookingDate,
        nights: nights,
        totalPrice: price * nights,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'web'
      });
      alert("Booking Request Sent!");
      setShowBookingModal(false);
    } catch (e) {
      console.error(e);
      alert("Booking failed");
    } finally {
      setIsBookingLoading(false);
    }
  };

  // --- LOGIC: REVIEWS ---
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hotel) return;
    
    await addDoc(collection(db, 'hotels', hotel.id, 'reviews'), {
        userId: user.uid,
        userName: user.displayName || 'User',
        rating: reviewRating,
        comment: reviewText,
        createdAt: serverTimestamp()
    });
    setReviewText('');
    alert("Review Submitted!");
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#0065eb] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading Hotel Details...</p>
    </div>
  );

  if (errorMsg || !hotel) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Oops!</h2>
        <p className="text-slate-500">{errorMsg || "Hotel not found"}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-200 rounded-full font-bold">Go Back</button>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:h-[calc(100vh-80px)] min-h-[600px] flex flex-col lg:flex-row gap-8">
        
        {/* LEFT: IMAGE SLIDER */}
        <div className="lg:w-[70%] w-full h-[400px] lg:h-full relative rounded-[2rem] overflow-hidden group shadow-2xl bg-slate-200">
            <Image 
              src={hotel.images[currentImgIndex] || '/placeholder.jpg'} 
              alt={hotel.name} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw" // FIXED: Added sizes prop
              className="object-cover transition-all duration-700 hover:scale-105" 
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Controls */}
            <button onClick={() => router.back()} className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all z-20">
                <ChevronLeft size={20} />
            </button>
            <div className="absolute top-6 right-6 flex gap-2 z-20">
                <button onClick={handleChat} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-[#0065eb] transition-all"><MessageCircle size={20} /></button>
                <button onClick={() => setIsSaved(!isSaved)} className={`bg-white/20 backdrop-blur-md p-3 rounded-full transition-all ${isSaved ? 'text-red-500 bg-white' : 'text-white hover:bg-white hover:text-red-500'}`}><Heart size={20} className={isSaved ? "fill-current" : ""} /></button>
                <button onClick={() => setIsFullScreen(true)} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-black transition-all"><Expand size={20} /></button>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-black/30 backdrop-blur-xl rounded-full border border-white/10 p-1.5 shadow-2xl z-20">
                <button onClick={() => setCurrentImgIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length)} className="p-3 text-white hover:bg-white/20 rounded-full"><ChevronLeft size={20} /></button>
                <div className="px-4 text-xs font-black text-white tracking-widest min-w-[60px] text-center">{currentImgIndex + 1} / {hotel.images.length}</div>
                <button onClick={() => setCurrentImgIndex((prev) => (prev + 1) % hotel.images.length)} className="p-3 text-white hover:bg-white/20 rounded-full"><ChevronRight size={20} /></button>
            </div>
        </div>

        {/* RIGHT: BOOKING & FEATURES */}
        <div className="lg:w-[30%] w-full flex flex-col gap-6 h-full overflow-y-auto no-scrollbar">
            
            {/* BOOKING CARD */}
            <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 blur-[50px] rounded-full pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Starting Price</p>
                        <div className="flex items-baseline gap-1">
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight">${hotel.pricePerNight}</h2>
                            <span className="text-slate-500 font-medium">/night</span>
                        </div>
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle size={12} /> Available
                    </div>
                </div>

                <button 
                  onClick={() => openBooking(null)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-[#0065eb] transition-all flex items-center justify-center gap-2 group"
                >
                  {user ? 'Check Availability' : 'Login to Book'}
                </button>
            </div>

            {/* AMENITIES */}
            <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-lg flex-1">
               <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#0065eb]"></span> Highlights
               </h3>
               {hotel.amenities && (
                   <div className="grid grid-cols-2 gap-3 h-full content-start">
                      {hotel.amenities.hasWifi && <FeatureCard icon={<Wifi size={18}/>} label="Fast Wifi" />}
                      {hotel.amenities.hasPool && <FeatureCard icon={<Droplets size={18}/>} label="Pool" />}
                      {hotel.amenities.hasGym && <FeatureCard icon={<Dumbbell size={18}/>} label="Fitness" />}
                      {hotel.amenities.hasRestaurant && <FeatureCard icon={<Utensils size={18}/>} label="Dining" />}
                   </div>
               )}
            </div>
        </div>
      </div>

      {/* --- TITLE & TABS --- */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
         <div className="mb-10">
            <h1 className="text-3xl md:text-5xl font-extrabold font-sans text-slate-900 mb-4">{hotel.name}</h1>
            <div className="flex items-center gap-4">
                <p className="text-lg flex items-center gap-2 text-slate-600 font-medium">
                    <MapPin size={20} className="text-slate-400" /> 
                    {typeof hotel.location === 'object' 
                      ? `${hotel.location.area || ''}, ${hotel.location.city || ''}`
                      : hotel.location}
                </p>
                <div className="flex items-center gap-1 bg-amber-500 px-2 py-1 rounded-md text-white text-sm font-bold shadow-sm">
                    <Star size={14} className="fill-white" /> {hotel.rating.toFixed(1)}
                </div>
            </div>
         </div>

         <div className="border-b border-slate-200 mb-10">
            <nav className="flex space-x-8 -mb-px overflow-x-auto no-scrollbar">
                {['About', 'Rooms', 'Reviews', 'Gallery'].map(tabName => (
                    <button 
                        key={tabName} 
                        onClick={() => setActiveTab(tabName)}
                        className={`py-4 px-1 font-bold text-lg transition-all border-b-2 whitespace-nowrap ${
                            activeTab === tabName 
                            ? 'border-[#0065eb] text-[#0065eb]' 
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        {tabName}
                    </button>
                ))}
            </nav>
         </div>

         {/* TAB CONTENT */}
         <div className="min-h-[400px]">
            {activeTab === 'About' && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Description</h3>
                    <p className="text-slate-600 text-lg leading-loose whitespace-pre-line">{hotel.description}</p>
                </div>
            )}

            {activeTab === 'Rooms' && (
                <div id="rooms-section" className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {rooms.length > 0 ? rooms.map(room => (
                      <div key={room.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
                         <div className="relative h-64 overflow-hidden">
                            <Image 
                              src={room.images?.[0] || hotel.images[0] || '/placeholder.jpg'} 
                              alt={room.roomTypeName} 
                              fill 
                              sizes="(max-width: 768px) 100vw, 50vw" // FIXED: Added sizes
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900">
                               Max {room.capacity} Guests
                            </div>
                         </div>
                         <div className="p-8">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{room.roomTypeName}</h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                               {room.features?.slice(0,3).map((f,i) => (
                                  <span key={i} className="text-[10px] font-bold uppercase text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-slate-100">
                                     <CheckCircle size={10} className="text-[#0065eb]"/> {f}
                                  </span>
                               ))}
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                               <p className="text-3xl font-black text-[#0065eb]">${room.price}</p>
                               <button onClick={() => openBooking(room)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0065eb] transition-colors shadow-lg">
                                  Book Now
                               </button>
                            </div>
                         </div>
                      </div>
                   )) : <p>No rooms listed.</p>}
                </div>
            )}

            {activeTab === 'Reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Write Review */}
                    {user && (
                        <form onSubmit={submitReview} className="mb-10 bg-slate-50 p-6 rounded-2xl">
                             <h4 className="font-bold mb-4">Write a Review</h4>
                             <textarea 
                                value={reviewText} onChange={e => setReviewText(e.target.value)}
                                className="w-full p-4 rounded-xl border border-slate-200 mb-4" placeholder="How was your stay?"
                             />
                             <div className="flex justify-between items-center">
                                 <div className="flex gap-1">
                                    {[1,2,3,4,5].map(s => (
                                        <Star key={s} size={24} onClick={() => setReviewRating(s)} className={`cursor-pointer ${s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                 </div>
                                 <button type="submit" className="bg-[#0065eb] text-white px-6 py-2 rounded-lg font-bold">Post</button>
                             </div>
                        </form>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {reviews.length > 0 ? reviews.map(r => <ReviewCard key={r.id} review={r} />) : <p className="text-slate-500 italic">No reviews yet.</p>}
                    </div>
                </div>
            )}
            
            {activeTab === 'Gallery' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {hotel.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { setCurrentImgIndex(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <Image 
                              src={img} 
                              alt="" 
                              fill 
                              sizes="(max-width: 768px) 50vw, 25vw" // FIXED: Added sizes
                              className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* --- MAP & RELATED --- */}
      <div className="bg-slate-50 py-20 border-t border-slate-200 mt-20">
         <div className="max-w-[1600px] mx-auto px-6">
            <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-2">
                <span className="w-8 h-1 bg-[#0065eb] rounded-full"></span> Location & Neighbors
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               
               {/* MAP - CRITICAL SECURITY FEATURE */}
               <div className="h-[500px] w-full bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200 relative group">
                  <div className="absolute inset-0 bg-[url('/map-pattern.png')] bg-cover opacity-50 flex items-center justify-center">
                      <MapPin size={40} className="text-blue-600"/>
                  </div>
                  
                  {/* BLUR OVERLAY FOR NON-PRO */}
                  {!isPro && (
                      <div className="absolute inset-0 backdrop-blur-md bg-white/40 flex flex-col items-center justify-center z-10">
                        <div className="bg-white p-4 rounded-full shadow-xl mb-3">
                           <Lock className="text-red-500 w-8 h-8" />
                        </div>
                        <p className="font-black text-slate-900 text-lg">Location Hidden</p>
                        <p className="text-slate-600 text-sm mb-4">Upgrade to Pro to view exact location</p>
                      </div>
                  )}
               </div>

               {/* RELATED LIST */}
               <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col h-[500px] shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <div>
                         <h4 className="text-xl font-black text-slate-900">Similar stays</h4>
                         <p className="text-slate-500 text-sm font-medium">Nearby hotels</p>
                      </div>
                      <Link href="/hotels" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#0065eb] transition-all">
                         <ArrowRight size={18}/>
                      </Link>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                      {relatedHotels.map(h => (
                         <Link key={h.id} href={`/hotels/${h.id}`} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200">
                               <Image 
                                 src={h.images[0] || '/placeholder.jpg'} 
                                 alt={h.name} 
                                 fill 
                                 sizes="100px" // FIXED
                                 className="object-cover group-hover:scale-110 transition-transform duration-500" 
                               />
                            </div>
                            <div className="flex flex-col justify-center">
                               <h4 className="font-bold text-slate-900 leading-tight group-hover:text-[#0065eb] transition-colors line-clamp-2">{h.name}</h4>
                               <div className="flex items-center gap-1 my-1">
                                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-bold text-slate-700">{h.rating.toFixed(1)}</span>
                               </div>
                               <p className="text-sm font-black text-slate-900">${h.pricePerNight} <span className="text-slate-400 font-normal text-xs">/night</span></p>
                            </div>
                         </Link>
                      ))}
                      {relatedHotels.length === 0 && <p className="text-center text-slate-400 mt-10">No similar hotels found.</p>}
                  </div>
               </div>

            </div>
         </div>
      </div>

      {/* --- BOOKING MODAL --- */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Book {selectedRoom ? selectedRoom.roomTypeName : 'Room'}</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={submitBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Check-in Date</label>
                <input required type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nights</label>
                    <input required type="number" min="1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={nights} onChange={(e) => setNights(parseInt(e.target.value))}/>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Total</label>
                    <div className="w-full p-3 bg-blue-50 text-blue-600 font-bold rounded-xl">${(selectedRoom ? selectedRoom.price : hotel.pricePerNight) * nights}</div>
                 </div>
              </div>
              <button type="submit" disabled={isBookingLoading} className="w-full bg-[#0065eb] text-white py-3.5 rounded-xl font-bold mt-2 hover:bg-blue-700">
                {isBookingLoading ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX */}
      {isFullScreen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center animate-in fade-in duration-300" onClick={() => setIsFullScreen(false)}>
           <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20"><X size={24}/></button>
           <div className="relative w-full h-full max-w-7xl max-h-[90vh] p-4">
              <Image src={hotel.images[currentImgIndex]} alt="" fill className="object-contain" sizes="100vw" />
           </div>
        </div>
      )}

    </div>
  );
}