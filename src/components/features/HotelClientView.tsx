'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  MapPin, 
  Wifi, 
  Coffee, 
  Car, 
  Tv, 
  CheckCircle, 
  X, 
  ChevronRight, 
  Calendar, 
  User, 
  CreditCard,
  Lock,
  Share2,
  Heart
} from 'lucide-react';

// --- 1. DEFINED INTERFACES (Fixes "implicitly has 'any' type" errors) ---

interface Review {
  id: string;
  user: string;
  rating: number;
  text: string;
  date: string;
}

interface Room {
  id: string;
  name: string;
  price: number;
  capacity: number;
  features: string[];
  images?: string[];
}

interface Hotel {
  id: string;
  slug: string; // Fixes "Property 'slug' does not exist"
  name: string;
  city: string;
  address?: string;
  price: number; // Base price
  rating: number;
  images: string[];
  description?: string;
  features?: string[]; // e.g., ['wifi', 'pool']
  reviews?: Review[];
  rooms?: Room[];
  isVerified?: boolean;
}

// Props for the main component (if any are passed from parent)
interface HotelClientViewProps {
  initialHotel?: Hotel; // Optional, in case you pass data in
}

// Props for the Action Button (Fixes "Property 'isDark' does not exist")
interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  color?: string; // e.g., 'text-red-500'
  onClick: () => void;
  isLocked?: boolean;
  isDark?: boolean; // <--- ADDED THIS to fix the specific error
}

// Props for Inputs
interface SimpleInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

// --- 2. HELPER COMPONENTS ---

