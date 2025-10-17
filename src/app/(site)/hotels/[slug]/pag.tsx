'use client';

import { useState, useEffect } from 'react';
import { getHotelBySlug, getHotelRooms, getHotelReviews, getRelatedHotels } from '../../../lib/data';
import type { Hotel, Room, Review } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, Expand, X, Wifi, Droplets, Dumbbell, Utensils } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ListingCard from '@/components/shared/ListingCard';


// =======================================================================
//  1. Interactive Image Gallery Component
// =======================================================================
const ImageGallery = ({ images, title }: { images: string[], title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (images && images.length > 1) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [images]);

  const goToPrevious = () => {
    if (!images) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (!images) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  if (!images || images.length === 0) {
    return <div className="w-full h-[400px] bg-slate-200 flex items-center justify-center"><p>No Image Available</p></div>;
  }

  return (
    <>
      <div className="relative w-full h-[300px] md:h-[500px] bg-slate-200 overflow-hidden group">
        <Image 
          src={images[currentIndex]}
          alt={`${title} - image ${currentIndex + 1}`}
          fill
          className="object-cover transition-all duration-500 ease-in-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {images.length > 1 && (
          <>
            <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeft size={24} /></button>
            <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRight size={24} /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`}></button>
              ))}
            </div>
          </>
        )}
        
        <button onClick={() => setIsFullScreen(true)} className="absolute top-4 right-4 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Expand size={20} />
        </button>
      </div>

      {isFullScreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setIsFullScreen(false)}>
          <button className="absolute top-6 right-6 text-white z-50"><X size={32} /></button>
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]"><Image src={images[currentIndex]} alt={title} fill className="object-contain" /></div>
        </div>
      )}
    </>
  );
};


// =======================================================================
//  2. All Helper Components for the Page
// =======================================================================

const LocationMap = ({ coords, title }: { coords: { latitude: number; longitude: number; }, title: string }) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const embedUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coords.latitude},${coords.longitude}&zoom=15`;

    return (
        <div className="mt-12">
            <h3 className="text-2xl font-bold text-black mb-6">Location</h3>
            <div className="w-full h-80 rounded-2xl overflow-hidden shadow-md border">
                <iframe width="100%" height="100%" style={{ border: 0 }} src={embedUrl} allowFullScreen title={`Map location for ${title}`}></iframe>
            </div>
            {!apiKey && <p className="text-xs text-red-500 mt-2">Note: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing. The map will not display correctly.</p>}
        </div>
    );
};

const AboutTab = ({ hotel }: { hotel: Hotel }) => {
    const amenities = {
        'Wi-Fi': { value: hotel.amenities.hasWifi, icon: <Wifi size={20}/> },
        'Pool': { value: hotel.amenities.hasPool, icon: <Droplets size={20}/> },
        'Gym': { value: hotel.amenities.hasGym, icon: <Dumbbell size={20}/> },
        'Restaurant': { value: hotel.amenities.hasRestaurant, icon: <Utensils size={20}/> },
    };
    const availableAmenities = Object.entries(amenities).filter(([, data]) => data.value);

    return (
        <div className="space-y-10">
            <div>
                <h3 className="text-2xl font-bold text-black mb-6">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{hotel.description}</p>
            </div>
            {availableAmenities.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-black mb-6">Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {availableAmenities.map(([label, data]) => (
                            <div key={label} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                                <div className="text-[#0164E5]">{data.icon}</div>
                                <span className="font-semibold text-black">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <LocationMap coords={hotel.location.coordinates} title={hotel.name} />
        </div>
    );
};

const RoomCard = ({ room }: { room: Room }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border flex flex-col sm:flex-row my-6">
        <div className="relative w-full sm:w-1/3 h-48 sm:h-auto"><Image src={room.images?.[0] || '/placeholder-image.png'} alt={room.roomTypeName} fill className="object-cover" /></div>
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
    <div>
        <h2 className="text-3xl font-bold text-black mb-4">Available Rooms</h2>
        <div className="space-y-6">
            {rooms.length > 0 ? rooms.map(room => <RoomCard key={room.id} room={room} />) : <p className="text-gray-600">No specific room types are listed for this hotel at the moment.</p>}
        </div>
    </div>
);

const ReviewCard = ({ review }: { review: Review }) => (
    <div className="border-b py-6">
        <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-black">{review.userName}</p>
            <div className="flex items-center gap-1 text-amber-500">
                <Star size={16} className="fill-current" /> <span className="font-bold">{review.rating.toFixed(1)}</span>
            </div>
        </div>
        <p className="text-sm text-gray-500 mb-3">{new Date(review.createdAt).toLocaleDateString()}</p>
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
    </div>
);

const ReviewForm = ({ hotelId }: { hotelId: string }) => {
    const { user } = useAuth();
    return (
        <div className="bg-slate-50 p-6 rounded-2xl border sticky top-28">
            <h4 className="text-xl font-bold text-black mb-4">Leave a Review</h4>
            {user ? (
                <form className="space-y-4">
                    <div className="flex items-center gap-2"> {[1, 2, 3, 4, 5].map(star => <Star key={star} className="text-gray-300 cursor-pointer" />)} </div>
                    <textarea placeholder={`Share your experience, ${user.displayName}...`} className="w-full p-3 border rounded-md min-h-[100px]" required></textarea>
                    <button type="submit" className="bg-[#0164E5] text-white font-bold py-2 px-6 rounded-lg w-full">Submit Review</button>
                </form>
            ) : (
                <p className="text-gray-600">Please <Link href="/login" className="text-[#0164E5] underline font-semibold">log in</Link> to leave a review.</p>
            )}
        </div>
    );
};

const ReviewsTab = ({ reviews, hotelId }: { reviews: Review[], hotelId: string }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-4">
             <h2 className="text-3xl font-bold text-black mb-4">Guest Reviews ({reviews.length})</h2>
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

const RelatedHotels = ({ hotels }: { hotels: Hotel[] }) => {
    if (!hotels || hotels.length === 0) return null;
    return (
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8">Similar Hotels Nearby</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {hotels.map(hotel => <ListingCard key={hotel.id} listing={hotel} />)}
          </div>
        </div>
      </section>
    );
};

// =======================================================================
//  3. MAIN HOTEL DETAIL PAGE (CLIENT COMPONENT)
// =======================================================================
export default function HotelDetailPage({ params }: { params: { slug: string } }) {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedHotels, setRelatedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const hotelData = await getHotelBySlug(params.slug);
      if (hotelData) {
        setHotel(hotelData);
        const [roomsData, reviewsData, relatedData] = await Promise.all([
          getHotelRooms(hotelData.id),
          getHotelReviews(hotelData.id),
          getRelatedHotels(hotelData),
        ]);
        setRooms(roomsData);
        setReviews(reviewsData);
        setRelatedHotels(relatedData);
      }
      setLoading(false);
    };
    fetchData();
  }, [params.slug]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading Hotel Details...</p></div>;
  }

  if (!hotel) {
    return <div className="flex items-center justify-center h-screen"><p>Hotel not found.</p></div>;
  }

  return (
    <>
      <div className="bg-white pb-32">
        <div className="relative">
          <ImageGallery images={hotel.images} title={hotel.name} />
          <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold font-sans">{hotel.name}</h1>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-lg flex items-center gap-2"><MapPin size={20} /> {hotel.location.area}</p>
                <div className="flex items-center gap-1 bg-amber-500 px-2 py-1 rounded-md text-sm font-bold">
                    <Star size={16} /> {hotel.rating.toFixed(1)}
                </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 py-8">
            <div className="border-b mb-8">
                <nav className="flex space-x-8 -mb-px">
                    {['About', 'Rooms', 'Reviews', 'Gallery'].map(tabName => (
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

            <div className="mt-8">
                {activeTab === 'About' && <AboutTab hotel={hotel} />}
                {activeTab === 'Rooms' && <RoomsTab rooms={rooms} />}
                {activeTab === 'Reviews' && <ReviewsTab reviews={reviews} hotelId={hotel.id} />}
                {activeTab === 'Gallery' && (
                  <div>
                    <h2 className="text-3xl font-bold text-black mb-8">Photo Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hotel.images.map((img, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden cursor-pointer">
                          <Image src={img} alt={`${hotel.name} gallery image ${index+1}`} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
      </div>
      <RelatedHotels hotels={relatedHotels} />
      <FloatingBookingBar hotel={hotel} />
    </>
  );
}