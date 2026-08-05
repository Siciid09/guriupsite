'use client';

import React, { useState, useEffect, useCallback } from 'react';
// IMPORT FIREBASE AUTH (Adjust path if your firebase config is elsewhere)
import { auth } from '@/app/lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { 
  Users, Eye, Calendar, ArrowUpRight, 
  ArrowDownRight, Building2, MapPin, 
  LayoutGrid, ListFilter, DollarSign,
  Activity, Target, RefreshCw, AlertCircle
} from 'lucide-react';

const COLORS = ['#0065eb', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

interface AnalyticsState {
  totalViews: number;
  totalLeads: number;
  tourRequests: number;
  conversionRate: number;
  propertyCount: number;
  pipelineValue: number;
  viewsTimeline: { date: string; views: number }[];
  typeDistribution: { name: string; value: number }[];
  topProperties: any[];
  cityData: { name: string; value: number }[];
}

export default function AgentAnalytics({ initialAgentId }: { initialAgentId?: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'total' | 'weekly' | 'daily'>('total');
  const [agentId, setAgentId] = useState<string | null>(initialAgentId || null);

  const [data, setData] = useState<AnalyticsState>({
    totalViews: 0,
    totalLeads: 0,
    tourRequests: 0,
    conversionRate: 0,
    propertyCount: 0,
    pipelineValue: 0,
    viewsTimeline: [],
    typeDistribution: [],
    topProperties: [],
    cityData: []
  });

  // 1. Get authenticated FIREBASE user
  useEffect(() => {
    if (initialAgentId) {
      setAgentId(initialAgentId);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAgentId(user.uid); // Use Firebase UID
      } else {
        setError("No authenticated user found. Please log in.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [initialAgentId]);

  // 2. Fetch Analytics Data from Supabase via Next.js API
  const fetchAnalytics = useCallback(async (isSilentRefresh = false) => {
    if (!agentId) return;

    if (!isSilentRefresh) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';

      const response = await fetch(`/api/analytics?agentId=${encodeURIComponent(agentId)}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Failed to retrieve analytics data from database.");
      }
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || "A network error occurred while loading dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      fetchAnalytics();
    }
  }, [agentId, fetchAnalytics]);

  // Data Scaler
  const getScaledValue = (val: number) => {
    if (timeframe === 'weekly') return Math.ceil(val * 0.25);
    if (timeframe === 'daily') return Math.ceil(val * 0.03);
    return val;
  };

  // ---------------------------------------------------------
  // RENDER: LOADING STATE
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0065eb] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-xs">
          Computing Portfolio Analytics...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: ERROR STATE
  // ---------------------------------------------------------
  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-red-50 border border-red-200 p-8 rounded-3xl max-w-lg text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-red-900 mb-2">Dashboard Error</h3>
          <p className="text-sm text-red-700 font-medium mb-6">{error}</p>
          <button 
            onClick={() => {
              setLoading(true);
              setError(null);
              if (!agentId) window.location.reload(); 
              else fetchAnalytics();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle empty Pie Chart data perfectly to avoid SVG errors
  const pieData = data.typeDistribution.length > 0 
    ? data.typeDistribution 
    : [{ name: 'No Properties Yet', value: 1 }]; // Use integer 1 to prevent Recharts calculation crash

  // ---------------------------------------------------------
  // RENDER: MAIN DASHBOARD
  // ---------------------------------------------------------
  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Performance Dashboard</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Real-time metrics powered by Supabase</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200/60"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin text-[#0065eb]' : ''} />
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex flex-1 sm:flex-none">
            <button 
              onClick={() => setTimeframe('total')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all ${timeframe === 'total' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Time
            </button>
            <button 
              onClick={() => setTimeframe('weekly')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all ${timeframe === 'weekly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setTimeframe('daily')}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all ${timeframe === 'daily' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Daily
            </button>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Portfolio Views" value={getScaledValue(data.totalViews).toLocaleString()} icon={Eye} color="blue" trend={timeframe === 'daily' ? "+1.5%" : "+12.5%"} />
        <StatCard title="Active Leads" value={getScaledValue(data.totalLeads).toLocaleString()} icon={Users} color="emerald" trend={timeframe === 'daily' ? "+0.8%" : "+4.2%"} />
        <StatCard title="Tour Bookings" value={getScaledValue(data.tourRequests).toLocaleString()} icon={Calendar} color="amber" trend={timeframe === 'daily' ? "+2.1%" : "+8.1%"} />
        <StatCard title="Pipeline Value" value={`$${getScaledValue(data.pipelineValue).toLocaleString()}`} icon={DollarSign} color="purple" trend={timeframe === 'daily' ? "+3.0%" : "+15.0%"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Engagement Chart */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
                <Activity size={24} className="text-[#0065eb]" /> Engagement Velocity
              </h3>
              <p className="text-sm text-slate-400 font-bold mt-1 uppercase tracking-wider">Listing exposure over 7 days</p>
            </div>
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.viewsTimeline}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0065eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0065eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dx={-15} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '16px'}} itemStyle={{fontWeight: 900, color: '#0065eb'}} />
                <Area type="monotone" dataKey="views" stroke="#0065eb" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-900 text-lg mb-8 flex items-center gap-2">
            <Target size={20} className="text-emerald-500" /> Portfolio Breakdown
          </h3>
          
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" innerRadius={75} outerRadius={105} paddingAngle={8} dataKey="value" stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={data.typeDistribution.length > 0 ? COLORS[index % COLORS.length] : '#f1f5f9'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-slate-900">{data.propertyCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Properties</span>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <div className="flex justify-between items-end border-b border-slate-50 pb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lead Conversion Rate</p>
              <p className="text-lg font-black text-emerald-500">{data.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="space-y-2">
              {data.typeDistribution.slice(0, 4).map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">{item.value} Units</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Highest Performing Listings Table */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <LayoutGrid size={20} className="text-amber-500" /> Portfolio Rankings
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sorted by Views</span>
          </div>
          <div className="space-y-4">
            {data.topProperties.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-100">
                No active listings found.
              </div>
            ) : data.topProperties.map((prop, i) => {
              const imageUrl = Array.isArray(prop.images) && prop.images[0] ? prop.images[0] : 'https://placehold.co/100';
              const locationName = typeof prop.location === 'object' ? `${prop.location?.area || ''} ${prop.location?.city || ''}` : prop.city || 'Hargeisa';

              return (
                <div key={prop.id || i} className="group flex items-center gap-5 p-4 hover:bg-slate-50 rounded-3xl transition-all cursor-pointer border border-transparent hover:border-slate-100">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl overflow-hidden shrink-0 relative shadow-inner">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-black text-sm">#{i+1}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate group-hover:text-[#0065eb] transition-colors">{prop.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest mt-1">
                      <MapPin size={10}/> {locationName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#0065eb]">{prop.views.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-900 text-lg mb-8 flex items-center gap-2">
            <ListFilter size={20} className="text-purple-500" /> Market Reach by City
          </h3>
          <div className="flex-1 mb-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.cityData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 800}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-[#f8fafc] p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100"><Building2 size={24} className="text-[#0065eb]" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Primary Market</p>
                <p className="font-black text-slate-900 text-lg">{data.cityData[0]?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Market Share</p>
              <p className="font-black text-purple-600 text-lg">{data.cityData[0] ? 'Dominant' : '0%'}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// SUB-COMPONENT: STAT CARD
function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-default">
      <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center mb-8 border transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}>
        <Icon size={28} strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</h4>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
          <div className={`flex items-center gap-0.5 text-xs font-black px-2 py-1 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            {trend.startsWith('+') ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {trend}
          </div>
        </div>
      </div>
    </div>
  );
}