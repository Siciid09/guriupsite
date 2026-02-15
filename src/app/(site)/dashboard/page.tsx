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
  MessageSquare
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
  checkInDate: any; // Firestore Timestamp
  checkOutDate: any;
  totalAmount: number;
  paymentStatus: string;
  status: string;
}

// --- ANIMATION VARIANTS ---
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

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]); // simplified for demo
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  // --- AUTH & DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch User Role & Data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        setEditForm({ name: data.name, phone: data.phoneNumber || '' });
        
        // Fetch Bookings
        fetchBookings(user.uid);
        // Fetch Favorites (Logic omitted for brevity, would query property collection by IDs)
      }
      setLoading(false);
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
      alert('Profile updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update profile.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#0065eb] p-2 rounded-xl">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <span className="text-xl font-black tracking-tight hidden lg:block">GuriUp</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem icon={UserIcon} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={Calendar} label="My Bookings" active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} />
          <SidebarItem icon={Heart} label="Favorites" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold">
            <LogOut size={20} />
            <span className="hidden lg:block">Log Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-20 lg:ml-72 p-6 lg:p-10 max-w-7xl">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'bookings' && 'My Bookings'}
              {activeTab === 'favorites' && 'Saved Homes'}
              {activeTab === 'settings' && 'Account Settings'}
            </h1>
            <p className="text-slate-500 font-medium">Welcome back, {userData?.name.split(' ')[0]}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#0065eb] flex items-center justify-center text-white font-bold text-lg">
            {userData?.name[0]}
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial="hidden" animate="visible" variants={fadeIn} className="space-y-8">
              {/* Profile Hero */}
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                
                <div className="relative w-24 h-24 rounded-full border-4 border-blue-50 overflow-hidden bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-300">
                  {userData?.photoUrl ? <Image src={userData.photoUrl} alt="Me" fill className="object-cover" /> : userData?.name[0]}
                </div>
                
                <div className="flex-1 text-center md:text-left z-10">
                   <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                      <h2 className="text-2xl font-bold">{userData?.name}</h2>
                      <span className="bg-blue-100 text-[#0065eb] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {userData?.role === 'user' ? 'Member' : userData?.role}
                      </span>
                   </div>
                   <p className="text-slate-500 font-medium">{userData?.email}</p>
                   <p className="text-slate-400 text-sm mt-1">{userData?.phoneNumber || 'No phone linked'}</p>
                </div>

                <button onClick={() => setActiveTab('settings')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors z-10">
                  Edit Profile
                </button>
              </div>

              {/* Admin / Special Panels */}
              {(userData?.role === 'admin' || userData?.role === 'reagent' || userData?.role === 'hoadmin') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {userData.role === 'admin' && <AdminCard title="Admin Dashboard" icon={ShieldCheck} color="bg-purple-500" />}
                   {userData.role === 'reagent' && <AdminCard title="Agent Dashboard" icon={Briefcase} color="bg-emerald-500" />}
                   {userData.role === 'hoadmin' && <AdminCard title="Hotel Management" icon={Building2} color="bg-orange-500" />}
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <QuickAction icon={Wallet} label="Wallet" color="text-blue-600" bg="bg-blue-50" />
                 <QuickAction icon={MessageSquare} label="Chats" color="text-indigo-600" bg="bg-indigo-50" />
                 <QuickAction icon={Calendar} label="Bookings" color="text-orange-600" bg="bg-orange-50" onClick={() => setActiveTab('bookings')} />
                 <QuickAction icon={Heart} label="Favorites" color="text-pink-600" bg="bg-pink-50" onClick={() => setActiveTab('favorites')} />
              </div>
            </motion.div>
          )}

          {/* --- TAB: BOOKINGS --- */}
          {activeTab === 'bookings' && (
            <motion.div key="bookings" initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              {bookings.length === 0 ? (
                <EmptyState icon={Calendar} title="No Bookings Yet" desc="Your upcoming stays will appear here." />
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0065eb]">
                          <Building2 size={24} />
                       </div>
                       <div>
                          <h3 className="font-bold text-lg text-slate-900">{booking.hotelName}</h3>
                          <p className="text-slate-500 text-sm font-medium flex items-center gap-1">
                             <span className="text-slate-900">{booking.roomName}</span> • 
                             {new Date(booking.checkInDate.toDate()).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                       <StatusBadge status={booking.paymentStatus} />
                       <div className="text-right">
                          <p className="text-xl font-black text-[#0065eb]">${booking.totalAmount}</p>
                          <p className="text-xs text-slate-400 font-bold uppercase">Total Paid</p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* --- TAB: FAVORITES --- */}
          {activeTab === 'favorites' && (
             <motion.div key="favorites" initial="hidden" animate="visible" variants={fadeIn}>
                {favorites.length === 0 ? (
                   <EmptyState icon={Heart} title="No Favorites" desc="Properties you like will show up here." />
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Mapping favorites logic would go here similar to property cards */}
                   </div>
                )}
             </motion.div>
          )}

          {/* --- TAB: SETTINGS (Edit Profile) --- */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial="hidden" animate="visible" variants={fadeIn} className="max-w-2xl">
               <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-bold">Personal Information</h3>
                     <button 
                       onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                       className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isEditing ? 'bg-[#0065eb] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                     >
                       {isEditing ? <><Save size={16}/> Save Changes</> : <><Edit2 size={16}/> Edit</>}
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup 
                          label="Full Name" 
                          value={editForm.name} 
                          disabled={!isEditing} 
                          onChange={(e: { target: { value: any; }; }) => setEditForm({...editForm, name: e.target.value})} 
                        />
                        <InputGroup 
                          label="Phone Number" 
                          value={editForm.phone} 
                          disabled={!isEditing} 
                          onChange={(e: { target: { value: any; }; }) => setEditForm({...editForm, phone: e.target.value})} 
                        />
                     </div>
                     <InputGroup label="Email Address" value={userData?.email || ''} disabled={true} />
                     <InputGroup label="User ID" value={userData?.uid || ''} disabled={true} />
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

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-[#0065eb] text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'} />
    <span className={`font-bold text-sm hidden lg:block ${active ? 'text-white' : ''}`}>{label}</span>
  </button>
);

const QuickAction = ({ icon: Icon, label, color, bg, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3">
    <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center ${color}`}>
       <Icon size={24} />
    </div>
    <span className="font-bold text-slate-700 text-sm">{label}</span>
  </button>
);

const AdminCard = ({ title, icon: Icon, color }: any) => (
  <div className={`${color} p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group cursor-pointer hover:brightness-110 transition-all`}>
     <div className="relative z-10 flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
           <Icon size={24} />
        </div>
        <span className="font-bold text-lg">{title}</span>
     </div>
     <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
  </div>
);

const InputGroup = ({ label, value, disabled, onChange }: any) => (
  <div className="space-y-2">
     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
     <input 
       type="text" 
       value={value} 
       disabled={disabled}
       onChange={onChange}
       className={`w-full p-4 rounded-xl font-bold text-slate-900 border ${disabled ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
     />
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
   const styles = {
     paid: 'bg-emerald-100 text-emerald-700',
     confirmed: 'bg-emerald-100 text-emerald-700',
     pending: 'bg-amber-100 text-amber-700',
     cancelled: 'bg-red-100 text-red-700'
   }[status.toLowerCase()] || 'bg-slate-100 text-slate-600';

   return (
     <span className={`${styles} px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider`}>
       {status}
     </span>
   );
};

const EmptyState = ({ icon: Icon, title, desc }: any) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
     <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
        <Icon size={40} />
     </div>
     <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
     <p className="text-slate-500 max-w-sm">{desc}</p>
  </div>
);