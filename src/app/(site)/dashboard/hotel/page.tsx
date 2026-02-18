'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/lib/firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  BedDouble, 
  Settings, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  Menu, 
  X, 
  Phone, 
  LogOut, 
  ChevronRight, 
  MapPin,
  Building2  // <--- ADDED MISSING IMPORT HERE
} from 'lucide-react';

// ============================================================================
//  TYPES
// ============================================================================

interface HotelData {
  id: string;
  name: string;
  location: any; // { city, area }
  images: string[];
  pricePerNight: number;
  description: string;
  hotelAdminId: string;
  planTier: 'free' | 'pro' | 'premium';
  rating: number;
  views: number;
}

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestId: string;
  roomName: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'paid';
  createdAt: Timestamp;
  guests: number;
}

interface Room {
  id: string;
  name: string;
  price: number;
  capacity: number;
  available: number;
  images: string[];
  isDraft: boolean;
}

interface Chat {
  id: string;
  participantName: string;
  participantId: string;
  lastMessage: string;
  updatedAt: Timestamp;
  unread: number;
}

// ============================================================================
//  MAIN COMPONENT
// ============================================================================

export default function HotelDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATE ---
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'rooms' | 'inbox' | 'settings'>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [bookingFilter, setBookingFilter] = useState('all');

  // --- INIT ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      
      // 1. FIND HOTEL (Using hotelAdminId)
      const q = query(
        collection(db, 'hotels'), 
        where('hotelAdminId', '==', user.uid), 
        limit(1)
      );

      const snapshot = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          const hotelId = snap.docs[0].id;
          
          setHotel({
            id: hotelId,
            name: docData.name || 'My Hotel',
            location: docData.location || {},
            images: docData.images || [],
            pricePerNight: docData.pricePerNight || 0,
            description: docData.description || '',
            hotelAdminId: docData.hotelAdminId,
            planTier: docData.planTier || 'free',
            rating: docData.rating || 0,
            views: docData.views || 0,
          });

          // 2. Setup Realtime Listeners for Sub-collections
          subscribeToBookings(hotelId);
          subscribeToRooms(hotelId);
          subscribeToChats(user.uid);
          setLoading(false);
        } else {
          // No hotel found for this user
          setLoading(false);
        }
      });

      return () => snapshot();
    });
    return () => unsubAuth();
  }, [router]);

  const subscribeToBookings = (hotelId: string) => {
    const q = query(collection(db, 'bookings'), where('hotelId', '==', hotelId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          guestName: d.userName || d.name || 'Guest',
          guestPhone: d.userPhone || d.phone || '',
          guestId: d.userId || '',
          roomName: d.roomName || 'Standard Room',
          checkIn: d.checkInDate,
          checkOut: d.checkOutDate,
          totalPrice: d.totalAmount || 0,
          status: (d.paymentStatus || d.status || 'pending').toLowerCase(),
          createdAt: d.createdAt,
          guests: (d.adults || 1) + (d.children || 0),
        } as Booking;
      });
      setBookings(list);
    });
  };

  const subscribeToRooms = (hotelId: string) => {
    const q = collection(db, 'hotels', hotelId, 'rooms');
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.roomTypeName || 'Room',
          price: d.price || 0,
          capacity: d.capacity || 2,
          available: d.availableCount || 0,
          images: d.images || [],
          isDraft: d.status === 'draft',
        } as Room;
      });
      setRooms(list);
    });
  };

  const subscribeToChats = (uid: string) => {
    // Chats where the hotel admin is a participant
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          participantName: d.participantNames?.find((n: string) => n !== 'Hotel Admin') || 'Guest',
          participantId: '',
          lastMessage: d.lastMessage || '',
          updatedAt: d.updatedAt,
          unread: 0, 
        } as Chat;
      });
      setChats(list);
    });
  };

  // --- COMPUTED STATS ---
  const isPro = hotel?.planTier === 'pro' || hotel?.planTier === 'premium';
  const totalRevenue = bookings.reduce((sum, b) => (b.status === 'paid' || b.status === 'confirmed') ? sum + b.totalPrice : sum, 0);
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const filteredBookingsList = bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0065eb] mb-4"></div>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Dashboard</p>
      </div>
    </div>
  );
  
  if (!hotel) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-center p-6">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 text-slate-400">
           <Building2 size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Hotel Found</h2>
        <p className="text-slate-500 max-w-md mb-8">We couldn't find a hotel linked to your account. Please contact support if you believe this is an error.</p>
        <button onClick={() => router.push('/')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Return Home</button>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-900">
      
      {/* ================= SIDEBAR ================= */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center gap-3 h-20 border-b border-slate-50">
          <div className="w-10 h-10 bg-[#0065eb] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none">GuriUp</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hotel Admin</span>
          </div>
        </div>

        <nav className="p-4 space-y-1 mt-4">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem icon={Calendar} label="Bookings" count={pendingBookings > 0 ? pendingBookings : undefined} alert={pendingBookings > 0} active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <NavItem icon={BedDouble} label="Rooms" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
          <NavItem icon={MessageSquare} label="Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
          <NavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-6 border-t border-slate-50">
           <div className={`p-4 rounded-2xl mb-4 ${isPro ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white' : 'bg-blue-50 text-blue-900'}`}>
              <div className="flex items-center gap-2 mb-2">
                 {isPro ? <ShieldCheck size={18} className="text-emerald-400"/> : <Lock size={18} className="text-blue-500"/>}
                 <span className="font-black text-xs uppercase tracking-widest">{isPro ? 'Pro Active' : 'Free Plan'}</span>
              </div>
              <p className="text-[10px] opacity-80 leading-relaxed">
                {isPro ? 'You have full access to analytics & guest data.' : 'Upgrade to unlock guest contacts and deep analytics.'}
              </p>
              {!isPro && <button className="mt-3 w-full py-2 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm">Upgrade Now</button>}
           </div>
           
           <button onClick={() => router.push('/')} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold w-full">
             <LogOut size={18}/> Return Home
           </button>
        </div>
      </aside>

      {/* ================= CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10">
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Menu size={20}/></button>
              <h2 className="text-xl font-black text-slate-800 capitalize">{activeTab}</h2>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                 <span className={`w-2 h-2 rounded-full ${hotel.planTier !== 'free' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                 <span className="text-xs font-bold text-slate-600">{hotel.name}</span>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                 <Image src={currentUser?.photoURL || '/placeholder.jpg'} alt="Profile" width={40} height={40} />
              </div>
           </div>
        </header>

        {/* SCROLLABLE CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* -------------------- OVERVIEW TAB -------------------- */}
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-8">
                 
                 {/* Stats Row */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
                    <StatCard title="Bookings" value={bookings.length.toString()} icon={Calendar} color="text-blue-600" bg="bg-blue-50" />
                    <StatCard title="Profile Views" value={hotel.views.toString()} icon={Eye} color="text-purple-600" bg="bg-purple-50" isPro={isPro} />
                    <StatCard title="Occupancy" value="--%" icon={TrendingUp} color="text-orange-600" bg="bg-orange-50" isPro={isPro} />
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Bookings List */}
                    <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-slate-900 text-lg">Recent Bookings</h3>
                          <button onClick={() => setActiveTab('bookings')} className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                       </div>
                       <div className="space-y-4">
                          {bookings.slice(0, 5).map(booking => (
                             <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                      {booking.guestName[0]}
                                   </div>
                                   <div>
                                      <h4 className="font-bold text-slate-900">{booking.guestName}</h4>
                                      <p className="text-xs text-slate-500 font-medium">{booking.roomName} • {new Date(booking.checkIn.toDate()).toLocaleDateString()}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="font-black text-slate-900">${booking.totalPrice}</p>
                                   <span className={`text-[10px] font-bold uppercase ${booking.status === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'}`}>{booking.status}</span>
                                </div>
                             </div>
                          ))}
                          {bookings.length === 0 && <div className="text-center py-10 text-slate-400 font-bold">No bookings yet.</div>}
                       </div>
                    </div>

                    {/* Quick Actions / Analytics Preview */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-xl relative overflow-hidden">
                           <div className="relative z-10">
                              <h3 className="font-bold text-lg mb-2">Lead Sources</h3>
                              <div className="space-y-3 mt-4">
                                 <div className="flex justify-between text-sm"><span className="opacity-70">WhatsApp</span> <span className="font-bold">45%</span></div>
                                 <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[45%]"></div></div>
                                 
                                 <div className="flex justify-between text-sm mt-2"><span className="opacity-70">Direct Call</span> <span className="font-bold">30%</span></div>
                                 <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[30%]"></div></div>
                              </div>
                              {!isPro && (
                                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                                   <Lock className="mb-2 text-white"/>
                                   <p className="text-xs font-bold text-slate-300 mb-3">Upgrade to see detailed analytics</p>
                                   <button className="px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg">Upgrade</button>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                           <h3 className="font-bold text-slate-900 mb-4">Availability</h3>
                           <div className="flex items-center justify-between">
                              <div className="text-center">
                                 <div className="text-2xl font-black text-emerald-500">8</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">Available</div>
                              </div>
                              <div className="w-px h-10 bg-slate-100"></div>
                              <div className="text-center">
                                 <div className="text-2xl font-black text-blue-500">4</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">Occupied</div>
                              </div>
                              <div className="w-px h-10 bg-slate-100"></div>
                              <div className="text-center">
                                 <div className="text-2xl font-black text-slate-300">2</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">Dirty</div>
                              </div>
                           </div>
                        </div>
                    </div>
                 </div>
              </motion.div>
            )}

            {/* -------------------- BOOKINGS TAB -------------------- */}
            {activeTab === 'bookings' && (
              <motion.div key="bookings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                 <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4">
                    <h3 className="text-xl font-black text-slate-900">All Reservations</h3>
                    <div className="flex gap-2">
                       {['all', 'pending', 'confirmed', 'cancelled'].map(filter => (
                          <button key={filter} onClick={() => setBookingFilter(filter)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${bookingFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                             {filter}
                          </button>
                       ))}
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <tr>
                             <th className="px-6 py-4">Guest</th>
                             <th className="px-6 py-4">Room</th>
                             <th className="px-6 py-4">Dates</th>
                             <th className="px-6 py-4">Amount</th>
                             <th className="px-6 py-4">Status</th>
                             <th className="px-6 py-4">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredBookingsList.map(b => (
                             <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4">
                                   <div className="font-bold text-slate-900">{b.guestName}</div>
                                   <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                      {isPro ? b.guestPhone : '••••••••••'} {isPro ? '' : <Lock size={10}/>}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="font-bold text-slate-700">{b.roomName}</div>
                                   <div className="text-xs text-slate-400">{b.guests} Guests</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                   {new Date(b.checkIn.toDate()).toLocaleDateString()} <br/>
                                   <span className="text-slate-400 text-xs">to {new Date(b.checkOut.toDate()).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-4 font-black text-slate-900">${b.totalPrice}</td>
                                <td className="px-6 py-4">
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                                      b.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                      'bg-red-100 text-red-600'
                                   }`}>
                                      {b.status}
                                   </span>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex gap-2">
                                      <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><CheckCircle size={16}/></button>
                                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><XCircle size={16}/></button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    {filteredBookingsList.length === 0 && <div className="p-10 text-center text-slate-400 font-bold">No bookings found.</div>}
                 </div>
              </motion.div>
            )}

            {/* -------------------- ROOMS TAB -------------------- */}
            {activeTab === 'rooms' && (
               <motion.div key="rooms" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-2xl font-black text-slate-900">Room Inventory</h3>
                     <button className="bg-[#0065eb] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
                        <Plus size={18}/> Add Room
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {rooms.map(room => (
                        <div key={room.id} className="bg-white rounded-[24px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                           <div className="h-48 bg-slate-200 relative">
                              <Image src={room.images[0] || '/placeholder.jpg'} alt={room.name} fill className="object-cover" />
                              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase ${room.isDraft ? 'bg-slate-800 text-slate-400' : 'bg-green-500 text-white'}`}>
                                 {room.isDraft ? 'Hidden' : 'Live'}
                              </div>
                           </div>
                           <div className="p-5">
                              <div className="flex justify-between items-start mb-2">
                                 <h4 className="font-bold text-slate-900 text-lg">{room.name}</h4>
                                 <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={18}/></button>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-2">
                                 <Users size={14}/> Max {room.capacity} • {room.available} Left
                              </p>
                              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                 <span className="font-black text-xl text-[#0065eb]">${room.price}</span>
                                 <button className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100"><Edit3 size={16}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            )}

            {/* -------------------- INBOX TAB -------------------- */}
            {activeTab === 'inbox' && (
               <div className="h-[700px] bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex">
                  {/* Chat List */}
                  <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 flex flex-col">
                     <div className="p-4 border-b border-slate-100">
                        <h3 className="font-black text-lg">Messages</h3>
                     </div>
                     <div className="flex-1 overflow-y-auto">
                        {chats.map(chat => (
                           <div key={chat.id} className="p-4 hover:bg-white hover:shadow-sm transition-all cursor-pointer flex gap-3 border-b border-slate-50">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                 {chat.participantName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-sm text-slate-900 truncate">{chat.participantName}</h4>
                                    <span className="text-[10px] text-slate-400">{new Date(chat.updatedAt.toDate()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
                              </div>
                           </div>
                        ))}
                        {chats.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">No conversations yet.</div>}
                     </div>
                  </div>
                  {/* Chat Area Placeholder */}
                  <div className="w-2/3 bg-white flex flex-col items-center justify-center text-center p-8">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <MessageSquare size={32}/>
                     </div>
                     <h3 className="font-bold text-slate-900 mb-2">Select a Conversation</h3>
                     <p className="text-sm text-slate-400 max-w-xs">Choose a chat from the left to view details and respond to guests.</p>
                  </div>
               </div>
            )}

            {/* -------------------- SETTINGS TAB -------------------- */}
            {activeTab === 'settings' && (
               <div className="max-w-2xl bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Hotel Settings</h3>
                  <div className="space-y-6">
                     <div>
                        <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Hotel Name</label>
                        <input type="text" defaultValue={hotel.name} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Base Price</label>
                           <input type="number" defaultValue={hotel.pricePerNight} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                           <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Location</label>
                           <input type="text" defaultValue={hotel.location.city} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Description</label>
                        <textarea defaultValue={hotel.description} rows={4} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                     </div>
                     <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">Save Changes</button>
                  </div>
               </div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );

  async function updateBookingStatus(id: string, status: string) {
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status: status, 
        paymentStatus: status === 'confirmed' ? 'paid' : status 
      });
    } catch (e) { console.error(e); }
  }
}

// --- HELPER COMPONENT ---
function StatCard({ title, value, icon: Icon, color, bg, isPro = true }: any) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group">
       <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center ${color}`}>
             <Icon size={22} />
          </div>
          {/* Pro Lock */}
          {!isPro && <Lock size={16} className="text-slate-300" />}
       </div>
       <div className={!isPro ? 'blur-sm select-none' : ''}>
          <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{value}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
       </div>
       {!isPro && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
             <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">Upgrade</span>
          </div>
       )}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
      <div className="flex items-center gap-3"><Icon size={20} /><span className="font-bold text-sm">{label}</span></div>
      {count > 0 && <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{count}</span>}
    </button>
  );
}