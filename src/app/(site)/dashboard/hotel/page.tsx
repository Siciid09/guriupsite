'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '../../../lib/firebase'; // Adjust your path
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, collection, query, where, orderBy, onSnapshot, updateDoc, Timestamp, limit, getDoc,
  getDocs
} from 'firebase/firestore';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar as CalendarIcon, CalendarDays, MessageSquare, BedDouble, 
  Settings, Users, TrendingUp, DollarSign, CheckCircle, XCircle, 
  Plus, Edit3, Lock, MapPin, Building2, Phone, Globe, Wifi, Shield,
  FileText, UserPlus, BellRing, LogOut, ArrowRightCircle, ArrowLeftCircle, AlertCircle, Loader2, Utensils, Trash2, Eye, EyeOff
} from 'lucide-react';

// --- IMPORT YOUR COMPLETED FORMS ---
import HotelForm from '../../../../components/hotelform'; 
import AddEditRoom from '../../../../components/room'; 
import HotelAnalytics from '@/components/hotelstats';
import RestaurantManagement from '../../../../components/RestaurantManagement'; // Adjust path as needed

// ============================================================================
// STRICT TYPES
// ============================================================================
interface HotelData {
  id: string;
  _id?: string;
  name: string;
  type: string;
  description: string;
  pricePerNight: number;
  roomsCount: number;
  rating: number;
  images: string[];
  location: { city: string; area: string; latDisplay: string; lngDisplay: string; };
  contact: { phoneCall: string; phoneWhatsapp: string; phoneManager: string; website: string; };
  policies: { checkInTime: string; checkOutTime: string; cancellation: string; paymentMethods: string; };
  amenities: Record<string, boolean>;
  hotelAdminId: string;
  planTier: 'free' | 'pro' | 'premium';
}

interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  roomName: string;
  checkIn: Timestamp;
  checkOut: Timestamp;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  paymentStatus: string;
  createdAt: Timestamp;
}

interface Room {
  id?: string;
  _id?: string;
  roomName?: string;
  roomTypeName?: string;
  pricePerNight: number;
  basePrice?: number;
  maxOccupancy: string;
  status: string;
  images: string[];
}

interface Chat {
  id: string;
  lastMessage: string;
  participantName: string;
  unreadCount: number;
  updatedAt: Timestamp;
}

// Expanded TabTypes to include inner navigation for forms
type TabType = 'overview' | 'reservations' | 'calendar' | 'rooms' | 'restaurants' | 'messages' | 'analytics' | 'reports' | 'guests' | 'staff' | 'settings' | 'edit-hotel' | 'add-room' | 'edit-room' | 'setup-hotel' | 'setup-agent';

// ============================================================================
// MAIN COMPONENT WRAPPER
// ============================================================================
export default function HotelDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb]" size={40}/></div>}>
      <DashboardContent />
    </Suspense>
  );
}

