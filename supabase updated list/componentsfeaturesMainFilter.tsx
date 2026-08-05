'use client';

import { MapPin, Home, Wallet, Search } from 'lucide-react';

export default function MainFilter() {
  return (
    <div className="bg-white rounded-full shadow-lg p-3 lg:p-4 max-w-4xl mx-auto -mt-12 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
        {/* Location Input */}
        <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r">
          <MapPin className="text-gray-400" size={20} />
          <div className="w-full">
            <label htmlFor="location" className="block text-xs text-gray-500">Location</label>
            <input type="text" id="location" placeholder="e.g., Mogadishu" className="w-full text-sm font-semibold bg-transparent focus:outline-none" />
          </div>
        </div>
        
        {/* Type Input */}
        <div className="flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r">
          <Home className="text-gray-400" size={20} />
          <div className="w-full">
            <label htmlFor="type" className="block text-xs text-gray-500">Type</label>
            <select id="type" className="w-full text-sm font-semibold bg-transparent focus:outline-none appearance-none">
              <option>All Properties</option>
              <option>House</option>
              <option>Apartment</option>
              <option>Land</option>
            </select>
          </div>
        </div>

        {/* Price Range Input */}
        <div className="flex items-center gap-3 px-4 py-2">
          <Wallet className="text-gray-400" size={20} />
          <div className="w-full">
            <label htmlFor="price" className="block text-xs text-gray-500">Price Range</label>
            <select id="price" className="w-full text-sm font-semibold bg-transparent focus:outline-none appearance-none">
              <option>Any Price</option>
              <option>$0 - $1,000</option>
              <option>$1,000+</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="px-2">
          <button className="w-full bg-[#0164E5] text-white rounded-full flex items-center justify-center gap-2 px-6 py-3 font-bold hover:bg-blue-700 transition-colors">
            <Search size={20} />
            <span className="hidden lg:inline">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}