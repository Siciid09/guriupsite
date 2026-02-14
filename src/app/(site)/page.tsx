import { 
  getFeaturedProperties, 
  getLatestProperties, 
  getFeaturedHotels, 
  getLatestHotels 
}  from '../lib/data';
import type { Property, Hotel } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Building, Home, LandPlot, Store, Hotel as HotelIcon, Presentation, Briefcase, ShoppingCart, University, Building2, Warehouse, Tent,
  MapPin, Wallet, Search,
  ShieldCheck, Zap, Award,
  Download
} from 'lucide-react';
import ListingCard from '@/components/shared/ListingCard';

const Hero = () => (
    <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-white text-center">
        <div className="absolute inset-0 bg-black">
            <Image src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80" fill className="object-cover opacity-40" alt="Beautiful home in Somalia" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0164E5]/60 to-transparent"></div>
        <div className="relative z-10 px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">Find Your Perfect Space in Somalia</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-blue-100">The #1 Somali app for properties and hotels. Discover, book, and experience your next home or stay.</p>
        </div>
    </section>
);

const MainFilter = () => (
  <div className="bg-white rounded-full shadow-lg p-3 lg:p-4 max-w-4xl mx-auto -mt-12 relative z-20">
    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
      <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r"><MapPin className="text-gray-500" size={20} /><div className="w-full"><label htmlFor="location" className="block text-xs text-gray-400">Location</label><input type="text" id="location" placeholder="e.g., Mogadishu" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none" /></div></div>
      <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r"><Home className="text-gray-500" size={20} /><div className="w-full"><label htmlFor="type" className="block text-xs text-gray-400">Type</label><select id="type" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none appearance-none"><option>All Types</option><option>House</option><option>Apartment</option></select></div></div>
      <div className="flex items-center gap-3 px-4 py-2"><Wallet className="text-gray-500" size={20} /><div className="w-full"><label htmlFor="price" className="block text-xs text-gray-400">Price Range</label><select id="price" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none appearance-none"><option>Any Price</option><option>$0 - $1,000</option></select></div></div>
      <div className="px-2"><button className="w-full bg-[#0164E5] text-white rounded-full flex items-center justify-center gap-2 px-6 py-3 font-bold hover:bg-blue-700 transition-colors"><Search size={20} /><span className="hidden lg:inline">Search</span></button></div>
    </div>
  </div>
);

