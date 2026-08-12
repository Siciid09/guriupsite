'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/app/lib/firebase';
import { 
  Utensils, ChefHat, Plus, Edit3, Trash2, X, Clock, 
  Loader2, Store, RefreshCw, BellRing, ClipboardList, 
  CalendarDays, Grid, BarChart3, Search, Filter, 
  CheckCircle2, Coffee, MapPin, Phone, User, DollarSign,
  ArrowLeft, CheckSquare, Square
} from 'lucide-react';

// Import your newly created forms
import RestaurantForm from './resform';
import MenuForm from './menuform';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface Restaurant {
  id?: string;
  _id?: string;
  name: string;
  cuisineType: string;
  priceLevel: string;
  status: string;
  images: string[];
  guestHoursNote?: string;
  cuisines?: string[];
  restaurantType?: string;
}

interface MenuItem {
  id?: string;
  _id?: string;
  restaurantId: string;
  name: string;
  category: string;
  price: number | null;
  isAvailable: boolean;
  prepTimeMinutes?: number | null;
  description?: string;
}

interface Order {
  id?: string;
  _id?: string;
  customerName: string;
  deliveryLocation: string; 
  orderType: 'Room Service' | 'Dine-in' | 'Takeaway' | 'Public';
  items: any[];
  notes: string;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  phone?: string;
}

