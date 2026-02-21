'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, getDoc, setDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, storage } from '../../..///lib/firebase'; // Adjust to your actual path
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  LayoutDashboard, Building, MessageSquare, Calendar as CalendarIcon, 
  TrendingUp, User, LogOut, Bell, Search, Filter, MoreVertical, 
  CheckCircle, XCircle, Clock, Phone, MapPin, Zap, Lock, Camera, 
  Send, CheckCircle2, ChevronRight, Briefcase, Globe, ShieldCheck,
  Star, ArrowUpRight, ArrowDownRight, RefreshCw, X, Eye, PieChart as PieChartIcon
} from 'lucide-react';

// --- IMPORT THE PROPERTY MANAGER ---
// Adjust this path to where you saved the previous property management file
import CompletePropertyManagement from '../../../..//components/AgentPropertyManagement';

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

interface AgentProfile {
  uid: string;
  name: string;
  agencyName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  bio: string;
  city: string;
  planTier: 'free' | 'pro' | 'premium' | 'agent_pro';
  profileImageUrl: string;
  coverImageUrl: string;
  githubUsername?: string; 
  isVerified: boolean;
  createdAt: any;
}

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: Record<string, number>;
  otherUser: { id: string; name: string; avatar: string };
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  isRead: boolean;
}

interface TourRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  userId: string;
  userName: string;
  userPhone: string;
  agentId: string;
  date: string;
  time: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  timestamp: any;
}

interface AnalyticsData {
  totalViews: number;
  totalLeads: number;
  totalTours: number;
  pipelineValue: number;
  conversionRate: number;
  viewsTimeline: { date: string; views: number }[];
  propertyTypes: { name: string; value: number }[];
  cityReach: Record<string, number>;
  topAssets: { id: string; name: string; views: number; image: string }[];
}

type TabMode = 'overview' | 'properties' | 'inbox' | 'bookings' | 'analytics' | 'settings';

