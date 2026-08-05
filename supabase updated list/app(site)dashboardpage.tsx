'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db, storage } from '../../lib/firebase'; // Ensure correct path
import { 
  onAuthStateChanged, 
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Heart, 
  Settings, 
  User as UserIcon, 
  MapPin, 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  Loader2,
  Edit2,
  Save,
  MessageSquare,
  Bell,
  ChevronRight,
  AlertCircle,
  Building,
  UploadCloud,
  Camera,
  Layers,
  LogOut
} from 'lucide-react';

// IMPORTANT: Import your hotel form component here
import HotelForm from '../../../components/hotelform'; 

// --- TYPES ---
interface UserData {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'reagent' | 'hoadmin';
  photoUrl?: string;
  favorites?: string[]; 
}

interface Booking {
  id: string;
  hotelName: string;
  roomName: string;
  checkInDate: any; 
  checkOutDate: any;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'cancelled' | 'confirmed';
  status: string;
  createdAt: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: any;
}

interface Chat {
  id: string;
  lastMessage: string;
  participantName: string;
  unreadCount: number;
  updatedAt: any;
}

interface Property {
  id: string;
  title: string;
  location: any;
  price: number;
  images: string[];
  status: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-[#0065eb]" size={40}/></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Based Tab State
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab: string) => router.push(`?tab=${tab}`, { scroll: false });

  // --- AUTH & USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- SETUP GATEKEEPER STATE ---
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // --- DATA STATE ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  
  // --- UI STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  // =========================================================
  // 1. INITIAL FETCH & REAL-TIME LISTENERS
  // =========================================================
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          setUserData(data);
          setEditForm({ name: data.name || '', phone: data.phoneNumber || '' });
          
          // --- THE GATEKEEPER CHECK ---
          let missingProfile = false;
          if (data.role === 'hoadmin') {
             const hotelQ = query(collection(db, 'hotels'), where('hotelAdminId', '==', user.uid));
             const hotelSnap = await getDocs(hotelQ);
             if (hotelSnap.empty) missingProfile = true;
          } else if (data.role === 'reagent') {
             const agentDoc = await getDoc(doc(db, 'agents', user.uid));
             if (!agentDoc.exists()) missingProfile = true;
          }
          setNeedsSetup(missingProfile);
          setCheckingSetup(false);

          fetchUserBookings(user.uid);
          fetchUserFavorites(data.favorites || []);
          
          const unsubNotify = subscribeToNotifications(user.uid);
          const unsubChats = subscribeToChats(user.uid);

          setLoading(false);
          
