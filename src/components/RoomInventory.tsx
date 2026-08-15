'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { format, addDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble, DoorOpen, Calendar, Plus, Search, Filter,
  CheckCircle2, AlertCircle, Trash2, Edit3, Eye, EyeOff,
  Layers, Building, Sparkles, RefreshCw, ChevronRight,
  User, Check, X, ShieldAlert, SlidersHorizontal,
  Home, DollarSign, Clock, Settings, ArrowRight, ArrowLeft,
  Loader2
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RoomType {
  _id?: string;
  id?: string;
  hotelId: string;
  roomTypeName: string;
  roomCategory: string;
  headline?: string;
  roomSize?: string;
  description?: string;
  maxOccupancy: number;
  adults: number;
  children: number;
  beds?: Array<{ type: string; quantity: number }>;
  numberOfRooms: number;
  basePrice: number;
  discountPrice?: number;
  currency?: string;
  images?: string[];
  inventoryStatus: 'Draft' | 'Published' | 'Hidden' | 'Temporarily unavailable';
  highlights?: string[];
  isFeatured?: boolean;
}

export interface PhysicalRoom {
  _id?: string;
  id?: string;
  hotelId: string;
  roomTypeId: string;
  roomTypeName: string;
  roomNumber: string;
  floor?: string;
  building?: string;
  notes?: string;
  operationalStatus: 'active' | 'out_of_order' | 'out_of_service';
  housekeepingStatus: 'clean' | 'dirty' | 'inspected';
}

export interface Booking {
  _id?: string;
  id?: string;
  hotelId: string;
  roomTypeId?: string;
  physicalRoomId?: string;       // <-- ADDED THIS
  assignedRoomNumber?: string;   // <-- ADDED THIS
  roomName?: string;
  checkIn: string | Date;
  checkOut: string | Date;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
}

interface RoomInventoryProps {
  hotelId: string;
  onNavigateAddRoomType?: () => void;
  onNavigateAddPhysicalRoom?: () => void;
  onNavigateEditRoomType?: (id: string) => void;
  onNavigateEditPhysicalRoom?: (id: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RoomInventory({
  hotelId,
  onNavigateAddRoomType,
  onNavigateAddPhysicalRoom,
  onNavigateEditRoomType,
  onNavigateEditPhysicalRoom
}: RoomInventoryProps) {
  const router = useRouter();

  // Navigation & View State
  const [mainTab, setMainTab] = useState<'rooms' | 'physical-rooms' | 'availability'>('rooms');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedPhysicalRoom, setSelectedPhysicalRoom] = useState<PhysicalRoom | null>(null); // NEW STATE

  // Data States
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [calendarStartDate, setCalendarStartDate] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [housekeepingFilter, setHousekeepingFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Manual Booking State
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [manualBookingData, setManualBookingData] = useState({
    checkIn: '', checkOut: '', guestName: '', guestPhone: '', paymentReceived: false, physicalRoomId: ''
  });

  const handleManualBooking = async (contextRoomTypeId: string, contextRoomName: string) => {
    const { checkIn, checkOut, guestName, guestPhone, paymentReceived, physicalRoomId } = manualBookingData;
    if (!checkIn || !checkOut) return alert("Please select dates.");
    if (new Date(checkIn) >= new Date(checkOut)) return alert("Check-out must be after check-in.");
    if (!physicalRoomId) return alert("Please assign a physical room.");
    
    const sIn = new Date(checkIn);
    const sOut = new Date(checkOut);
    sIn.setHours(0,0,0,0);
    sOut.setHours(0,0,0,0);

    // STRICT SUPABASE DATE PARSER (No .seconds check)
    const isConflict = bookings.some(b => {
      const matchesPhysical = b.physicalRoomId === physicalRoomId || b.assignedRoomNumber === contextRoomName || b.roomName === contextRoomName;
      if (!matchesPhysical) return false;
      if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return false;
      
      const bIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
      const bOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
      bIn.setHours(0,0,0,0);
      bOut.setHours(0,0,0,0);
      
      return (bIn.getTime() < sOut.getTime() && bOut.getTime() > sIn.getTime());
    });

    if (isConflict) return alert("❌ ERROR: This room is already occupied during these dates!");

    setActionLoading('manual_booking');
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      
      const targetPhysicalRoom = physicalRooms.find(pr => (pr._id || pr.id) === physicalRoomId);
      const actualRoomNumber = targetPhysicalRoom?.roomNumber || contextRoomName;
      
      const payload = {
        hotelId,
        roomId: contextRoomTypeId, // 🔥 FIX: The database column is 'roomId', not 'roomTypeId'
        physicalRoomId: physicalRoomId,
        roomName: actualRoomNumber,
        assignedRoomNumber: actualRoomNumber,
        guestName: guestName || "Walk-in Guest",
        guestPhone: guestPhone || "N/A",
        checkIn,
        checkOut,
        status: 'checked-in', // Instantly occupy
        paymentStatus: paymentReceived ? 'paid' : 'pending',
        totalAmount: 0, // 🔥 FIXED: Changed from totalPrice to totalAmount
        source: 'admin_manual'
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to book room");
      
      const newBooking = await res.json();
      setBookings(prev => [newBooking.booking, ...prev]);
      
      setShowManualBooking(false);
      setManualBookingData({ checkIn: '', checkOut: '', guestName: '', guestPhone: '', paymentReceived: false, physicalRoomId: '' });
      if (selectedPhysicalRoom) setSelectedPhysicalRoom(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================================================
  // API FETCHING
  // ============================================================================

  const fetchInventoryData = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';
      const headers = { Authorization: `Bearer ${idToken}` };

      // 1. Fetch Room Types
      const rtRes = await fetch(`/api/rooms?hotelId=${hotelId}`, { headers });
      const rtData = await rtRes.json();
      const fetchedRoomTypes = Array.isArray(rtData) ? rtData : (rtData.roomTypes || rtData.rooms || []);

      // 2. Fetch Physical Rooms
      const prRes = await fetch(`/api/physical-rooms?hotelId=${hotelId}`, { headers });
      const prData = await prRes.json();
      const fetchedPhysicalRooms = Array.isArray(prData) ? prData : (prData.physicalRooms || prData.data || []);

      // 3. Fetch Bookings
      const bkRes = await fetch(`/api/bookings?hotelId=${hotelId}`, { headers });
      const bkData = await bkRes.json();
      const fetchedBookings = Array.isArray(bkData) ? bkData : (bkData.bookings || bkData.data || []);

      setRoomTypes(fetchedRoomTypes);
      setPhysicalRooms(fetchedPhysicalRooms);
      setBookings(fetchedBookings);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to sync inventory from server.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && hotelId) fetchInventoryData();
      else setIsFetching(false);
    });
    return () => unsubscribe();
  }, [hotelId]);