// ============================================================================
// DASHBOARD CONTENT
// ============================================================================
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabParam = searchParams.get('tab') as TabType;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  
  // Real Data State
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  
  // UI Navigation State
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');
  const [resFilter, setResFilter] = useState<string>('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // --- INITIALIZE & FETCH DATA ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      setCurrentUser(user);
      
      const idToken = await user.getIdToken();
      
      const userRes = await fetch('/api/users/me', { headers: { Authorization: `Bearer ${idToken}` } });
      const { user: userData } = await userRes.json();

      // 🛡️ SECURITY: Block standard users and real estate agents from the Hotel Dashboard
      if (userData?.role !== 'hoadmin' && userData?.role !== 'admin' && userData?.role !== 'sadmin') {
         return router.push('/'); // Redirect unauthorized users to home
      }

      const managedHotelId = userData?.managedHotelId;

      // 1. Fetch Hotel STRICTLY using the Foreign Key
      const hotelRes = await fetch(`/api/hotels?adminId=${user.uid}`);
      const hotelJson = await hotelRes.json();
      
      // 2. 🛡️ CRITICAL FIX: The API returns `.hotels`, not `.data` or `.hotel`!
      const hotelData = hotelJson.hotels && hotelJson.hotels.length > 0 ? hotelJson.hotels[0] : null;

      if (hotelData) {
        setHotel(hotelData as HotelData);
        setNeedsSetup(false); // 👈 THIS REMOVES THE "ACTION REQUIRED" SCREEN
        const hotelId = hotelData.id || hotelData._id; // Ensure we get the correct ID
        
        // Fetch Bookings
        const bRes = await fetch(`/api/bookings?hotelId=${hotelId}`, { headers: { Authorization: `Bearer ${idToken}` } });
        if (bRes.ok) {
           const bJson = await bRes.json();
           // FIX: Properly handle raw arrays returned from the API
           setBookings(Array.isArray(bJson) ? bJson : (bJson.bookings || bJson.data || []));
        }
        
        // Fetch Rooms
        const rRes = await fetch(`/api/rooms?hotelId=${hotelId}`);
        if (rRes.ok) {
           const rJson = await rRes.json();
           const fetchedRooms = Array.isArray(rJson) ? rJson : (rJson.data || rJson.rooms || []);
           setRooms(fetchedRooms);
        }

        // Chats Listener (Keep Firebase Realtime for Messages)
        // 🛡️ CRITICAL FIX: Removed orderBy to prevent silent index failures, added fallback listener for hotel.id
        const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
        const qChatsHotel = query(collection(db, 'chats'), where('participants', 'array-contains', hotelId));

        let userChats: Chat[] = [];
        let hotelChats: Chat[] = [];

        const combineAndSortChats = () => {
           const combined = [...userChats, ...hotelChats];
           // Remove duplicates in case a chat matches both
           const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
           unique.sort((a, b) => {
              const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt as any).getTime();
              const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt as any).getTime();
              return (timeB || 0) - (timeA || 0);
           });
           setChats(unique);
        };

        const processChats = (docs: any[]) => {
           return docs.map(d => {
             const data = d.data();
             return {
               id: d.id,
               lastMessage: data.lastMessage || 'Sent a message',
               participantName: data.otherUserName || data.userName || data.senderName || data.recipientName || 'Guest User',
               unreadCount: data.unreadCount?.[user.uid] || 0,
               updatedAt: data.updatedAt || data.lastMessageTime || new Date()
             } as Chat;
           });
        };

        const unsubChats1 = onSnapshot(qChats, (cSnap) => {
           userChats = processChats(cSnap.docs);
           combineAndSortChats();
        });

        const unsubChats2 = onSnapshot(qChatsHotel, (cSnap) => {
           hotelChats = processChats(cSnap.docs);
           combineAndSortChats();
        });

        setLoading(false);
        return () => { unsubChats1(); unsubChats2(); };
      } else {
        setNeedsSetup(true);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, [router]);

  const updateTab = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to permanently delete this room?")) return;
    try {
      const idToken = await currentUser?.getIdToken();
      await fetch(`/api/rooms?id=${roomId}&hotelId=${hotel?.id || hotel?._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      setRooms(prev => prev.filter(r => (r.id || r._id) !== roomId));
    } catch (e) {
      alert("Failed to delete room");
    }
  };

  const toggleRoomStatus = async (roomId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'Available' : 'draft';
      const idToken = await currentUser?.getIdToken();
      await fetch('/api/rooms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: roomId, hotelId: hotel?.id || hotel?._id, status: newStatus })
      });
      setRooms(prev => prev.map(r => (r.id || r._id) === roomId ? { ...r, status: newStatus } : r));
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      if (!currentUser || !hotel) return;
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        // FIX: Send the hotelId to pass the API security gatekeeper
        body: JSON.stringify({ id, hotelId: hotel.id || hotel._id, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed");
      
      // Optimistic update
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
    } catch (e) {
      alert("Failed to update status");
    }
  };

  // --- REAL DYNAMIC CALCULATIONS ---
  const isPro = hotel?.planTier === 'pro' || hotel?.planTier === 'premium';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todayArrivals = 0;
  let todayDepartures = 0;
  let monthlyRevenue = 0;
  let occupiedRooms = 0;

  bookings.forEach(b => {
    if (!b.checkIn || !b.checkOut) return;
    const checkInDate = new Date(b.checkIn as any);
    const checkOutDate = new Date(b.checkOut as any);
    
    // Revenue (only confirmed/checked-in/paid)
    if (['confirmed', 'checked-in', 'checked-out'].includes(b.status)) {
       if (b.createdAt && new Date(b.createdAt as any).getMonth() === today.getMonth()) monthlyRevenue += (b.totalPrice || 0);
    }
    // Arrivals
    if (checkInDate.toDateString() === today.toDateString() && ['pending', 'confirmed'].includes(b.status)) todayArrivals++;
    // Departures
    if (checkOutDate.toDateString() === today.toDateString() && b.status === 'checked-in') todayDepartures++;
    // Occupancy (Currently checked in)
    if (b.status === 'checked-in') occupiedRooms++;
  });

  const occupancyRate = hotel?.roomsCount ? Math.round((occupiedRooms / hotel.roomsCount) * 100) : 0;
  const filteredBookings = resFilter === 'all' ? bookings : bookings.filter(b => b.status === resFilter);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb] w-12 h-12"/></div>;
  if (!hotel && !needsSetup) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]"><Building2 size={64} className="text-slate-300 mb-4"/><h2 className="text-2xl font-black text-slate-900">No Hotel Found</h2></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-slate-900 font-sans relative pt-20">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-20 h-[calc(100vh-5rem)] z-30 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 text-white"><Building2 size={24} /></div>
          <div>
            <h2 className="text-lg font-black tracking-tight leading-tight truncate w-40">{hotel?.name || 'My Hotel'}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Core Management</p>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
          <SidebarItem icon={CalendarIcon} label="Reservations" active={activeTab === 'reservations'} onClick={() => updateTab('reservations')} count={bookings.filter(b=>b.status==='pending').length} />
          <SidebarItem icon={CalendarDays} label="Calendar" active={activeTab === 'calendar'} onClick={() => updateTab('calendar')} />
          <SidebarItem icon={BedDouble} label="Rooms" active={['rooms', 'add-room', 'edit-room'].includes(activeTab)} onClick={() => updateTab('rooms')} />
          <SidebarItem icon={Utensils} label="Dining & KDS" active={activeTab === 'restaurants'} onClick={() => updateTab('restaurants')} />
          <SidebarItem icon={MessageSquare} label="Messages" active={activeTab === 'messages'} onClick={() => updateTab('messages')} count={chats.filter(c => c.unreadCount > 0).length} />
          
          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Pro Features</p>
          <SidebarItem icon={TrendingUp} label="Analytics" active={activeTab === 'analytics'} onClick={() => updateTab('analytics')} isProLocked={!isPro} />
          <SidebarItem icon={FileText} label="Reports" active={activeTab === 'reports'} onClick={() => updateTab('reports')} isProLocked={!isPro} />
          <SidebarItem icon={Users} label="Guests" active={activeTab === 'guests'} onClick={() => updateTab('guests')} isProLocked={!isPro} />
          <SidebarItem icon={UserPlus} label="Staff" active={activeTab === 'staff'} onClick={() => updateTab('staff')} isProLocked={!isPro} />

          <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Configuration</p>
          <SidebarItem icon={Settings} label="Settings" active={['settings', 'edit-hotel'].includes(activeTab)} onClick={() => updateTab('settings')} />
        </nav>
      </aside>

      {/* ================= MOBILE HEADER ================= */}
      <div className="lg:hidden sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-40 px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="bg-[#0065eb] p-2 rounded-xl text-white"><Building2 size={18} /></div>
            <span className="font-black text-lg truncate max-w-[200px]">{hotel?.name || 'GuriUp'}</span>
         </div>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 flex flex-col min-w-0 p-4 pb-48 md:p-8 lg:p-12 lg:pb-48 transition-all duration-300">
        
        {/* ================= GLOBAL WARNING BANNER ================= */}
        {needsSetup && activeTab !== 'setup-hotel' && (
           <div className="bg-red-500 text-white p-3 w-full flex flex-col sm:flex-row items-center justify-center gap-3 shadow-md rounded-2xl mb-8 shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm">
                 <AlertCircle size={18} />
                 <span>Action Required: You must set up your Hotel profile to unlock management features.</span>
              </div>
              <button 
                onClick={() => updateTab('setup-hotel')} 
                className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm hover:scale-105 transition-transform"
              >
                Set Up Now
              </button>
           </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* --- TAB: DASHBOARD (OVERVIEW) --- */}
          {activeTab === 'overview' && hotel && !needsSetup && (
            <motion.div key="overview" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="space-y-8">
               <h1 className="text-3xl font-black tracking-tight">Today's Overview</h1>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard title="Arrivals Today" value={todayArrivals} icon={ArrowRightCircle} color="text-blue-600" bg="bg-blue-50" />
                  <StatCard title="Departures" value={todayDepartures} icon={ArrowLeftCircle} color="text-orange-600" bg="bg-orange-50" />
                  <StatCard title="Occupancy" value={`${occupancyRate}%`} icon={BedDouble} color="text-emerald-600" bg="bg-emerald-50" />
                  <StatCard title="Mtd Revenue" value={`$${monthlyRevenue}`} icon={DollarSign} color="text-purple-600" bg="bg-purple-50" />
               </div>

               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-xl">Needs Action (Pending)</h3>
                     <button onClick={() => updateTab('reservations')} className="text-sm font-bold text-[#0065eb] hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                     {bookings.filter(b => b.status === 'pending').slice(0, 5).map(b => (
                        <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-4">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{b.guestName || 'Guest'}</span>
                              <span className="text-xs text-slate-500 font-medium">{b.roomName} • {format(new Date(b.checkIn as any), 'MMM d')} - {format(new Date(b.checkOut as any), 'MMM d')}</span>
                           </div>
                           <div className="flex items-center gap-4 justify-between w-full md:w-auto border-t md:border-none border-slate-200 pt-3 md:pt-0">
                              <span className="font-black text-[#0065eb]">${b.totalPrice}</span>
                              <div className="flex gap-2">
                                 <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm hover:scale-105 transition-transform"><CheckCircle size={18}/></button>
                                 <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"><XCircle size={18}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                     {bookings.filter(b => b.status === 'pending').length === 0 && <p className="text-slate-400 text-sm font-medium py-4 text-center">No pending reservations right now.</p>}
                  </div>
               </div>
            </motion.div>
          )}

          {/* --- TAB: RESERVATIONS --- */}
          {activeTab === 'reservations' && hotel && !needsSetup && (
            <motion.div key="reservations" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col h-full">
               <h1 className="text-3xl font-black tracking-tight mb-6">Reservations</h1>
               
               {/* Filters */}
               <div className="flex overflow-x-auto pb-4 mb-4 gap-2 hide-scrollbar">
                  {['all', 'pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(f => (
                     <button 
                       key={f} 
                       onClick={() => setResFilter(f)}
                       className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${resFilter === f ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                     >
                        {f.replace('-', ' ')}
                     </button>
                  ))}
               </div>

               {/* List */}
               <div className="space-y-4">
                  {filteredBookings.map(b => (
                     <div key={b.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0065eb] font-bold text-lg">{b.guestName?.[0] || 'G'}</div>
                           <div>
                              <h4 className="font-bold text-lg">{b.guestName || 'Guest'}</h4>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-2"><Phone size={12}/> {b.guestPhone}</p>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 bg-slate-50 p-4 rounded-2xl">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room</p>
                              <p className="font-bold text-sm">{b.roomName}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</p>
                              <p className="font-bold text-sm">{format(new Date(b.checkIn as any), 'MMM d')} - {format(new Date(b.checkOut as any), 'MMM d')}</p>
                           </div>
                           <div className="col-span-2 md:col-span-1 text-right md:text-left">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                              <p className="font-black text-lg text-[#0065eb]">${b.totalPrice}</p>
                           </div>
                        </div>

                        {/* Status Actions */}
                        <div className="flex flex-col items-end gap-2 min-w-[140px]">
                           <StatusBadge status={b.status} />
                           <div className="flex gap-2 mt-2">
                              {b.status === 'pending' && (
                                 <><ActionButton icon={CheckCircle} color="bg-emerald-500 text-white" onClick={() => updateBookingStatus(b.id, 'confirmed')}/><ActionButton icon={XCircle} color="bg-red-100 text-red-600" onClick={() => updateBookingStatus(b.id, 'cancelled')}/></>
                              )}
                              {b.status === 'confirmed' && (
                                 <><button onClick={() => updateBookingStatus(b.id, 'checked-in')} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">Mark Check-In</button><ActionButton icon={XCircle} color="bg-slate-100 text-slate-600" onClick={() => updateBookingStatus(b.id, 'cancelled')}/></>
                              )}
                              {b.status === 'checked-in' && (
                                 <button onClick={() => updateBookingStatus(b.id, 'checked-out')} className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors">Mark Check-Out</button>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
                  {filteredBookings.length === 0 && <EmptyState icon={CalendarIcon} title="No Reservations" desc={`No bookings found for status: ${resFilter}`} />}
               </div>
            </motion.div>
          )}

          {/* --- TAB: CALENDAR --- */}
          {activeTab === 'calendar' && hotel && !needsSetup && (
             <motion.div key="calendar" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <h1 className="text-3xl font-black tracking-tight mb-6">Visual Calendar</h1>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                   <CalendarDays size={64} className="text-blue-100 mx-auto mb-4" />
                   <h3 className="text-xl font-bold mb-2">Upcoming Stays Timeline</h3>
                   <p className="text-slate-500 mb-8 max-w-md mx-auto">A simple visual overview of who is arriving and departing in the next 7 days.</p>
                   
                   <div className="space-y-4 max-w-2xl mx-auto text-left">
                      {bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status) && new Date(b.checkIn as any) >= new Date()).slice(0, 10).map(b => (
                         <div key={b.id} className="flex items-center gap-4 relative pl-6 border-l-2 border-[#0065eb] pb-4">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#0065eb]"></div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-1 flex justify-between items-center">
                               <div>
                                  <p className="font-bold text-[#0065eb]">{format(new Date(b.checkIn as any), 'MMM do, yyyy')}</p>
                                  <p className="font-black text-slate-900 text-lg">{b.guestName}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xs font-bold text-slate-500">{b.roomName}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">Check-out: {format(new Date(b.checkOut as any), 'MMM do')}</p>
                               </div>
                            </div>
                         </div>
                      ))}
                      {bookings.filter(b => ['confirmed', 'checked-in'].includes(b.status)).length === 0 && <p className="text-slate-400 text-center font-bold">No upcoming stays scheduled.</p>}
                   </div>
                </div>
             </motion.div>
          )}

          {/* --- TAB: ROOMS --- */}
          {activeTab === 'rooms' && hotel && !needsSetup && (
             <motion.div key="rooms" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <div className="flex justify-between items-center mb-8">
                   <h1 className="text-3xl font-black tracking-tight">Room Inventory</h1>
                   <button onClick={() => updateTab('add-room')} className="bg-[#0065eb] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform">
                      <Plus size={18}/> Add Room
                   </button>
                </div>
                
                {rooms.length === 0 ? (
                    <EmptyState icon={BedDouble} title="No Rooms Listed" desc="You haven't added any rooms yet. Click 'Add Room' to start building your inventory." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                     {rooms.map(room => (
                        <div key={room._id || room.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow group flex flex-col">
                           <div className="h-48 bg-slate-100 relative">
                              {room.images && room.images[0] ? (
                                <Image src={room.images[0]} alt={room.roomName || room.roomTypeName || 'Room'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><BedDouble size={48}/></div>
                              )}
                              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${room.status === 'draft' ? 'bg-slate-900/80 text-white' : 'bg-emerald-500/90 text-white shadow-lg'}`}>
                                 {room.status === 'draft' ? 'Hidden' : 'Live'}
                              </div> 
                           </div>
                           <div className="p-6 flex-1 flex flex-col">
                              <h4 className="font-bold text-xl mb-1">{room.roomName || room.roomTypeName || 'Unnamed Room'}</h4>
                              <p className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-1"><Users size={14}/> Max {room.maxOccupancy} Guests</p>
                              
                              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                 <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price / Night</p>
                                    <span className="font-black text-2xl text-[#0065eb]">${room.pricePerNight || room.basePrice || 0}</span>
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={() => toggleRoomStatus(room._id || room.id || '', room.status)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-colors" title={room.status === 'draft' ? "Make Live" : "Hide Room"}>
                                       {room.status === 'draft' ? <Eye size={18}/> : <EyeOff size={18}/>}
                                    </button>
                                    <button onClick={() => { setSelectedRoomId(room._id || room.id || ''); updateTab('edit-room'); }} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-[#0065eb] hover:text-white transition-colors" title="Edit Room">
                                       <Edit3 size={18}/>
                                    </button>
                                    <button onClick={() => deleteRoom(room._id || room.id || '')} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-colors" title="Delete Room">
                                       <Trash2 size={18}/>
                                    </button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </motion.div>
          )}

          {/* --- TAB: RESTAURANTS (DINING & KDS) --- */}
          {activeTab === 'restaurants' && hotel && !needsSetup && (
             <motion.div key="restaurants" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <RestaurantManagement hotelId={hotel.id || hotel._id || ''} />
             </motion.div>
          )}

          {/* --- TAB: ADD ROOM --- */}
          {activeTab === 'add-room' && hotel && (
             <motion.div key="add-room" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <button onClick={() => updateTab('rooms')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
                   <ArrowLeftCircle size={20} /> Back to Rooms
                </button>
                <AddEditRoom hotelId={hotel.id} />
             </motion.div>
          )}

          {/* --- TAB: EDIT ROOM --- */}
          {activeTab === 'edit-room' && hotel && selectedRoomId && (
             <motion.div key="edit-room" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <button onClick={() => updateTab('rooms')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
                   <ArrowLeftCircle size={20} /> Back to Rooms
                </button>
                <AddEditRoom hotelId={hotel.id} roomId={selectedRoomId} />
             </motion.div>
          )}

          {/* --- TAB: MESSAGES --- */}
          {activeTab === 'messages' && hotel && !needsSetup && (
             <motion.div key="messages" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden min-h-[500px] shadow-sm">
                <div className="p-8 border-b border-slate-100">
                   <h2 className="text-2xl font-black">Guest Inbox</h2>
                   <p className="text-slate-500 font-medium">Manage all guest inquiries and booking messages.</p>
                </div>
                {chats.length === 0 ? (
                    <EmptyState icon={MessageSquare} title="No Messages" desc="When guests contact you, their messages will appear here." />
                ) : (
                    <div className="divide-y divide-slate-100">
                        {chats.map(chat => (
                            <div key={chat.id} onClick={() => router.push(`/dashboard/chat/${chat.id}`)} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center group gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-[#0065eb] font-bold text-lg shadow-inner shrink-0">
                                        {chat.participantName?.[0] || 'G'}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 group-hover:text-[#0065eb] transition-colors truncate">{chat.participantName || 'Guest User'}</h4>
                                        <p className="text-sm text-slate-500 truncate max-w-[200px] md:max-w-md">{chat.lastMessage || 'Sent a message'}</p>
                                    </div>
                                </div>
                                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-none border-slate-100 pt-3 sm:pt-0">
                                    {/* 🛡️ FIX: Safely parse standard string dates OR Firebase Timestamps */}
                                    <p className="text-xs font-bold text-slate-400 sm:mb-1">
                                      {chat.updatedAt ? (chat.updatedAt?.toDate ? format(chat.updatedAt.toDate(), 'MMM d, h:mm a') : format(new Date(chat.updatedAt as any), 'MMM d, h:mm a')) : 'Just now'}
                                    </p>
                                    {chat.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{chat.unreadCount} new</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
             </motion.div>
          )}

          {/* --- TAB: SETTINGS (READ-ONLY OVERVIEW) --- */}
          {activeTab === 'settings' && hotel && !needsSetup && (
             <motion.div key="settings" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <h1 className="text-3xl font-black tracking-tight mb-6">Hotel Settings</h1>
                <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-sm max-w-4xl">
                   
                   <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-blue-50 rounded-xl text-[#0065eb]"><Building2 size={28}/></div>
                         <div>
                            <h3 className="text-xl font-bold">Property Profile</h3>
                            <p className="text-sm text-slate-500">Manage your public listing details and configuration.</p>
                         </div>
                      </div>
                      <button onClick={() => updateTab('edit-hotel')} className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shrink-0">
                         <Edit3 size={18}/> Edit Complete Hotel
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoField label="Hotel Name" value={hotel.name} icon={Building2} />
                      <InfoField label="Base Price / Night" value={`$${hotel.pricePerNight}`} icon={DollarSign} />
                      <InfoField label="Location (City)" value={hotel.location?.city || 'Not specified'} icon={MapPin} />
                      <InfoField label="Location (Area)" value={hotel.location?.area || 'Not specified'} icon={MapPin} />
                      <InfoField label="Total Rooms Configured" value={`${hotel.roomsCount}`} icon={BedDouble} />
                      <InfoField label="Reception Phone" value={hotel.contact?.phoneCall || 'Not specified'} icon={Phone} />
                      <div className="md:col-span-2">
                         <InfoField label="Cancellation Policy" value={hotel.policies?.cancellation || 'Not specified'} icon={Shield} />
                      </div>
                   </div>

                </div>
             </motion.div>
          )}

          {/* --- TAB: EDIT HOTEL (CALLS THE HOTELFORM) --- */}
          {activeTab === 'edit-hotel' && hotel && (
             <motion.div key="edit-hotel" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <button onClick={() => updateTab('settings')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
                   <ArrowLeftCircle size={20} /> Back to Settings
                </button>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                   <HotelForm hotelId={hotel.id} />
                </div>
             </motion.div>
          )}

          {/* --- TAB: SETUP HOTEL (INITIAL CREATION) --- */}
          {activeTab === 'setup-hotel' && (
             <motion.div key="setup-hotel" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mt-6">
                   <HotelForm />
                </div>
             </motion.div>
          )}

          {/* --- REAL DYNAMIC ANALYTICS --- */}
          {activeTab === 'analytics' && hotel && !needsSetup && (
             <motion.div key="analytics" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <HotelAnalytics hotelId={hotel.id} />
             </motion.div>
          )}

          {/* --- REMAINING LOCKED PRO TABS --- */}
          {['reports', 'guests', 'staff'].includes(activeTab) && hotel && !needsSetup && (
             <motion.div key="locked" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <ProLockOverlay featureName={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <BottomNavItem icon={LayoutDashboard} label="Home" active={activeTab === 'overview'} onClick={() => updateTab('overview')} />
         <BottomNavItem icon={CalendarIcon} label="Bookings" active={activeTab === 'reservations'} onClick={() => updateTab('reservations')} badge={bookings.filter(b=>b.status==='pending').length} />
         <BottomNavItem icon={BedDouble} label="Rooms" active={['rooms', 'add-room', 'edit-room'].includes(activeTab)} onClick={() => updateTab('rooms')} />
         <BottomNavItem icon={MessageSquare} label="Inbox" active={activeTab === 'messages'} onClick={() => updateTab('messages')} badge={chats.filter(c => c.unreadCount > 0).length} />
         <BottomNavItem icon={Settings} label="Menu" active={['settings', 'edit-hotel', 'analytics', 'reports', 'guests', 'staff', 'restaurants'].includes(activeTab)} onClick={() => updateTab('settings')} />
      </nav>

    </div>
  );
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function SidebarItem({ icon: Icon, label, active, onClick, count, isProLocked }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
      <div className="flex items-center gap-3">
          <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
          <span className="font-bold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
         {isProLocked && <Lock size={14} className="text-amber-500" />}
         {count > 0 && <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white text-slate-900' : 'bg-red-500 text-white'}`}>{count}</span>}
      </div>
    </button>
  );
}

function BottomNavItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-2 relative w-16">
       <div className={`p-2 rounded-xl transition-all ${active ? 'bg-[#0065eb] text-white shadow-md -translate-y-1' : 'text-slate-400'}`}>
          <Icon size={22} strokeWidth={active ? 2.5 : 2} />
          {badge > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>}
       </div>
       <span className={`text-[10px] font-bold mt-1 transition-all ${active ? 'text-[#0065eb]' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
       <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color} mb-4`}>
          <Icon size={24} strokeWidth={2.5} />
       </div>
       <div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">{value}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{title}</p>
       </div>
    </div>
  );
}

function InfoField({ label, value, icon: Icon }: any) {
   return (
     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 shrink-0"><Icon size={24}/></div>
        <div className="min-w-0">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className="font-bold text-slate-900 truncate">{value}</p>
        </div>
     </div>
   )
}

function StatusBadge({ status }: { status?: string | null }) {
   const safeStatus = status || 'pending';
   const styles: any = {
     'pending': 'bg-amber-100 text-amber-700',
     'confirmed': 'bg-emerald-100 text-emerald-700',
     'checked-in': 'bg-blue-100 text-blue-700',
     'checked-out': 'bg-slate-100 text-slate-600',
     'cancelled': 'bg-red-100 text-red-700',
   };
   return (
     <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${styles[safeStatus.toLowerCase()] || 'bg-slate-100 text-slate-900'}`}>
       {safeStatus.replace('-', ' ')}
     </span>
   );
}

function ActionButton({ icon: Icon, color, onClick }: any) {
   return (
      <button onClick={onClick} className={`p-2 rounded-xl shadow-sm hover:scale-105 transition-all ${color}`}>
         <Icon size={18} />
      </button>
   );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6"><Icon size={40} /></div>
       <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
       <p className="text-slate-500 font-medium text-sm max-w-sm">{desc}</p>
    </div>
  );
}

function ProLockOverlay({ featureName }: { featureName: string }) {
   const router = useRouter();
   return (
      <div className="h-[70vh] min-h-[500px] flex flex-col items-center justify-center bg-white rounded-3xl border border-amber-200 relative overflow-hidden text-center p-6">
         <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10">
            <Lock size={40} />
         </div>
         <h2 className="text-3xl font-black text-slate-900 mb-3 relative z-10">{featureName} is a Pro Feature</h2>
         <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 relative z-10">
            Upgrade to the Premium Plan to unlock advanced analytics, guest history, staff management, and financial reporting.
         </p>
         <button onClick={() => router.push('/subscription')} className="bg-amber-400 text-amber-950 px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-amber-400/20 hover:bg-amber-500 hover:scale-105 transition-all relative z-10 flex items-center gap-2">
            <Shield size={20} /> Upgrade to Pro
         </button>
      </div>
   );
}