export default function RestaurantManagement({ hotelId }: { hotelId: string }) {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'locations' | 'menus' | 'orders' | 'reservations' | 'kds' | 'tables' | 'analytics'>('locations');
  const [activeView, setActiveView] = useState<'dashboard' | 'resform' | 'menuform'>('dashboard');
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  
  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('All');
  const [menuSearch, setMenuSearch] = useState('');

  // ==========================================
  // API FETCHING & DATA MANAGEMENT
  // ==========================================
  const fetchData = async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const headers = { 'Authorization': `Bearer ${idToken}` };

      const [res1, res2, res3, res4, res5] = await Promise.all([
        fetch(`/api/restaurants?hotelId=${hotelId}`, { headers }).catch(() => null),
        fetch(`/api/restaurants?entity=menu_item&hotelId=${hotelId}`, { headers }).catch(() => null),
        fetch(`/api/bookings?type=food_orders&hotelId=${hotelId}`, { headers }).catch(() => null),
        fetch(`/api/bookings?type=table_reservation&hotelId=${hotelId}`, { headers }).catch(() => null),
        fetch(`/api/restaurants?entity=table&hotelId=${hotelId}`, { headers }).catch(() => null)
      ]);

      if (res1?.ok) setRestaurants(await res1.json());
      if (res2?.ok) setMenuItems(await res2.json());
      if (res3?.ok) {
        const ords = await res3.json();
        const mapped = ords.map((o: any) => ({
          ...o,
          orderType: o.orderType || (o.deliveryLocation?.toLowerCase().includes('room') ? 'Room Service' : 'Takeaway'),
          status: o.status === 'pending' ? 'new' : o.status
        }));
        setOrders(mapped);
      }
      if (res4?.ok) setReservations(await res4.json());
      if (res5?.ok) setTables(await res5.json());
    } catch (error) {
      console.error("Error fetching dining data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s for KDS/Orders
    return () => clearInterval(interval);
  }, [hotelId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const idToken = await auth.currentUser!.getIdToken();
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: orderId, hotelId, type: 'food_orders', status })
      });
      fetchData(); // Optimistic UI could be added here, but fetch ensures sync
    } catch (e) {
      alert("Failed to update order status.");
    }
  };

  const deleteEntity = async (id: string, entity: 'restaurant' | 'menu_item') => {
    if (!window.confirm(`Are you sure you want to delete this ${entity.replace('_', ' ')}?`)) return;
    try {
      const idToken = await auth.currentUser!.getIdToken();
      await fetch(`/api/restaurants?id=${id}&hotelId=${hotelId}&entity=${entity}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      fetchData();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  // ==========================================
  // VIEW HANDLERS (Switching to Forms)
  // ==========================================
  const handleOpenResForm = (id?: string) => {
    setEditingId(id);
    setActiveView('resform');
  };

  const handleOpenMenuForm = (id?: string) => {
    setEditingId(id);
    setActiveView('menuform');
  };

  const closeForms = () => {
    setActiveView('dashboard');
    setEditingId(undefined);
    fetchData(); // Refresh data in case changes were saved
  };

  // ==========================================
  // DYNAMIC ANALYTICS CALCULATIONS
  // ==========================================
  // 1. Core Metrics
  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const todayRevenue = activeOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const pendingOrders = orders.filter(o => ['new', 'preparing'].includes(o.status)).length;
  
  // 2. Revenue by Channel
  const getChanRev = (type: string) => activeOrders.filter(o => o.orderType === type).reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const roomServiceRev = getChanRev('Room Service');
  const dineInRev = getChanRev('Dine-in');
  const takeawayRev = getChanRev('Takeaway') + getChanRev('Public'); // Merging external channels

  const rsPct = todayRevenue ? Math.round((roomServiceRev / todayRevenue) * 100) : 0;
  const diPct = todayRevenue ? Math.round((dineInRev / todayRevenue) * 100) : 0;
  const taPct = todayRevenue ? Math.round((takeawayRev / todayRevenue) * 100) : 0;

  // 3. Top Selling Items Calculator
  const itemCounts: Record<string, number> = {};
  activeOrders.forEach(o => {
    (o.items || []).forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + (Number(item.quantity) || 1);
    });
  });
  
  const topItems = Object.entries(itemCounts)
    .map(([name, sold]) => ({ name, sold }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  // ==========================================
  // RENDER FORMS
  // ==========================================
  if (activeView === 'resform') {
    return (
      <div className="space-y-4 animate-in fade-in">
        <button onClick={closeForms} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <RestaurantForm hotelId={hotelId} restaurantId={editingId} onSuccess={closeForms} onCancel={closeForms} />
      </div>
    );
  }

  if (activeView === 'menuform') {
    return (
      <div className="space-y-4 animate-in fade-in">
        <button onClick={closeForms} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <MenuForm hotelId={hotelId} itemId={editingId} onSuccess={closeForms} onCancel={closeForms} />
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD RENDER
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-20">
      
      {/* HEADER & NAVIGATION */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Utensils size={24} className="text-[#0065eb] shrink-0" /> <span className="truncate">Dining Hub</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-1">Manage restaurants, menus, reservations, orders, and KDS.</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-2 shrink-0">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Sync
          </button>
        </div>

        {/* Unified Navigation Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'locations', icon: Store, label: 'Locations' },
            { id: 'menus', icon: Coffee, label: 'Menus' },
            { id: 'orders', icon: ClipboardList, label: 'Orders' },
            { id: 'reservations', icon: CalendarDays, label: 'Reservations' },
            { id: 'kds', icon: ChefHat, label: 'KDS' },
            { id: 'tables', icon: Grid, label: 'Tables' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.id === 'orders' && pendingOrders > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOrders}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUMMARY METRICS BAR - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Restaurants', value: restaurants.length, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Menu Items', value: menuItems.length, icon: Coffee, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Orders Today', value: orders.length, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Revenue Today', value: `$${todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: pendingOrders, icon: BellRing, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Reservations', value: reservations.length, icon: CalendarDays, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((metric, i) => (
          <div key={i} className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 min-w-0">
            <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${metric.bg} ${metric.color}`}>
              <metric.icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">{metric.label}</p>
              <p className="text-sm sm:text-xl font-black text-slate-900 leading-none mt-1 truncate">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading && restaurants.length === 0 ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#0065eb] w-10 h-10"/></div>
      ) : (
        <>
          {/* ================= TAB 1: LOCATIONS ================= */}
          {activeTab === 'locations' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex justify-end">
                <button onClick={() => handleOpenResForm()} className="w-full sm:w-auto px-6 py-3 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-xl shadow-lg shadow-blue-500/20 font-black text-sm flex items-center justify-center gap-2 transition-transform hover:scale-105">
                  <Plus size={18} /> Add New Restaurant
                </button>
              </div>

              {restaurants.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100">
                  <Store size={40} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="font-bold text-slate-900">No Restaurants Added</h3>
                  <p className="text-sm text-slate-500 mt-1">Create your first location to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {restaurants.map(rest => (
                    <div key={rest.id || rest._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row min-w-0">
                      <div className="w-full md:w-48 h-48 md:h-auto relative bg-slate-200 shrink-0">
                        <img src={rest.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80'} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-green-600 shadow-sm flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> {rest.status || 'Active'}
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xl font-black text-slate-900 truncate">{rest.name}</h3>
                            <button onClick={() => deleteEntity(rest.id || rest._id!, 'restaurant')} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg shrink-0 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-500 truncate mt-0.5">
                            {rest.cuisines ? rest.cuisines.join(' • ') : rest.cuisineType} • {rest.priceLevel}
                          </p>
                          
                          <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600">
                            <p className="flex items-center gap-2 truncate text-slate-500">
                              <Clock size={14} className="text-[#0065eb] shrink-0"/> 
                              {rest.guestHoursNote || 'Hours configured in settings'}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {['Dine-in', 'Room Service', 'Reservations', 'Takeaway'].map(srv => (
                              <span key={srv} className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">{srv}</span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <div className="min-w-0 pr-2">
                              <p className="text-[10px] font-black uppercase text-slate-400 truncate">Today's Performance</p>
                              <p className="text-sm font-bold text-slate-900 truncate">18 Orders · $426 Rev · 3 Resvs</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenResForm(rest.id || rest._id)} className="flex-1 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"><Edit3 size={14}/> Edit</button>
                            <button onClick={() => setActiveTab('menus')} className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors text-center">Menu</button>
                            <button onClick={() => setActiveTab('orders')} className="flex-1 py-2.5 bg-[#0065eb] text-white rounded-xl text-xs font-bold hover:bg-[#0052c1] transition-colors shadow-md shadow-blue-500/20 text-center">Orders</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 2: MENUS ================= */}
          {activeTab === 'menus' && (
            <div className="animate-in slide-in-from-bottom-4 flex flex-col lg:flex-row gap-6">
              {/* Menu Sidebar */}
              <div className="w-full lg:w-72 shrink-0 space-y-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-900 text-lg mb-1">Menu Overview</h3>
                  <p className="text-3xl font-black text-[#0065eb] mb-4">{menuItems.length} <span className="text-sm text-slate-500 font-bold">Items</span></p>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex justify-between text-slate-600"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> Available</span> <span>{menuItems.filter(i => i.isAvailable).length}</span></div>
                    <div className="flex justify-between text-slate-600"><span className="flex items-center gap-2"><X size={14} className="text-red-500"/> Unavailable</span> <span>{menuItems.filter(i => !i.isAvailable).length}</span></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hidden lg:block">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Categories</h3>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {Array.from(new Set(menuItems.map(i => i.category))).map(cat => (
                      <button key={cat} className="w-full flex justify-between items-center p-2 rounded-xl hover:bg-slate-50 transition-colors text-sm font-bold text-slate-700 truncate">
                        <span className="truncate">{cat}</span> <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-xs shrink-0 ml-2">{menuItems.filter(i => i.category === cat).length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Menu List */}
              <div className="flex-1 space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search menu..." 
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#0065eb]" 
                    />
                  </div>
                  <button onClick={() => handleOpenMenuForm()} className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-colors">
                    <Plus size={16} /> Add Menu Item
                  </button>
                </div>

                {menuItems.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100">
                    <Coffee size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-900">No Menu Items</h3>
                    <p className="text-sm text-slate-500 mt-1">Add items to build your menu.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems
                      .filter(i => i.name.toLowerCase().includes(menuSearch.toLowerCase()) || i.category.toLowerCase().includes(menuSearch.toLowerCase()))
                      .map(item => (
                      <div key={item.id || item._id} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-start gap-4 hover:border-blue-200 transition-all min-w-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                          {(item as any).imageUrl ? (
                            <img src={(item as any).imageUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Coffee size={24} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-black text-slate-900 truncate">{item.name}</h4>
                              <span className="font-black text-[#0065eb] shrink-0">${item.price}</span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-snug">
                              {item.description || item.category}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              {item.isAvailable 
                                ? <span className="text-green-600 flex items-center gap-1 shrink-0"><CheckCircle2 size={10}/> Available</span>
                                : <span className="text-red-500 shrink-0">Unavailable</span>}
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-slate-500 hidden sm:flex items-center gap-1 shrink-0"><Clock size={10}/> {item.prepTimeMinutes || 20}m</span>
                            </div>
                            <div className="flex gap-3 shrink-0">
                              <button onClick={() => handleOpenMenuForm(item.id || item._id)} className="text-[11px] font-bold text-[#0065eb] hover:underline">Edit</button>
                              <button onClick={() => deleteEntity(item.id || item._id!, 'menu_item')} className="text-[11px] font-bold text-red-500 hover:underline">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 3: ORDERS ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              {/* Responsive Filters */}
              <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <span className="p-2 text-slate-400 hidden sm:block"><Filter size={16}/></span>
                  {['All', 'New', 'Preparing', 'Ready', 'Completed', 'Cancelled'].map(f => (
                    <button key={f} onClick={() => setOrderStatusFilter(f)} className={`px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex-1 sm:flex-none text-center ${orderStatusFilter === f ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{f}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-4 w-full lg:w-auto">
                  {['All', 'Room Service', 'Dine-in', 'Takeaway', 'Public'].map(f => (
                    <button key={f} onClick={() => setOrderTypeFilter(f)} className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all ${orderTypeFilter === f ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>{f}</button>
                  ))}
                </div>
              </div>

              {/* Order Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-slate-100">
                    <ClipboardList size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-900">No Orders Found</h3>
                  </div>
                ) : (
                  orders
                  .filter(o => orderStatusFilter === 'All' || o.status.toLowerCase() === orderStatusFilter.toLowerCase())
                  .filter(o => orderTypeFilter === 'All' || o.orderType === orderTypeFilter)
                  .map(order => (
                    <div key={order.id || order._id} className={`bg-white rounded-[2rem] border-2 shadow-sm flex flex-col ${order.status === 'new' ? 'border-orange-400 shadow-orange-500/10' : 'border-slate-100'}`}>
                      
                      <div className={`p-4 border-b ${order.status === 'new' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'} flex justify-between items-start rounded-t-[1.8rem]`}>
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            {order.status === 'new' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0"></span>}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{order.status} Order #{order.id?.slice(-4) || '1048'}</span>
                          </div>
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase truncate ${
                            order.orderType === 'Room Service' ? 'bg-indigo-100 text-indigo-700' : 
                            order.orderType === 'Dine-in' ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-purple-100 text-purple-700'
                          }`}>{order.orderType}</span>
                        </div>
                        <div className="text-right text-xs font-bold text-slate-500 shrink-0 mt-1">
                           {/* Time calculation logic can be added here if needed */}
                           Just now
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
                            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                              {order.orderType === 'Room Service' ? <MapPin size={18}/> : <User size={18}/>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 truncate">{order.deliveryLocation}</p>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">Guest: {order.customerName}</p>
                              {order.phone && <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1 truncate"><Phone size={10} className="shrink-0"/> {order.phone}</p>}
                            </div>
                          </div>

                          <div className="space-y-2 mb-6 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between items-start text-sm gap-2">
                                <span className="font-bold text-slate-700 break-words flex-1 leading-snug">
                                  <span className="text-blue-600 mr-1">{item.quantity}x</span> {item.name}
                                </span>
                                <span className="font-bold text-slate-400 shrink-0">${item.price * item.quantity}</span>
                              </div>
                            ))}
                            {order.notes && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Notes</p>
                                <p className="text-xs font-bold text-red-900 break-words leading-relaxed">{order.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-5 pt-4 border-t border-slate-50">
                            <span className="text-xs font-black uppercase text-slate-400">Total</span>
                            <span className="text-xl font-black text-slate-900">${order.totalAmount}</span>
                          </div>

                          {/* Dynamic Actions */}
                          {order.status === 'new' && (
                            <button onClick={() => updateOrderStatus(order.id!, 'preparing')} className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm transition-colors shadow-lg shadow-orange-500/20">Accept Order</button>
                          )}
                          {order.status === 'preparing' && (
                            <button onClick={() => updateOrderStatus(order.id!, 'ready')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-colors">Mark as Ready</button>
                          )}
                          {order.status === 'ready' && (
                            <button onClick={() => updateOrderStatus(order.id!, 'completed')} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm transition-colors">Complete / Handover</button>
                          )}
                          {['completed', 'cancelled'].includes(order.status) && (
                            <div className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-black text-sm text-center uppercase tracking-widest">
                              {order.status}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: KDS ================= */}
          {activeTab === 'kds' && (
            <div className="h-[calc(100vh-200px)] min-h-[600px] animate-in slide-in-from-bottom-4 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 bg-slate-900 p-4 sm:p-5 rounded-2xl shrink-0">
                <div className="flex items-center gap-3 text-white min-w-0">
                  <ChefHat size={28} className="text-orange-400 shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-black text-lg leading-tight truncate">Live Kitchen Orders</h3>
                    <p className="text-xs font-semibold text-slate-400 truncate">Expediter View</p>
                  </div>
                </div>
                <div className="text-white text-xs font-bold flex flex-wrap gap-3 sm:gap-4 shrink-0">
                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg"><span className="w-2 h-2 rounded-full bg-red-500"></span> New: {orders.filter(o=>o.status==='new').length}</span>
                  <span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Prep: {orders.filter(o=>o.status==='preparing').length}</span>
                </div>
              </div>

              <div className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                {[
                  { id: 'new', title: 'NEW', color: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700' },
                  { id: 'preparing', title: 'PREPARING', color: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
                  { id: 'ready', title: 'READY', color: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
                  { id: 'completed', title: 'SERVED', color: 'border-slate-300', bg: 'bg-slate-100', text: 'text-slate-600' }
                ].map(col => (
                  <div key={col.id} className="min-w-[280px] sm:min-w-[320px] w-[280px] sm:w-[320px] flex flex-col bg-slate-50/80 rounded-[2rem] border border-slate-200 p-3 sm:p-4 snap-center shrink-0">
                    <div className={`px-4 py-2.5 rounded-xl border ${col.bg} ${col.color} ${col.text} font-black text-[11px] sm:text-xs tracking-widest text-center mb-4 shadow-sm shrink-0`}>
                      {col.title} ({orders.filter(o => o.status === col.id).length})
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 custom-scrollbar pr-1 sm:pr-2">
                      {orders.filter(o => o.status === col.id).map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-w-0">
                          <div className="flex justify-between items-center mb-2 gap-2">
                            <span className="text-sm font-black text-slate-900 truncate">#{order.id?.slice(-4) || '1045'}</span>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">5m</span>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-500 mb-3 pb-3 border-b border-slate-100 break-words leading-snug">
                            {order.deliveryLocation} <span className="opacity-50">({order.orderType})</span>
                          </p>
                          
                          <ul className="space-y-1.5 mb-4 text-xs sm:text-sm font-semibold text-slate-800 flex-1">
                            {order.items?.map((item:any, i:number) => (
                              <li key={i} className="flex gap-2 items-start break-words leading-snug">
                                <span className="text-orange-500 font-black shrink-0">{item.quantity}x</span> 
                                <span>{item.name}</span>
                              </li>
                            ))}
                          </ul>

                          {order.notes && (
                             <div className="mb-4 p-2 bg-amber-50 rounded-lg border border-amber-100 text-[11px] font-bold text-amber-900 break-words leading-relaxed">
                               🚨 {order.notes}
                             </div>
                          )}

                          <div className="mt-auto shrink-0">
                            {col.id === 'new' && <button onClick={() => updateOrderStatus(order.id!, 'preparing')} className="w-full py-2.5 bg-orange-100 text-orange-700 rounded-xl text-xs font-black uppercase hover:bg-orange-200 transition-colors">Accept</button>}
                            {col.id === 'preparing' && <button onClick={() => updateOrderStatus(order.id!, 'ready')} className="w-full py-2.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-black uppercase hover:bg-blue-200 transition-colors">Mark Ready</button>}
                            {col.id === 'ready' && <button onClick={() => updateOrderStatus(order.id!, 'completed')} className="w-full py-2.5 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase hover:bg-emerald-200 transition-colors">Complete</button>}
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === col.id).length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-xs font-bold italic border-2 border-dashed border-slate-200 rounded-2xl">Queue Empty</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: RESERVATIONS ================= */}
          {activeTab === 'reservations' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 mb-6 custom-scrollbar">
                {['Today', 'Upcoming', 'Past', 'Cancelled'].map((t, i) => (
                  <button key={t} className={`px-4 py-2 text-sm font-bold border-b-2 transition-all shrink-0 ${i === 0 ? 'border-[#0065eb] text-[#0065eb]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {reservations.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-slate-100">
                    <CalendarDays size={40} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-900">No Reservations Found</h3>
                  </div>
                ) : (
                  reservations.map(res => {
                    const timeString = res.time || res.reservationTime || '12:00 PM';
                    const timeParts = timeString.split(' ');
                    const mainTime = timeParts[0] || '--:--';
                    const amPm = timeParts[1] || '';
                    
                    return (
                      <div key={res.id || res._id} className="bg-white p-4 sm:p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4 min-w-0">
                        <div className="flex gap-4 items-start min-w-0 w-full">
                          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-center min-w-[70px] shrink-0">
                            <p className="text-[10px] font-bold uppercase">Today</p>
                            <p className="text-lg font-black leading-tight">{mainTime}</p>
                            <p className="text-[10px] font-black">{amPm}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-900 text-lg truncate">{res.customerName || res.name || 'Guest'}</h4>
                            <p className="text-sm text-slate-500 font-semibold truncate">{res.guests || res.partySize || 1} guests • {res.restaurantName || 'Restaurant'}</p>
                            <span className="inline-block mt-2 px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-black uppercase truncate">{res.status || 'Confirmed'}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-2 justify-center sm:shrink-0 w-full sm:w-auto">
                          <button className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors">Check In</button>
                          <button className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 6: TABLES ================= */}
          {activeTab === 'tables' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="font-black text-xl text-slate-900">Table Management</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold shrink-0">
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Free</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Busy</span>
                    <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> Reserved</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-8 rounded-[2rem] border-2 border-dashed border-slate-200 min-h-[400px]">
                  {tables.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-10">
                      <Grid size={40} className="mb-4 opacity-50" />
                      <p className="font-bold">No Tables Configured</p>
                      <p className="text-xs mt-1">Configure tables in settings to map your floorplan.</p>
                    </div>
                  ) : (
                    tables.map(t => {
                      const status = (t.status || 'FREE').toUpperCase();
                      const tableNum = t.tableNumber || t.id || '01';
                      return (
                        <div key={t.id || t._id} className={`relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl border-2 shadow-sm cursor-pointer hover:-translate-y-1 transition-transform min-h-[120px] ${
                          status === 'FREE' ? 'bg-white border-green-200' :
                          status === 'BUSY' ? 'bg-red-50 border-red-200' :
                          'bg-amber-50 border-amber-200'
                        }`}>
                          <h4 className="text-base sm:text-xl font-black text-slate-800 mb-1 truncate w-full text-center">{t.name || `Table ${tableNum.replace('T', '')}`}</h4>
                          <p className="text-[10px] sm:text-xs font-bold text-slate-500 mb-3">{t.seats || t.capacity || 2} seats</p>
                          <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate max-w-full ${
                            status === 'FREE' ? 'bg-green-500 text-white' :
                            status === 'BUSY' ? 'bg-red-500 text-white' :
                            'bg-amber-500 text-white'
                          }`}>{status}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 7: ANALYTICS ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stats Card */}
                <div className="lg:col-span-1 bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-lg flex flex-col justify-center min-w-0">
                  <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 truncate">Today's Revenue</h3>
                  <p className="text-4xl md:text-5xl font-black mb-6 truncate">${todayRevenue.toFixed(2)}</p>
                  
                  <div className="space-y-4 text-xs md:text-sm font-bold border-t border-slate-800 pt-6">
                    <div className="flex justify-between gap-2"><span className="text-slate-400">Orders</span> <span className="truncate">{orders.length}</span></div>
                    <div className="flex justify-between gap-2"><span className="text-slate-400">Avg Order</span> <span className="truncate">${orders.length > 0 ? (todayRevenue / orders.length).toFixed(2) : '0.00'}</span></div>
                  </div>
                </div>

                {/* Revenue by Channel */}
                <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm min-w-0">
                  <h3 className="font-black text-lg md:text-xl text-slate-900 mb-6 truncate">Revenue by Channel</h3>
                  <div className="space-y-6">
                    {[
                      { name: 'Room Service', val: roomServiceRev, pct: rsPct, color: 'bg-indigo-500' },
                      { name: 'Dine-in', val: dineInRev, pct: diPct, color: 'bg-emerald-500' },
                      { name: 'Takeaway/Public', val: takeawayRev, pct: taPct, color: 'bg-orange-500' }
                    ].map(chan => (
                      <div key={chan.name}>
                        <div className="flex justify-between text-xs md:text-sm font-bold mb-2 gap-2">
                          <span className="text-slate-700 truncate">{chan.name}</span>
                          <span className="text-slate-900 shrink-0">${chan.val.toFixed(2)} <span className="text-slate-400 ml-1 md:ml-2">({chan.pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 md:h-3 overflow-hidden">
                          <div className={`h-full rounded-full ${chan.color}`} style={{ width: `${chan.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm min-w-0">
                <h3 className="font-black text-lg md:text-xl text-slate-900 mb-6 truncate">Top Selling Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {topItems.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-slate-400 font-bold text-sm">
                      No orders yet to calculate top items.
                    </div>
                  ) : (
                    topItems.map(item => (
                      <div key={item.name} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-slate-100 rounded-2xl bg-slate-50 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center font-black text-slate-900 shadow-sm text-sm md:text-lg shrink-0">#{item.rank}</div>
                        <div className="min-w-0">
                          <p className="font-black text-sm md:text-base text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-500 truncate">{item.sold} orders today</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}