          return () => {
            unsubNotify();
            unsubChats();
          };
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Dashboard Init Error:", error);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const fetchUserBookings = async (uid: string) => {
    try {
        const q = query(collection(db, 'bookings'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
        setBookings(list);
    } catch (e) {
        console.error("Error fetching bookings:", e);
    }
  };

  const fetchUserFavorites = async (favIds: string[]) => {
    if (!favIds || favIds.length === 0) return;
    try {
        const safeIds = favIds.slice(0, 10);
        const q = query(collection(db, 'property'), where('__name__', 'in', safeIds));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
        setFavorites(list);
    } catch (e) {
        console.error("Error fetching favorites:", e);
    }
  };

  const subscribeToNotifications = (uid: string) => {
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(list);
    });
  };

  const subscribeToChats = (uid: string) => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
        setChats(list);
    });
  };

  const handleUpdateProfile = async () => {
    if (!currentUser || !userData) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: editForm.name,
        phoneNumber: editForm.phone
      });
      await updateProfile(currentUser, { displayName: editForm.name });
      setUserData({ ...userData, name: editForm.name, phoneNumber: editForm.phone });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to update profile.");
    }
  };

  // --- DYNAMIC NOTIFICATIONS (INJECT SETUP WARNING) ---
  const displayNotifications = [...notifications];
  if (needsSetup) {
     displayNotifications.unshift({
        id: 'setup-alert-1',
        title: 'Profile Setup Required',
        message: `You must set up your ${userData?.role === 'hoadmin' ? 'Hotel' : 'Agent Profile'} to activate your account. Click here to set up now.`,
        isRead: false,
        type: 'error',
        createdAt: { toDate: () => new Date() } // Fake timestamp for display
     } as any);
  }

  const firstName = userData?.name ? userData.name.trim().split(' ')[0] : 'User';
  const unreadNotifications = displayNotifications.filter(n => !n.isRead).length;

  if (loading || checkingSetup) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#0065eb] mb-4" size={48} />
        <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    // FIX 1: pt-20 added here so the global header does not cover the red banner
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col lg:flex-row w-full relative pt-9">
        
        {/* ================= SIDEBAR (Desktop) ================= */}
        {/* FIX 2: sticky top-20 and h-[calc(100vh-5rem)] so it doesn't hit the footer */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col sticky top-20 h-[calc(100vh-5rem)] z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
              <LayoutDashboard className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter">GuriUp</span>
          </div>

          <nav className="flex-1 px-6 space-y-2 mt-4 pb-12 overflow-y-auto custom-scrollbar">
            <SidebarItem icon={UserIcon} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <SidebarItem icon={Calendar} label="My Bookings" count={bookings.length} active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
            <SidebarItem icon={Heart} label="Favorites" count={favorites.length} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
            <SidebarItem icon={MessageSquare} label="Messages" count={chats.length} active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
            <SidebarItem icon={Bell} label="Notifications" count={unreadNotifications} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
            <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </nav>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          
          {/* ================= GLOBAL WARNING BANNER (IN NORMAL FLOW) ================= */}
          {needsSetup && activeTab !== 'setup-hotel' && activeTab !== 'setup-agent' && (
             <div className="bg-red-500 text-white p-3 w-full flex flex-col sm:flex-row items-center justify-center gap-3 shadow-md z-20 shrink-0">
                <div className="flex items-center gap-2 font-bold text-sm">
                   <AlertCircle size={18} />
                   <span>Action Required: You must set up your {userData?.role === 'hoadmin' ? 'Hotel' : 'Agent Profile'} to activate your account.</span>
                </div>
                <button 
                  onClick={() => setActiveTab(userData?.role === 'hoadmin' ? 'setup-hotel' : 'setup-agent')} 
                  className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-black shadow-sm hover:scale-105 transition-transform"
                >
                  Set Up Now
                </button>
             </div>
          )}

          {/* FIX 3: pb-48 added here so cards can scroll safely past the footer */}
          <div className="p-6 pb-48 lg:p-12 lg:pb-48 transition-all duration-300 flex-1">
              <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight capitalize">
                    {activeTab.replace('-', ' ')}
                  </h1>
                  <p className="text-slate-400 font-bold mt-1">
                    Welcome back, {firstName}! 
                  </p>
                </div>
                
                <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div onClick={() => setActiveTab('notifications')} className="p-2 text-slate-400 hover:text-[#0065eb] cursor-pointer relative">
                      <Bell size={20} />
                      {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100 mx-1" />
                    <div className="flex items-center gap-3 pr-2">
                      <span className="text-sm font-black text-slate-700">{userData?.name}</span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        {userData?.name ? userData.name[0] : 'U'}
                      </div>
                    </div>
                </div>
              </header>

              <AnimatePresence mode="wait">
                
                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="space-y-8">
                    
                    {/* Profile Card */}
                    <div className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="relative w-32 h-32 rounded-[2rem] border-8 border-slate-50 overflow-hidden bg-white shadow-inner flex items-center justify-center text-5xl font-black text-blue-100">
                        {userData?.photoUrl ? (
                          <Image src={userData.photoUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                          userData?.name ? userData.name[0] : 'U'
                        )}
                      </div>
                      
                      <div className="flex-1 text-center md:text-left z-10">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                            <h2 className="text-3xl font-black tracking-tight">{userData?.name}</h2>
                            <span className="bg-[#0065eb] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                              {userData?.role === 'reagent' ? 'Real Estate Agent' : userData?.role === 'hoadmin' ? 'Hotel Admin' : 'Member'}
                            </span>
                          </div>
                          <p className="text-slate-500 font-bold">{userData?.email}</p>
                      </div>

                      {needsSetup && (
                         <div className="mt-4 md:mt-0 z-10">
                            <button 
                               onClick={() => setActiveTab(userData?.role === 'hoadmin' ? 'setup-hotel' : 'setup-agent')}
                               className="bg-red-500 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-500/30 hover:bg-red-600 hover:-translate-y-1 transition-all"
                            >
                               SET UP PROFILE NOW
                            </button>
                         </div>
                      )}
                    </div>

                    {/* --- BIG GATEKEEPER ALERT CARD --- */}
                    {needsSetup && (
                        <div className="bg-red-50 border border-red-200 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg shadow-red-500/10">
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-100 rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-red-900 mb-2 flex items-center gap-2">
                                   <AlertCircle size={28}/> Profile Incomplete
                                </h3>
                                <p className="text-red-700 font-medium">You cannot access your management dashboard until your profile is fully set up.</p>
                            </div>
                            <button 
                               onClick={() => setActiveTab(userData?.role === 'hoadmin' ? 'setup-hotel' : 'setup-agent')}
                               className="relative z-10 w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-red-600/30 hover:bg-red-700 hover:-translate-y-1 transition-all"
                            >
                               SET UP NOW
                            </button>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                       <QuickAction icon={MessageSquare} label="Inbox" val={chats.length.toString()} color="text-indigo-600" bg="bg-indigo-50" onClick={() => setActiveTab('messages')} />
                       <QuickAction icon={Calendar} label="History" val={bookings.length.toString()} color="text-orange-600" bg="bg-orange-50" onClick={() => setActiveTab('bookings')} />
                       <QuickAction icon={Heart} label="Saved" val={favorites.length.toString()} color="text-pink-600" bg="bg-pink-50" onClick={() => setActiveTab('favorites')} />
                    </div>

                    {/* ROLE BASED MANAGEMENT CARDS */}
                    {(!needsSetup && (userData?.role === 'admin' || userData?.role === 'reagent' || userData?.role === 'hoadmin')) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                         {userData.role === 'admin' && (
                             <AdminCard title="Global Admin" icon={ShieldCheck} color="bg-slate-900" onClick={() => router.push('/admin')} />
                         )}
                         
                         {userData.role === 'reagent' && (
                             <AdminCard title="Manage Agent Profile" icon={Briefcase} color="bg-emerald-600" onClick={() => router.push('/dashboard/agent')} />
                         )}
                         
                         {userData.role === 'hoadmin' && (
                             <AdminCard title="Manage Hotel" icon={Building2} color="bg-[#0065eb]" onClick={() => router.push('/dashboard/hotel')} />
                         )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* --- TAB: SETUP HOTEL --- */}
                {activeTab === 'setup-hotel' && userData?.role === 'hoadmin' && (
                  <motion.div key="setup-hotel" initial="hidden" animate="visible" exit="hidden" variants={fadeIn}>
                     <HotelForm />
                  </motion.div>
                )}

                {/* --- TAB: SETUP AGENT --- */}
                {activeTab === 'setup-agent' && userData?.role === 'reagent' && (
                  <motion.div key="setup-agent" initial="hidden" animate="visible" exit="hidden" variants={fadeIn}>
                     <AgentSetupForm 
                        user={currentUser!} 
                        userData={userData}
                        onComplete={() => {
                            setNeedsSetup(false);
                            setActiveTab('overview');
                        }} 
                     />
                  </motion.div>
                )}

                {/* --- TAB: BOOKINGS --- */}
                {activeTab === 'bookings' && (
                  <motion.div key="bookings" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="space-y-4">
                    {bookings.length === 0 ? (
                      <EmptyState icon={Calendar} title="No Active Stays" desc="Your booking history is currently empty." action={() => router.push('/hotels')} actionLabel="Browse Hotels" />
                    ) : (
                      bookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] border border-blue-100">
                                <Building2 size={32} />
                             </div>
                             <div>
                                <h3 className="font-black text-xl text-slate-900">{booking.hotelName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{booking.roomName}</span>
                                   <span className="text-slate-300">•</span>
                                   <span className="text-xs font-bold text-slate-400">{booking.checkInDate?.toDate().toDateString()}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                             <StatusBadge status={booking.paymentStatus} />
                             <div className="text-right">
                                <p className="text-2xl font-black text-slate-900">${booking.totalAmount}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* --- TAB: FAVORITES --- */}
                {activeTab === 'favorites' && (
                  <motion.div key="favorites" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.length === 0 ? (
                          <div className="col-span-full">
                              <EmptyState icon={Heart} title="No Favorites Yet" desc="Properties you save will appear here." action={() => router.push('/properties')} actionLabel="Find Homes" />
                          </div>
                      ) : (
                          favorites.map((prop) => (
                              <div key={prop.id} onClick={() => router.push(`/properties/${prop.id}`)} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                                  <div className="h-48 bg-slate-200 rounded-[1.5rem] relative overflow-hidden mb-4">
                                      <Image src={prop.images[0]} alt={prop.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                  </div>
                                  <h3 className="font-black text-lg text-slate-900 truncate">{prop.title}</h3>
                                  <p className="text-sm font-bold text-slate-400 mb-3">{prop.location?.area || 'Unknown Area'}</p>
                                  <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                      <span className="font-black text-[#0065eb]">${prop.price.toLocaleString()}</span>
                                      <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{prop.status}</span>
                                  </div>
                              </div>
                          ))
                      )}
                  </motion.div>
                )}

                {/* --- TAB: MESSAGES --- */}
                {activeTab === 'messages' && (
                  <motion.div key="messages" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden min-h-[500px]">
                      {chats.length === 0 ? (
                          <EmptyState icon={MessageSquare} title="No Messages" desc="Start a chat with an agent to see messages here." />
                      ) : (
                          <div className="divide-y divide-slate-100">
                              {chats.map(chat => (
                                  <div key={chat.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                              {chat.participantName[0]}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-slate-900">{chat.participantName}</h4>
                                              <p className="text-sm text-slate-500 truncate max-w-xs">{chat.lastMessage}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className="text-xs font-bold text-slate-400 mb-1">{new Date(chat.updatedAt?.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                          {chat.unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{chat.unreadCount} new</span>}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </motion.div>
                )}

                {/* --- TAB: NOTIFICATIONS --- */}
                {activeTab === 'notifications' && (
                  <motion.div key="notifications" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="space-y-4 max-w-3xl">
                      {displayNotifications.length === 0 ? (
                          <EmptyState icon={Bell} title="All Caught Up" desc="You have no new notifications." />
                      ) : (
                          displayNotifications.map(notif => (
                              <div 
                                 key={notif.id} 
                                 onClick={() => {
                                    if (notif.id === 'setup-alert-1') {
                                       setActiveTab(userData?.role === 'hoadmin' ? 'setup-hotel' : 'setup-agent');
                                    }
                                 }}
                                 className={`p-6 rounded-2xl border flex gap-4 transition-all 
                                 ${notif.id === 'setup-alert-1' ? 'bg-red-50 border-red-200 cursor-pointer hover:bg-red-100' : 
                                 (notif.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100')}`}
                              >
                                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${notif.id === 'setup-alert-1' ? 'bg-red-500' : (notif.isRead ? 'bg-slate-300' : 'bg-[#0065eb]')}`}></div>
                                  <div>
                                      <h4 className={`font-bold mb-1 ${notif.id === 'setup-alert-1' ? 'text-red-700' : 'text-slate-900'}`}>{notif.title}</h4>
                                      <p className={`text-sm leading-relaxed ${notif.id === 'setup-alert-1' ? 'text-red-600 font-medium' : 'text-slate-600'}`}>{notif.message}</p>
                                      <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                                         {notif.id === 'setup-alert-1' ? 'Just Now' : new Date(notif.createdAt?.toDate()).toLocaleString()}
                                      </span>
                                  </div>
                              </div>
                          ))
                      )}
                  </motion.div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === 'settings' && (
                  <motion.div key="settings" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="max-w-3xl">
                     <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black tracking-tight">Profile Settings</h3>
                            <button 
                              onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${isEditing ? 'bg-[#0065eb] text-white shadow-blue-500/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                              {isEditing ? <><Save size={18}/> Update</> : <><Edit2 size={18}/> Edit Profile</>}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputGroup label="Display Name" value={editForm.name} disabled={!isEditing} onChange={(e: any) => setEditForm({...editForm, name: e.target.value})} />
                            <InputGroup label="Phone Number" value={editForm.phone} disabled={!isEditing} onChange={(e: any) => setEditForm({...editForm, phone: e.target.value})} />
                            <div className="md:col-span-2">
                              <InputGroup label="Account Email" value={userData?.email || ''} disabled={true} />
                            </div>
                            <div className="md:col-span-2">
                              <InputGroup label="Verified ID" value={userData?.uid || ''} disabled={true} />
                            </div>
                        </div>
                     </div>
                  </motion.div>
                )}

              </AnimatePresence>
          </div>
        </main>
      
      {/* ================= MOBILE BOTTOM NAVIGATION (6 Tabs) ================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between px-2 pb-safe pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <BottomNavItem icon={UserIcon} label="Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
         <BottomNavItem icon={Calendar} label="Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
         <BottomNavItem icon={Heart} label="Saved" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
         <BottomNavItem icon={MessageSquare} label="Inbox" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
         <BottomNavItem icon={Bell} label="Notifs" active={activeTab === 'notifications'} badge={unreadNotifications} onClick={() => setActiveTab('notifications')} />
         <BottomNavItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

    </div>
  );
}

// --- NEW BUILT-IN AGENT FORM ---
const AgentSetupForm = ({ user, userData, onComplete }: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
     businessName: '',
     whatsappNumber: userData?.phoneNumber || '',
     city: '',
     specialty: 'Residential',
     bio: ''
  });
  
  const [profileImg, setProfileImg] = useState<{file: File | null, preview: string | null}>({file: null, preview: null});

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImg({ file: e.target.files[0], preview: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
         if (!formData.businessName || !formData.city || !formData.whatsappNumber) throw new Error("Please fill in all required fields.");
         if (!profileImg.file && !userData?.photoUrl) throw new Error("A profile photo is required for agents.");

         let finalUrl = userData?.photoUrl || "";
         if (profileImg.file) {
            const ext = profileImg.file.name.split('.').pop();
            const sRef = ref(storage, `agent_profiles/${user.uid}_profile_${Date.now()}.${ext}`);
            await uploadBytes(sRef, profileImg.file);
            finalUrl = await getDownloadURL(sRef);
         }

         const safeSlug = formData.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

         const agencyData = {
            agencyName: formData.businessName,
            agentVerified: false,
            analytics: { clicks: 0, leads: 0, views: 0 },
            averageRating: 0,
            bio: formData.bio,
            coverPhoto: "",
            email: user.email,
            featured: false,
            isFeatured: false,
            isVerified: false,
            joinDate: serverTimestamp(),
            languages: ["Somali", "English"],
            lastUpdated: serverTimestamp(),
            licenseNumber: 'PENDING',
            migratedAt: serverTimestamp(),
            name: formData.businessName,
            phone: userData?.phoneNumber || "",
            planTier: 'free',
            profileImageUrl: finalUrl,
            propertiesSold: 0,
            slug: safeSlug, 
            specialties: [formData.specialty],
            status: "active",
            totalListings: 0,
            userid: user.uid,
            verifiedAt: null,
            city: formData.city,
            ownerName: userData?.name || "Agent",
            whatsappNumber: formData.whatsappNumber,
            type: "reagent"
         };

         await setDoc(doc(db, 'agents', user.uid), agencyData);
         await updateDoc(doc(db, 'users', user.uid), { isAgent: true, role: 'reagent', photoUrl: finalUrl });
         
         onComplete();
      } catch (err: any) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
  };

  return (
      <div className="max-w-2xl bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-blue-900/5 mx-auto">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Briefcase size={32} /></div>
             <h2 className="text-2xl font-black text-slate-900">Set Up Agent Profile</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">Complete this short form to activate your agency.</p>
          </div>

          {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-2"><AlertCircle size={20}/>{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center mb-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Profile Photo *</label>
                    <input type="file" accept="image/*" onChange={handleImage} className="hidden" id="agent-pic" />
                    <label htmlFor="agent-pic" className={`relative flex flex-col items-center justify-center cursor-pointer border-2 border-dashed w-28 h-28 rounded-full mx-auto overflow-hidden group transition-all ${profileImg.preview ? 'border-transparent shadow-md' : 'border-slate-300 bg-slate-50 hover:border-blue-500'}`}>
                        {profileImg.preview ? (
                           <>
                             <Image src={profileImg.preview} alt="Preview" fill className="object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white" size={24} /></div>
                           </>
                        ) : (
                           <UploadCloud size={24} className="text-slate-400 group-hover:text-blue-500" />
                        )}
                    </label>
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Agency Name *</label>
                    <input type="text" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="e.g. Horn Properties" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">City *</label>
                       <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="Hargeisa" required />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">WhatsApp *</label>
                       <input type="tel" value={formData.whatsappNumber} onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="+252..." required />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Specialty</label>
                    <select value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 cursor-pointer">
                       <option>Residential</option><option>Commercial</option><option>Land</option><option>Luxury</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Bio (Optional)</label>
                    <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="Tell clients about your agency..." />
                 </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex justify-center mt-6">
                  {loading ? <Loader2 className="animate-spin" /> : 'LAUNCH AGENCY PROFILE'}
              </button>
          </form>
      </div>
  );
};

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, count, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <div className="flex items-center gap-4">
        <Icon size={22} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
        <span className="font-black text-sm">{label}</span>
    </div>
    {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {count}
        </span>
    )}
  </button>
);

const BottomNavItem = ({ icon: Icon, label, active, badge, onClick }: any) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative">
     <div className={`p-2 rounded-xl transition-all relative ${active ? 'bg-[#0065eb] text-white shadow-md shadow-blue-500/30 -translate-y-1' : 'text-slate-400 bg-transparent'}`}>
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
        {badge !== undefined && badge > 0 && (
           <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
        )}
     </div>
     <span className={`text-[10px] font-bold transition-all ${active ? 'text-[#0065eb]' : 'text-slate-400'}`}>{label}</span>
  </button>
);

const QuickAction = ({ icon: Icon, label, val, color, bg, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer h-full">
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
       <Icon size={28} />
    </div>
    <div className="text-center">
       <p className="font-black text-slate-900 text-xl md:text-2xl">{val}</p>
       <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">{label}</p>
    </div>
  </button>
);

const AdminCard = ({ title, icon: Icon, color, onClick }: any) => (
  <div onClick={onClick} className={`${color} p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform`}>
     <div className="relative z-10 flex flex-col gap-4">
        <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
           <Icon size={28} />
        </div>
        <div>
            <span className="font-black text-xl tracking-tight block">{title}</span>
            <span className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1 flex items-center gap-1">Access Dashboard <ChevronRight size={12}/></span>
        </div>
     </div>
     <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
  </div>
);

const InputGroup = ({ label, value, disabled, onChange }: any) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
     <input 
       type="text" 
       value={value} 
       disabled={disabled}
       onChange={onChange}
       className={`w-full p-5 rounded-2xl font-bold text-slate-900 border transition-all ${disabled ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed shadow-inner' : 'bg-white border-slate-200 focus:border-[#0065eb] focus:ring-4 focus:ring-blue-500/5'}`}
     />
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
   const styles = {
     paid: 'bg-emerald-500 text-white',
     confirmed: 'bg-emerald-500 text-white',
     pending: 'bg-amber-500 text-white',
     cancelled: 'bg-red-500 text-white'
   }[status.toLowerCase()] || 'bg-slate-900 text-white';

   return (
     <span className={`${styles} px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md`}>
       {status}
     </span>
   );
};

const EmptyState = ({ icon: Icon, title, desc, action, actionLabel }: any) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
     <div className="w-24 h-24 bg-white border border-slate-50 shadow-inner rounded-full flex items-center justify-center text-slate-200 mb-8">
        <Icon size={48} strokeWidth={1.5} />
     </div>
     <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
     <p className="text-slate-400 font-bold max-w-sm text-sm mb-8">{desc}</p>
     {action && (
         <button onClick={action} className="bg-[#0065eb] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors">
           {actionLabel}
         </button>
     )}
  </div>
);