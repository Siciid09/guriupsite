'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/app/lib/firebase'; // <-- ADD THIS IMPORT
import { 
  DoorOpen, Hash, Layers, Building, 
  StickyNote, Save, Plus, Loader2, Info, CheckCircle2, ChevronDown,
  ShieldAlert, Sparkles, AlertCircle, ToggleLeft, PaintBucket
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface AddEditPhysicalRoomProps {
  hotelId: string;
  physicalRoomId?: string | null;
}

interface RoomType {
  _id?: string;
  id?: string;
  roomTypeName: string;
}

// ============================================================================
// STYLED INPUTS (Matching your Super Modern Theme)
// ============================================================================
const InputStyles = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all placeholder:text-slate-400";
const SelectStyles = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all appearance-none cursor-pointer pr-10";

export default function AddEditPhysicalRoom({ hotelId, physicalRoomId }: AddEditPhysicalRoomProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = physicalRoomId || searchParams.get('id'); // Grabs ID from URL to fix blank edit screen
  const isEditing = !!editId;

  // --- UI State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  // --- Form State ---
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('');
  const [selectedRoomTypeName, setSelectedRoomTypeName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [building, setBuilding] = useState('');
  const [notes, setNotes] = useState('');
  const [operationalStatus, setOperationalStatus] = useState('active');
  const [housekeepingStatus, setHousekeepingStatus] = useState('clean');

  // ============================================================================
  // INITIAL DATA FETCHING (SQL APIs)
  // ============================================================================
  useEffect(() => {
    async function loadData() {
      try {
        setIsFetching(true);
        setError(null);

        // 1. Fetch available Room Types safely
        const roomRes = await fetch(`/api/rooms?hotelId=${hotelId}`);
        const roomData = await roomRes.json();
        
        if (roomRes.ok) {
          const list = Array.isArray(roomData) ? roomData : (roomData.roomTypes || roomData.data || []);
          setRoomTypes(list);
        } else {
          throw new Error("Failed to load Room Types.");
        }

        // 2. Fetch specific physical room if editing
        if (isEditing && physicalRoomId) {
          const physRes = await fetch(`/api/physical-rooms?id=${physicalRoomId}`);
          const physData = await physRes.json();

          if (physRes.ok && physData) {
            setSelectedRoomTypeId(physData.roomTypeId || '');
            setSelectedRoomTypeName(physData.roomTypeName || '');
            setRoomNumber(physData.roomNumber || '');
            setFloor(physData.floor || '');
            setBuilding(physData.building || '');
            setNotes(physData.notes || '');
            setOperationalStatus(physData.operationalStatus || 'active');
            setHousekeepingStatus(physData.housekeepingStatus || 'clean');
          } else {
            throw new Error("Failed to load physical room data.");
          }
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading data.");
      } finally {
        setIsFetching(false);
      }
    }

    if (hotelId) loadData();
  }, [hotelId, physicalRoomId, isEditing]);

  // ============================================================================
  // SAVE HANDLER
  // ============================================================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomTypeId) {
      setError("Please choose a Room Type.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!roomNumber.trim()) {
      setError("Room number is required.");
      const el = document.getElementById('roomNumber');
      if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      hotelId,
      roomTypeId: selectedRoomTypeId,
      roomTypeName: selectedRoomTypeName,
      roomNumber: roomNumber.trim(),
      floor: floor.trim(),
      building: building.trim(),
      notes: notes.trim(),
      operationalStatus,
      housekeepingStatus,
    };

    try {
      // 1. Get the current user's auth token
      const user = auth.currentUser;
      const idToken = user ? await user.getIdToken() : '';

      const endpoint = isEditing ? `/api/physical-rooms?id=${editId}` : '/api/physical-rooms';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) throw new Error(resData.error || "Failed to save physical room.");

      // SHOW ANIMATED SUCCESS & REDIRECT
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard/hotel?tab=rooms';
      }, 1500);

    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // UI RENDER
  // ============================================================================
  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-36 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
      {/* SUCCESS ANIMATION OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 20, scale: 1 }} 
            exit={{ opacity: 0, y: -50, scale: 0.9 }} 
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black border border-emerald-400"
          >
            <CheckCircle2 size={24} className="animate-bounce" />
            {isEditing ? 'Successfully Updated!' : 'Successfully Added!'} Redirecting...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4">
        
        {/* ====================================================================
            MODERN INLINE HEADER
        ==================================================================== */}
        <div className="relative bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-inner shrink-0">
            <DoorOpen size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isEditing ? 'Edit Physical Room' : 'Add Physical Room'}
            </h1>
            <p className="text-sm font-semibold text-slate-500 mt-1">Assign a real room number to your existing room types.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl font-bold flex items-start gap-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Info size={20} className="shrink-0 mt-0.5"/> <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* 1. ROOM TYPE ASSIGNMENT */}
          <FormCard number="1" title="Room Type Assignment" description="Which category does this physical room belong to?">
            {roomTypes.length === 0 ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-bold flex items-center gap-3 shadow-sm">
                <AlertCircle size={20} className="shrink-0" />
                No Room Types found. You must create a Room Type before adding physical rooms.
              </div>
            ) : (
              <Field label="Select Room Type *">
                <div className="relative">
                  <select
                    value={selectedRoomTypeId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const rt = roomTypes.find(r => (r._id || r.id) === id);
                      setSelectedRoomTypeId(id);
                      setSelectedRoomTypeName(rt?.roomTypeName || '');
                    }}
                    className={SelectStyles}
                  >
                    <option value="" disabled>Choose a Room Type...</option>
                    {roomTypes.map((rt) => {
                      const rtId = rt._id || rt.id;
                      return <option key={rtId} value={rtId}>{rt.roomTypeName}</option>
                    })}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                </div>
              </Field>
            )}
          </FormCard>

          {/* 2. ROOM IDENTITY */}
          <FormCard number="2" title="Room Identity" description="The specific number and location in the hotel.">
            <div className="space-y-6">
              <Field label="Room Number *">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input
                    id="roomNumber"
                    type="text"
                    placeholder="e.g. 101"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className={`${InputStyles} pl-11`}
                  />
                </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Floor">
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input
                      type="text"
                      placeholder="e.g. 1"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className={`${InputStyles} pl-11`}
                    />
                  </div>
                </Field>
                <Field label="Building / Wing">
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input
                      type="text"
                      placeholder="e.g. Main"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      className={`${InputStyles} pl-11`}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </FormCard>

          {/* 3. STATUS & HOUSEKEEPING */}
          <FormCard number="3" title="Status & Housekeeping" description="Current condition of the physical room.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Field label="Operational Status">
                  <div className="flex flex-col gap-3 mt-3">
                    <StatusBtn 
                      active={operationalStatus === 'active'} 
                      onClick={() => setOperationalStatus('active')}
                      icon={CheckCircle2} label="Active" colorClass="bg-emerald-100 text-emerald-800 border-emerald-500" 
                    />
                    <StatusBtn 
                      active={operationalStatus === 'out_of_order'} 
                      onClick={() => setOperationalStatus('out_of_order')}
                      icon={ShieldAlert} label="Out of Order" colorClass="bg-amber-100 text-amber-800 border-amber-500" 
                    />
                    <StatusBtn 
                      active={operationalStatus === 'out_of_service'} 
                      onClick={() => setOperationalStatus('out_of_service')}
                      icon={AlertCircle} label="Out of Service" colorClass="bg-rose-100 text-rose-800 border-rose-500" 
                    />
                  </div>
                </Field>
              </div>
              <div>
                <Field label="Housekeeping Status">
                  <div className="flex flex-col gap-3 mt-3">
                    <StatusBtn 
                      active={housekeepingStatus === 'clean'} 
                      onClick={() => setHousekeepingStatus('clean')}
                      icon={Sparkles} label="Clean" colorClass="bg-teal-100 text-teal-800 border-teal-500" 
                    />
                    <StatusBtn 
                      active={housekeepingStatus === 'dirty'} 
                      onClick={() => setHousekeepingStatus('dirty')}
                      icon={PaintBucket} label="Dirty" colorClass="bg-orange-100 text-orange-800 border-orange-500" 
                    />
                    <StatusBtn 
                      active={housekeepingStatus === 'inspected'} 
                      onClick={() => setHousekeepingStatus('inspected')}
                      icon={CheckCircle2} label="Inspected" colorClass="bg-blue-100 text-blue-800 border-blue-500" 
                    />
                  </div>
                </Field>
              </div>
            </div>
          </FormCard>

          {/* 4. INTERNAL NOTES */}
          <FormCard number="4" title="Internal Notes" description="Private notes for staff and housekeeping.">
            <Field label="Room Notes">
              <div className="relative">
                <StickyNote className="absolute left-4 top-4 text-slate-400" size={18}/>
                <textarea
                  rows={3}
                  placeholder="e.g. Near elevator, connecting door to 102..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${InputStyles} pl-11 py-4 resize-none`}
                />
              </div>
            </Field>
          </FormCard>

          {/* FLOATING ACTION DOCK (STICKY INSIDE FORM CONTAINER) */}
          <div className="sticky bottom-6 z-[100] mt-8 flex justify-center w-full pointer-events-none animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-2.5 rounded-2xl flex items-center gap-3 pointer-events-auto">
              <button 
                type="submit" disabled={isLoading}
                className="px-10 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-blue-500/30 disabled:opacity-70 disabled:hover:bg-blue-600"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin"/> : (isEditing ? <Save size={18}/> : <Plus size={18}/>)} 
                {isLoading ? 'Saving...' : (isEditing ? 'Save Physical Room' : 'Add Physical Room')}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

// ============================================================================
// UI WRAPPERS & COMPONENTS
// ============================================================================

function FormCard({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-10 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center shrink-0 border border-indigo-100/50 shadow-inner">
          {number}
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1">{label}</label>
      {children}
    </div>
  );
}

function StatusBtn({ active, onClick, icon: Icon, label, colorClass }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
        active 
          ? colorClass 
          : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
      }`}
    >
      <Icon size={18} className={active ? '' : 'text-slate-400'} />
      {label}
    </button>
  );
}