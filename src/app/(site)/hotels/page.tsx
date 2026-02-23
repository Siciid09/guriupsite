import { Metadata } from 'next';
import HotelsUI from '@/components/templates/HotelsUI';
import { getHotelsDataInternal } from '@/app/api/hotels/route';

export const dynamic = 'force-dynamic';

// --- 1. SEO METADATA (Targeting Africa & Global) ---
export const metadata: Metadata = {
  title: 'Explore Top Hotels in Africa & The World | GuriUp',
  description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide. Explore handpicked premium stays and verified accommodations on GuriUp.',
  keywords: 'hotels in Africa, book hotels worldwide, global hotel booking, luxury stays Africa, best accommodations, GuriUp hotels, travel Africa',
  openGraph: {
    title: 'Explore Top Hotels in Africa & The World | GuriUp',
    description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide on GuriUp.',
    type: 'website',
    siteName: 'GuriUp',
    locale: 'en_US',
    url: 'https://guriup.com/hotels', // Update domain if needed
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Top Hotels in Africa & The World | GuriUp',
    description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide.',
  },
  alternates: {
    canonical: 'https://guriup.com/hotels', // Prevents duplicate content SEO penalties
  }
};

export default async function HotelsPage() {
  // --- 2. FETCH DATA (100% UNTOUCHED) ---
  const [featuredData, allData] = await Promise.all([
    // Recommended: Strictly fetch PRO/PREMIUM (isFeatured: true)
    getHotelsDataInternal({ isFeatured: true, limitCount: 10 }),
    
    // Explore All: Fetch EVERYTHING (No filters, limit 100)
    getHotelsDataInternal({ isFeatured: false, limitCount: 100 }),
  ]);

  const featuredHotels = Array.isArray(featuredData) ? featuredData : [];
  const allHotels = Array.isArray(allData) ? allData : [];

  // --- 3. SEO JSON-LD: Collection Schema for Google ---
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Top Hotels in Africa & The World',
    description: 'Browse and book premium and budget hotels across Africa and globally.',
    url: 'https://guriup.com/hotels',
    provider: {
      '@type': 'Organization',
      name: 'GuriUp',
    },
    // Safely maps up to 3 featured hotels for Google's search bots without breaking TS
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: featuredHotels.slice(0, 3).map((hotel: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Hotel',
          name: hotel?.name || 'GuriUp Featured Hotel',
          url: `https://guriup.com/hotels/${hotel?.slug || hotel?.id || ''}`
        }
      }))
    }
  };

  // --- 4. RENDER (UNTOUCHED) ---
  return (
    <>
      {/* Invisible SEO Script for Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <HotelsUI 
        featuredHotels={featuredHotels} 
        allHotels={allHotels} 
      />
    </>
  );
}