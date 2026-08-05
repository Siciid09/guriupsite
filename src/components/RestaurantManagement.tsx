'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { auth, storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  Utensils, ChefHat, Plus, Edit3, Trash2, X, Clock, 
  CheckCircle, Loader2, Image as ImageIcon, Store,
  AlertCircle, RefreshCw, BellRing
} from 'lucide-react';

// --- TYPES ---
interface Restaurant {
  id?: string;
  _id?: string;
  name: string;
  description: string;
  cuisineType: string;
  priceLevel: string;
  images: string[];
  openHour: number;
  closeHour: number;
  status: string;
}

interface MenuItem {
  id?: string;
  _id?: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
}

interface Order {
  id?: string;
  _id?: string;
  customerName: string;
  deliveryLocation: string;
  items: any[];
  notes: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export default function RestaurantManagement({ hotelId }: { hotelId: string }) {
  const [activeTab, setActiveTab] = useState<'restaurants' | 'menus' | 'live_orders'>('restaurants');
  const [isLoading, setIsLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modals
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingRest, setEditingRest] = useState<Restaurant | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);

  // Form States
  const [isSaving, setIsSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (!hotelId) return;
    setIsLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
      const headers = { 'Authorization': `Bearer ${idToken}` };

      // 1. Fetch Restaurants
      const res1 = await fetch(`/api/restaurants?hotelId=${hotelId}`, { headers });
      const rests = await res1.json();
      setRestaurants(Array.isArray(rests) ? rests : []);

      // 2. Fetch Menu Items
      const res2 = await fetch(`/api/restaurants?entity=menu_item&hotelId=${hotelId}`, { headers });
      const menus = await res2.json();
      setMenuItems(Array.isArray(menus) ? menus : []);

      // 3. Fetch Live Orders
      const res3 = await fetch(`/api/bookings?type=food_orders&hotelId=${hotelId}`, { headers });
      const ords = await res3.json();
      setOrders(Array.isArray(ords) ? ords : []);

    } catch (error) {
      console.error("Error fetching dining data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Setup simple polling for Kitchen Display System if on orders tab
    let interval: NodeJS.Timeout;
    if (activeTab === 'live_orders') {
      interval = setInterval(fetchData, 15000); // Check for new orders every 15s
    }
    return () => clearInterval(interval);
  }, [hotelId, activeTab]);

