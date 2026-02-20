'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase'; // Adjust this path if needed
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  Timestamp,
  limit,
  getDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  LayoutDashboard, Calendar, MessageSquare, BedDouble, Settings, 
  Users, TrendingUp, DollarSign, Eye, CheckCircle, XCircle, 
  Plus, Edit3, Lock, MapPin, Building2, Phone, Globe, Wifi, Shield
} from 'lucide-react';

// ============================================================================
//  STRICT TYPES & INTERFACES
// ============================================================================

interface HotelLocation {
  city: string;
  area: string;
  latDisplay: string;
  lngDisplay: string;
}

interface HotelContact {
  phoneCall: string;
  phoneWhatsapp: string;
  phoneManager: string;
  website: string;
}

interface HotelPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellation: string;
  paymentMethods: string;
}

interface HotelData {
  id: string;
  name: string;
  type: string;
  description: string;
  pricePerNight: number;
  roomsCount: number;
  rating: number;
  views: number;
  images: string[];
  location: HotelLocation;
  contact: HotelContact;
  policies: HotelPolicies;
  amenities: Record<string, boolean>;
  hotelAdminId: string;
  planTier: 'free' | 'pro' | 'premium';
}

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestId: string;
  roomName: string;
  checkIn: Timestamp | null;
  checkOut: Timestamp | null;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'paid';
  createdAt: Timestamp | null;
}

interface Room {
  id: string;
  name: string;
  price: number;
  capacity: number;
  status: string;
  images: string[];
}

interface Chat {
  id: string;
  participantName: string;
  lastMessage: string;
  updatedAt: Timestamp | null;
}

type TabType = 'overview' | 'analytics' | 'bookings' | 'rooms' | 'inbox' | 'settings';

