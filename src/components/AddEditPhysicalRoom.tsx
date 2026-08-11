'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DoorOpen, Hash, Layers, Building, ToggleLeft, 
  PaintBucket, StickyNote, Save, Plus, Loader2, Info, CheckCircle2, ChevronDown
} from 'lucide-react';

interface AddEditPhysicalRoomProps {
  hotelId: string;
  physicalRoomId?: string | null; // If null/undefined, we are in Add Mode
}

interface RoomType {
  _id: string; // SQL ID
  roomTypeName: string;
}

export default function AddEditPhysicalRoom({ hotelId, physicalRoomId }: AddEditPhysicalRoomProps) {
  const router = useRouter();
  const isEditing = !!physicalRoomId;

  // --- UI State ---
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

        // 1. Fetch available Room Types for the dropdown (from SQL 'rooms' table)
        const roomRes = await fetch(`/api/rooms?hotelId=${hotelId}`);
        const roomData = await roomRes.json();
        
        if (roomRes.ok) {
          // Adapt standard API response (array or wrapped array)
          const list = Array.isArray(roomData) ? roomData : (roomData.rooms || []);
          setRoomTypes(list);
        } else {
          throw new Error("Failed to load Room Types.");
        }

        // 2. If editing, fetch the specific physical room (from SQL 'physical_rooms' table)
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
  // SAVE HANDLER (SQL APIs)
  // ============================================================================
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomTypeId) {
      setError("Please choose which Room Type this room belongs to.");
      return;
    }
    if (!roomNumber.trim()) {
      setError("Room number is required.");
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
      const endpoint = isEditing ? `/api/physical-rooms?id=${physicalRoomId}` : '/api/physical-rooms';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to save physical room.");
      }

      // Success
      router.back(); 
      router.refresh(); // Force Next.js to re-fetch SQL data on the previous page
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
      <div className="flex justify-center py-32">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* --- HERO HEADER (Matches Flutter SliverAppBar) --- */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 h-48 relative overflow-hidden flex items-end px-6 md:px-12 pb-6">
        <DoorOpen className="absolute -right-8 -bottom-8 w-64 h-64 text-white opacity-10" />
        <h1 className="text-3xl font-bold text-white z-10">
          {isEditing ? 'Edit Room' : 'Add Physical Room'}
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <form onSubmit={handleSave} className="bg-white p-6 md:p-10 rounded-[2rem] shadow-lg border border-slate-100">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-semibold flex items-center gap-3 border border-red-100">
              <Info size={20} /> {error}
            </div>
          )}

          {/* --- ROOM TYPE --- */}
          <SectionLabel icon={<Layers size={18} />} text="Room Type" />
          <div className="mt-3 mb-8">
            {roomTypes.length === 0 ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm font-medium">
                No Room Types yet — create a Room Type first, then add physical rooms to it.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedRoomTypeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const rt = roomTypes.find(r => r._id === id);
                    setSelectedRoomTypeId(id);
                    setSelectedRoomTypeName(rt?.roomTypeName || '');
                  }}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Choose a Room Type</option>
                  {roomTypes.map((rt) => (
                    <option key={rt._id} value={rt._id}>{rt.roomTypeName}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-blue-600">
                  <ChevronDown size={20} />
                </div>
              </div>
            )}
          </div>

          {/* --- ROOM IDENTITY --- */}
          <SectionLabel icon={<Hash size={18} />} text="Room Identity" />
          <div className="mt-3 mb-8 space-y-4">
            <ModernField
              label="Room Number *"
              hint="e.g. 101"
              icon={<Hash size={18} />}
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernField
                label="Floor"
                hint="e.g. 1"
                icon={<Layers size={18} />}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
              <ModernField
                label="Building / Wing"
                hint="e.g. Main"
                icon={<Building size={18} />}
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
              />
            </div>
          </div>

          {/* --- OPERATIONAL STATUS --- */}
          <SectionLabel icon={<ToggleLeft size={18} />} text="Operational Status" />
          <div className="mt-3 mb-8">
            <StatusChips
              options={[
                { key: 'active', label: 'Active', colorClass: 'text-green-700 bg-green-50 border-green-500' },
                { key: 'out_of_order', label: 'Out of Order', colorClass: 'text-orange-700 bg-orange-50 border-orange-500' },
                { key: 'out_of_service', label: 'Out of Service', colorClass: 'text-red-700 bg-red-50 border-red-500' },
              ]}
              selected={operationalStatus}
              onSelect={setOperationalStatus}
            />
          </div>

          {/* --- HOUSEKEEPING STATUS --- */}
          <SectionLabel icon={<PaintBucket size={18} />} text="Housekeeping" />
          <div className="mt-3 mb-8">
            <StatusChips
              options={[
                { key: 'clean', label: 'Clean', colorClass: 'text-teal-700 bg-teal-50 border-teal-500' },
                { key: 'dirty', label: 'Dirty', colorClass: 'text-amber-800 bg-amber-50 border-amber-600' },
                { key: 'inspected', label: 'Inspected', colorClass: 'text-blue-700 bg-blue-50 border-blue-500' },
              ]}
              selected={housekeepingStatus}
              onSelect={setHousekeepingStatus}
            />
          </div>

          {/* --- INTERNAL NOTES --- */}
          <SectionLabel icon={<StickyNote size={18} />} text="Internal Notes" />
          <div className="mt-3 mb-10">
            <div className="relative">
              <div className="absolute left-4 top-4 text-slate-400">
                <StickyNote size={18} className="text-blue-600"/>
              </div>
              <textarea
                rows={3}
                placeholder="e.g. Near elevator, connecting door to 102..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* --- SUBMIT BUTTON --- */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : (isEditing ? <Save size={24} /> : <Plus size={24} />)}
            {isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Room')}
          </button>

        </form>
      </div>
    </div>
  );
}

// ============================================================================
// UI SUB-COMPONENTS
// ============================================================================

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-blue-700 font-bold uppercase tracking-wider text-xs">
      {icon} <span>{text}</span>
    </div>
  );
}

function ModernField({ 
  label, hint, icon, value, onChange, required = false 
}: { 
  label: string; hint: string; icon: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean 
}) {
  return (
    <div>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
          {icon}
        </div>
        <input
          type="text"
          placeholder={hint}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-medium"
        />
        <label className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider rounded-full border border-slate-100">
          {label}
        </label>
      </div>
    </div>
  );
}

function StatusChips({ 
  options, selected, onSelect 
}: { 
  options: { key: string; label: string; colorClass: string }[]; 
  selected: string; 
  onSelect: (val: string) => void; 
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
              isSelected 
                ? opt.colorClass 
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isSelected && <CheckCircle2 size={16} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}