  // --- ACTIONS ---
  const saveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRest) return;
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser!.getIdToken();
      let imageUrls = editingRest.images || [];

      if (uploadFile) {
        const fileRef = ref(storage, `restaurants/${Date.now()}_${uploadFile.name}`);
        await uploadBytes(fileRef, uploadFile);
        imageUrls = [await getDownloadURL(fileRef)];
      }

      const payload = { ...editingRest, hotelId, images: imageUrls, entity: 'restaurant' };
      const method = editingRest.id ? 'PATCH' : 'POST';

      const res = await fetch('/api/restaurants', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchData();
      setIsRestModalOpen(false);
      setUploadFile(null);
    } catch (err) {
      alert("Error saving restaurant");
    } finally {
      setIsSaving(false);
    }
  };

  const saveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser!.getIdToken();
      let imageUrl = editingMenu.imageUrl || '';

      if (uploadFile) {
        const fileRef = ref(storage, `menus/${Date.now()}_${uploadFile.name}`);
        await uploadBytes(fileRef, uploadFile);
        imageUrl = await getDownloadURL(fileRef);
      }

      const payload = { ...editingMenu, hotelId, imageUrl, entity: 'menu_item' };
      const method = editingMenu.id ? 'PATCH' : 'POST';

      const res = await fetch('/api/restaurants', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchData();
      setIsMenuModalOpen(false);
      setUploadFile(null);
    } catch (err) {
      alert("Error saving menu item");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntity = async (id: string, entity: 'restaurant' | 'menu_item') => {
    if (!window.confirm(`Delete this ${entity.replace('_', ' ')}?`)) return;
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

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const idToken = await auth.currentUser!.getIdToken();
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ id: orderId, hotelId, type: 'food_orders', status })
      });
      fetchData();
    } catch (e) {
      alert("Failed to update order status.");
    }
  };

  const openRestModal = (rest?: Restaurant) => {
    setEditingRest(rest || { name: '', description: '', cuisineType: 'Multicuisine', priceLevel: '$$', images: [], openHour: 6, closeHour: 23, status: 'active' });
    setUploadFile(null);
    setIsRestModalOpen(true);
  };

  const openMenuModal = (item?: MenuItem) => {
    setEditingMenu(item || { restaurantId: restaurants[0]?.id || restaurants[0]?._id || '', name: '', description: '', price: 0, category: 'Main Course', imageUrl: '', isAvailable: true });
    setUploadFile(null);
    setIsMenuModalOpen(true);
  };

  if (isLoading && restaurants.length === 0) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10"/></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Utensils size={24} className="text-[#0065eb]" /> Dining Hub</h2>
          <p className="text-sm text-slate-500 font-medium">Manage restaurants, menus, and live room service orders.</p>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex text-xs font-black shadow-inner">
          <button onClick={() => setActiveTab('restaurants')} className={`px-5 py-2.5 rounded-xl transition-all ${activeTab === 'restaurants' ? 'bg-white text-[#0065eb] shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Locations</button>
          <button onClick={() => setActiveTab('menus')} className={`px-5 py-2.5 rounded-xl transition-all ${activeTab === 'menus' ? 'bg-white text-[#0065eb] shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Menus</button>
          <button onClick={() => setActiveTab('live_orders')} className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'live_orders' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
            Live KDS {orders.filter(o => o.status === 'pending').length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          </button>
        </div>
      </div>

      {/* ================= TAB 1: RESTAURANTS ================= */}
      {activeTab === 'restaurants' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <button onClick={() => openRestModal()} className="w-full py-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-[2rem] shadow-xl shadow-blue-500/20 font-black text-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.01]">
            <Store size={24} /> Add New Restaurant Location
          </button>

          {restaurants.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
              <Store size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-900">No Restaurants Added</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restaurants.map(rest => (
                <div key={rest.id || rest._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group">
                  <div className="h-40 relative bg-slate-200">
                    <Image src={rest.images?.[0] || 'https://placehold.co/600x400'} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black uppercase text-green-600 shadow-sm flex items-center gap-1"><CheckCircle size={12}/> Active</div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black text-slate-900 mb-1">{rest.name}</h3>
                    <p className="text-xs font-bold text-slate-500 mb-4">{rest.cuisineType} • {rest.priceLevel}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openRestModal(rest)} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"><Edit3 size={14}/> Settings</button>
                      <button onClick={() => deleteEntity(rest.id || rest._id!, 'restaurant')} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MENU ITEMS ================= */}
      {activeTab === 'menus' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100">
            <p className="text-sm font-bold text-slate-600 ml-2">Total Items: {menuItems.length}</p>
            <button onClick={() => {
              if (restaurants.length === 0) return alert("Add a restaurant first.");
              openMenuModal();
            }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg hover:bg-black">
              <Plus size={16} /> Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {menuItems.map(item => {
              const parentRest = restaurants.find(r => (r.id || r._id) === item.restaurantId);
              return (
                <div key={item.id || item._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl relative overflow-hidden shrink-0">
                    <Image src={item.imageUrl || 'https://placehold.co/200x200'} alt="" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-bold text-slate-900 truncate ${!item.isAvailable && 'line-through text-slate-400'}`}>{item.name}</h4>
                      {!item.isAvailable && <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[9px] font-black uppercase">Out of Stock</span>}
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1">{item.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{parentRest?.name || 'Unknown Location'}</span> • <span className="text-[#0065eb]">${item.price}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openMenuModal(item)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><Edit3 size={16}/></button>
                    <button onClick={() => deleteEntity(item.id || item._id!, 'menu_item')} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: LIVE KITCHEN DISPLAY (KDS) ================= */}
      {activeTab === 'live_orders' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center bg-orange-50 border border-orange-200 p-4 rounded-[1.5rem]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-500/30 animate-bounce"><BellRing size={20}/></div>
              <div>
                <h3 className="font-black text-orange-900 text-lg">Kitchen Display System</h3>
                <p className="text-xs font-bold text-orange-700">Live incoming room service orders</p>
              </div>
            </div>
            <button onClick={fetchData} className="px-4 py-2 bg-white text-orange-600 rounded-lg text-xs font-bold shadow-sm hover:bg-orange-100 flex items-center gap-2">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Sync
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.length === 0 ? (
              <div className="col-span-2 text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                <ChefHat size={60} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-black text-xl text-slate-400">Kitchen is Clear!</h3>
                <p className="text-slate-400 font-medium text-sm mt-2">Waiting for new orders...</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id || order._id} className={`p-6 rounded-[2rem] border-2 shadow-xl relative overflow-hidden ${order.status === 'pending' ? 'bg-white border-orange-400' : 'bg-slate-50 border-slate-200'}`}>
                {order.status === 'pending' && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500 animate-pulse"></div>}
                
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white mb-2 ${order.status === 'pending' ? 'bg-orange-500 animate-pulse' : 'bg-blue-500'}`}>{order.status}</span>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{order.deliveryLocation}</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#0065eb]">${order.totalAmount}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1"><Clock size={10} className="inline"/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <div className="flex gap-3">
                        <span className="font-black text-[#0065eb] text-lg">{item.quantity}x</span>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">${item.price} each</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Special Notes / Allergies</p>
                      <p className="text-sm font-bold text-red-900">{order.notes}</p>
                    </div>
                  </div>
                )}

                {order.status === 'pending' ? (
                  <div className="flex gap-3">
                    <button onClick={() => updateOrderStatus(order.id || order._id!, 'cancelled')} className="flex-1 py-4 border-2 border-red-100 text-red-500 rounded-xl font-black text-sm hover:bg-red-50 transition-colors">Reject</button>
                    <button onClick={() => updateOrderStatus(order.id || order._id!, 'preparing')} className="flex-[2] py-4 bg-green-500 text-white rounded-xl font-black text-sm shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors">Accept & Prepare</button>
                  </div>
                ) : order.status === 'preparing' ? (
                  <button onClick={() => updateOrderStatus(order.id || order._id!, 'completed')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors">Mark as Delivered</button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* Restaurant Modal */}
      {isRestModalOpen && editingRest && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRestModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-[2.5rem] z-20">
              <h2 className="text-xl font-black">{editingRest.id ? 'Edit Restaurant' : 'New Restaurant'}</h2>
              <button onClick={() => setIsRestModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={saveRestaurant} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div><label className="text-[10px] font-black uppercase text-slate-400">Name</label><input required type="text" value={editingRest.name} onChange={e=>setEditingRest({...editingRest, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Description</label><textarea required value={editingRest.description} onChange={e=>setEditingRest({...editingRest, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400">Cuisine</label><input required type="text" value={editingRest.cuisineType} onChange={e=>setEditingRest({...editingRest, cuisineType: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400">Price ($ - $$$$)</label><select value={editingRest.priceLevel} onChange={e=>setEditingRest({...editingRest, priceLevel: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]"><option>$</option><option>$$</option><option>$$$</option><option>$$$$</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400">Open Hour (0-23)</label><input type="number" min="0" max="23" value={editingRest.openHour} onChange={e=>setEditingRest({...editingRest, openHour: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400">Close Hour (0-23)</label><input type="number" min="0" max="23" value={editingRest.closeHour} onChange={e=>setEditingRest({...editingRest, closeHour: parseInt(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Cover Image</label>
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200">
                    {(uploadFile || editingRest.images?.[0]) ? <Image src={uploadFile ? URL.createObjectURL(uploadFile) : editingRest.images[0]} alt="" fill className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto text-slate-300" />}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black">Upload New</button>
                  <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={e => e.target.files && setUploadFile(e.target.files[0])} />
                </div>
              </div>
              <button disabled={isSaving} type="submit" className="w-full mt-4 py-4 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex justify-center">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Restaurant'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {isMenuModalOpen && editingMenu && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuModalOpen(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-[2.5rem] z-20">
              <h2 className="text-xl font-black">{editingMenu.id ? 'Edit Item' : 'New Menu Item'}</h2>
              <button onClick={() => setIsMenuModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
            </div>
            <form onSubmit={saveMenuItem} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Restaurant Menu</label>
                <select value={editingMenu.restaurantId} onChange={e=>setEditingMenu({...editingMenu, restaurantId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]">
                  {restaurants.map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Item Name</label><input required type="text" value={editingMenu.name} onChange={e=>setEditingMenu({...editingMenu, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black uppercase text-slate-400">Price ($)</label><input required type="number" step="0.01" value={editingMenu.price} onChange={e=>setEditingMenu({...editingMenu, price: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" /></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400">Category</label><input required type="text" value={editingMenu.category} onChange={e=>setEditingMenu({...editingMenu, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" placeholder="e.g. Mains, Drinks" /></div>
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400">Description</label><textarea value={editingMenu.description} onChange={e=>setEditingMenu({...editingMenu, description: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-[#0065eb]" rows={2} /></div>
              
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input type="checkbox" checked={editingMenu.isAvailable} onChange={e=>setEditingMenu({...editingMenu, isAvailable: e.target.checked})} className="w-5 h-5 rounded text-[#0065eb] focus:ring-[#0065eb]" />
                <span className="font-bold text-sm text-slate-900">Item is currently available</span>
              </label>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Item Photo</label>
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl relative overflow-hidden border border-slate-200">
                    {(uploadFile || editingMenu.imageUrl) ? <Image src={uploadFile ? URL.createObjectURL(uploadFile) : editingMenu.imageUrl} alt="" fill className="object-cover" /> : <ImageIcon className="absolute inset-0 m-auto text-slate-300" />}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black">Upload Photo</button>
                  <input type="file" hidden accept="image/*" ref={fileInputRef} onChange={e => e.target.files && setUploadFile(e.target.files[0])} />
                </div>
              </div>
              <button disabled={isSaving} type="submit" className="w-full mt-4 py-4 bg-[#0065eb] hover:bg-[#0052c1] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex justify-center">{isSaving ? <Loader2 className="animate-spin" /> : 'Save Item'}</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}