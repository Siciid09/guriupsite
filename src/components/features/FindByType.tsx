import { Building, Home, LandPlot, Store, Hotel, Presentation, Briefcase, ShoppingCart, University, Building2, Warehouse, Tent } from 'lucide-react';
import Link from 'next/link';

const types = [
    { name: 'Villa', icon: <Home /> }, { name: 'House', icon: <Building2 /> }, { name: 'Apartment', icon: <Building /> }, { name: 'Land', icon: <LandPlot /> }, { name: 'Hotel', icon: <Hotel /> }, { name: 'Hall', icon: <Presentation /> }, { name: 'Business', icon: <Store /> }, { name: 'Mall', icon: <ShoppingCart /> }, { name: 'Building', icon: <University /> }, { name: 'Studio', icon: <Briefcase /> }, { name: 'Bungalow', icon: <Tent /> }, { name: 'Office', icon: <Warehouse /> },
];

export default function FindByType() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-2xl font-bold text-black text-center mb-8">Find By Type</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4">
          {types.map((type) => (
            <Link href="#" key={type.name} className="group flex flex-col items-center justify-center text-center p-4 bg-[#0164E5] rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="text-white mb-2 group-hover:scale-110 transition-transform">
                {type.icon}
              </div>
              <h3 className="font-semibold text-sm text-white">{type.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}