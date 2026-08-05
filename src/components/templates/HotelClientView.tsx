'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, MapPin, ChevronLeft, ChevronRight, Share2, Heart, CheckCircle, 
  ArrowRight, X, Expand, MessageCircle, Phone, Calendar, Users, Minus, 
  Plus, MessageSquare, Download, Briefcase, Building2, ShieldCheck, Video,
  Utensils, Clock, ShoppingBag, 
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SharedChatComponent from '@/components/sharedchat';

// --- TYPES ---
interface Hotel {
  _id?: string;
  id: string;
  slug?: string;
  hotelAdminId?: string;
  ownerId?: string;
  name: string;
  description: string;
  pricePerNight: number;
  images: string[];
  location: {
    city: string;
    area: string;
    address?: string;
    latDisplay?: string;
    lngDisplay?: string;
    coordinates?: { latitude: number; longitude: number };
  } | any;
  rating: number;
  amenities: string[];
  phone: string;
  isPro?: boolean;
  isVerified?: boolean;
  contact?: {
    phoneWhatsapp?: string;
    phoneCall?: string;
  };
  contactPhone?: string;
  planTier?: string;
  videoUrl?: string;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  refundPolicy?: string;
  paymentMethods?: string[];
}

interface Room {
  id: string;
  _id?: string;
  roomName?: string;
  roomTypeName?: string;
  pricePerNight?: number;
  price?: number;
  basePrice?: number;
  maxOccupancy?: number | string;
  capacity?: number;
  images?: string[];
  features?: Record<string, any>;
}

interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

interface Restaurant {
  _id?: string;
  id: string;
  name: string;
  description: string;
  cuisineType?: string;
  priceLevel?: string;
  images: string[];
  openHour?: number;
  closeHour?: number;
  menuItems?: MenuItem[];
}

interface Review {
  _id?: string;
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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarHotels, setSimilarHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [currentImg, setCurrentImg] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('About');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Food Ordering Modal State
  const [selectedFood, setSelectedFood] = useState<{ item: MenuItem; restaurantName: string } | null>(null);
  const [foodQuantity, setFoodQuantity] = useState(1);
  const [notInRoom, setNotInRoom] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [foodNotes, setFoodNotes] = useState('');

  // Set Document Title for SEO
  useEffect(() => {
    if (hotel) document.title = `${hotel.name} | GuriUp`;
  }, [hotel]);

