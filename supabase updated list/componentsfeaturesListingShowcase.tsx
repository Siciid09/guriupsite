import type { Property, Hotel } from '@/types';
import ListingCard from '../shared/ListingCard';
import Link from 'next/link';

interface ListingShowcaseProps {
  title: string;
  listings: (Property | Hotel)[];
  viewAllLink: string;
  isHotel?: boolean;
}

export default function ListingShowcase({ title, listings, viewAllLink, isHotel = false }: ListingShowcaseProps) {
  if (!listings || listings.length === 0) {
    return null; // Don't render the section if there are no listings
  }

  const heroListing = listings[0];
  const smallListings = listings.slice(1, 5); // Take the next 4

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">{title}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Hero Listing (Large Card) */}
          <div className="lg:col-span-1">
            <ListingCard listing={heroListing} />
          </div>
          
          {/* Small Listings Grid */}
          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {smallListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
        <div className="text-center mt-12">
          <Link href={viewAllLink} className="bg-[#0164E5] text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300">
            View All
          </Link>
        </div>
      </div>
    </section>
  );
}