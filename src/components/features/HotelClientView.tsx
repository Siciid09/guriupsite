'use client';

import { useState } from 'react';
import type { Hotel, Room, Review } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// =======================================================================
//  Helper Components for the Client View
// =======================================================================

const HotelImageHeader = ({ hotel }: { hotel: Hotel }) => (
    <div className="relative w-full h-[300px] md:h-[400px]">
        <Image src={hotel.images[0]} alt={hotel.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold">{hotel.name}</h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-lg flex items-center gap-2"><MapPin size={20} /> {hotel.location.area}</p>
                <div className="flex items-center gap-1 bg-amber-500 px-2 py-1 rounded-md text-sm font-bold">
                    <Star size={16} /> {hotel.rating.toFixed(1)}
                </div>
            </div>
        </div>
    </div>
);

const AboutTab = ({ hotel }: { hotel: Hotel }) => (
    <div className="space-y-10">
        <div>
            <h3 className="text-2xl font-bold text-black mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{hotel.description}</p>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-black mb-6">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(hotel.amenities).filter(([, value]) => value).map(([key]) => (
                    <div key={key} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                        <CheckCircle className="text-green-500 flex-shrink-0" size={20}/>
                        <span className="text-sm font-medium text-gray-800 capitalize">{key.replace('has', '')}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const RoomCard = ({ room }: { room: Room }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-1/3 h-48 sm:h-auto">
            <Image src={room.images[0] || '/placeholder-image.png'} alt={room.roomTypeName} fill className="object-cover" />
        </div>
        <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
                <h4 className="text-xl font-bold text-black">{room.roomTypeName}</h4>
                <p className="text-sm text-gray-600 mt-1">Max Occupancy: {room.maxOccupancy}</p>
            </div>
            <div className="flex justify-between items-center mt-4">
                <p className="text-2xl font-bold text-[#0164E5]">${room.pricePerNight}<span className="text-sm font-normal text-gray-500">/night</span></p>
                <button className="bg-[#0164E5] text-white font-bold py-2 px-6 rounded-lg text-sm hover:bg-blue-700 transition-colors">Book</button>
            </div>
        </div>
    </div>
);

const RoomsTab = ({ rooms }: { rooms: Room[] }) => (
    <div className="space-y-6">
        {rooms.length > 0 ? rooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-gray-600">No specific room types are listed for this hotel at the moment.</p>}
    </div>
);

const ReviewForm = ({ hotelId }: { hotelId: string }) => {
    const { user } = useAuth();
    // This form would have state and an onSubmit handler to post to '/api/reviews'
    return (
        <div className="bg-slate-50 p-6 rounded-2xl border">
            <h4 className="text-xl font-bold text-black mb-4">Leave a Review</h4>
            {user ? (
                <form className="space-y-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="text-gray-300 cursor-pointer" />)}
                    </div>
                    <textarea placeholder={`Share your experience, ${user.displayName}...`} className="w-full p-3 border rounded-md min-h-[100px]" required></textarea>
                    <button type="submit" className="bg-[#0164E5] text-white font-bold py-2 px-6 rounded-lg">Submit Review</button>
                </form>
            ) : (
                <p className="text-gray-600">Please <Link href="/login" className="text-[#0164E5] underline font-semibold">log in</Link> to leave a review.</p>
            )}
        </div>
    );
};

const ReviewCard = ({ review }: { review: Review }) => (
    <div className="border-b py-6">
        <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-black">{review.userName}</p>
            <div className="flex items-center gap-1 text-amber-500">
                <Star size={16} className="fill-current" /> 
                <span className="font-bold">{review.rating.toFixed(1)}</span>
            </div>
        </div>
        <p className="text-gray-600 leading-relaxed">{review.comment}</p>
    </div>
);

const ReviewsTab = ({ reviews, hotelId }: { reviews: Review[], hotelId: string }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
             <h3 className="text-2xl font-bold text-black mb-4">Guest Reviews ({reviews.length})</h3>
            {reviews.length > 0 ? reviews.map(review => <ReviewCard key={review.id} review={review} />) : <p className="text-gray-600">Be the first to review this hotel!</p>}
        </div>
        <div className="lg:col-span-1">
            <ReviewForm hotelId={hotelId} />
        </div>
    </div>
);

const FloatingBookingBar = ({ hotel }: { hotel: Hotel }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-top p-4 border-t z-40">
        <div className="container mx-auto flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-600">Starts from</p>
                <p className="text-2xl font-bold text-black">${hotel.pricePerNight}<span className="text-base font-normal text-gray-500">/night</span></p>
            </div>
            <button className="bg-[#0164E5] text-white font-bold py-3 px-8 rounded-xl text-lg hover:bg-blue-700 transition-colors">Book Now</button>
        </div>
    </div>
);

// =======================================================================
//  CLIENT COMPONENT MAIN VIEW
// =======================================================================
export default function HotelClientView({ hotel, rooms, reviews }: { hotel: Hotel; rooms: Room[]; reviews: Review[] }) {
  const [activeTab, setActiveTab] = useState('About');

  return (
    <>
      <div className="bg-white pb-32"> {/* Padding at bottom to clear floating bar */}
        <HotelImageHeader hotel={hotel} />
        
        <div className="container mx-auto px-6 py-8">
            <div className="border-b mb-8">
                <nav className="flex space-x-8 -mb-px">
                    {['About', 'Rooms', 'Reviews'].map(tabName => (
                        <button 
                            key={tabName} 
                            onClick={() => setActiveTab(tabName)}
                            className={`py-4 px-1 font-semibold text-lg transition-colors ${activeTab === tabName ? 'border-b-2 border-[#0164E5] text-[#0164E5]' : 'text-gray-500 hover:text-black'}`}
                        >
                            {tabName}
                        </button>
                    ))}
                </nav>
            </div>

            <div>
                {activeTab === 'About' && <AboutTab hotel={hotel} />}
                {activeTab === 'Rooms' && <RoomsTab rooms={rooms} />}
                {activeTab === 'Reviews' && <ReviewsTab reviews={reviews} hotelId={hotel.id} />}
            </div>
        </div>
      </div>
      <FloatingBookingBar hotel={hotel} />
    </>
  );
}