const FindByType = () => {
  const types = [
    { name: 'Villa', icon: <Home /> },
    { name: 'House', icon: <Building2 /> },
    { name: 'Apartment', icon: <Building /> },
    { name: 'Land', icon: <LandPlot /> },
    { name: 'Hotel', icon: <HotelIcon /> },
    { name: 'Hall', icon: <Presentation /> },
    { name: 'Business', icon: <Store /> },
    { name: 'Mall', icon: <ShoppingCart /> },
    { name: 'Building', icon: <University /> },
    { name: 'Studio', icon: <Briefcase /> },
    { name: 'Bungalow', icon: <Tent /> },
    { name: 'Office', icon: <Warehouse /> },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-[#0164E5] text-center mb-10">
          Find By Type
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4">
          {types.map((type) => (
            <Link
              href="#"
              key={type.name}
              className="group flex flex-col items-center justify-center text-center p-4 rounded-xl shadow-sm
              bg-[#DCE8F8] hover:bg-[#0164E5] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-[#0164E5] mb-2 group-hover:text-white group-hover:scale-110 transition-transform">
                {type.icon}
              </div>
              <h3 className="font-bold text-sm text-[#0164E5] group-hover:text-white">
                {type.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const ListingSection = ({ title, listings, viewAllLink }: { title: string; listings: (Property | Hotel)[]; viewAllLink: string }) => (
  <section className="py-16">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-black mb-8">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {listings.slice(0, 4).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="text-center mt-12">
        <Link href={viewAllLink} className="bg-[#0164E5] text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
          View All {title}
        </Link>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="py-20 bg-white">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold text-black mb-12">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center">
          <div className="bg-[#0164E5] text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">1</div>
          <h3 className="text-xl font-bold text-black mb-2">Search Properties</h3>
          <p className="text-gray-600">Use our advanced filters to find the perfect property or hotel in your desired city.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#0164E5] text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">2</div>
          <h3 className="text-xl font-bold text-black mb-2">Connect with Agents</h3>
          <p className="text-gray-600">Contact agents or hotel owners directly to get more information or schedule a viewing.</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-[#0164E5] text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold mb-4">3</div>
          <h3 className="text-xl font-bold text-black mb-2">Secure Your Space</h3>
          <p className="text-gray-600">Finalize your booking or purchase with confidence through our trusted platform.</p>
        </div>
      </div>
    </div>
  </section>
);

const WhyChooseGuriUp = () => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black">Why Choose GuriUp?</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {[
          { icon: <ShieldCheck size={28} />, title: "Verified Listings", desc: "Every property is vetted for quality and authenticity." },
          { icon: <Zap size={28} />, title: "Instant Booking", desc: "Book your desired space in just a few simple clicks." },
          { icon: <Award size={28} />, title: "Best Price Guarantee", desc: "We ensure you get unbeatable value across all listings." },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl flex items-start gap-5 shadow-sm">
            <div className="bg-blue-100 text-[#0164E5] w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-bold text-lg text-black mb-1">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ListYourProperty = () => (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-100 p-8 rounded-2xl flex items-center gap-6 text-left">
            <Home className="text-[#0164E5]" size={48} />
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">List Your Property</h3>
              <p className="text-gray-600 mb-4">Join our network to reach thousands of clients across Somalia.</p>
              <Link href="#" className="font-bold text-[#0164E5] hover:underline">Start Listing →</Link>
            </div>
          </div>
          <div className="bg-slate-100 p-8 rounded-2xl flex items-center gap-6 text-left">
            <HotelIcon className="text-[#0164E5]" size={48} />
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">Register Your Hotel</h3>
              <p className="text-gray-600 mb-4">Partner with GuriUp to increase your bookings and visibility.</p>
              <Link href="#" className="font-bold text-[#0164E5] hover:underline">Register Now →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
);

const DownloadApp = () => (
  <section className="bg-[#0164E5] text-white">
    <div className="container mx-auto px-6 py-20 text-center">
      <h2 className="text-4xl font-bold mb-4">Your Next Home, in Your Pocket</h2>
      <p className="text-blue-200 mb-8 max-w-md mx-auto">Get exclusive deals, manage bookings, and find properties faster with the free GuriUp mobile app.</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800"><Download size={20} /> App Store</a>
        <a href="#" className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-3 hover:bg-gray-800"><Download size={20} /> Google Play</a>
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
          <h3 className="font-bold text-lg text-black">{`How do I contact an agent?`}</h3>
          <p className="text-gray-600 mt-2">{`On each property's detail page, you will find a "Contact Agent" button which will allow you to send a message directly.`}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-lg">
          <h3 className="font-bold text-lg text-black">Is GuriUp available in my city?</h3>
          <p className="text-gray-600 mt-2">GuriUp operates across all major cities in Somalia, including Mogadishu, Hargeisa, Kismayo, and more. Use the search filter to find listings in your city.</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-lg">
          <h3 className="font-bold text-lg text-black">How do I list my own property?</h3>
          <p className="text-gray-600 mt-2">{`Click on the "List Your Property" button on our homepage to start the simple registration process for agents and property owners.`}</p>
        </div>
      </div>
    </div>
  </section>
);

export default async function HomePage() {
  const [
    featuredProperties,
    latestProperties,
    featuredHotels,
    latestHotels,
  ] = await Promise.all([
    getFeaturedProperties(),
    getLatestProperties(),
    getFeaturedHotels(),
    getLatestHotels(),
  ]);

  return (
    <>
      <Hero />
      <MainFilter />
      <FindByType />
      <div className="bg-slate-50"><ListingSection title="Featured Properties" listings={featuredProperties} viewAllLink="/properties" /></div>
      <div className="bg-white"><ListingSection title="Latest Properties" listings={latestProperties} viewAllLink="/properties" /></div>
      <div className="bg-slate-50"><ListingSection title="Featured Hotels" listings={featuredHotels} viewAllLink="/hotels" /></div>
      <div className="bg-white"><ListingSection title="Latest Hotels" listings={latestHotels} viewAllLink="/hotels" /></div>
      <HowItWorks />
      <WhyChooseGuriUp />
      <ListYourProperty />
      <DownloadApp />
      <FAQ />
    </>
  );
}