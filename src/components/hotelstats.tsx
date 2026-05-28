'use client';

import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot 
} from 'firebase/firestore';
import { db } from '../app/lib/firebase'; // Adjust path if needed
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  Eye, Users, CalendarCheck, DollarSign, Activity, Target, 
  BedDouble, TrendingUp, ArrowUpRight, MessageSquare, Phone, Send
} from 'lucide-react';
import { format, subDays } from 'date-fns';

// --- STYLING CONSTANTS ---
const COLORS = ['#0065eb', '#10B981', '#F59E0B', '#8B5CF6'];
const PIE_COLORS = {
  'WhatsApp': '#25D366',
  'Direct Call': '#10B981',
  'In-App Chat': '#0065eb',
  'Other': '#94a3b8'
};

interface HotelAnalyticsProps {
  hotelId: string;
}

interface HotelAnalyticsState {
  totalViews: number;
  totalInquiries: number;
  totalBookings: number;
  totalRevenue: number;
  viewsTimeline: { date: string; views: number }[];
  inquiryDistribution: { name: string; value: number }[];
  roomPopularity: { name: string; bookings: number }[];
}

export default function HotelAnalytics({ hotelId }: HotelAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HotelAnalyticsState>({
    totalViews: 0,
    totalInquiries: 0,
    totalBookings: 0,
    totalRevenue: 0,
    viewsTimeline: [],
    inquiryDistribution: [],
    roomPopularity: []
  });

  useEffect(() => {
    if (!hotelId) return;

    let unsubAnalytics = () => {};
    let unsubBookings = () => {};

    // --- 1. REAL-TIME ANALYTICS LISTENER (Views & Clicks from Flutter) ---
    const qAnalytics = query(collection(db, 'analytics_views'), where('hotelId', '==', hotelId));
    unsubAnalytics = onSnapshot(qAnalytics, (snap) => {
      let views = 0;
      let whatsappClicks = 0;
      let callClicks = 0;
      let chatClicks = 0;
      
      const timelineData: Record<string, number> = {};
      
      // Initialize last 7 days to 0
      Array.from({ length: 7 }).forEach((_, i) => {
        timelineData[format(subDays(new Date(), 6 - i), 'MMM dd')] = 0;
      });

      snap.docs.forEach(doc => {
        const d = doc.data();
        const eventType = d.type;
        const dateStr = d.timestamp ? format(d.timestamp.toDate(), 'MMM dd') : null;

        if (eventType === 'view_hotel') {
          views++;
          if (dateStr && timelineData[dateStr] !== undefined) {
             timelineData[dateStr] += 1;
          }
        } else if (eventType === 'click_whatsapp') {
          whatsappClicks++;
        } else if (eventType === 'click_call') {
          callClicks++;
        } else if (eventType === 'click_chat') {
          chatClicks++;
        }
      });

      // Format for Recharts
      const realTimeline = Object.keys(timelineData).map(date => ({
        date, 
        views: timelineData[date] 
      }));

      const inquiryDist = [
        { name: 'WhatsApp', value: whatsappClicks },
        { name: 'Direct Call', value: callClicks },
        { name: 'In-App Chat', value: chatClicks },
      ].filter(item => item.value > 0); // Only show methods that have clicks

      // --- 2. REAL-TIME BOOKINGS LISTENER (Revenue & Room Popularity) ---
      const qBookings = query(collection(db, 'bookings'), where('hotelId', '==', hotelId));
      unsubBookings = onSnapshot(qBookings, (bookingSnap) => {
        let revenue = 0;
        let bookingsCount = 0;
        const roomCounts: Record<string, number> = {};

        bookingSnap.docs.forEach(doc => {
          const b = doc.data();
          
          // Only count revenue for valid, non-cancelled bookings
          if (['confirmed', 'checked-in', 'checked-out'].includes(b.status)) {
             revenue += (b.totalPrice || 0);
             bookingsCount++;
             
             // Track which rooms are most popular
             const rName = b.roomName || 'Unknown Room';
             roomCounts[rName] = (roomCounts[rName] || 0) + 1;
          }
        });

        // Sort rooms by popularity for the bar chart
        const topRooms = Object.keys(roomCounts)
          .map(k => ({ name: k, bookings: roomCounts[k] }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 5); // Top 5 rooms

        setData({
          totalViews: views,
          totalInquiries: whatsappClicks + callClicks + chatClicks,
          totalBookings: bookingsCount,
          totalRevenue: revenue,
          viewsTimeline: realTimeline,
          inquiryDistribution: inquiryDist,
          roomPopularity: topRooms
        });
        
        setLoading(false);
      });
    });

    return () => {
      unsubAnalytics();
      unsubBookings();
    };
  }, [hotelId]);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0065eb] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">Syncing Live Analytics...</p>
      </div>
    );
  }

  const conversionRate = data.totalViews > 0 
    ? ((data.totalBookings / data.totalViews) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* --- KPI GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Profile Views" value={data.totalViews.toLocaleString()} icon={Eye} color="blue" />
        <StatCard title="Contact Inquiries" value={data.totalInquiries.toLocaleString()} icon={Phone} color="amber" />
        <StatCard title="Confirmed Bookings" value={data.totalBookings.toLocaleString()} icon={CalendarCheck} color="emerald" />
        <StatCard title="Total Revenue" value={`$${data.totalRevenue.toLocaleString()}`} icon={DollarSign} color="purple" />
      </div>

      {/* --- MAIN CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Exposure Velocity Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
                <Activity size={24} className="text-[#0065eb]" /> 7-Day Traffic Velocity
              </h3>
              <p className="text-sm text-slate-400 font-bold mt-1">Live views driven by GuriUp searches</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
               <TrendingUp className="text-emerald-500" size={20} />
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Conversion</p>
                  <p className="font-black text-slate-900 leading-none">{conversionRate}%</p>
               </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.viewsTimeline}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0065eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0065eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dx={-10} />
                <RechartsTooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '12px'}} 
                  itemStyle={{fontWeight: 900, color: '#0065eb'}}
                />
                <Area type="monotone" dataKey="views" stroke="#0065eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2">
            <Target size={20} className="text-emerald-500" /> Inquiry Sources
          </h3>
          
          <div className="flex-1 min-h-[220px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.inquiryDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {data.inquiryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || COLORS[0]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-slate-900">{data.totalInquiries}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads</span>
            </div>
          </div>

          <div className="space-y-3 mt-6 border-t border-slate-50 pt-6">
            {data.inquiryDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: PIE_COLORS[item.name as keyof typeof PIE_COLORS] || COLORS[0]}}></div>
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}</span>
              </div>
            ))}
            {data.inquiryDistribution.length === 0 && (
              <p className="text-center text-sm font-bold text-slate-400 py-4">No inquiries tracked yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- ROOM PERFORMANCE BAR CHART --- */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 text-lg mb-8 flex items-center gap-2">
          <BedDouble size={20} className="text-purple-500" /> Room Performance (Confirmed Bookings)
        </h3>
        {data.roomPopularity.length > 0 ? (
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.roomPopularity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9', radius: 8}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="bookings" fill="#8B5CF6" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl">
             Not enough booking data to chart room performance yet.
          </div>
        )}
      </div>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
        <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
      </div>
    </div>
  );
}