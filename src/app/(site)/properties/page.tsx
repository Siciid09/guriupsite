import { 
  getFeaturedProperties, 
  getAllProperties 
}  from '../../lib/data';
import type { Property } from '@/types';

import Link from 'next/link';
import { 
  MapPin, Home, Wallet, Search, Award, ShieldCheck, Ticket, UserCheck, Building, LandPlot, Building2
} from 'lucide-react';
import ListingCard from '@/components/shared/ListingCard';
import Testimonials from '@/components/shared/Testimonials';
import DownloadApp from '@/components/shared/DownloadApp';

// =======================================================================
//  1. PROPERTIES HERO SECTION
// =======================================================================
const PropertiesHero = () => (
    <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center text-white text-center">
        <div className="absolute inset-0 bg-black">
            <img 
              src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80" 
              className="w-full h-full object-cover opacity-40" 
              alt="Modern residential house" 
            />
        </div>
        <div className="relative z-10 px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold font-sans mb-4 tracking-tight">Find Your Next Home</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-blue-100">Explore a wide range of properties for rent and sale across Somalia.</p>
        </div>
    </section>
);


// =======================================================================
//  2. PROPERTY SEARCH & FILTER BAR
// =======================================================================
const PropertyFilterBar = () => (
  <div className="bg-white rounded-lg shadow-lg p-4 max-w-5xl mx-auto -mt-16 relative z-20">
    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
      {/* Location */}
      <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r">
        <MapPin className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="location" className="block text-xs text-gray-400">Location</label>
          <input type="text" id="location" placeholder="Enter city or area" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none" />
        </div>
      </div>

      {/* Type */}
      <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r">
        <Home className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="type" className="block text-xs text-gray-400">Property Type</label>
          <select id="type" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none appearance-none">
            <option>All Types</option>
            <option>House</option>
            <option>Apartment</option>
            <option>Villa</option>
            <option>Land</option>
          </select>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3 px-4 py-2">
        <Wallet className="text-gray-500" size={20} />
        <div className="w-full">
          <label htmlFor="price" className="block text-xs text-gray-400">Price Range</label>
          <select id="price" className="w-full text-sm font-bold text-black bg-transparent focus:outline-none appearance-none">
            <option>Any Price</option>
            <option>$0 - $500 /mo</option>
            <option>$500 - $1500 /mo</option>
            <option>$100,000+ Sale</option>
          </select>
        </div>
      </div>

      {/* Search Button */}
      <div className="px-2">
        <button className="w-full bg-[#0164E5] text-white rounded-lg flex items-center justify-center gap-2 px-6 py-3 font-bold hover:bg-blue-700 transition-colors">
          <Search size={20} />
        </button>
      </div>
    </div>
  </div>
);


// =======================================================================
//  3. FEATURED PROPERTIES SECTION
// =======================================================================
const FeaturedProperties = ({ properties }: { properties: Property[] }) => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-black mb-8">Featured Properties</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {properties.map(property => (
          <ListingCard key={property.id} listing={property} />
        ))}
      </div>
    </div>
  </section>
);


// =======================================================================
//  4. ALL PROPERTIES SECTION
// =======================================================================
const AllProperties = ({ properties }: { properties: Property[] }) => (
  <section className="py-16 bg-white">
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-black mb-8">Explore All Listings</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {properties.map(property => (
          <ListingCard key={property.id} listing={property} />
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


// =======================================================================
//  5. PROPERTY TYPES SECTION
// =======================================================================
const PropertyTypes = () => {
    const types = [
        { name: 'House', icon: <Home /> },
        { name: 'Apartment', icon: <Building /> },
        { name: 'Villa', icon: <Building2 /> },
        { name: 'Land', icon: <LandPlot /> },
    ];
    return (
        <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold text-black mb-8">Browse by Property Type</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    {types.map(type => (
                        <Link href="#" key={type.name} className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                            <div className="text-[#0164E5] w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">{type.icon}</div>
                            <h3 className="font-bold text-black">{type.name}</h3>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};


// =======================================================================
//  6. POPULAR CITIES / AREAS SECTION
// =======================================================================
const PopularCities = () => (
  <section className="py-16 bg-white">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-3xl font-bold text-black mb-8">Popular Cities & Areas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Mogadishu', 'Hargeisa', 'Jigjiga Yar', 'Wadajir'].map(city => (
          <Link href="#" key={city} className="block relative rounded-xl overflow-hidden shadow-lg group h-80">
            <img src={`https://source.unsplash.com/800x600/?${city},building`} alt={city} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/50 flex items-end">
              <h3 className="p-4 text-2xl font-bold text-white">{city}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);


// =======================================================================
//  7. WHY CHOOSE GURIUP SECTION
// =======================================================================
const WhyChooseGuriUp = () => (
  <section className="py-20 bg-slate-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-black">The GuriUp Advantage</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { icon: <Award size={32} />, title: "Market Experts", desc: "Local agents with deep knowledge of the market." },
          { icon: <ShieldCheck size={32} />, title: "Verified Listings", desc: "Every property is vetted for quality and authenticity." },
          { icon: <Ticket size={32} />, title: "Transparent Pricing", desc: "No hidden fees. Clear and upfront pricing on all listings." },
          { icon: <UserCheck size={32} />, title: "Direct Contact", desc: "Connect directly with agents to secure your new home." },
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


// =======================================================================
//  MAIN PROPERTIES PAGE COMPONENT
// =======================================================================
export default async function PropertiesPage() {
  const [featuredProperties, allProperties] = await Promise.all([
    getFeaturedProperties(),
    getAllProperties(),
  ]);

  const featuredIds = new Set(featuredProperties.map(p => p.id));
  const otherProperties = allProperties.filter(p => !featuredIds.has(p.id));

  return (
    <>
      <PropertiesHero />
      <PropertyFilterBar />
      <FeaturedProperties properties={featuredProperties} />
      <AllProperties properties={otherProperties} />
      <PropertyTypes />
      <PopularCities />
      <WhyChooseGuriUp />
      <Testimonials />
      <DownloadApp />
    </>
  );
}