const ActionButton = ({ icon: Icon, label, color, onClick, isLocked, isDark }: ActionButtonProps) => {
  return (
    <button 
      onClick={onClick}
      disabled={isLocked}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon className={`w-4 h-4 ${color || ''}`} />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
};

// Fixes: Binding element 'hotel', 'isVerified' implicitly has an 'any' type
const HotelHeader = ({ hotel, isVerified }: { hotel: Hotel; isVerified: boolean }) => (
  <div className="mb-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {isVerified && (
            <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
          <span className="bg-[#0065eb] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
            Hotel
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2">{hotel.name}</h1>
        <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
          <MapPin className="w-4 h-4" />
          {hotel.city}, {hotel.address || 'Somalia'}
        </div>
      </div>
      <div className="flex flex-col items-end">
         <div className="flex items-center gap-1 mb-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-black text-slate-900">{hotel.rating}</span>
            <span className="text-sm text-gray-400 font-medium">/ 5.0</span>
         </div>
         <span className="text-xs font-bold text-[#0065eb] underline cursor-pointer">
           See all reviews
         </span>
      </div>
    </div>
  </div>
);

// Fixes: Binding element 'rooms', 'onBook' implicitly has an 'any' type
const RoomsList = ({ rooms, onBook }: { rooms: Room[]; onBook: (room: Room) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {rooms.map((room) => (
        <div key={room.id} className="border border-gray-200 rounded-3xl p-6 hover:border-[#0065eb] transition-all group bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{room.name}</h3>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <User className="w-3 h-3" /> {room.capacity} Guests
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#0065eb]">${room.price}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Per Night</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {room.features.map((feat, i) => (
              <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold">
                {feat}
              </span>
            ))}
          </div>

          <button 
            onClick={() => onBook(room)}
            className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider group-hover:bg-[#0065eb] transition-colors flex items-center justify-center gap-2"
          >
            Select Room <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Fixes: Binding element 'reviews', 'hotelId' implicitly has an 'any' type
const ReviewsSection = ({ reviews, hotelId }: { reviews: Review[]; hotelId: string }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-3xl p-8 mb-12">
      <h3 className="text-2xl font-black text-slate-900 mb-6">Guest Reviews</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#0065eb]/10 rounded-full flex items-center justify-center text-[#0065eb] font-black">
                    {review.user.charAt(0)}
                 </div>
                 <div>
                    <div className="font-bold text-slate-900 text-sm">{review.user}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{review.date}</div>
                 </div>
               </div>
               <div className="flex items-center gap-1 bg-yellow-400/20 px-2 py-1 rounded-lg">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs font-black text-yellow-700">{review.rating}</span>
               </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">"{review.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Fixes: Binding element 'hotel', 'rooms', 'preSelectedRoom' implicitly has an 'any' type
const BookingModal = ({ 
  hotel, 
  rooms, 
  preSelectedRoom, 
  onClose, 
  isVerified 
}: { 
  hotel: Hotel; 
  rooms: Room[]; 
  preSelectedRoom: Room | null; 
  onClose: () => void; 
  isVerified: boolean; 
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState(preSelectedRoom?.id || rooms[0]?.id);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Modal Header */}
        <div className="bg-[#0065eb] p-6 text-white flex justify-between items-start">
           <div>
             <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1 block">Booking At</span>
             <h2 className="text-2xl font-black">{hotel.name}</h2>
             {isVerified && <div className="flex items-center gap-1 text-xs font-bold mt-1 opacity-90"><CheckCircle className="w-3 h-3"/> Verified Partner</div>}
           </div>
           <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Left: Form */}
           <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-gray-400 mb-1 block">Select Room</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-[#0065eb]"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                   {rooms.map(r => (
                     <option key={r.id} value={r.id}>{r.name} - ${r.price}</option>
                   ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <SimpleInput label="Check In" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
                 <SimpleInput label="Check Out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
              
              <SimpleInput label="Guests" type="number" value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} />
           </div>

           {/* Right: Summary */}
           <div className="bg-gray-50 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                 <h4 className="text-lg font-black text-slate-900 mb-4">Price Summary</h4>
                 <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                    <span>{activeRoom?.name} x 1 Night</span>
                    <span>${activeRoom?.price}</span>
                 </div>
                 <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                    <span>Taxes & Fees</span>
                    <span>$15</span>
                 </div>
                 <div className="border-t border-gray-200 my-4"></div>
                 <div className="flex justify-between text-xl font-black text-[#0065eb]">
                    <span>Total</span>
                    <span>${(activeRoom?.price || 0) + 15}</span>
                 </div>
              </div>
              
              <button className="w-full bg-[#0065eb] text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all mt-6">
                Confirm Booking
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

// Fixes: Binding element 'label', 'value', 'onChange' implicitly has an 'any' type
const SimpleInput = ({ label, value, onChange, type = "text" }: SimpleInputProps) => (
  <div>
    <label className="text-xs font-black uppercase text-gray-400 mb-1 block">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-sm outline-none focus:border-[#0065eb] transition-colors"
    />
  </div>
);


// --- 3. MAIN COMPONENT ---

const HotelClientView = ({ initialHotel }: HotelClientViewProps) => {
  // FIX: Explicitly type the state as Hotel[] to avoid 'never' error
  const [recentHotels, setRecentHotels] = useState<Hotel[]>([]); 
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Mock data if no initialHotel is provided
  const hotelData: Hotel = initialHotel || {
    id: 'h1',
    slug: 'grand-hargeisa',
    name: 'Grand Hargeisa Hotel',
    city: 'Hargeisa',
    address: 'Road 1, Koodbuur',
    price: 120,
    rating: 4.8,
    images: ['/hotel1.jpg', '/hotel2.jpg'], // Placeholders
    isVerified: true,
    features: ['Free Wifi', 'Swimming Pool', 'Gym', 'Breakfast Included'],
    rooms: [
      { id: 'r1', name: 'Deluxe King', price: 120, capacity: 2, features: ['King Bed', 'Balcony', 'City View'] },
      { id: 'r2', name: 'Twin Suite', price: 180, capacity: 4, features: ['2 Queen Beds', 'Living Area', 'Kitchenette'] },
    ],
    reviews: [
      { id: 'rev1', user: 'Ahmed M.', rating: 5, text: 'Amazing stay! The staff was incredibly helpful.', date: 'Oct 2025' },
      { id: 'rev2', user: 'Sarah L.', rating: 4, text: 'Great location, close to everything.', date: 'Sep 2025' },
    ]
  };

  const handleBookClick = (room: Room) => {
    setSelectedRoom(room);
    setIsBookModalOpen(true);
  };

  // Example of using the state that was causing errors
  useEffect(() => {
    // Simulate fetching recent hotels and setting state
    const fetchRecent = async () => {
       const mockRecent: Hotel[] = [hotelData];
       setRecentHotels(mockRecent);
    };
    fetchRecent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image Section */}
      <div className="h-[50vh] md:h-[60vh] relative w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000" 
          alt={hotelData.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/30"></div>
        
        {/* Top Actions */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
           <ActionButton 
             icon={ChevronRight} 
             label="Back" 
             onClick={() => window.history.back()} 
             isDark={true} // Passed safely now
             color="text-white"
           />
           <div className="flex gap-2">
             <ActionButton 
               icon={Share2} 
               label="Share" 
               onClick={() => {}} 
               isDark={true} 
               color="text-white"
             />
             <ActionButton 
               icon={Heart} 
               label="Save" 
               onClick={() => {}} 
               isDark={true} 
               color="text-red-500"
             />
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-[40px] shadow-xl p-8 md:p-12 mb-10">
           {/* Header */}
           <HotelHeader hotel={hotelData} isVerified={!!hotelData.isVerified} />

           {/* Features Pills */}
           <div className="flex flex-wrap gap-3 mb-12">
             {hotelData.features?.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-xs font-bold uppercase text-gray-600">
                   <CheckCircle className="w-4 h-4 text-[#0065eb]" /> {feat}
                </div>
             ))}
           </div>

           {/* Rooms */}
           <h2 className="text-2xl font-black text-slate-900 mb-6">Available Rooms</h2>
           <RoomsList rooms={hotelData.rooms || []} onBook={handleBookClick} />

           {/* Reviews */}
           <ReviewsSection reviews={hotelData.reviews || []} hotelId={hotelData.id} />
        </div>
      </div>

      {/* Booking Modal */}
      {isBookModalOpen && (
        <BookingModal 
          hotel={hotelData}
          rooms={hotelData.rooms || []}
          preSelectedRoom={selectedRoom}
          onClose={() => setIsBookModalOpen(false)}
          isVerified={!!hotelData.isVerified}
        />
      )}
    </div>
  );
};

export default HotelClientView;