'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Heart, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  MapPin, 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  Loader2,
  Edit2,
  Save,
  Wallet,
  MessageSquare,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Menu
} from 'lucide-react';

// --- TYPES ---
interface UserData {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'reagent' | 'hoadmin';
  photoUrl?: string;
  favorites?: string[]; // Array of Property IDs
}

interface Booking {
  id: string;
  hotelName: string;
  roomName: string;
  checkInDate: any; // Firestore Timestamp
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
  const router = useRouter();
  
  // --- AUTH & USER STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATE ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [favorites, setFavorites] = useState<Property[]>([]);
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'favorites' | 'messages' | 'notifications' | 'settings'>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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

      // A. Fetch User Profile
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data() as UserData;
          setUserData(data);
          setEditForm({ name: data.name || '', phone: data.phoneNumber || '' });
          
          // Trigger Data Fetches based on UID
          fetchUserBookings(user.uid);
          fetchUserFavorites(data.favorites || []);
          
          // Setup Real-time Listeners
          const unsubNotify = subscribeToNotifications(user.uid);
          const unsubChats = subscribeToChats(user.uid);

          setLoading(false);
          
          return () => {
            unsubNotify();
            unsubChats();
          };
        } else {
            // Handle edge case: User auth exists but no Firestore doc
            setLoading(false);
        }
      } catch (error) {
        console.error("Dashboard Init Error:", error);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  // --- B. FETCH BOOKINGS (Once) ---
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

  // --- C. FETCH FAVORITES (Once) ---
  const fetchUserFavorites = async (favIds: string[]) => {
    if (!favIds || favIds.length === 0) return;
    try {
        // Firestore 'in' query supports max 10 items. For robustness, fetch individual if array is large, 
        // or just fetch 10 for overview. Here we slice 10 for safety.
        const safeIds = favIds.slice(0, 10);
        const q = query(collection(db, 'property'), where('__name__', 'in', safeIds));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Property));
        setFavorites(list);
    } catch (e) {
        console.error("Error fetching favorites:", e);
    }
  };

  // --- D. SUBSCRIBE NOTIFICATIONS (Real-time) ---
  const subscribeToNotifications = (uid: string) => {
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), orderBy('createdAt', 'desc'), limit(20));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(list);
    });
  };

  // --- E. SUBSCRIBE CHATS (Real-time) ---
  const subscribeToChats = (uid: string) => {
    // Assuming a 'chats' collection where user IDs are in a 'participants' array
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
        setChats(list);
    });
  };

  // --- HANDLERS ---
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

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut(auth);
      router.push('/login');
    }
  };

  // --- DERIVED STATE ---
  const firstName = userData?.name ? userData.name.trim().split(' ')[0] : 'User';
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#0065eb] mb-4" size={48} />
        <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-900">
      
      {/* ================= SIDEBAR (Desktop) ================= */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col fixed h-full z-30">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter">GuriUp</span>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <SidebarItem icon={UserIcon} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={Calendar} label="My Bookings" count={bookings.length} active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <SidebarItem icon={Heart} label="Favorites" count={favorites.length} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          <SidebarItem icon={MessageSquare} label="Messages" count={chats.length} active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
          <SidebarItem icon={Bell} label="Notifications" count={unreadNotifications} active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE NAV ================= */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="bg-[#0065eb] p-1.5 rounded-lg"><LayoutDashboard className="text-white" size={18} /></div>
           <span className="font-black tracking-tighter text-lg">GuriUp</span>
        </div>
        <button onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} className="p-2 text-slate-600"><Menu/></button>
      </div>
      
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white p-6 flex flex-col gap-4 animate-in slide-in-from-right">
            <div className="flex justify-end"><button onClick={() => setIsMobileNavOpen(false)} className="p-2 bg-slate-100 rounded-full"><XCircle/></button></div>
            <SidebarItem icon={UserIcon} label="Overview" onClick={() => { setActiveTab('overview'); setIsMobileNavOpen(false); }} />
            <SidebarItem icon={Calendar} label="Bookings" onClick={() => { setActiveTab('bookings'); setIsMobileNavOpen(false); }} />
            <SidebarItem icon={MessageSquare} label="Messages" onClick={() => { setActiveTab('messages'); setIsMobileNavOpen(false); }} />
            <SidebarItem icon={Bell} label="Notifications" onClick={() => { setActiveTab('notifications'); setIsMobileNavOpen(false); }} />
            <SidebarItem icon={Settings} label="Settings" onClick={() => { setActiveTab('settings'); setIsMobileNavOpen(false); }} />
            <button onClick={handleLogout} className="mt-auto w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl">Log Out</button>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 lg:ml-72 p-6 pt-24 lg:p-12 mb-20 lg:mb-0 transition-all duration-300">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight capitalize">
              {activeTab}
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
              </div>

              {/* Stats Grid - DYNAMIC */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                 <QuickAction icon={Wallet} label="Balance" val="$0.00" color="text-blue-600" bg="bg-blue-50" />
                 <QuickAction icon={MessageSquare} label="Inbox" val={chats.length.toString()} color="text-indigo-600" bg="bg-indigo-50" onClick={() => setActiveTab('messages')} />
                 <QuickAction icon={Calendar} label="History" val={bookings.length.toString()} color="text-orange-600" bg="bg-orange-50" onClick={() => setActiveTab('bookings')} />
                 <QuickAction icon={Heart} label="Saved" val={favorites.length.toString()} color="text-pink-600" bg="bg-pink-50" onClick={() => setActiveTab('favorites')} />
              </div>

              {/* ROLE BASED MANAGEMENT CARDS */}
              {(userData?.role === 'admin' || userData?.role === 'reagent' || userData?.role === 'hoadmin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                   {userData.role === 'admin' && (
                        <AdminCard title="Global Admin" icon={ShieldCheck} color="bg-slate-900" onClick={() => router.push('/admin')} />
                   )}
                   
                   {/* DYNAMIC LINK: REAGENT -> /dashboard/agent */}
                   {userData.role === 'reagent' && (
                        <AdminCard title="Manage Agent Profile" icon={Briefcase} color="bg-emerald-600" onClick={() => router.push('/dashboard/agent')} />
                   )}
                   
                   {/* DYNAMIC LINK: HOADMIN -> /dashboard/hotel */}
                   {userData.role === 'hoadmin' && (
                        <AdminCard title="Manage Hotel" icon={Building2} color="bg-[#0065eb]" onClick={() => router.push('/dashboard/hotel')} />
                   )}
                </div>
              )}
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
                {notifications.length === 0 ? (
                    <EmptyState icon={Bell} title="All Caught Up" desc="You have no new notifications." />
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className={`p-6 rounded-2xl border flex gap-4 ${notif.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100'}`}>
                            <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${notif.isRead ? 'bg-slate-300' : 'bg-[#0065eb]'}`}></div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">{notif.title}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                                <span className="text-[10px] font-bold text-slate-400 mt-2 block">{new Date(notif.createdAt?.toDate()).toLocaleString()}</span>
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
      </main>
    </div>
  );
}

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

const QuickAction = ({ icon: Icon, label, val, color, bg, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3 group cursor-pointer">
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center ${color} shadow-inner group-hover:scale-110 transition-transform`}>
       <Icon size={28} />
    </div>
    <div className="text-center">
       <p className="font-black text-slate-900 text-lg">{val}</p>
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
        <Icon size={48} />
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