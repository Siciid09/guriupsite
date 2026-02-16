'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  updateDoc 
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
  Menu,
  X,
  Bell
} from 'lucide-react';

// --- TYPES ---
interface UserData {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'reagent' | 'hoadmin';
  photoUrl?: string;
}

interface Booking {
  id: string;
  hotelName: string;
  roomName: string;
  checkInDate: any; 
  checkOutDate: any;
  totalAmount: number;
  paymentStatus: string;
  status: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'favorites' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setEditForm({ name: data.name || '', phone: data.phoneNumber || '' });
          fetchBookings(user.uid);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchBookings = async (uid: string) => {
    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const bookingData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
    setBookings(bookingData);
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name: editForm.name,
        phoneNumber: editForm.phone
      });
      await updateProfile(currentUser, { displayName: editForm.name });
      setUserData(prev => prev ? { ...prev, name: editForm.name, phoneNumber: editForm.phone } : null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SOLVED: split() Error Fix ---
  // Using optional chaining and fallback ensures the app never crashes
  const firstName = userData?.name ? userData.name.trim().split(' ')[0] : 'User';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">GuriUp Dashboard</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans text-slate-900">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col fixed h-full z-30">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-[#0065eb] p-2.5 rounded-2xl shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter">GuriUp</span>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <SidebarItem icon={UserIcon} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={Calendar} label="My Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <SidebarItem icon={Heart} label="Favorites" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-black text-sm">
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOP BAR --- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="bg-[#0065eb] p-1.5 rounded-lg">
             <LayoutDashboard className="text-white" size={18} />
           </div>
           <span className="font-black tracking-tighter text-lg">GuriUp</span>
        </div>
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
             {userData?.name ? userData.name[0] : 'U'}
           </div>
        </div>
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 z-40 flex justify-around items-center py-3 px-2 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <MobileNavItem icon={LayoutDashboard} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <MobileNavItem icon={Calendar} active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
        <MobileNavItem icon={Heart} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
        <MobileNavItem icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 lg:ml-72 p-6 pt-24 lg:p-12 mb-20 lg:mb-0 transition-all duration-300">
        
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'bookings' && 'Reservations'}
              {activeTab === 'favorites' && 'Saved Homes'}
              {activeTab === 'settings' && 'Account'}
            </h1>
            <p className="text-slate-400 font-bold mt-1">
              Hi, {firstName}! Managing your property journey.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
             <div className="p-2 text-slate-400 hover:text-blue-600 cursor-pointer">
               <Bell size={20} />
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
                        {userData?.role || 'Member'}
                      </span>
                   </div>
                   <p className="text-slate-500 font-bold">{userData?.email}</p>
                   <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-slate-400 font-bold text-sm">
                      <MapPin size={16} className="text-blue-500" />
                      <span>Hargeisa, Somaliland</span>
                   </div>
                </div>

                <button onClick={() => setActiveTab('settings')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/10 z-10">
                  Manage Account
                </button>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                 <QuickAction icon={Wallet} label="Balance" val="$1,240" color="text-blue-600" bg="bg-blue-50" />
                 <QuickAction icon={MessageSquare} label="Inbox" val="12" color="text-indigo-600" bg="bg-indigo-50" />
                 <QuickAction icon={Calendar} label="History" val={bookings.length} color="text-orange-600" bg="bg-orange-50" onClick={() => setActiveTab('bookings')} />
                 <QuickAction icon={Heart} label="Saved" val="5" color="text-pink-600" bg="bg-pink-50" onClick={() => setActiveTab('favorites')} />
              </div>

              {/* Admin Special Tools */}
              {(userData?.role === 'admin' || userData?.role === 'reagent' || userData?.role === 'hoadmin') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {userData.role === 'admin' && <AdminCard title="Global Control" icon={ShieldCheck} color="bg-slate-900" />}
                   {userData.role === 'reagent' && <AdminCard title="Lead Manager" icon={Briefcase} color="bg-emerald-600" />}
                   {userData.role === 'hoadmin' && <AdminCard title="Property Hub" icon={Building2} color="bg-[#0065eb]" />}
                </div>
              )}
            </motion.div>
          )}

          {/* --- TAB: BOOKINGS --- */}
          {activeTab === 'bookings' && (
            <motion.div key="bookings" initial="hidden" animate="visible" exit="hidden" variants={fadeIn} className="space-y-4">
              {bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No Active Stays" desc="Your dream vacations will show up right here." />
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                       <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb] border border-blue-100">
                          <Building2 size={32} />
                       </div>
                       <div>
                          <h3 className="font-black text-xl text-slate-900">{booking.hotelName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{booking.roomName}</span>
                             <span className="text-slate-300">•</span>
                             <span className="text-xs font-bold text-slate-400">{new Date(booking.checkInDate.toDate()).toDateString()}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                       <StatusBadge status={booking.paymentStatus} />
                       <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">${booking.totalAmount}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Grand Total</p>
                       </div>
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

                  <div className="mt-12 pt-8 border-t border-slate-50">
                     <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest">Security Action</p>
                     <button className="text-red-500 font-black text-sm hover:underline">Request Account Deletion</button>
                  </div>
               </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// --- ATOMS & COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group ${active ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/30 scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <Icon size={22} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
    <span className="font-black text-sm">{label}</span>
  </button>
);

const MobileNavItem = ({ icon: Icon, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`p-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-[#0065eb] text-white shadow-lg shadow-blue-500/30' : 'text-slate-400'}`}
  >
    <Icon size={24} />
  </button>
);

const QuickAction = ({ icon: Icon, label, val, color, bg, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center gap-3">
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center ${color} shadow-inner`}>
       <Icon size={28} />
    </div>
    <div className="text-center">
       <p className="font-black text-slate-900 text-lg">{val}</p>
       <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">{label}</p>
    </div>
  </button>
);

const AdminCard = ({ title, icon: Icon, color }: any) => (
  <div className={`${color} p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group cursor-pointer`}>
     <div className="relative z-10 flex flex-col gap-4">
        <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
           <Icon size={28} />
        </div>
        <span className="font-black text-xl tracking-tight">{title}</span>
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

const EmptyState = ({ icon: Icon, title, desc }: any) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
     <div className="w-24 h-24 bg-white border border-slate-50 shadow-inner rounded-full flex items-center justify-center text-slate-200 mb-8">
        <Icon size={48} />
     </div>
     <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
     <p className="text-slate-400 font-bold max-w-sm text-sm">{desc}</p>
     <button className="mt-8 bg-[#0065eb] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
       Start Exploring
     </button>
  </div>
);