  // ============================================================================
  // DYNAMIC CALCULATIONS & SUMMARY KPIS
  // ============================================================================

  const kpis = useMemo(() => {
    const totalTypes = roomTypes.length;
    const totalPhysical = physicalRooms.length;

    const dirtyCount = physicalRooms.filter(r => r.housekeepingStatus === 'dirty').length;
    const maintenanceCount = physicalRooms.filter(r => r.operationalStatus !== 'active').length;

    // Estimate occupied rooms based on 'checked-in' status or today's active bookings
    const today = new Date();
    const occupiedPhysicalIds = new Set<string>();

    bookings.forEach(b => {
      if (['checked-in', 'confirmed'].includes(b.status)) {
        const cIn = new Date(b.checkIn);
        const cOut = new Date(b.checkOut);
        if (today >= cIn && today <= cOut) {
          // Counted as active occupied booking today
          occupiedPhysicalIds.add(b.id || b._id || Math.random().toString());
        }
      }
    });

    const occupiedCount = Math.min(occupiedPhysicalIds.size, totalPhysical);
    const availableCount = Math.max(0, totalPhysical - occupiedCount - maintenanceCount);

    return {
      totalTypes,
      totalPhysical,
      availableToday: availableCount,
      occupiedToday: occupiedCount,
      dirtyToday: dirtyCount,
      maintenanceToday: maintenanceCount
    };
  }, [roomTypes, physicalRooms, bookings]);

  // Breakdowns per Room Type ID
  const roomTypeStats = useMemo(() => {
    const stats: Record<string, { total: number; available: number; occupied: number; dirty: number; maintenance: number }> = {};

    roomTypes.forEach(rt => {
      const rtId = rt._id || rt.id || '';
      const linkedRooms = physicalRooms.filter(p => p.roomTypeId === rtId || p.roomTypeName === rt.roomTypeName);

      // 🔥 STRICT PHYSICAL COUNT: Only count actual linked physical rooms!
      const total = linkedRooms.length; 
      const dirty = linkedRooms.filter(p => p.housekeepingStatus === 'dirty').length;
      const maintenance = linkedRooms.filter(p => p.operationalStatus !== 'active').length;

      // Real Occupied Calculation for the main cards
      let occupied = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      linkedRooms.forEach(pr => {
        const isOccupied = bookings.some(b => {
          if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return false;
          const matchesRoom = b.physicalRoomId === (pr._id || pr.id) || b.assignedRoomNumber === pr.roomNumber || b.roomName === pr.roomNumber || b.roomName === `${pr.roomTypeName} - ${pr.roomNumber}` || (b as any).roomId === (pr._id || pr.id);
          if (!matchesRoom) return false;
          const cIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
          cIn.setHours(0,0,0,0);
          const cOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
          cOut.setHours(0,0,0,0);
          return today.getTime() >= cIn.getTime() && today.getTime() < cOut.getTime(); // Check-out day frees the room
        });
        if (isOccupied) occupied++;
      });

      const available = Math.max(0, total - occupied - maintenance);

      stats[rtId] = { total, available, occupied, dirty, maintenance };
    });

    return stats;
  }, [roomTypes, physicalRooms, bookings]);

  // Unique Floors for Filter Dropdown
  const uniqueFloors = useMemo(() => {
    const floors = new Set<string>();
    physicalRooms.forEach(r => { if (r.floor) floors.add(r.floor); });
    return Array.from(floors);
  }, [physicalRooms]);

  // Filtered Physical Rooms
  const filteredPhysicalRooms = useMemo(() => {
    return physicalRooms.filter(room => {
      const matchesSearch =
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.building || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || room.operationalStatus === statusFilter;
      const matchesHousekeeping = housekeepingFilter === 'all' || room.housekeepingStatus === housekeepingFilter;
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter;

      return matchesSearch && matchesStatus && matchesHousekeeping && matchesFloor;
    });
  }, [physicalRooms, searchTerm, statusFilter, housekeepingFilter, floorFilter]);

