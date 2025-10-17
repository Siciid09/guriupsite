import type { Property, Hotel } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, BedDouble, Bath } from 'lucide-react';

interface ListingCardProps {
  listing: Property | Hotel;
}

// Type guard to check if a listing is a Hotel
function isHotel(listing: Property | Hotel): listing is Hotel {
  return 'pricePerNight' in listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const isListingHotel = isHotel(listing);
  const linkPath = isListingHotel ? `/hotels/${listing.id}` : `/properties/${listing.id}`;
  
  // THE FIX: Create a variable to hold the correct name based on the type
  const displayName = isListingHotel ? listing.name : listing.title;
  
  const price = isListingHotel ? listing.pricePerNight : listing.price;
  const priceLabel = isListingHotel ? '/night' : (listing as Property).isForSale ? '' : '/month';
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link href={linkPath} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
        <div className="relative">
          <Image
            src={listing.images[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'}
            // Use the new displayName variable here
            alt={displayName}
            width={400}
            height={225}
            className="h-56 w-full object-cover"
          />
          {listing.featured && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Star size={12} />Featured
            </div>
          )}
          {isListingHotel && (
            <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-amber-600 font-bold text-sm">
              <Star size={16} className="fill-current text-amber-500" />
              <span>{listing.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-800 font-sans group-hover:text-[#0164E5] transition-colors">
            {/* Use the new displayName variable here as well */}
            {displayName}
          </h3>
          <p className="text-gray-500 my-2 flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-[#0164E5]" />
            {listing.location.area}, {listing.location.city}
          </p>

          {!isListingHotel && (
            <div className="flex items-center space-x-4 text-gray-600 my-2 text-sm">
              <div className="flex items-center gap-2"><BedDouble size={20} className="text-[#0164E5]" /><span className="font-medium">{listing.features.bedrooms} beds</span></div>
              <div className="flex items-center gap-2"><Bath size={20} className="text-[#0164E5]" /><span className="font-medium">{listing.features.bathrooms} baths</span></div>
            </div>
          )}
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <p className="text-xl font-bold text-[#0164E5]">
              {formattedPrice} <span className="text-sm font-normal text-gray-500">{priceLabel}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}