// ============================================================================
//  MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdvancedHotelDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // --- DATA STATE ---
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [bookingFilter, setBookingFilter] = useState<string>('all');

  // --- INIT FIREBASE LISTENERS ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      
      // Fetch User Role to find assigned hotel
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      const managedHotelId = userSnap.data()?.managedHotelId;

      const hotelQuery = managedHotelId 
        ? query(collection(db, 'hotels'), where('__name__', '==', managedHotelId))
        : query(collection(db, 'hotels'), where('hotelAdminId', '==', user.uid), limit(1));

      const unsubHotel = onSnapshot(hotelQuery, (snap) => {
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          const hotelId = snap.docs[0].id;
          
          setHotel({
            id: hotelId,
            name: docData.name || '',
            type: docData.type || 'Hotel',
            description: docData.description || '',
            pricePerNight: docData.pricePerNight || 0,
            roomsCount: docData.roomsCount || 0,
            rating: docData.rating || 0,
            views: docData.views || 0,
            images: docData.images || [],
            location: docData.location || { city: '', area: '', latDisplay: '', lngDisplay: '' },
            contact: docData.contact || { phoneCall: '', phoneWhatsapp: '', phoneManager: '', website: '' },
            policies: docData.policies || { checkInTime: '', checkOutTime: '', cancellation: '', paymentMethods: '' },
            amenities: docData.amenities || {},
            hotelAdminId: docData.hotelAdminId,
            planTier: docData.planTier || 'free',
          });

          // Attach Sub-listeners
          subscribeToBookings(hotelId);
          subscribeToRooms(hotelId);
          subscribeToChats(user.uid);
          setLoading(false);
        } else {
          setLoading(false);
        }
      });

      return () => unsubHotel();
    });
    return () => unsubAuth();
  }, [router]);

  const subscribeToBookings = (hotelId: string) => {
    const q = query(collection(db, 'bookings'), where('hotelId', '==', hotelId), orderBy('createdAt', 'desc'));
    onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    });
  };

  const subscribeToRooms = (hotelId: string) => {
    const q = collection(db, 'hotels', hotelId, 'rooms');
    onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().roomTypeName || 'Room',
        price: doc.data().pricePerNight || 0,
        capacity: doc.data().capacity || 2,
        status: doc.data().status || 'published',
        images: doc.data().images || [],
      } as Room)));
    });
  };

  const subscribeToChats = (uid: string) => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid));
    onSnapshot(q, (snap) => {
      setChats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat)));
    });
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'bookings', id), { 
      status: newStatus, 
      paymentStatus: newStatus === 'confirmed' ? 'paid' : newStatus 
    });
  };

  // --- COMPUTED STATS ---
  const isPro = hotel?.planTier === 'pro' || hotel?.planTier === 'premium';
  const totalRevenue = bookings.reduce((sum, b) => (b.status === 'paid' || b.status === 'confirmed') ? sum + (b.totalPrice||0) : sum, 0);
  const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
  const filteredBookingsList = bookingFilter === 'all' ? bookings : bookings.filter(b => (b.status||'pending').toLowerCase() === bookingFilter);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!hotel) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]"><Building2 size={64} className="text-slate-300 mb-4"/><h2 className="text-2xl font-black text-slate-800">No Hotel Found</h2><p className="text-slate-500">Your account is not linked to any property.</p></div>;

  return (
    // pt-24 pushes the content down so it doesn't hide behind the main top nav.
    // pb-28 gives padding at the bottom so content doesn't hide behind the bottom nav.
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-28 font-sans text-slate-900 relative">
      
      {/* ================= HEADER ================= */}
      <header className="px-6 md:px-12 mb-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
               <h1 className="text-2xl font-black text-slate-900">{hotel.name}</h1>
               <div className="flex items-center gap-2 mt-1">
                  <MapPin size={14} className="text-slate-400"/>
                  <span className="text-sm font-bold text-slate-500">{hotel.location.city || 'Location not set'}</span>
               </div>
            </div>
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 ${isPro ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}>
               {isPro ? <Shield size={18}/> : <Lock size={18}/>}
               <span className="text-xs font-black uppercase tracking-wider">{isPro ? 'Premium Partner' : 'Free Plan'}</span>
            </div>
         </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="px-6 md:px-12">
        <AnimatePresence mode="wait">
          
          {/* -------------------- OVERVIEW TAB -------------------- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
                  <StatCard title="Total Bookings" value={bookings.length.toString()} icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" />
                  <StatCard title="Profile Views" value={hotel.views.toString()} icon={Eye} color="text-purple-600" bg="bg-purple-50" isPro={isPro} />
                  <StatCard title="Pending Leads" value={pendingBookingsCount.toString()} icon={Users} color="text-amber-600" bg="bg-amber-50" />
               </div>
               
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-lg">Recent Reservations</h3>
                     <button onClick={() => setActiveTab('bookings')} className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                     {bookings.slice(0, 5).map(b => (
                        <div key={b.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 font-bold shadow-sm">
                                 {b.guestName ? b.guestName[0] : 'G'}
                              </div>
                              <div>
                                 <h4 className="font-bold">{b.guestName || 'Guest'}</h4>
                                 <p className="text-xs text-slate-500">{b.roomName} • {b.checkIn ? format(b.checkIn.toDate(), 'MMM d, yyyy') : 'N/A'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-indigo-600">${b.totalPrice}</p>
                              <span className={`text-[10px] font-bold uppercase ${b.status === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'}`}>{b.status}</span>
                           </div>
                        </div>
                     ))}
                     {bookings.length === 0 && <p className="text-slate-400 text-sm py-4 text-center font-medium">No recent bookings to display.</p>}
                  </div>
               </div>
            </motion.div>
          )}

          {/* -------------------- ANALYTICS TAB -------------------- */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-8 relative">
               {!isPro && (
                  <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/50 flex flex-col items-center justify-center rounded-3xl border border-slate-100">
                     <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-slate-100">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-black mb-2">Analytics Locked</h2>
                        <p className="text-slate-500 mb-6 text-sm">Upgrade to Premium to see your business funnel, projected revenue, and lead sources in real-time.</p>
                        <button className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200">Upgrade to Premium</button>
                     </div>
                  </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120}/></div>
                     <h3 className="text-slate-400 font-bold mb-2 relative z-10">Projected Monthly Revenue</h3>
                     <p className="text-4xl font-black mb-8 relative z-10">$12,450.00</p>
                     <div className="flex justify-between border-t border-slate-700 pt-6 relative z-10">
                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmed</p><p className="text-xl font-bold text-emerald-400">$8,200</p></div>
                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p><p className="text-xl font-bold text-amber-400">$4,250</p></div>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold text-lg mb-6">Lead Channels</h3>
                     <div className="space-y-4">
                        <ChannelRow label="WhatsApp Leads" count={45} color="bg-emerald-500" />
                        <ChannelRow label="Direct Calls" count={22} color="bg-blue-500" />
                        <ChannelRow label="In-App Chats" count={89} color="bg-purple-500" />
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* -------------------- BOOKINGS TAB -------------------- */}
          {activeTab === 'bookings' && (
            <motion.div key="bookings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
               <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-xl font-black">All Reservations</h3>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                     {['all', 'pending', 'confirmed'].map(filter => (
                        <button key={filter} onClick={() => setBookingFilter(filter)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${bookingFilter === filter ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                           {filter}
                        </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {filteredBookingsList.map(b => (
                     <div key={b.id} className="border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
                              {b.guestName ? b.guestName[0] : 'G'}
                           </div>
                           <div>
                              <h4 className="font-bold text-lg">{b.guestName || 'Guest'}</h4>
                              <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                                 <Phone size={14}/> 
                                 {isPro ? b.guestPhone : '••••••••••'} {!isPro && <Lock size={12} className="text-amber-500"/>}
                              </p>
                           </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                           <div className="bg-slate-50 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room</p>
                              <p className="font-bold text-sm text-slate-800">{b.roomName}</p>
                           </div>
                           <div className="bg-slate-50 px-4 py-2 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</p>
                              <p className="font-bold text-sm text-slate-800">{b.checkIn ? format(b.checkIn.toDate(), 'MMM d') : '-'} to {b.checkOut ? format(b.checkOut.toDate(), 'MMM d') : '-'}</p>
                           </div>
                           <div className="text-right min-w-[80px]">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                              <p className="font-black text-lg text-indigo-600">${b.totalPrice}</p>
                           </div>
                           <div className="flex gap-2">
                              {b.status === 'pending' && (
                                 <>
                                    <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"><CheckCircle size={20}/></button>
                                    <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"><XCircle size={20}/></button>
                                 </>
                              )}
                              {b.status !== 'pending' && (
                                 <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{b.status}</span>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
                  {filteredBookingsList.length === 0 && (
                     <div className="text-center py-20">
                        <Calendar size={48} className="text-slate-200 mx-auto mb-4"/>
                        <p className="text-slate-400 font-bold">No bookings found for this filter.</p>
                     </div>
                  )}
               </div>
            </motion.div>
          )}

          {/* -------------------- ROOMS TAB -------------------- */}
          {activeTab === 'rooms' && (
             <motion.div key="rooms" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black">Room Inventory</h3>
                   <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                      <Plus size={18}/> Add Room
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {rooms.map(room => (
                      <div key={room.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                         <div className="h-48 bg-slate-100 relative overflow-hidden">
                            {room.images && room.images[0] ? (
                              <Image src={room.images[0]} alt={room.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><BedDouble size={48}/></div>
                            )}
                            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${room.status === 'draft' ? 'bg-slate-900/80 text-white' : 'bg-emerald-500/90 text-white shadow-lg'}`}>
                               {room.status === 'draft' ? 'Hidden' : 'Live'}
                            </div>
                         </div>
                         <div className="p-6">
                            <h4 className="font-bold text-lg mb-2 truncate">{room.name}</h4>
                            <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-2"><Users size={14}/> Capacity: {room.capacity} Guests</p>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                               <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Price / Night</p>
                                  <span className="font-black text-xl text-indigo-600">${room.price}</span>
                               </div>
                               <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><Edit3 size={18}/></button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </motion.div>
          )}

          {/* -------------------- INBOX TAB -------------------- */}
          {activeTab === 'inbox' && (
             <div className="h-[70vh] min-h-[600px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex">
                <div className="w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
                   <div className="p-6 border-b border-slate-200 bg-white"><h3 className="font-black text-lg">Messages</h3></div>
                   <div className="flex-1 overflow-y-auto">
                      {chats.map(chat => (
                         <div key={chat.id} className="p-5 hover:bg-white cursor-pointer border-b border-slate-200 flex gap-4 transition-colors">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">{chat.participantName?.[0] || 'U'}</div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                               <div className="flex justify-between items-center mb-1">
                                  <h4 className="font-bold text-sm truncate">{chat.participantName || 'Guest'}</h4>
                               </div>
                               <p className="text-xs text-slate-500 truncate font-medium">{chat.lastMessage}</p>
                            </div>
                         </div>
                      ))}
                      {chats.length === 0 && <p className="text-center p-8 text-slate-400 font-bold text-sm">No conversations yet.</p>}
                   </div>
                </div>
                <div className="w-2/3 bg-white flex flex-col items-center justify-center text-center p-8">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300"><MessageSquare size={40}/></div>
                   <h3 className="text-xl font-black mb-2 text-slate-800">Your Inbox</h3>
                   <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Select a conversation from the list to view message history and reply to your guests.</p>
                </div>
             </div>
          )}

          {/* -------------------- SETTINGS (ADVANCED EDITOR) -------------------- */}
          {activeTab === 'settings' && (
             <AdvancedHotelEditor hotel={hotel} setHotel={setHotel} isPro={isPro} />
          )}

        </AnimatePresence>
      </main>

      {/* ================= BOTTOM NAVIGATION BAR ================= */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:p-6 pointer-events-none">
        <div className="max-w-3xl mx-auto bg-slate-900 text-white rounded-full p-2 flex items-center justify-between shadow-2xl shadow-slate-900/20 pointer-events-auto backdrop-blur-lg border border-slate-700/50">
           <BottomNavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
           <BottomNavItem icon={TrendingUp} label="Stats" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
           <BottomNavItem icon={Calendar} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} count={pendingBookingsCount} />
           <BottomNavItem icon={BedDouble} label="Rooms" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
           <BottomNavItem icon={MessageSquare} label="Chat" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
           <BottomNavItem icon={Settings} label="Edit" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

    </div>
  );
}

// ============================================================================
//  ADVANCED EDITOR COMPONENT (The Mega Form)
// ============================================================================

interface AdvancedHotelEditorProps {
  hotel: HotelData;
  setHotel: React.Dispatch<React.SetStateAction<HotelData | null>>;
  isPro: boolean;
}

function AdvancedHotelEditor({ hotel, setHotel, isPro }: AdvancedHotelEditorProps) {
  const [formData, setFormData] = useState<HotelData>(hotel);
  const [saving, setSaving] = useState<boolean>(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev: HotelData) => {
      const keys = field.split('.');
      if (keys.length === 1) return { ...prev, [field]: value };
      return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: value } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'hotels', hotel.id), {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        pricePerNight: Number(formData.pricePerNight),
        roomsCount: Number(formData.roomsCount),
        location: formData.location,
        contact: formData.contact,
        policies: formData.policies,
        amenities: formData.amenities,
      });
      setHotel(formData);
      alert('Hotel profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (key: string) => {
    setFormData((prev: HotelData) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
    }));
  };

  const amenitiesList = ['Free Wi-Fi', 'Restaurant', 'Swimming Pool', 'Gym / Fitness', 'Room Service', 'Airport Shuttle', 'Free Parking', 'Spa', 'Air Conditioning', 'Bar / Lounge', '24/7 Front Desk'];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-5xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-8 rounded-3xl shadow-xl sticky top-24 z-20">
        <div>
          <h3 className="text-2xl font-black mb-1">Hotel Profile Editor</h3>
          <p className="text-slate-400 text-sm font-medium">Update your public listing details, policies, and amenities.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 min-w-[160px]">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <EditorSection title="Basic Information" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Hotel Name" value={formData.name} onChange={(v: string) => handleChange('name', v)} />
          <Input label="Property Type" value={formData.type} onChange={(v: string) => handleChange('type', v)} placeholder="e.g. Resort, Boutique Hotel" />
          <Input label="Base Price / Night ($)" type="number" value={formData.pricePerNight} onChange={(v: string) => handleChange('pricePerNight', v)} />
          <Input label="Total Rooms Available" type="number" value={formData.roomsCount} onChange={(v: string) => handleChange('roomsCount', v)} />
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-2 block">Description</label>
            <textarea 
               rows={5} 
               value={formData.description} 
               onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)} 
               className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 transition-all resize-none" 
               placeholder="Describe your property to potential guests..."
            />
          </div>
        </div>
      </EditorSection>

      <EditorSection title="Location" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="City" value={formData.location.city} onChange={(v: string) => handleChange('location.city', v)} />
          <Input label="Area / Neighborhood" value={formData.location.area} onChange={(v: string) => handleChange('location.area', v)} />
        </div>
      </EditorSection>

      <EditorSection title="Contact Information" icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Reception Phone" value={formData.contact.phoneCall} onChange={(v: string) => handleChange('contact.phoneCall', v)} icon={Phone} />
          <Input label="WhatsApp Number" value={formData.contact.phoneWhatsapp} onChange={(v: string) => handleChange('contact.phoneWhatsapp', v)} icon={MessageSquare} />
          <Input label="Manager Phone" value={formData.contact.phoneManager} onChange={(v: string) => handleChange('contact.phoneManager', v)} icon={Users} />
          <Input label="Website URL" value={formData.contact.website} onChange={(v: string) => handleChange('contact.website', v)} icon={Globe} />
        </div>
      </EditorSection>

      <EditorSection title="Policies & Payments" icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input label="Check-In Time" value={formData.policies.checkInTime} onChange={(v: string) => handleChange('policies.checkInTime', v)} placeholder="e.g. 2:00 PM" />
          <Input label="Check-Out Time" value={formData.policies.checkOutTime} onChange={(v: string) => handleChange('policies.checkOutTime', v)} placeholder="e.g. 11:00 AM" />
          <div className="md:col-span-2">
            <Input label="Cancellation Policy" value={formData.policies.cancellation} onChange={(v: string) => handleChange('policies.cancellation', v)} placeholder="e.g. Free cancellation up to 24hrs before..." />
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3 block">Payment Methods Accepted (Comma separated)</label>
          <input 
             type="text" 
             value={formData.policies.paymentMethods} 
             onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('policies.paymentMethods', e.target.value)} 
             placeholder="e.g. Zaad, E-Dahab, Cash, Visa, Mastercard" 
             className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
          />
        </div>
      </EditorSection>

      <EditorSection title="Amenities & Facilities" icon={Wifi}>
        {!isPro && (
           <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
              <Lock className="text-amber-500 shrink-0"/>
              <p className="text-sm font-bold text-amber-800">Amenities selection is limited on the Free Plan. Upgrade to showcase all your facilities.</p>
           </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${!isPro ? 'opacity-60 pointer-events-none' : ''}`}>
          {amenitiesList.map(amenity => (
            <label key={amenity} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors select-none">
              <div className="relative flex items-center justify-center">
                 <input 
                    type="checkbox" 
                    checked={formData.amenities[amenity] || false} 
                    onChange={() => toggleAmenity(amenity)} 
                    className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer appearance-none checked:bg-indigo-600 transition-colors" 
                 />
                 {(formData.amenities[amenity] || false) && <CheckCircle size={14} className="absolute text-white pointer-events-none"/>}
              </div>
              <span className="text-sm font-bold text-slate-700">{amenity}</span>
            </label>
          ))}
        </div>
      </EditorSection>

    </motion.div>
  );
}

// ============================================================================
//  STRICTLY TYPED HELPER COMPONENTS
// ============================================================================

interface BottomNavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

function BottomNavItem({ icon: Icon, label, active, onClick, count }: BottomNavItemProps) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all ${active ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      <Icon size={active ? 22 : 20} className="mb-1 transition-all" />
      <span className={`text-[9px] font-bold uppercase tracking-wider ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
      {count !== undefined && count > 0 && (
         <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-slate-900">
            {count}
         </span>
      )}
    </button>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  isPro?: boolean;
}

function StatCard({ title, value, icon: Icon, color, bg, isPro = true }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
       <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center ${color}`}>
             <Icon size={26} strokeWidth={2.5} />
          </div>
          {!isPro && <Lock size={18} className="text-slate-300" />}
       </div>
       <div className={!isPro ? 'blur-[6px] select-none' : ''}>
          <h3 className="text-4xl font-black text-slate-900 mb-1 tracking-tight">{value}</h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
       </div>
       {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10">
             <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">Pro Feature</span>
          </div>
       )}
    </div>
  );
}

interface ChannelRowProps {
  label: string;
  count: number;
  color: string;
}

function ChannelRow({ label, count, color }: ChannelRowProps) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-4 h-4 rounded-md ${color} shadow-sm`}></div>
        <span className="font-bold text-slate-700 text-sm">{label}</span>
      </div>
      <span className="font-black text-xl text-slate-900">{count}</span>
    </div>
  );
}

interface EditorSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function EditorSection({ title, icon: Icon, children }: EditorSectionProps) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-50">
        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
           <Icon size={24} strokeWidth={2.5}/>
        </div>
        <h4 className="text-2xl font-black text-slate-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
}

function Input({ label, value, onChange, type = 'text', placeholder, icon: Icon }: InputProps) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>}
        <input 
          type={type} 
          value={value} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 transition-all ${Icon ? 'pl-12' : ''}`}
        />
      </div>
    </div>
  );
}