const COLORS = ['#0065eb', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

// ============================================================================
// 2. MAIN DASHBOARD COMPONENT
// ============================================================================

export default function SuperAgentDashboard() {
  const router = useRouter();

  // --- GLOBAL STATE ---
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- REALTIME DATA STATE ---
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [tourFilter, setTourFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalViews: 0, totalLeads: 0, totalTours: 0, pipelineValue: 0, conversionRate: 0,
    viewsTimeline: [], propertyTypes: [], cityReach: {}, topAssets: []
  });

  const isPro = ['pro', 'premium', 'agent_pro'].includes(profile?.planTier || 'free');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // 3. AUTH & REALTIME LISTENERS (THE ENGINE)
  // ============================================================================

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchProfile(user.uid);
        setupRealtimeListeners(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubAuth();
  }, [router]);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          uid,
          name: d.name || 'Agent',
          agencyName: d.agencyName || 'Independent',
          email: d.email || 'abdulrazaqj59@gmail.com', // Default fallback
          phone: d.phone || '',
          whatsappNumber: d.whatsappNumber || '',
          bio: d.bio || '',
          city: d.city || 'Hargeisa', // Localized default
          planTier: d.planTier || 'free',
          profileImageUrl: d.profileImageUrl || d.photoUrl || '',
          coverImageUrl: d.coverImageUrl || '',
          githubUsername: d.githubUsername || 'Biggieki',
          isVerified: d.isVerified || false,
          createdAt: d.createdAt,
        });
      }
    } catch (e) { console.error("Profile fetch error", e); }
  };

  const setupRealtimeListeners = (uid: string) => {
    setIsLoading(true);

    // 1. Listen to Chats
    const qChats = query(collection(db, 'chats'), where('participants', 'array-contains', uid), orderBy('lastMessageTime', 'desc'));
    const unsubChats = onSnapshot(qChats, (snap) => {
      const chatData = snap.docs.map(doc => {
        const d = doc.data();
        const otherParticipantId = d.participants.find((p: string) => p !== uid) || 'unknown';
        return {
          id: doc.id,
          participants: d.participants,
          lastMessage: d.lastMessage || '',
          lastMessageTime: d.lastMessageTime,
          unreadCount: d.unreadCount || {},
          otherUser: { 
            id: otherParticipantId, 
            name: d.otherUserName || 'Client', 
            avatar: d.otherUserAvatar || '' 
          }
        } as ChatRoom;
      });
      setChats(chatData);
    });

    // 2. Listen to Tour Requests (Bookings)
    const qTours = query(collection(db, 'tour_requests'), where('agentId', '==', uid), orderBy('timestamp', 'desc'));
    const unsubTours = onSnapshot(qTours, (snap) => {
      const tours = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TourRequest));
      setTourRequests(tours);
    });

    // 3. Aggregate Heavy Analytics (Listening to properties)
    const qProps = query(collection(db, 'property'), where('agentId', '==', uid));
    const unsubProps = onSnapshot(qProps, (snap) => {
      let views = 0;
      const typesMap: Record<string, number> = {};
      const cityMap: Record<string, number> = {};
      const assetsList: any[] = [];

      snap.docs.forEach(doc => {
        const d = doc.data();
        const v = d.views || 0;
        views += v;
        
        const type = d.propertyType || 'Other';
        typesMap[type] = (typesMap[type] || 0) + 1;

        const city = d.location?.city || 'Hargeisa';
        cityMap[city] = (cityMap[city] || 0) + 1;

        assetsList.push({ id: doc.id, name: d.title || 'Listing', views: v, image: d.images?.[0] || '' });
      });

      assetsList.sort((a, b) => b.views - a.views);

      // Generate mock timeline based on total views for visual flair
      const timeline = Array.from({length: 7}).map((_, i) => ({
        date: format(new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
        views: Math.floor((views / 7) * (0.5 + Math.random())) // Simulated distribution
      }));

      setAnalytics(prev => ({
        ...prev,
        totalViews: views,
        propertyTypes: Object.keys(typesMap).map(k => ({ name: k, value: typesMap[k] })),
        cityReach: cityMap,
        topAssets: assetsList.slice(0, 4),
        viewsTimeline: timeline,
      }));
      setIsLoading(false);
    });

    return () => { unsubChats(); unsubTours(); unsubProps(); };
  };

  // Listen to Active Chat Messages
  useEffect(() => {
    if (!activeChatId) return;
    const qMsgs = query(collection(db, `chats/${activeChatId}/messages`), orderBy('timestamp', 'asc'));
    const unsubMsgs = onSnapshot(qMsgs, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Clear unread count
      if (currentUser?.uid) {
        updateDoc(doc(db, 'chats', activeChatId), { [`unreadCount.${currentUser.uid}`]: 0 });
      }
    });
    return () => unsubMsgs();
  }, [activeChatId, currentUser]);

  // Recalculate derived analytics when leads/tours update
  useEffect(() => {
    const leadsCount = chats.length;
    const toursCount = tourRequests.length;
    const pipeline = leadsCount * 350; // Dynamic est value
    const convRate = analytics.totalViews > 0 ? (leadsCount / analytics.totalViews) * 100 : 0;
    
    setAnalytics(prev => ({
      ...prev, totalLeads: leadsCount, totalTours: toursCount, 
      pipelineValue: pipeline, conversionRate: convRate
    }));
  }, [chats, tourRequests, analytics.totalViews]);


  // ============================================================================
  // 4. ACTION HANDLERS
  // ============================================================================

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !currentUser) return;
    
    const msgText = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      const chatRef = doc(db, 'chats', activeChatId);
      const chatDoc = await getDoc(chatRef);
      const otherId = chatDoc.data()?.participants.find((p: string) => p !== currentUser.uid);

      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        text: msgText,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        isRead: false
      });

      await updateDoc(chatRef, {
        lastMessage: msgText,
        lastMessageTime: serverTimestamp(),
        // Increment unread for the OTHER user
        [`unreadCount.${otherId}`]: (chatDoc.data()?.unreadCount?.[otherId] || 0) + 1
      });
    } catch (err) { console.error("Message send failed", err); }
  };

  const updateTourStatus = async (tourId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tour_requests', tourId), { status: newStatus });
    } catch (err) { console.error("Status update failed", err); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // ============================================================================
  // 5. RENDERERS: OVERVIEW (THE COMMAND CENTER)
  // ============================================================================
  const renderOverview = () => {
    const pendingTours = tourRequests.filter(t => t.status === 'pending');
    const recentActivity = [...tourRequests.slice(0, 3)]; // Simplified for space

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0065eb] opacity-20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="text-blue-400 font-bold tracking-widest text-xs mb-2 uppercase flex items-center gap-2">
                <ShieldCheck size={16}/> {profile?.isVerified ? 'Verified Agent' : 'Agent Dashboard'}
              </p>
              <h1 className="text-3xl md:text-4xl font-black mb-2">Welcome back, {profile?.name.split(' ')[0]}</h1>
              <p className="text-slate-400 font-medium">You have <strong className="text-white">{pendingTours.length} pending tour requests</strong> requiring your attention today.</p>
            </div>
            {!isPro && (
              <button onClick={() => setActiveTab('settings')} className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2">
                <Zap size={18} fill="currentColor" /> Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Core KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Reach" value={analytics.totalViews.toLocaleString()} icon={Globe} color="blue" trend="+12%" />
          <StatCard title="Active Leads" value={analytics.totalLeads} icon={MessageSquare} color="emerald" trend="+5%" />
          <StatCard title="Tour Requests" value={analytics.totalTours} icon={CalendarIcon} color="purple" trend="Steady" />
          <StatCard title="Est. Pipeline" value={`$${analytics.pipelineValue.toLocaleString()}`} icon={Briefcase} color="amber" isCurrency locked={!isPro} />
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-slate-900 text-lg">Engagement Velocity</h3>
              <select className="bg-slate-50 border-none text-sm font-bold text-slate-600 rounded-xl px-4 py-2 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full relative">
              {!isPro && (
                <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                  <Lock className="text-amber-500 mb-3" size={32} />
                  <p className="font-bold text-slate-900 mb-4">Pro Feature</p>
                  <button onClick={() => setActiveTab('settings')} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold">Unlock Analytics</button>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.viewsTimeline}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0065eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0065eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dx={-10} />
                  <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="views" stroke="#0065eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Activity & Pending */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Bell className="text-blue-500" size={18}/> Action Required</h3>
              {pendingTours.length > 0 ? (
                <div className="space-y-4">
                  {pendingTours.slice(0, 3).map(tour => (
                    <div key={tour.id} className="p-4 bg-slate-50 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{tour.userName}</p>
                          <p className="text-xs text-slate-500 font-medium">Requested a tour for</p>
                          <p className="text-xs font-bold text-blue-600 truncate max-w-[150px]">{tour.propertyName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{tour.date}</p>
                          <p className="text-[10px] font-bold text-slate-400">{tour.time}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button onClick={() => updateTourStatus(tour.id, 'approved')} className="bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-600">Approve</button>
                        <button onClick={() => updateTourStatus(tour.id, 'cancelled')} className="bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-300">Decline</button>
                      </div>
                    </div>
                  ))}
                  {pendingTours.length > 3 && (
                    <button onClick={() => setActiveTab('bookings')} className="w-full text-center text-xs font-bold text-blue-600 py-2">View all {pendingTours.length} requests</button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-100" />
                  <p className="text-sm font-bold">All caught up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 6. RENDERERS: INBOX (REALTIME CHAT)
  // ============================================================================
  const renderInbox = () => {
    const activeChat = chats.find(c => c.id === activeChatId);

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex animate-in fade-in duration-500">
        
        {/* Left: Chat List */}
        <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search clients..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {chats.length === 0 ? (
              <p className="text-center text-slate-400 text-sm mt-10">No messages yet.</p>
            ) : chats.map(chat => {
              const unread = currentUser ? chat.unreadCount?.[currentUser.uid] || 0 : 0;
              const isActive = activeChatId === chat.id;
              let timeStr = '';
              if (chat.lastMessageTime?.toDate) {
                const date = chat.lastMessageTime.toDate();
                timeStr = isToday(date) ? format(date, 'h:mm a') : isYesterday(date) ? 'Yesterday' : format(date, 'MMM d');
              }

              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex gap-4 items-center ${isActive ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className="relative">
                    {chat.otherUser.avatar ? (
                      <img src={chat.otherUser.avatar} className="w-12 h-12 rounded-full object-cover bg-slate-200" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-black text-lg">
                        {chat.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">{unread}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`text-sm truncate ${unread > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{chat.otherUser.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400">{timeStr}</span>
                    </div>
                    <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>{chat.lastMessage || 'Started a conversation'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Chat Room */}
        <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 bg-slate-100 rounded-full text-slate-600"><ChevronRight className="rotate-180" size={20}/></button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                      {activeChat.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{activeChat.otherUser.name}</h3>
                      <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online / Active Lead</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"><Phone size={18}/></button>
                  <button className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"><MoreVertical size={18}/></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === currentUser?.uid;
                  let time = '';
                  if (msg.timestamp?.toDate) time = format(msg.timestamp.toDate(), 'h:mm a');
                  
                  // Show date separator if needed (simplified logic here)
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] md:max-w-[60%] ${isMe ? 'order-2' : 'order-1'}`}>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                          isMe 
                            ? 'bg-[#0065eb] text-white rounded-tr-sm' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`mt-1.5 text-[10px] font-bold text-slate-400 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {time} {isMe && <CheckCircle2 size={10} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <button type="button" className="p-3 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 rounded-xl"><Camera size={20}/></button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..." 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="bg-[#0065eb] disabled:bg-slate-300 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#0052c1] transition-all shadow-md shadow-blue-500/20"
                  >
                    <Send size={16} /> <span className="hidden md:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Your Inbox</h3>
              <p className="font-medium">Select a conversation from the left to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // 7. RENDERERS: BOOKINGS / TOURS
  // ============================================================================
  const renderBookings = () => {
    const filteredTours = tourFilter === 'all' ? tourRequests : tourRequests.filter(t => t.status === tourFilter);

    const getStatusStyle = (status: string) => {
      switch(status) {
        case 'pending': return 'bg-amber-100 text-amber-700';
        case 'approved': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-emerald-100 text-emerald-700';
        case 'cancelled': return 'bg-rose-100 text-rose-700';
        default: return 'bg-slate-100 text-slate-700';
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-black text-slate-900">Tour & Viewing Schedule</h2>
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex text-sm font-bold shadow-sm">
            {['all', 'pending', 'approved', 'completed'].map(f => (
              <button 
                key={f} onClick={() => setTourFilter(f as any)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${tourFilter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Client Details</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Property Target</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTours.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No tour requests found for this filter.</td></tr>
                ) : filteredTours.map(tour => (
                  <tr key={tour.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <p className="font-black text-slate-900 text-sm mb-1">{tour.userName}</p>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={10}/> {tour.userPhone}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-bold text-blue-600 text-sm cursor-pointer hover:underline">{tour.propertyName}</p>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-slate-900 text-sm flex items-center gap-1.5 mb-1"><CalendarIcon size={14} className="text-blue-500"/> {tour.date}</p>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><Clock size={12}/> {tour.time}</p>
                    </td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusStyle(tour.status)}`}>
                        {tour.status}
                      </span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      {tour.status === 'pending' && (
                        <>
                          <button onClick={() => updateTourStatus(tour.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Approve"><CheckCircle size={18}/></button>
                          <button onClick={() => updateTourStatus(tour.id, 'cancelled')} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100" title="Decline"><XCircle size={18}/></button>
                        </>
                      )}
                      {tour.status === 'approved' && (
                        <button onClick={() => updateTourStatus(tour.id, 'completed')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 shadow-sm">Mark Done</button>
                      )}
                      <a href={`https://wa.me/${tour.userPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366]/20" title="WhatsApp">
                        <MessageSquare size={18}/>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 8. RENDERERS: ADVANCED ANALYTICS
  // ============================================================================
  const renderAnalyticsTab = () => {
    if (!isPro) {
      return (
        <div className="relative bg-white rounded-3xl border border-slate-100 p-10 min-h-[600px] flex flex-col items-center justify-center text-center overflow-hidden animate-in zoom-in-95">
          <div className="absolute inset-0 bg-slate-50 opacity-50 blur-[2px] bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
          <div className="relative z-10 max-w-lg mx-auto bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-2xl border border-white">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3">
              <Lock size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Pro Analytics Engine</h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-8 text-sm">
              Stop guessing. Start knowing. Unlock hyper-detailed insights into your portfolio's performance, lead conversion funnels, and geographic reach. Designed for top-tier UI/UX and data-driven agents.
            </p>
            <button onClick={() => setActiveTab('settings')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:scale-105 transition-all w-full text-lg">
              Unlock Premium Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <h2 className="text-2xl font-black text-slate-900">Advanced Intelligence Hub</h2>
        
        {/* Row 1: Funnel & Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Conversion Funnel */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2"><Filter className="text-blue-500" size={20}/> Acquisition Funnel</h3>
            <div className="space-y-6">
              <FunnelStep label="Total Listing Views" value={analytics.totalViews} percentage={100} color="bg-blue-100" />
              <FunnelStep label="Interested Leads" value={analytics.totalLeads} percentage={analytics.conversionRate} color="bg-blue-400" />
              <FunnelStep label="Tour Conversions" value={analytics.totalTours} percentage={analytics.totalLeads > 0 ? (analytics.totalTours/analytics.totalLeads)*100 : 0} color="bg-blue-600" />
            </div>
          </div>

          {/* Portfolio Mix */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2"><PieChartIcon className="text-purple-500" size={20}/> Portfolio Distribution</h3>
            <div className="flex-1 flex items-center justify-center min-h-[250px]">
              {analytics.propertyTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.propertyTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {analytics.propertyTypes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 font-bold text-sm">No property data available.</p>
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {analytics.propertyTypes.map((type, i) => (
                <div key={type.name} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span> {type.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Top Assets */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2"><Star className="text-amber-500" size={20}/> Top Performing Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {analytics.topAssets.length === 0 ? (
              <p className="text-slate-400 col-span-full">Upload properties to see rankings.</p>
            ) : analytics.topAssets.map((asset, i) => (
              <div key={asset.id} className="relative rounded-2xl overflow-hidden border border-slate-100 group">
                <div className="h-32 bg-slate-200 relative">
                  <img src={asset.image || 'https://placehold.co/400x300'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt=""/>
                  <div className="absolute top-2 left-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full text-white flex items-center justify-center font-black text-xs border border-white/20">#{i+1}</div>
                </div>
                <div className="p-4 bg-white">
                  <h4 className="font-bold text-slate-900 text-sm truncate mb-2">{asset.name}</h4>
                  <p className="text-xs font-black text-amber-500 flex items-center gap-1"><Eye size={14}/> {asset.views.toLocaleString()} Views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const FunnelStep = ({ label, value, percentage, color }: any) => (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-black text-slate-900">{value.toLocaleString()} <span className="text-slate-400 text-xs font-bold">({percentage.toFixed(1)}%)</span></span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{width: `${Math.max(percentage, 2)}%`}}></div>
      </div>
    </div>
  );

  // ============================================================================
  // 9. RENDERERS: PROFILE & SETTINGS
  // ============================================================================
  const renderProfileSettings = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-20">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Account Settings</h2>
        
        {/* Cover & Avatar Header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
            {profile?.coverImageUrl && <img src={profile.coverImageUrl} className="w-full h-full object-cover opacity-80 mix-blend-overlay" alt="" />}
            <button className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black/60 transition-colors flex items-center gap-2">
              <Camera size={14}/> Change Cover
            </button>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-16 left-8">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-slate-100 relative overflow-hidden group">
                {profile?.profileImageUrl ? (
                  <img src={profile.profileImageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User size={60} className="text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            </div>
            
            <div className="ml-40 pt-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  {profile?.name} {profile?.isVerified && <ShieldCheck className="text-blue-500" size={20}/>}
                </h3>
                <p className="font-bold text-slate-500 text-sm">{profile?.agencyName} • {profile?.city}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-1 shadow-sm">
                  {profile?.planTier} Plan
                </span>
                {!isPro && <p className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Upgrade Now</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Forms */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          <h4 className="font-black text-slate-900 mb-6 text-lg border-b border-slate-50 pb-4">Personal Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Full Name" value={profile?.name} />
            <InputGroup label="Email Address" value={profile?.email} disabled />
            <InputGroup label="Agency Name" value={profile?.agencyName} />
            <InputGroup label="City Location" value={profile?.city} />
            <InputGroup label="WhatsApp Number" value={profile?.whatsappNumber} />
            <InputGroup label="GitHub Username" value={profile?.githubUsername} icon={Globe} />
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Professional Bio</label>
              <textarea rows={4} defaultValue={profile?.bio} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"></textarea>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end">
             <button className="bg-[#0065eb] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform flex items-center gap-2">
               Save Changes
             </button>
          </div>
        </div>
      </div>
    );
  };

  const InputGroup = ({ label, value, disabled = false, icon: Icon }: any) => (
    <div>
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>}
        <input 
          type="text" 
          defaultValue={value} 
          disabled={disabled}
          className={`w-full bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${Icon ? 'pl-11' : ''}`} 
        />
      </div>
    </div>
  );

  // ============================================================================
  // 10. MAIN LAYOUT SHELL
  // ============================================================================

  if (isLoading && !profile) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" /><h2 className="text-xl font-black text-slate-900 animate-pulse">Initializing Command Center...</h2></div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      
      {/* SIDEBAR (Desktop) */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 w-72 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <div className="w-10 h-10 bg-[#0065eb] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30 mr-3">G</div>
          <span className="text-2xl font-black tracking-tight text-slate-900">GuriUp <span className="text-blue-600">Pro</span></span>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto p-2"><X size={20}/></button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          <NavItem icon={LayoutDashboard} label="Overview" isActive={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setIsSidebarOpen(false);}} />
          <NavItem icon={Building} label="Property Manager" isActive={activeTab === 'properties'} onClick={() => {setActiveTab('properties'); setIsSidebarOpen(false);}} />
          <NavItem icon={MessageSquare} label="Inbox" isActive={activeTab === 'inbox'} onClick={() => {setActiveTab('inbox'); setIsSidebarOpen(false);}} badge={chats.reduce((acc, c) => acc + (c.unreadCount?.[currentUser?.uid] || 0), 0)} />
          <NavItem icon={CalendarIcon} label="Tour Bookings" isActive={activeTab === 'bookings'} onClick={() => {setActiveTab('bookings'); setIsSidebarOpen(false);}} badge={tourRequests.filter(t=>t.status==='pending').length} badgeColor="bg-amber-500" />
          
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4">Intelligence</p>
          <NavItem icon={TrendingUp} label="Analytics" isActive={activeTab === 'analytics'} onClick={() => {setActiveTab('analytics'); setIsSidebarOpen(false);}} locked={!isPro} />
          
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-8 mb-4">Configuration</p>
          <NavItem icon={User} label="Profile Settings" isActive={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setIsSidebarOpen(false);}} />
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <img src={profile?.profileImageUrl || 'https://placehold.co/100'} className="w-10 h-10 rounded-full object-cover shadow-sm bg-white" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate">{profile?.name}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{profile?.planTier}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><LogOut size={16}/></button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 transition-all duration-300 md:ml-72 flex flex-col min-h-screen`}>
        
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 bg-slate-50 rounded-xl"><LayoutDashboard size={20}/></button>
            <div className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input type="text" placeholder="Command + K to search..." className="bg-slate-50 pl-10 pr-4 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell size={18}/>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
            </button>
            <button className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors">
              <Globe size={14}/> View Live Site
            </button>
          </div>
        </header>

        {/* Dynamic Content Routing */}
        <div className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'properties' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* THE IMPORTED PROPERTY MANAGER IN ACTION */}
              <CompletePropertyManagement 
                currentUserUid={currentUser?.uid} 
                userPlan={profile?.planTier || 'free'} 
                onUpgrade={() => setActiveTab('settings')}
              />
            </div>
          )}
          {activeTab === 'inbox' && renderInbox()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'settings' && renderProfileSettings()}
        </div>
      </main>

      {/* Global Styles for Scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

// ============================================================================
// 11. REUSABLE UI COMPONENTS
// ============================================================================

const NavItem = ({ icon: Icon, label, isActive, onClick, badge, badgeColor = 'bg-rose-500', locked = false }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
      isActive 
        ? 'bg-[#0065eb] text-white shadow-xl shadow-blue-500/20' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3 relative z-10">
      <Icon size={20} className={isActive ? "opacity-100" : "opacity-50 group-hover:opacity-100 transition-opacity"} strokeWidth={isActive ? 2.5 : 2} /> 
      <span className={`text-sm ${isActive ? 'font-black' : 'font-bold'}`}>{label}</span>
    </div>
    <div className="flex items-center gap-2 relative z-10">
      {locked && <Lock size={14} className={isActive ? 'text-blue-300' : 'text-slate-300'} />}
      {badge > 0 && (
        <span className={`px-2 py-0.5 text-[10px] font-black text-white rounded-full ${isActive ? 'bg-white/20' : badgeColor}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
  </button>
);

const StatCard = ({ title, value, icon: Icon, color, trend, isCurrency = false, locked = false }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
      {locked && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center flex-col">
          <Lock size={24} className="text-amber-500 mb-2"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white px-3 py-1 rounded-full shadow-sm">Pro Only</span>
        </div>
      )}
      <div className={`w-14 h-14 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-6 border transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</h4>
      <div className="flex items-end gap-3">
        <span className={`text-3xl md:text-4xl font-black text-slate-900 tracking-tight ${isCurrency ? 'font-mono' : ''}`}>{value}</span>
        {trend && (
          <span className={`text-sm font-bold pb-1 flex items-center gap-0.5 ${trend.includes('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
            {trend.includes('+') ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>} {trend}
          </span>
        )}
      </div>
    </div>
  );
};