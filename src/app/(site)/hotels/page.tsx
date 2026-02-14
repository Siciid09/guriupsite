import { 
  getFeaturedHotels, 
  getAllHotels 
} from '../../lib/data';
import type { Hotel } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, Users, Search, MapPin, Award, ShieldCheck, Ticket, UserCheck
} from 'lucide-react';
import ListingCard from '@/components/shared/ListingCard';
import Testimonials from '@/components/shared/Testimonials';
import DownloadApp from '../../../components/shared/DownloadApp';

const HotelsHero = () => (
    <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-white text-center">
        <div className="absolute inset-0 bg-black">
            <Image 
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80" 
              fill
              className="object-cover opacity-40" 
              alt="Luxury hotel lobby" 
              priority
            />
        </div>
        <div className="relative z-10 px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">Find Your Perfect Stay</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-blue-100">Book from our curated collection of top-rated hotels across Somalia.</p>
        </div>
    </section>
);

const HotelFilterBar = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 max-w-5xl mx-auto -mt-16 relative z-20">
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 items-center gap-4">
      <div className="lg:col-span-2 flex items-center gap-3 px-4 py-2">
        <MapPin className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="destination" className="block text-xs text-gray-400">Destination</label>
          <input type="text" id="destination" placeholder="Where are you going?" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-2">
        <Calendar className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="dates" className="block text-xs text-gray-400">Dates</label>
          <input type="text" id="dates" placeholder="Select Dates" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none" />
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-2">
        <Users className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="guests" className="block text-xs text-gray-400">Guests</label>
          <input type="text" id="guests" placeholder="2 Adults" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none" />
        </div>
      </div>
      <div className="px-2">
        <button className="w-full bg-[#0164E5] text-white rounded-lg flex items-center justify-center gap-2 px-6 py-3 font-bold hover:bg-blue-700 transition-colors">
          <Search size={20} />
        </button>
      </div>
    </div>
  </div>
);

const FeaturedHotels = ({ hotels }: { hotels: Hotel[] }) => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-black mb-8">Featured Hotels</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {hotels.map(hotel => (
          <ListingCard key={hotel.id} listing={hotel} />
        ))}
      </div>
    </div>
  </section>
);

const AllHotels = ({ hotels }: { hotels: Hotel[] }) => (
  <section className="py-16 bg-white">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-black mb-8">Explore All Hotels</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {hotels.map(hotel => (
          <ListingCard key={hotel.id} listing={hotel} />
        ))}
      </div>
       <div className="text-center mt-12">
        <button className="bg-slate-200 text-black font-bold px-8 py-3.5 rounded-full hover:bg-slate-300 transition-colors">
          Load More
        </button>
      </div>
    </div>
  </section>
);

const PopularDestinations = () => (
  <section className="py-16 bg-slate-50">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold text-black mb-8">Popular Destinations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Mogadishu', 'Hargeisa', 'Kismayo', 'Bosaso'].map(city => (
          <Link href="#" key={city} className="block relative rounded-xl overflow-hidden shadow-lg group h-80">
            <Image 
              src={`https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=800&auto=format&fit=crop`} 
              alt={city} 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-black/50 flex items-end">
              <h3 className="p-4 text-2xl font-bold text-white">{city}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const WhyBookWithGuriUp = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black">Why Book With GuriUp?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { icon: <Award size={32} />, title: "Best Price Guarantee", desc: "Find the lowest prices on top-rated hotels." },
          { icon: <ShieldCheck size={32} />, title: "Verified Reviews", desc: "Book with confidence based on real guest experiences." },
          { icon: <Ticket size={32} />, title: "Exclusive Deals", desc: "Access special offers and discounts you won't find anywhere else." },
          { icon: <UserCheck size={32} />, title: "24/7 Support", desc: "Our dedicated team is here to help you around the clock." },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <div className="text-[#0164E5] w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">{item.icon}</div>
            <h3 className="font-bold text-lg text-black mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6 max-w-4xl">
      <h2 className="text-3xl font-bold text-black text-center mb-10">Frequently Asked Questions</h2>
      <div className="space-y-4">
        <div className="p-6 bg-slate-50 rounded-lg">
          <h3 className="font-bold text-lg text-black">What is the cancellation policy?</h3>
          <p className="text-gray-600 mt-2">Cancellation policies vary by hotel and are clearly displayed during the booking process. Many hotels offer free cancellation up to 24 hours before check-in.</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-lg">
          <h3 className="font-bold text-lg text-black">{`Can I book a hotel for someone else?`}</h3>
          <p className="text-gray-600 mt-2">{`Yes, you can. Simply enter the guest's name and contact information during the booking process.`}</p>
        </div>
      </div>
    </div>
  </section>
);

export default async function HotelsPage() {
  const [featuredHotels, allHotels] = await Promise.all([
    getFeaturedHotels(),
    getAllHotels(),
  ]);

  const featuredIds = new Set(featuredHotels.map(h => h.id));
  const otherHotels = allHotels.filter(h => !featuredIds.has(h.id));

  return (
    <>
      <HotelsHero />
      <HotelFilterBar />
      <FeaturedHotels hotels={featuredHotels} />
      <AllHotels hotels={otherHotels} />
      <PopularDestinations />
      <WhyBookWithGuriUp />
      <Testimonials />
      <DownloadApp />
      <FAQ />
    </>
  );
}