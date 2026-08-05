import type { Property, Hotel } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  BedDouble, 
  Bath, 
  Maximize, 
  ArrowUpRight, 
  Heart 
} from 'lucide-react';

interface ListingCardProps {
  listing: Property | Hotel;
}

// Type guard
function isHotel(listing: Property | Hotel): listing is Hotel {
  return 'pricePerNight' in listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const isListingHotel = isHotel(listing);
  const linkPath = isListingHotel ? `/hotels/${listing.id}` : `/properties/${listing.id}`;
  
  // Data Normalization
  const displayName = isListingHotel ? (listing as Hotel).name : (listing as Property).title;
  const price = isListingHotel ? (listing as Hotel).pricePerNight : (listing as Property).price;
  const isForSale = !isListingHotel && (listing as Property).isForSale;
  const priceLabel = isListingHotel ? '/night' : isForSale ? '' : '/month';

  // Handling location object vs string
  const locationText = typeof listing.location === 'string' 
    ? listing.location 
    : `${listing.location.area || ''}, ${listing.location.city || ''}`;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link href={linkPath} className="group block h-full select-none">
      <div className="relative h-full bg-white rounded-[2rem] p-3 border border-gray-100 transition-all duration-500 ease-out hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:border-transparent transform hover:-translate-y-1">
        
        {/* --- IMAGE SECTION --- */}
        <div className="relative h-64 w-full overflow-hidden rounded-[1.5rem] bg-gray-100 isolate">
          <Image
            src={listing.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {listing.featured && (
              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800">Featured</span>
              </div>
            )}
             {!isListingHotel && (
               <div className={`backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm ${
                 isForSale ? 'bg-slate-900/80 text-white' : 'bg-emerald-500/90 text-white'
               }`}>
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  {isForSale ? 'Buy' : 'Rent'}
                </span>
              </div>
             )}
          </div>

          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:bg-white hover:text-red-500 hover:scale-110 active:scale-95 z-20">
            <Heart size={18} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-4 left-4 z-10">
            {isListingHotel && (
              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-lg">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-slate-800">{(listing as Hotel).rating?.toFixed(1) || '5.0'}</span>
              </div>
            )}
          </div>
        </div>

        {/* --- CONTENT SECTION --- */}
        <div className="pt-5 px-2 pb-2 flex flex-col h-[calc(100%-16rem)]">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-[#0164E5] transition-colors line-clamp-1">
              {displayName}
            </h3>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#0164E5] group-hover:text-white transition-all duration-300 transform -rotate-45 group-hover:rotate-0">
               <ArrowUpRight size={18} strokeWidth={3} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-gray-500 mb-6">
            <MapPin size={14} className="text-gray-400" />
            <p className="text-sm font-medium truncate">{locationText}</p>
          </div>

          {/* Amenities Row - Matches your Property model bedrooms/bathrooms/area directly */}
          {!isListingHotel && (
            <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shrink-0">
                <BedDouble size={16} className="text-slate-900" />
                <span className="text-xs font-bold text-gray-600">{(listing as Property).bedrooms} <span className="hidden sm:inline font-medium text-gray-400">Beds</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shrink-0">
                <Bath size={16} className="text-slate-900" />
                <span className="text-xs font-bold text-gray-600">{(listing as Property).bathrooms} <span className="hidden sm:inline font-medium text-gray-400">Baths</span></span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 shrink-0">
                <Maximize size={16} className="text-slate-900" />
                <span className="text-xs font-bold text-gray-600">
                    {(listing as Property).area} <span className="hidden sm:inline font-medium text-gray-400">sqft</span>
                </span>
              </div>
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between group-hover:border-transparent transition-colors">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {isListingHotel ? 'Start from' : 'Price'}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formattedPrice}
                </span>
                <span className="text-sm font-medium text-gray-400">{priceLabel}</span>
              </div>
            </div>
            
            <div className="opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <span className="text-xs font-black text-[#0164E5] uppercase tracking-widest">
                    View Details
                </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}