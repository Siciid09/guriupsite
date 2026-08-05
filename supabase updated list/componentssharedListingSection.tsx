import ListingCard from '@/components/shared/ListingCard';
import type { Property, Hotel } from '@/types';
import Link from 'next/link';

interface ListingSectionProps {
  title: string;
  listings: (Property[] | Hotel[]);
  type: 'property' | 'hotel';
}

export default function ListingSection({ title, listings, type }: ListingSectionProps) {
  const exploreLink = type === 'property' ? '/properties' : '/hotels';
  
  return (
    <section className="py-20 bg-slate-100">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold font-sans text-gray-800">{title}</h2>
          <Link href={exploreLink} className="text-[#0164E5] font-semibold hover:underline">
            View All
          </Link>
        </div>
        
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No featured {type} listings found at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}