  // Dynamic 7 Days for Availability Matrix
  const calendarDays = useMemo(() => {
    const days = [];
    const start = new Date(calendarStartDate);
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [calendarStartDate]);

  // ============================================================================
  // QUICK ACTIONS & API MUTATIONS
  // ============================================================================

  const updatePhysicalRoomStatus = async (roomId: string, housekeepingStatus?: string, operationalStatus?: string) => {
    setActionLoading(roomId);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const target = physicalRooms.find(r => (r._id || r.id) === roomId);
      if (!target) return;

      const payload = {
        hotelId,
        roomTypeId: target.roomTypeId,
        roomNumber: target.roomNumber,
        housekeepingStatus: housekeepingStatus || target.housekeepingStatus,
        operationalStatus: operationalStatus || target.operationalStatus
      };

      const res = await fetch(`/api/physical-rooms?id=${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update room status');

      // Optimistic Local Update
      setPhysicalRooms(prev =>
        prev.map(p =>
          (p._id === roomId || p.id === roomId)
            ? {
                ...p,
                housekeepingStatus: (housekeepingStatus as any) || p.housekeepingStatus,
                operationalStatus: (operationalStatus as any) || p.operationalStatus
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  ;

  const deleteRoomType = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room type? This will permanently remove it from your inventory.")) return;
    setActionLoading(roomId);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const res = await fetch(`/api/rooms?id=${roomId}&hotelId=${hotelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete room type');
      }

      setRoomTypes(prev => prev.filter(rt => (rt._id !== roomId && rt.id !== roomId)));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRoomTypeVisibility = async (roomTypeId: string, currentStatus: string) => {
    setActionLoading(roomTypeId);
    try {
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const newStatus = currentStatus === 'Published' ? 'Draft' : 'Published';

      const res = await fetch(`/api/rooms?id=${roomTypeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ hotelId, inventoryStatus: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update room type status');

      setRoomTypes(prev =>
        prev.map(rt => ((rt._id === roomTypeId || rt.id === roomTypeId) ? { ...rt, inventoryStatus: newStatus as any } : rt))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-blue-600 w-12 h-12 mb-4" />
        <p className="text-slate-500 font-bold text-sm">Syncing Room Inventory Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-slate-800 animate-in fade-in duration-300">

      {/* ====================================================================
          HEADER & ACTION BAR
      ==================================================================== */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
              <Layers size={24} />
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Room Inventory
            </h1>
          </div>
          <p className="text-xs md:text-sm font-semibold text-slate-500">
            Command center to manage room types, physical units, availability, and housekeeping.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigateAddRoomType ? onNavigateAddRoomType() : router.push('?tab=add-room')}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Room Type
          </button>
          <button
            type="button"
            onClick={() => onNavigateAddPhysicalRoom ? onNavigateAddPhysicalRoom() : router.push('?tab=add-physical-room')}
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2"
          >
            <DoorOpen size={18} className="text-blue-600" /> Add Physical Room
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ====================================================================
          1. INVENTORY SUMMARY KPIS
      ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard title="Room Types" value={kpis.totalTypes} icon={BedDouble} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard title="Physical Rooms" value={kpis.totalPhysical} icon={DoorOpen} color="text-indigo-600" bg="bg-indigo-50" />
        <KpiCard title="Available Today" value={kpis.availableToday} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard title="Occupied Today" value={kpis.occupiedToday} icon={User} color="text-amber-600" bg="bg-amber-50" />
        <KpiCard title="Dirty Units" value={kpis.dirtyToday} icon={Sparkles} color="text-orange-600" bg="bg-orange-50" />
        <KpiCard title="In Maintenance" value={kpis.maintenanceToday} icon={ShieldAlert} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* ====================================================================
          2. NAVIGATION TABS
      ==================================================================== */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-2 w-max max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setMainTab('rooms')}
          className={`px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            mainTab === 'rooms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BedDouble size={18} /> Room Types ({kpis.totalTypes})
        </button>
        <button
          type="button"
          onClick={() => setMainTab('physical-rooms')}
          className={`px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            mainTab === 'physical-rooms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DoorOpen size={18} /> Physical Rooms ({kpis.totalPhysical})
        </button>
        <button
          type="button"
          onClick={() => setMainTab('availability')}
          className={`px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            mainTab === 'availability' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar size={18} /> Availability Matrix
        </button>
      </div>

      {/* ====================================================================
          TAB 1: ROOM TYPES VIEW
      ==================================================================== */}
      {mainTab === 'rooms' && (
        <div className="space-y-6">
          {roomTypes.length === 0 ? (
            <EmptyState
              icon={BedDouble}
              title="No Room Types Configured"
              description="Create room categories (e.g., Deluxe King, Family Suite) to start selling inventory on GuriUp."
              actionLabel="Create Room Type"
              onAction={() => onNavigateAddRoomType ? onNavigateAddRoomType() : router.push('?tab=add-room')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map(rt => {
                const rtId = rt._id || rt.id || '';
                const stats = roomTypeStats[rtId] || { total: 0, available: 0, occupied: 0, dirty: 0, maintenance: 0 };
                const isPublished = rt.inventoryStatus === 'Published';

                return (
                  <div
                    key={rtId}
                    className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-blue-200/80 transition-all duration-300"
                  >
                    {/* Media Header */}
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      {rt.images && rt.images[0] ? (
                        <Image
                          src={rt.images[0]}
                          alt={rt.roomTypeName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <BedDouble size={48} />
                          <span className="text-xs font-bold mt-2">No Image</span>
                        </div>
                      )}

                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isPublished ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-900/80 text-white backdrop-blur-md'
                        }`}>
                          {rt.inventoryStatus || 'Draft'}
                        </span>
                      </div>

                      <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-black">
                        ${rt.basePrice} / night
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-black text-slate-900 leading-tight">
                            {rt.roomTypeName}
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          {rt.roomCategory} • {stats.total} Units
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 mt-3 pt-3 border-t border-slate-100">
                          <span>👤 {rt.maxOccupancy} Guests</span>
                          <span>•</span>
                          <span>🛏 {rt.beds?.[0]?.type || 'King'}</span>
                          {rt.roomSize && (
                            <>
                              <span>•</span>
                              <span>📐 {rt.roomSize} m²</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Today's Live Breakdown */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Today's Unit Breakdown</span>
                        <div className="grid grid-cols-4 gap-1 text-center text-xs font-bold">
                          <div className="bg-emerald-100/60 text-emerald-800 p-1.5 rounded-xl">
                            <span className="block text-[10px] font-medium opacity-80">Avail</span>
                            {stats.available}
                          </div>
                          <div className="bg-amber-100/60 text-amber-800 p-1.5 rounded-xl">
                            <span className="block text-[10px] font-medium opacity-80">Occ</span>
                            {stats.occupied}
                          </div>
                          <div className="bg-orange-100/60 text-orange-800 p-1.5 rounded-xl">
                            <span className="block text-[10px] font-medium opacity-80">Dirty</span>
                            {stats.dirty}
                          </div>
                          <div className="bg-rose-100/60 text-rose-800 p-1.5 rounded-xl">
                            <span className="block text-[10px] font-medium opacity-80">Maint</span>
                            {stats.maintenance}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedRoomType(rt)}
                          className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          Manage Details <ChevronRight size={14} />
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionLoading === rtId}
                            onClick={() => toggleRoomTypeVisibility(rtId, rt.inventoryStatus)}
                            className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                            title={isPublished ? 'Unpublish / Draft' : 'Publish Room Type'}
                          >
                            {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateEditRoomType ? onNavigateEditRoomType(rtId) : router.push(`?tab=add-room&id=${rtId}`)}
                            className="p-2.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                            title="Edit Room Type"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === rtId}
                            onClick={() => deleteRoomType(rtId)}
                            className="p-2.5 bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                            title="Delete Room Type"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: PHYSICAL ROOMS VIEW
      ==================================================================== */}
      {mainTab === 'physical-rooms' && (
        <div className="space-y-6">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search room number or type..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Operational Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="out_of_order">Out of Order</option>
                <option value="out_of_service">Out of Service</option>
              </select>

              {/* Housekeeping Filter */}
              <select
                value={housekeepingFilter}
                onChange={e => setHousekeepingFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Housekeeping</option>
                <option value="clean">Clean</option>
                <option value="dirty">Dirty</option>
                <option value="inspected">Inspected</option>
              </select>

              {/* Floor Filter */}
              {uniqueFloors.length > 0 && (
                <select
                  value={floorFilter}
                  onChange={e => setFloorFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="all">All Floors</option>
                  {uniqueFloors.map(f => (
                    <option key={f} value={f}>Floor {f}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* PHYSICAL ROOMS TABLE */}
          {filteredPhysicalRooms.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="No Physical Rooms Found"
              description="No physical room records matched your active filters or search terms."
              actionLabel="Add Physical Room"
              onAction={() => onNavigateAddPhysicalRoom ? onNavigateAddPhysicalRoom() : router.push('?tab=add-physical-room')}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="p-4 pl-6">Room Number</th>
                      <th className="p-4">Room Type</th>
                      <th className="p-4">Floor / Wing</th>
                      <th className="p-4">Operational Status</th>
                      <th className="p-4">Housekeeping</th>
                      <th className="p-4 text-right pr-6">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {filteredPhysicalRooms.map(room => {
                      const rId = room._id || room.id || '';
                      const isClean = room.housekeepingStatus === 'clean' || room.housekeepingStatus === 'inspected';
                      const isActive = room.operationalStatus === 'active';

                      return (
                        <tr key={rId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 pl-6">
                            <span className="text-base font-black text-slate-900">
                              #{room.roomNumber}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-blue-600">
                            {room.roomTypeName}
                          </td>
                          <td className="p-4 text-slate-500">
                            {room.floor ? `Floor ${room.floor}` : '—'} {room.building ? `(${room.building})` : ''}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isActive ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                              {room.operationalStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                              isClean ? 'bg-teal-100 text-teal-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {isClean ? <Sparkles size={12} /> : <AlertCircle size={12} />}
                              {room.housekeepingStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              {/* Housekeeping Toggle Button */}
                              <button
                                type="button"
                                disabled={actionLoading === rId}
                                onClick={() => updatePhysicalRoomStatus(rId, isClean ? 'dirty' : 'clean')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                                  isClean ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                                }`}
                              >
                                {isClean ? 'Mark Dirty' : 'Mark Clean'}
                              </button>

                              {/* Maintenance Toggle Button */}
                              <button
                                type="button"
                                disabled={actionLoading === rId}
                                onClick={() => updatePhysicalRoomStatus(rId, undefined, isActive ? 'out_of_order' : 'active')}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                                  isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                }`}
                              >
                                {isActive ? 'Block (Maint)' : 'Activate'}
                              </button>

                              {/* View Physical Room */}
                              <button
                                type="button"
                                onClick={() => setSelectedPhysicalRoom(room)}
                                className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-colors"
                                title="View Physical Room"
                              >
                                <Eye size={14} />
                              </button>

                              {/* Edit Physical Room */}
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/hotel?tab=add-physical-room&id=${rId}`)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-700"
                                title="Edit Physical Room"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 3: AVAILABILITY MATRIX / CALENDAR
      ==================================================================== */}
      {mainTab === 'availability' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900">7-Day Availability Forecast</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Date:</span>
                <input 
                  type="date" 
                  value={format(calendarStartDate, 'yyyy-MM-dd')}
                  onChange={(e) => setCalendarStartDate(new Date(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> Limited (&le; 2)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"/> Sold Out (0)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-left font-black text-xs text-slate-500 uppercase tracking-wider min-w-[200px]">
                    Room Category
                  </th>
                  {calendarDays.map(day => (
                    <th key={day.toISOString()} className="p-4 font-bold text-xs text-slate-700 min-w-[100px]">
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-slate-400 font-medium text-[11px]">{format(day, 'MMM d')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold">
                {roomTypes.map(rt => {
                  const rtId = rt._id || rt.id || '';
                  // 🔥 STRICT PHYSICAL COUNT: No more fallback to rt.numberOfRooms
                  const totalUnits = roomTypeStats[rtId]?.total || 0;

                  return (
                    <tr key={rtId} className="hover:bg-slate-50/50">
                      <td className="p-4 text-left font-extrabold text-slate-900">
                        {rt.roomTypeName}
                        <span className="block text-[10px] font-normal text-slate-400">Total: {totalUnits} units</span>
                      </td>

                      {calendarDays.map(day => {
                        // REAL AVAILABILITY LOGIC
                        let occupiedCountForDay = 0;
                        
                        // Normalize the current calendar column day to midnight for accurate comparison
                        const currentCalendarDay = new Date(day);
                        currentCalendarDay.setHours(0, 0, 0, 0);

                        bookings.forEach(b => {
                          if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return;

                          const isThisRoomType = b.roomTypeId === rtId || 
                            physicalRooms.some(pr => pr.roomTypeId === rtId && (b.physicalRoomId === (pr._id || pr.id) || b.assignedRoomNumber === pr.roomNumber || b.roomName === pr.roomNumber || b.roomName === `${pr.roomTypeName} - ${pr.roomNumber}`));

                          if (isThisRoomType) {
                            const cIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
                            cIn.setHours(0, 0, 0, 0);
                            const cOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
                            cOut.setHours(0, 0, 0, 0);

                            // If the calendar day is on or after Check-In, AND strictly before Check-Out
                            // (Check-Out day is considered "Available" for new guests)
                            if (currentCalendarDay.getTime() >= cIn.getTime() && currentCalendarDay.getTime() < cOut.getTime()) {
                              occupiedCountForDay++;
                            }
                          }
                        });

                        // Calculate real availability: Total Units - Maintenance Units - Occupied Units
                        const maintenanceCount = roomTypeStats[rtId]?.maintenance || 0;
                        const avail = Math.max(0, totalUnits - maintenanceCount - occupiedCountForDay);

                        const isSoldOut = avail === 0;
                        const isLimited = avail > 0 && avail <= 2;

                        return (
                          <td key={day.toISOString()} className="p-4">
                            <span className={`inline-flex items-center justify-center w-12 h-10 rounded-2xl text-xs font-black shadow-sm ${
                              isSoldOut ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                              isLimited ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {avail}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          DEEP DIVE MODAL FOR MANAGING A ROOM TYPE
      ==================================================================== */}
      <AnimatePresence>
        {selectedRoomType && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedRoomType(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
             {/* Modal Header & Management Actions */}
              <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 sticky top-0 z-20">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedRoomType.roomTypeName}</h2>
                  <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${selectedRoomType.inventoryStatus === 'Published' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    {selectedRoomType.inventoryStatus} • ${selectedRoomType.basePrice} / night
                  </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* 🔥 NEW PUBLISH / HIDE TOGGLE */}
                  <button 
                    disabled={actionLoading === (selectedRoomType._id || selectedRoomType.id)}
                    onClick={() => {
                      const id = selectedRoomType._id || selectedRoomType.id || '';
                      toggleRoomTypeVisibility(id, selectedRoomType.inventoryStatus);
                      setSelectedRoomType(prev => prev ? { ...prev, inventoryStatus: prev.inventoryStatus === 'Published' ? 'Draft' : 'Published' } : null);
                    }} 
                    className={`hidden md:flex items-center gap-2 px-4 py-2 border rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 ${selectedRoomType.inventoryStatus === 'Published' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                  >
                    {selectedRoomType.inventoryStatus === 'Published' ? <EyeOff size={14} /> : <Eye size={14} />} 
                    {selectedRoomType.inventoryStatus === 'Published' ? 'Hide Room' : 'Publish Room'}
                  </button>
                  
                  <button onClick={() => {
                    const id = selectedRoomType._id || selectedRoomType.id || '';
                    setSelectedRoomType(null);
                    if (onNavigateEditRoomType) onNavigateEditRoomType(id);
                    else router.push(`?tab=edit-room&id=${id}`);
                  }} className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors shadow-sm">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => setSelectedRoomType(null)} className="p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-100 text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
                
                {(() => {
                  const rtId = selectedRoomType._id || selectedRoomType.id || '';
                  const linkedRooms = physicalRooms.filter(p => p.roomTypeId === rtId || p.roomTypeName === selectedRoomType.roomTypeName);
                  // 🔥 STRICT PHYSICAL COUNT: Read exactly from physical rooms
                  const total = linkedRooms.length;
                  const dirty = linkedRooms.filter(p => p.housekeepingStatus === 'dirty').length;
                  const maintenance = linkedRooms.filter(p => p.operationalStatus !== 'active').length;
                  
                  const today = new Date();
                  let occupiedCount = 0;
                  
                  linkedRooms.forEach(pr => {
                    const isOccupied = bookings.some(b => {
                      if (!['confirmed', 'checked-in'].includes(b.status)) return false;
                      const matchesRoom = b.roomName === pr.roomNumber || 
                                          b.roomName === `${pr.roomTypeName} - ${pr.roomNumber}` || 
                                          (b as any).roomId === (pr._id || pr.id) ||
                                          (b as any).physicalRoomId === (pr._id || pr.id);
                      if (!matchesRoom) return false;
                      const cIn = new Date(b.checkIn as any);
                      const cOut = new Date(b.checkOut as any);
                      return today >= cIn && today <= cOut;
                    });
                    if (isOccupied) occupiedCount++;
                  });

                  const availableCount = Math.max(0, total - occupiedCount - maintenance);

                  return (
                    <div className="space-y-8">
                      
                      {/* 1. Inventory Overview */}
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">Inventory Overview</h3>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                           <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <span className="text-3xl font-black text-slate-900">{total}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Total Units</span>
                           </div>
                           <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <span className="text-3xl font-black text-emerald-600">{availableCount}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mt-1">Available</span>
                           </div>
                           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <span className="text-3xl font-black text-indigo-600">{occupiedCount}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mt-1">Occupied</span>
                           </div>
                           <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <span className="text-3xl font-black text-orange-600">{dirty}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 mt-1">Dirty</span>
                           </div>
                           <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                             <span className="text-3xl font-black text-rose-600">{maintenance}</span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mt-1">Maint</span>
                           </div>
                         </div>
                      </div>

                      {/* 2. Room Details & Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Room Details</h3>
                           <ul className="space-y-3 text-sm font-medium text-slate-600">
                              <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Maximum Guests:</strong> {selectedRoomType.maxOccupancy}</li>
                              <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Adults:</strong> {selectedRoomType.adults}</li>
                              <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Children:</strong> {selectedRoomType.children}</li>
                              <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Bed:</strong> {selectedRoomType.beds?.[0]?.type || 'Standard'}</li>
                              {(selectedRoomType as any).roomSize && <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Room Size:</strong> {(selectedRoomType as any).roomSize} m²</li>}
                              {(selectedRoomType as any).minStay && <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Minimum Stay:</strong> {(selectedRoomType as any).minStay} night(s)</li>}
                              {(selectedRoomType as any).maxStay && <li className="flex justify-between border-b border-slate-50 pb-2"><strong className="text-slate-900">Maximum Stay:</strong> {(selectedRoomType as any).maxStay} night(s)</li>}
                           </ul>
                        </div>
                        <div>
                           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Description</h3>
                           <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                             {selectedRoomType.description || 'No detailed description provided for this room category.'}
                           </p>
                        </div>
                      </div>

                      {/* 3. Linked Physical Rooms (The Interactive List) */}
                      <div className="border-t border-slate-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Physical Rooms — {linkedRooms.length}</h3>
                           <div className="flex gap-2">
                             <button onClick={() => setShowManualBooking(!showManualBooking)} className={`text-xs font-black flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${showManualBooking ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:text-indigo-700'}`}>
                               <User size={14} /> Manual Booking
                             </button>
                             <button onClick={() => {
                               setSelectedRoomType(null);
                               if (onNavigateAddPhysicalRoom) onNavigateAddPhysicalRoom();
                               else router.push('?tab=add-physical-room');
                             }} className="text-xs font-black text-[#0065eb] hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                               <Plus size={14} /> Add Room
                             </button>
                           </div>
                        </div>

                        {/* MANUAL BOOKING FORM FOR ROOM TYPE */}
                        <AnimatePresence>
                          {showManualBooking && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl space-y-4">
                                <div className="flex justify-between items-center mb-4 pb-3 border-b border-indigo-100">
                                  <div>
                                    <h5 className="text-sm font-black text-indigo-900">Manual Guest Assignment</h5>
                                    <p className="text-xs font-bold text-indigo-500">{selectedRoomType.roomTypeName}</p>
                                  </div>
                                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold border border-indigo-200 shadow-sm">Admin Action</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Check-In *</label>
                                    <input type="date" value={manualBookingData.checkIn} onChange={e => setManualBookingData(p => ({...p, checkIn: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Check-Out *</label>
                                    <input type="date" value={manualBookingData.checkOut} onChange={e => setManualBookingData(p => ({...p, checkOut: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Assign Physical Room *</label>
                                    <select value={manualBookingData.physicalRoomId} onChange={e => setManualBookingData(p => ({...p, physicalRoomId: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none relative">
                                       <option value="" disabled>Select a room...</option>
                                       {linkedRooms.filter(pr => pr.operationalStatus === 'active').map(pr => {
                                          const isOccupied = bookings.some(b => {
                                            if (b.physicalRoomId !== (pr._id || pr.id)) return false;
                                            if (!['confirmed', 'checked-in'].includes(b.status)) return false;
                                            const bIn = new Date(b.checkIn as string).getTime();
                                            const bOut = new Date(b.checkOut as string).getTime();
                                            const sIn = new Date(manualBookingData.checkIn).getTime();
                                            const sOut = new Date(manualBookingData.checkOut).getTime();
                                            if (!manualBookingData.checkIn || !manualBookingData.checkOut) return false;
                                            return bIn < sOut && bOut > sIn;
                                          });
                                          return (
                                            <option key={pr._id || pr.id} value={pr._id || pr.id} disabled={isOccupied} className={isOccupied ? "text-red-500 font-bold" : "text-slate-900"}>
                                              Room #{pr.roomNumber} {isOccupied ? '(Occupied/Conflict)' : '(Available)'}
                                            </option>
                                          );
                                       })}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Guest Name</label>
                                    <input type="text" placeholder="Walk-in Guest" value={manualBookingData.guestName} onChange={e => setManualBookingData(p => ({...p, guestName: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Guest Phone</label>
                                    <input type="text" placeholder="+252..." value={manualBookingData.guestPhone} onChange={e => setManualBookingData(p => ({...p, guestPhone: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" />
                                  </div>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer mt-2">
                                   <input type="checkbox" checked={manualBookingData.paymentReceived} onChange={e => setManualBookingData(p => ({...p, paymentReceived: e.target.checked}))} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                                   <span className="text-xs font-bold text-indigo-900">Payment Received (Mark as Paid)</span>
                                </label>
                                <button disabled={actionLoading === 'manual_booking'} onClick={() => handleManualBooking(rtId, selectedRoomType.roomTypeName)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                                  {actionLoading === 'manual_booking' ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Confirm Assignment
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {linkedRooms.length === 0 ? (
                           <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                             <DoorOpen size={32} className="mx-auto text-slate-300 mb-2" />
                             <span className="text-sm font-medium text-slate-500">No physical rooms linked yet.</span>
                           </div>
                        ) : (
                           <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                             <div className="grid grid-cols-4 p-4 border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-500">
                               <span>Room</span>
                               <span>Status</span>
                               <span>Housekeeping</span>
                               <span className="text-right">Details</span>
                             </div>
                             <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                               {linkedRooms.map(pr => {
                                  const isActive = pr.operationalStatus === 'active';
                                  const isClean = ['clean', 'inspected'].includes(pr.housekeepingStatus);
                                  
                                  const isOccupied = bookings.some(b => {
                                    if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return false;
                                    const matchesRoom = b.physicalRoomId === (pr._id || pr.id) || b.assignedRoomNumber === pr.roomNumber || b.roomName === pr.roomNumber || b.roomName === `${pr.roomTypeName} - ${pr.roomNumber}` || (b as any).roomId === (pr._id || pr.id);
                                    if (!matchesRoom) return false;
                                    const cIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
                                    cIn.setHours(0,0,0,0);
                                    const cOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
                                    cOut.setHours(0,0,0,0);
                                    return today.getTime() >= cIn.getTime() && today.getTime() < cOut.getTime();
                                  });

                                  let statusDisplay = 'Available';
                                  let statusColor = 'text-emerald-700 bg-emerald-100';
                                  if (!isActive) {
                                    statusDisplay = 'Maintenance';
                                    statusColor = 'text-rose-700 bg-rose-100';
                                  } else if (isOccupied) {
                                    statusDisplay = 'Occupied';
                                    statusColor = 'text-indigo-700 bg-indigo-100';
                                  }

                                  return (
                                    <div 
                                      key={pr._id || pr.id} 
                                      onClick={() => {
                                        setSelectedRoomType(null);
                                        setSelectedPhysicalRoom(pr);
                                      }}
                                      className="grid grid-cols-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                                    >
                                      <span className="font-black text-slate-900 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                          <DoorOpen size={14} />
                                        </div>
                                        {pr.roomNumber}
                                      </span>
                                      
                                      <div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-white/20 ${statusColor}`}>
                                          {statusDisplay}
                                        </span>
                                      </div>
                                      
                                      <div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${isClean ? 'text-teal-700 bg-teal-50' : 'text-orange-700 bg-orange-50'}`}>
                                          {pr.housekeepingStatus}
                                        </span>
                                      </div>
                                      
                                      <div className="text-right">
                                        <button className="p-2 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                          <ChevronRight size={18} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                               })}
                             </div>
                           </div>
                        )}
                      </div>
                      
                      {/* 4. 7-DAY INTERACTIVE CALENDAR FOR ROOM TYPE */}
                      <div className="pt-4 border-t border-slate-100">
                         <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">7-Day Live Availability</h4>
                         <p className="text-[10px] text-slate-500 font-bold mb-4">Click any <span className="text-emerald-500">Green</span> available date to instantly open manual booking for this room type.</p>
                         <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                           {calendarDays.map(day => {
                             const currentCalendarDay = new Date(day);
                             currentCalendarDay.setHours(0, 0, 0, 0);

                             let occupiedCountForDay = 0;
                             bookings.forEach(b => {
                               if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return;
                               const isThisRoomType = b.roomTypeId === rtId || linkedRooms.some(pr => b.physicalRoomId === (pr._id || pr.id) || b.assignedRoomNumber === pr.roomNumber || b.roomName === pr.roomNumber);
                               if (isThisRoomType) {
                                 const cIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
                                 cIn.setHours(0, 0, 0, 0);
                                 const cOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
                                 cOut.setHours(0, 0, 0, 0);
                                 if (currentCalendarDay.getTime() >= cIn.getTime() && currentCalendarDay.getTime() < cOut.getTime()) {
                                   occupiedCountForDay++;
                                 }
                               }
                             });

                             const availForDay = Math.max(0, total - maintenance - occupiedCountForDay);
                             const isSoldOut = availForDay === 0;
                             let bg = !isSoldOut ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 hover:scale-105 cursor-pointer shadow-sm' : 'bg-rose-100 text-rose-700 border-rose-200 opacity-60';

                             return (
                               <div key={day.toISOString()} onClick={() => {
                                  if (!isSoldOut) {
                                     setManualBookingData(p => ({ ...p, checkIn: format(day, 'yyyy-MM-dd'), checkOut: format(addDays(day, 1), 'yyyy-MM-dd'), physicalRoomId: '' }));
                                     setShowManualBooking(true);
                                  }
                               }} className={`min-w-[80px] p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${bg}`}>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{format(day, 'EEE')}</span>
                                  <span className="text-xl font-black my-1">{format(day, 'dd')}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider">{isSoldOut ? 'Sold Out' : `${availForDay} Avail`}</span>
                               </div>
                             )
                           })}
                         </div>
                      </div>

                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedRoomType._id || selectedRoomType.id || '';
                    setSelectedRoomType(null);
                    router.push(`/dashboard/hotel?tab=add-room&id=${id}`);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Edit3 size={16} /> Edit Room Type
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          DEEP DIVE MODAL FOR PHYSICAL ROOMS
      ==================================================================== */}
      <AnimatePresence>
        {selectedPhysicalRoom && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setSelectedPhysicalRoom(null); setShowManualBooking(false); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-blue-200/50">
                    #{selectedPhysicalRoom.roomNumber}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Room {selectedPhysicalRoom.roomNumber}</h2>
                    <p className="text-xs font-semibold text-slate-500">{selectedPhysicalRoom.roomTypeName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPhysicalRoom(null); setShowManualBooking(false); }}
                  className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

{/* Modal Body */}
              <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                
                {/* 4-Grid Status Area */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedPhysicalRoom.operationalStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {selectedPhysicalRoom.operationalStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Housekeeping</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${['clean', 'inspected'].includes(selectedPhysicalRoom.housekeepingStatus) ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                      {selectedPhysicalRoom.housekeepingStatus}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Floor</span>
                    <span className="text-sm font-black text-slate-900">{selectedPhysicalRoom.floor || '—'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Building/Wing</span>
                    <span className="text-sm font-black text-slate-900">{selectedPhysicalRoom.building || '—'}</span>
                  </div>
                </div>

                {/* 7-DAY INTERACTIVE CALENDAR */}
                <div>
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">7-Day Live Availability</h4>
                   <p className="text-[10px] text-slate-500 font-bold mb-4">Click any <span className="text-emerald-500">Green</span> available date to instantly book or occupy this specific room.</p>
                   <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                     {calendarDays.map(day => {
                       const currentCalendarDay = new Date(day);
                       currentCalendarDay.setHours(0, 0, 0, 0);
                       
                       let status = 'Available';
                       let occupyingBooking: any = null; // Track who is occupying it
                       if (selectedPhysicalRoom.operationalStatus !== 'active') status = 'Maintenance';
                       else {
                         const isOccupied = bookings.some(b => {
                            const matchesPhysical = b.physicalRoomId === (selectedPhysicalRoom._id || selectedPhysicalRoom.id) || b.assignedRoomNumber === selectedPhysicalRoom.roomNumber || b.roomName === selectedPhysicalRoom.roomNumber;
                            if (!matchesPhysical) return false;
                            if (!['pending', 'confirmed', 'checked-in'].includes(b.status)) return false;
                            const cIn = new Date((b.checkIn as any)?.seconds ? (b.checkIn as any).seconds * 1000 : b.checkIn);
                            cIn.setHours(0,0,0,0);
                            const cOut = new Date((b.checkOut as any)?.seconds ? (b.checkOut as any).seconds * 1000 : b.checkOut);
                            cOut.setHours(0,0,0,0);
                            const overlap = currentCalendarDay.getTime() >= cIn.getTime() && currentCalendarDay.getTime() < cOut.getTime();
                            if (overlap) occupyingBooking = b;
                            return overlap;
                         });
                         if (isOccupied) status = 'Occupied';
                       }

                       let bg = status === 'Available' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 hover:scale-105 cursor-pointer shadow-sm' : 
                                status === 'Occupied' ? 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 hover:scale-105 cursor-pointer shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200 opacity-60';

                       function updateBookingStatus(occupyingBooking: any, arg1: string) {
                         throw new Error('Function not implemented.');
                       }

                       return (
                         <div key={day.toISOString()} onClick={() => {
                            if (status === 'Available') {
                               setManualBookingData(p => ({ ...p, checkIn: format(day, 'yyyy-MM-dd'), checkOut: format(addDays(day, 1), 'yyyy-MM-dd'), physicalRoomId: selectedPhysicalRoom._id || selectedPhysicalRoom.id || '' }));
                               setShowManualBooking(true);
                            } else if (status === 'Occupied' && occupyingBooking) {
                               // 🔥 KALA JARKA / UNLOCKING ROOM
                               const guest = occupyingBooking.guestName || 'a guest';
                               const coutDate = new Date((occupyingBooking.checkOut as any)?.seconds ? (occupyingBooking.checkOut as any).seconds * 1000 : occupyingBooking.checkOut);
                               if (confirm(`This room is blocked by ${guest} until ${format(coutDate, 'MMM do')}.\n\nDo you want to CANCEL their booking to unlock this room?`)) {
                                  updateBookingStatus(occupyingBooking, 'cancelled');
                               }
                            }
                         }} className={`min-w-[80px] p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${bg}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{format(day, 'EEE')}</span>
                            <span className="text-xl font-black my-1">{format(day, 'dd')}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider">{status}</span>
                         </div>
                       )
                     })}
                   </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Internal Notes</h4>
                  <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-2xl">
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedPhysicalRoom.notes || 'No internal notes provided for this physical unit.'}
                    </p>
                  </div>
                </div>

               {/* In-Modal Quick Actions */}
                <div>
                   <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Quick Actions</h4>
                   <div className="flex flex-wrap gap-3">
                      {/* 1. Manual Booking Toggle Button */}
                      <button onClick={() => {
                         setManualBookingData(p => ({ ...p, checkIn: '', checkOut: '', physicalRoomId: selectedPhysicalRoom._id || selectedPhysicalRoom.id || '' }));
                         setShowManualBooking(!showManualBooking);
                      }} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border flex items-center gap-2 ${showManualBooking ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
                         <User size={14}/> {showManualBooking ? 'Cancel Booking' : 'Manual Occupy'}
                      </button>

                      {/* 2. Housekeeping Status Toggle */}
                      <button
                        type="button"
                        disabled={actionLoading === (selectedPhysicalRoom._id || selectedPhysicalRoom.id)}
                        onClick={() => {
                          const rId = selectedPhysicalRoom._id || selectedPhysicalRoom.id || '';
                          const isClean = ['clean', 'inspected'].includes(selectedPhysicalRoom.housekeepingStatus);
                          updatePhysicalRoomStatus(rId, isClean ? 'dirty' : 'clean');
                          setSelectedPhysicalRoom(prev => prev ? { ...prev, housekeepingStatus: isClean ? 'dirty' : 'clean' } : null);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                          ['clean', 'inspected'].includes(selectedPhysicalRoom.housekeepingStatus) 
                            ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' 
                            : 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        {['clean', 'inspected'].includes(selectedPhysicalRoom.housekeepingStatus) ? 'Mark as Dirty' : 'Mark as Clean'}
                      </button>

                      {/* 3. Maintenance Status Toggle */}
                      <button
                        type="button"
                        disabled={actionLoading === (selectedPhysicalRoom._id || selectedPhysicalRoom.id)}
                        onClick={() => {
                          const rId = selectedPhysicalRoom._id || selectedPhysicalRoom.id || '';
                          const isActive = selectedPhysicalRoom.operationalStatus === 'active';
                          updatePhysicalRoomStatus(rId, undefined, isActive ? 'out_of_order' : 'active');
                          setSelectedPhysicalRoom(prev => prev ? { ...prev, operationalStatus: isActive ? 'out_of_order' : 'active' } : null);
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                          selectedPhysicalRoom.operationalStatus === 'active' 
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {selectedPhysicalRoom.operationalStatus === 'active' ? 'Set Out of Order' : 'Set as Active'}
                      </button>
                   </div>

                   {/* --- THE INLINE FORM FOR MANUAL OCCUPY --- */}
                   <AnimatePresence>
                     {showManualBooking && (
                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                         <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl space-y-4">
                           <div className="flex justify-between items-center mb-2 pb-3 border-b border-indigo-100">
                             <div>
                               <h5 className="text-sm font-black text-indigo-900">Manual Booking: Room #{selectedPhysicalRoom.roomNumber}</h5>
                               <p className="text-xs font-bold text-indigo-500">{selectedPhysicalRoom.roomTypeName}</p>
                             </div>
                             <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold border border-indigo-200 shadow-sm">Admin Action</span>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Check-In *</label>
                               <input type="date" value={manualBookingData.checkIn} onChange={e => setManualBookingData(p => ({...p, checkIn: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                             <div>
                               <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Check-Out (Frees Room) *</label>
                               <input type="date" value={manualBookingData.checkOut} onChange={e => setManualBookingData(p => ({...p, checkOut: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                             <div>
                               <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Guest Name</label>
                               <input type="text" placeholder="Walk-in Guest" value={manualBookingData.guestName} onChange={e => setManualBookingData(p => ({...p, guestName: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                             <div>
                               <label className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Guest Phone</label>
                               <input type="text" placeholder="+252..." value={manualBookingData.guestPhone} onChange={e => setManualBookingData(p => ({...p, guestPhone: e.target.value}))} className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-sm font-bold bg-white text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                           </div>

                           <label className="flex items-center gap-2 cursor-pointer mt-2">
                              <input type="checkbox" checked={manualBookingData.paymentReceived} onChange={e => setManualBookingData(p => ({...p, paymentReceived: e.target.checked}))} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                              <span className="text-xs font-bold text-indigo-900">Payment Received (Mark as Paid)</span>
                           </label>
                           
                           <button disabled={actionLoading === 'manual_booking'} onClick={() => handleManualBooking(selectedPhysicalRoom.roomTypeId, selectedPhysicalRoom.roomNumber)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2">
                             {actionLoading === 'manual_booking' ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Confirm Booking
                           </button>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

              </div>
              {/* Modal Footer */}

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedPhysicalRoom._id || selectedPhysicalRoom.id || '';
                    setSelectedPhysicalRoom(null);
                    router.push(`/dashboard/hotel?tab=add-physical-room&id=${id}`);
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Edit3 size={16} /> Edit Room Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ============================================================================
// HELPER SUB-COMPONENTS
// ============================================================================

function KpiCard({ title, value, icon: Icon, color, bg }: { title: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center ${color} mb-3`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{title}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: { icon: any; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-1">{title}</h3>
      <p className="text-xs font-semibold text-slate-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}