  // ✅ ANALYTICS: Track Views via API
  const hasTrackedView = React.useRef(false);
  useEffect(() => {
    if (hotel && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const hotelId = hotel._id || hotel.id;
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'view_hotel', hotelId, platform: 'web' }) 
      }).catch(() => {});
    }
  }, [hotel]);

  // ✅ ANALYTICS: Track Clicks via API
  const trackClick = (type: string) => {
    if (!hotel) return;
    const hotelId = hotel._id || hotel.id;
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, hotelId, platform: 'web' }) 
    }).catch(() => {});
  };

  // Booking Logic State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Review Logic State
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please log in to leave a review.");
    if (!hotel) return;
    setIsSubmittingReview(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({
          hotelId: hotel.id || hotel._id,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      if (res.ok) {
        setReviews(prev => [{
          id: Math.random().toString(),
          userName: user.displayName || 'Guest',
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: new Date().toISOString()
        }, ...prev]);
        setReviewData({ rating: 5, comment: '' });
      } else {
        alert("Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // --- FETCH DATA FROM APIS ---
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let hotelData: Hotel | null = null;

        // Try fetching hotel by ID or slug via API
        const res = await fetch(`/api/hotels?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          // Unwraps the { success: true, hotel: ... } payload correctly
          hotelData = data.hotel || (data.hotels && data.hotels[0]) || (Array.isArray(data) ? data[0] : data);
        }

        if (!hotelData) {
          const slugRes = await fetch(`/api/hotels?slug=${id}`);
          if (slugRes.ok) {
            const slugData = await slugRes.json();
            hotelData = slugData.hotel || (slugData.hotels && slugData.hotels[0]) || (Array.isArray(slugData) ? slugData[0] : slugData);
          }
        }

        if (hotelData) {
          setHotel(hotelData);
          
          // 🛡️ CRITICAL FIX: Prioritize .id (Supabase) over ._id (Legacy Firebase)
          const hotelId = hotelData.id || hotelData._id;

          // Fetch related entities in parallel from Supabase APIs
          const [roomsRes, reviewsRes, restaurantsRes, similarRes] = await Promise.all([
            fetch(`/api/rooms?hotelId=${hotelId}`),
            fetch(`/api/reviews?hotelId=${hotelId}`),
            fetch(`/api/restaurants?hotelId=${hotelId}`),
            hotelData.location?.city
              ? fetch(`/api/hotels?city=${encodeURIComponent(hotelData.location.city)}&limit=5`)
              : Promise.resolve({ ok: false, json: () => [] })
          ]);

          if (roomsRes.ok) {
            const rData = await roomsRes.json();
            const fetchedRooms = Array.isArray(rData) ? rData : (rData.rooms || rData.data || []);
            // 🛡️ CRITICAL FIX: Only show Live/Available rooms to the public
            setRooms(fetchedRooms.filter((r: any) => r.status !== 'draft' && r.status !== 'Hidden'));
          }
          if (reviewsRes.ok) {
            const revData = await reviewsRes.json();
            setReviews(Array.isArray(revData) ? revData : (revData.reviews || revData.data || []));
          }
          if (restaurantsRes.ok) {
            const restData = await restaurantsRes.json();
            setRestaurants(Array.isArray(restData) ? restData : (restData.restaurants || restData.data || []));
          }
          if (similarRes.ok) {
            const simData = await similarRes.json();
            const simList = Array.isArray(simData) ? simData : [];
            setSimilarHotels(simList.filter((h: any) => (h.id || h._id) !== hotelId));
          }
        }
      } catch (e) {
        console.error('Error fetching hotel details:', e);
      } finally {
        setLoading(false);
      }
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

    // Strict Validation
    if (!bookingData.name.trim() || !bookingData.phone.trim()) {
      alert("Please provide your Full Name and Phone Number.");
      return;
    }
    
    // Validate Phone Number properly
    const phoneRegex = /^[0-9+\s-]{7,15}$/;
    if (!phoneRegex.test(bookingData.phone.trim())) {
      alert("Please provide a valid Phone Number.");
      return;
    }

    if (rooms.length > 0 && !bookingData.roomId) {
      alert("Please select a room.");
      return;
    }

    setIsSubmitting(true);
    const hotelId = hotel.id || hotel._id;

    try {
      const idToken = user ? await user.getIdToken() : '';
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}) 
        },
        body: JSON.stringify({
          hotelId,
          hotelName: hotel.name,
          userId: user?.uid || 'guest',
          ...bookingData,
          guestName: bookingData.name, // Maps data properly for the dashboard read
          guestPhone: bookingData.phone, // Maps data properly for the dashboard read
          status: 'pending',
          source: 'whatsapp_redirect'
        })
      });
      if (!res.ok) console.error("Database save error", await res.text());
    } catch (e) {
      console.error("Booking save error", e);
    } finally {
      setIsSubmitting(false);
    }

    const selectedRoom = rooms.find(r => (r.id || r._id) === bookingData.roomId);
    
    // 🛡️ CRITICAL FIX: Safe fallback bindings for room properties
    const roomName = selectedRoom ? (selectedRoom.roomName || selectedRoom.roomTypeName) : 'Standard Room';
    const roomPrice = selectedRoom?.basePrice || selectedRoom?.pricePerNight || selectedRoom?.price || hotel.pricePerNight;
    const totalPrice = roomPrice * bookingData.roomCount;

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

  const isVerified = hotel.planTier?.toLowerCase().includes('pro') || hotel.isVerified === true;
  const rawTarget = hotel.contact?.phoneWhatsapp || hotel.contact?.phoneCall || hotel.contactPhone || hotel.phone;
  const targetPhone = isVerified && rawTarget ? rawTarget : '+252653227084';
  let cleanTargetPhone = targetPhone.replace(/[^0-9]/g, '');
  if (cleanTargetPhone.startsWith('63') && cleanTargetPhone.length === 9) {
    cleanTargetPhone = '252' + cleanTargetPhone;
  }

  return (
    <div className="bg-[#fafbfc] min-h-screen pb-20 font-sans text-slate-900 pt-10">
      {/* ================= HEADER SECTION ================= */}
      <div className="bg-white border-b border-slate-100 mb-8 relative z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">{hotel.name}</h1>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium mt-2">
              <MapPin size={16} className="text-[#0065eb]" />
              {typeof hotel.location === 'object' ? `${hotel.location?.area || ''}, ${hotel.location?.city || ''}` : hotel.location}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="p-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
              <Share2 size={20} />
            </button>
            <button className="hidden md:flex items-center gap-1.5 px-5 py-3 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-bold text-slate-900">
              <Star size={16} className="fill-yellow-400 text-yellow-400" /> {hotel.rating} <span className="text-slate-400 font-normal">Rate</span>
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
            <div className="relative h-[300px] md:h-[500px] w-full rounded-[2.5rem] overflow-hidden group bg-slate-900 shadow-2xl">
              <Image src={hotel.images?.[currentImg] && hotel.images[currentImg].trim() !== '' ? hotel.images[currentImg] : '/placeholder.jpg'} alt={hotel.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
              <button onClick={() => router.back()} className="absolute top-6 left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-all border border-white/10 z-20">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setShowGalleryModal(true)} className="absolute top-6 right-6 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all border border-white/10 z-20 flex items-center gap-2">
                <Expand size={14} /> Full View
              </button>
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
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {(hotel.images || []).slice(0, 8).map((img, idx) => (
                <div key={idx} onClick={() => idx === 7 ? setShowGalleryModal(true) : setCurrentImg(idx)} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${currentImg === idx ? 'ring-2 ring-[#0065eb] ring-offset-2' : 'hover:opacity-80'}`}>
                  <Image src={img && img.trim() !== '' ? img : '/placeholder.jpg'} alt="" fill className="object-cover" />
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

            <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 grid grid-cols-3 gap-3">
              <a onClick={() => trackClick('click_whatsapp')} href={`https://wa.me/${cleanTargetPhone}`} target="_blank" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors cursor-pointer group">
                <MessageCircle size={24} className="group-hover:scale-110 transition-transform"/>
                <span className="text-[9px] font-black uppercase tracking-wide">WhatsApp</span>
              </a>
              <a onClick={() => trackClick('click_call')} href={`tel:${targetPhone}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer group">
                <Phone size={24} className="group-hover:scale-110 transition-transform"/>
                <span className="text-[9px] font-black uppercase tracking-wide">Call</span>
              </a>
              <button onClick={() => { trackClick('click_chat'); setIsChatOpen(true); }} className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer group">
                <MessageSquare size={24} className="group-hover:scale-110 transition-transform"/>
                <span className="text-[9px] font-black uppercase tracking-wide">Chat</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-widest">Top Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(hotel.amenities) ? hotel.amenities : ["Free Wifi", "AC", "Security"]).slice(0, 5).map((am, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    {am}
                  </span>
                ))}
                <span className="text-[10px] font-bold text-[#0065eb] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">+More</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: TABS & MAP (60% / 40%) ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* --- LEFT: TABS (60%) --- */}
          <div className="w-full lg:w-[60%] bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 h-fit">
            <div className="flex items-center gap-4 mb-8 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2">
              {['About', 'Rooms', 'Restaurants', 'Reviews', 'Gallery', 'Video'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                  {tab}
                </button>
              ))}
            </div>

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

              {/* 🛡️ CRITICAL FIX: Safe fallback bindings for room rendering */}
              {activeTab === 'Rooms' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {rooms.length > 0 ? rooms.map(room => {
                    const roomId = room.id || room._id;
                    const rPrice = room.basePrice || room.pricePerNight || room.price || 0;
                    const rName = room.roomName || room.roomTypeName || 'Standard Room';
                    const rCap = room.maxOccupancy || room.capacity || 2;
                    return (
                      <div key={roomId} onClick={() => { setBookingData(prev => ({...prev, roomId: roomId as string})); setShowBookingModal(true); }} className="group border border-slate-100 rounded-2xl p-3 hover:border-[#0065eb] transition-all cursor-pointer flex gap-3">
                        <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden relative shrink-0">
                          <Image src={(room.images?.[0] && room.images[0].trim() !== '') ? room.images[0] : (hotel.images?.[0] && hotel.images[0].trim() !== '' ? hotel.images[0] : '/placeholder.jpg')} alt="" fill className="object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="font-bold text-slate-900 text-sm">{rName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Max {rCap} Guests</p>
                          <div className="mt-1 flex justify-between items-center">
                            <span className="text-[#0065eb] font-black">${rPrice}</span>
                            <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-lg group-hover:bg-[#0065eb] transition-colors">Select</span>
                          </div>
                        </div>
                      </div>
                    );
                  }) : <p className="text-slate-400 text-sm font-bold">No rooms listed.</p>}
                </div>
              )}

              {activeTab === 'Restaurants' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {restaurants.length > 0 ? restaurants.map(rest => {
                    const restId = rest.id || rest._id;
                    const restImages = rest.images || [];
                    const heroImg = restImages[0] || hotel.images?.[0] || '/placeholder.jpg';
                    const currentHour = new Date().getHours();
                    const openH = rest.openHour ?? 6;
                    const closeH = rest.closeHour ?? 23;
                    const isOpen = currentHour >= openH && currentHour < closeH;

                    return (
                      <div key={restId} className="space-y-4 border-b border-slate-100 pb-8 last:border-none">
                        {/* Banner Card */}
                        <div className="relative h-[200px] w-full rounded-2xl overflow-hidden shadow-md">
                          <Image src={heroImg && heroImg.trim() !== '' ? heroImg : '/placeholder.jpg'} alt={rest.name} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                            <div>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black text-white mb-2 ${isOpen ? 'bg-green-600' : 'bg-red-500'}`}>
                                {isOpen ? '🟢 Open Now' : '🔴 Closed'}
                              </span>
                              <h3 className="text-xl font-black text-white">{rest.name}</h3>
                            </div>
                            {restImages.length > 1 && (
                              <span className="text-white text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl">
                                {restImages.length} Photos
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed">{rest.description}</p>

                        {/* Menu Items */}
                        <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Menu & Dishes</h4>
                          <div className="space-y-3">
                            {rest.menuItems && rest.menuItems.length > 0 ? rest.menuItems.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden relative shrink-0">
                                    <Image src={(item.imageUrl && item.imageUrl.trim() !== '') ? item.imageUrl : (heroImg && heroImg.trim() !== '' ? heroImg : '/placeholder.jpg')} alt={item.name} fill className="object-cover" />
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-slate-900 text-sm">{item.name}</h5>
                                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.description}</p>
                                    <span className="text-[#0065eb] font-black text-sm mt-1 block">${item.price}</span>
                                  </div>
                                </div>
                                <button onClick={() => { setSelectedFood({ item, restaurantName: rest.name }); setFoodQuantity(1); }} className="px-4 py-2 bg-[#0065eb] text-white rounded-xl text-xs font-bold hover:bg-[#0052c1] transition-colors shadow-sm">
                                  Add
                                </button>
                              </div>
                            )) : <p className="text-slate-400 text-xs font-bold">No menu items added yet.</p>}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="py-12 text-center text-slate-400 font-bold">
                      <Utensils size={40} className="mx-auto mb-2 opacity-30" />
                      No dining options available.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Reviews' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <form onSubmit={submitReview} className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Leave a Review</h4>
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          size={24} 
                          onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                          className={`cursor-pointer transition-colors ${reviewData.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                        />
                      ))}
                    </div>
                    <textarea 
                      required 
                      value={reviewData.comment} 
                      onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="Share your experience..." 
                      className="w-full p-4 rounded-xl border-none font-medium text-sm focus:ring-2 focus:ring-[#0065eb] mb-4 bg-white shadow-sm"
                      rows={3}
                    />
                    <button disabled={isSubmittingReview} type="submit" className="px-6 py-3 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                      {isSubmittingReview ? <Loader2 className="animate-spin" size={16} /> : 'Submit Review'}
                    </button>
                  </form>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {reviews.length > 0 ? reviews.map(review => {
                      const revId = review.id || review._id;
                      return (
                        <div key={revId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">{review.userName || 'Guest'}</h5>
                              {review.createdAt && <p className="text-[10px] text-slate-400 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>}
                            </div>
                            <div className="flex text-yellow-400">
                               {[...Array(review.rating || 5)].map((_, i) => <Star key={i} size={12} className="fill-current"/>)}
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">"{review.comment}"</p>
                        </div>
                      );
                    }) : <p className="text-slate-400 text-sm font-bold text-center py-6">No reviews yet. Be the first!</p>}
                  </div>
                </div>
              )}

              {activeTab === 'Gallery' && (
                <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {(hotel.images || []).map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200">
                      <Image src={img && img.trim() !== '' ? img : '/placeholder.jpg'} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'Video' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {hotel.videoUrl ? (
                    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                      <video src={hotel.videoUrl} controls className="w-full h-full object-contain" playsInline />
                    </div>
                  ) : (
                    <div className="w-full h-[300px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                      <Video size={48} className="mb-4 opacity-20" />
                      <p className="font-bold text-sm">No video tour available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT: MAP (40%) --- */}
          <div className="w-full lg:w-[40%] bg-slate-100 rounded-[2.5rem] border border-slate-200 overflow-hidden relative group min-h-[400px]">
            {(() => {
              const lat = hotel.location?.latDisplay;
              const lng = hotel.location?.lngDisplay;
              const hasMap = isVerified && lat && lng;
              return hasMap ? (
                <>
                  <iframe width="100%" height="100%" style={{ border: 0, minHeight: '400px' }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" src={`https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`}></iframe>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                    <button onClick={() => window.open(`https://maps.google.com/maps?q=${lat},${lng}`, '_blank')} className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-[#0065eb] hover:text-white transition-all transform hover:-translate-y-1 hover:scale-105">
                      Open Map App
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-4 rounded-full shadow-2xl mb-4 animate-bounce">
                      <MapPin size={32} className="text-[#0065eb] fill-[#0065eb]" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2 relative z-10">Explore Area</h4>
                    <p className="text-sm text-slate-700 font-bold max-w-[200px] relative z-10">{hotel.location?.area || 'City Center'}, {hotel.location?.city}</p>
                    <a href={`https://maps.google.com/maps?q=${encodeURIComponent((hotel.location?.area || '') + ' ' + (hotel.location?.city || ''))}`} target="_blank" rel="noreferrer" className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#0065eb] transition-colors relative z-10">
                      Search on Map
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* ================= SECTION 3: MARKETING & NEARBY (65% / 35%) ================= */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[65%] relative rounded-[2.5rem] overflow-hidden bg-[#0a0c10] min-h-[400px] flex items-center p-8 lg:p-12 order-1">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#0065eb]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-purple-600/20 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4"></div>
            <div className="absolute inset-0 bg-black opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-4 w-fit backdrop-blur-md">GuriUp Ecosystem</span>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight tracking-tight">Grow Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0065eb] to-blue-400">Business Today.</span></h2>
                <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed max-w-sm">Download our app for exclusive mobile deals, or join our network to grow your business.</p>
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

          <div className="w-full lg:w-[35%] bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col min-h-[400px] order-2">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-slate-900 text-lg">Nearby Stays</h4>
              <Link href="/hotels" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-[#0065eb] hover:text-white transition-colors">
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar">
              {similarHotels.map(sim => {
                const simId = sim.id || sim._id;
                return (
                  <Link key={simId} href={`/hotels/${sim.slug || simId}`} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-3xl transition-colors group border border-transparent hover:border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden relative shrink-0">
                      <Image src={(sim.images?.[0] && sim.images[0].trim() !== '') ? sim.images[0] : '/placeholder.jpg'} alt="" fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 text-sm truncate group-hover:text-[#0065eb] transition-colors">{sim.name}</h5>
                      <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10}/> {sim.location?.area}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">${sim.pricePerNight}</span>
                    </div>
                  </Link>
                );
              })}
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
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900">Complete Reservation</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">{hotel.name}</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Full Name *</label>
                  <input required type="text" value={bookingData.name} onChange={(e) => handleBookingChange('name', e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="Your Name" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Phone Number *</label>
                  <input required type="tel" value={bookingData.phone} onChange={(e) => handleBookingChange('phone', e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="+252..." />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Select Room</label>
                <div className="grid grid-cols-1 gap-2">
                  {rooms.map(room => {
                    const roomId = room.id || room._id;
                    const rPrice = room.basePrice || room.pricePerNight || room.price || 0;
                    const rName = room.roomName || room.roomTypeName || 'Standard Room';
                    const rCap = room.maxOccupancy || room.capacity || 2;
                    return (
                      <div key={roomId} onClick={() => handleBookingChange('roomId', roomId)} className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${bookingData.roomId === roomId ? 'border-[#0065eb] bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div><p className="font-bold text-sm text-slate-900">{rName}</p><p className="text-xs text-slate-500">Max {rCap} Guests</p></div>
                        <span className="font-black text-sm text-[#0065eb]">${rPrice}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Check-in</label><div className="relative"><Calendar size={16} className="absolute top-4 left-4 text-slate-400" /><input type="date" onChange={(e) => handleBookingChange('checkIn', e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" /></div></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Check-out</label><div className="relative"><Calendar size={16} className="absolute top-4 left-4 text-slate-400" /><input type="date" onChange={(e) => handleBookingChange('checkOut', e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl font-bold text-sm" /></div></div>
              </div>
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
            <div className="p-6 border-t border-slate-100 bg-white">
              <button disabled={isSubmitting} onClick={confirmBooking} className="w-full py-4 bg-[#25D366] hover:bg-[#1dbf57] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />} Confirm via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOD ORDER MODAL ================= */}
      {selectedFood && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFood(null)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Food</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">{selectedFood.restaurantName}</p>
              </div>
              <button onClick={() => setSelectedFood(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="w-20 h-20 rounded-xl bg-slate-200 overflow-hidden relative shrink-0">
                  <Image src={(selectedFood.item.imageUrl && selectedFood.item.imageUrl.trim() !== '') ? selectedFood.item.imageUrl : (hotel.images?.[0] && hotel.images[0].trim() !== '' ? hotel.images[0] : '/placeholder.jpg')} alt="" fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{selectedFood.item.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedFood.item.description}</p>
                  <span className="text-[#0065eb] font-black text-base mt-1 block">${selectedFood.item.price}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                <span className="font-bold text-sm text-slate-700">Quantity</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><Minus size={14}/></button>
                  <span className="font-black text-base">{foodQuantity}</span>
                  <button onClick={() => setFoodQuantity(foodQuantity + 1)} className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center"><Plus size={14}/></button>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4">
                {!notInRoom ? (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Room Number</label>
                    <input type="text" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="e.g. 204" />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Delivery Address</label>
                    <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="Your delivery location..." />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={notInRoom} onChange={(e) => setNotInRoom(e.target.checked)} className="rounded text-[#0065eb] focus:ring-[#0065eb]" />
                  <span className="text-xs font-bold text-slate-700">I am not inside a hotel room</span>
                </label>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 block">Special Instructions (Optional)</label>
                  <textarea value={foodNotes} onChange={(e) => setFoodNotes(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="Any dietary requests..." rows={2} />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-sm text-[#0065eb]">Total Amount</span>
                <span className="font-black text-xl text-[#0065eb]">${(selectedFood.item.price * foodQuantity).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <button onClick={() => {
                if (!notInRoom && !roomNumber.trim()) {
                  alert('Please enter your room number.');
                  return;
                }
                if (notInRoom && !deliveryAddress.trim()) {
                  alert('Please enter your delivery address.');
                  return;
                }
                const deliveryLoc = notInRoom ? `Address: ${deliveryAddress}` : `Room: ${roomNumber}`;
                const total = (selectedFood.item.price * foodQuantity).toFixed(2);
                const orderMsg = `🍽️ *NEW FOOD ORDER* 🍽️\n\n` +
                  `🏨 Hotel/Restaurant: ${hotel.name} (${selectedFood.restaurantName})\n` +
                  `📍 Location: ${deliveryLoc}\n` +
                  `📝 Notes: ${foodNotes || 'None'}\n` +
                  `---------------------------\n` +
                  `📦 Item: ${selectedFood.item.name}\n` +
                  `🔢 Quantity: ${foodQuantity}\n` +
                  `💵 Total: $${total}\n\n` +
                  `Please confirm my order!`;

                window.open(`https://wa.me/${cleanTargetPhone}?text=${encodeURIComponent(orderMsg)}`, '_blank');
                setSelectedFood(null);
              }} className="w-full py-4 bg-[#25D366] hover:bg-[#1dbf57] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2">
                <MessageCircle size={20} /> Order Food via WhatsApp
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
          recipientId={hotel.hotelAdminId || hotel.ownerId || hotel._id || hotel.id || ''} 
          recipientName={hotel.name} 
          propertyId={hotel.id || hotel._id || ''} 
          propertyTitle={hotel.name} 
        />
      )}
    </div>
  );
}