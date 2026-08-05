import { Metadata } from 'next';
import HotelsUI from '@/components/templates/HotelsUI';
// IMPORT DIRECTLY FROM YOUR DATA LIB JUST LIKE THE HOME PAGE
import { getFeaturedHotels, getAllHotels } from '@/app/lib/data'; 

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

export const metadata: Metadata = {
  title: 'Explore Top Hotels & Resorts in Africa & The World | GuriUp',
  description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide. Explore handpicked premium stays and verified accommodations on GuriUp.',
  keywords: 'hotels in Africa, book hotels worldwide, global hotel booking, luxury stays Africa, best accommodations, GuriUp hotels, travel Africa',
  openGraph: {
    title: 'Explore Top Hotels & Resorts in Africa & The World | GuriUp',
    description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide on GuriUp.',
    type: 'website',
    siteName: 'GuriUp',
    locale: 'en_US',
    url: `${BASE_URL}/hotels`, 
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Top Hotels & Resorts in Africa & The World | GuriUp',
    description: 'Book the best luxury, business, and budget-friendly hotels across Africa and worldwide.',
  },
  alternates: {
    canonical: `${BASE_URL}/hotels`,
  }
};

export default async function HotelsPage() {
  // BYPASS THE API ROUTE AND TALK DIRECTLY TO THE DATABASE
  let featuredHotels: any[] = [];
  let allHotels: any[] = [];

  try {
    const [featHotels, lateHotels] = await Promise.all([
      getFeaturedHotels().catch(() => []),
      getAllHotels().catch(() => []) 
    ]);

    featuredHotels = featHotels || [];
    allHotels = lateHotels || [];
  } catch (error) {
    console.error("🚨 Error fetching hotel data directly:", error);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Top Hotels in Africa & The World',
    description: 'Browse and book premium and budget hotels across Africa and globally.',
    url: `${BASE_URL}/hotels`,
    provider: {
      '@type': 'Organization',
      name: 'GuriUp',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: featuredHotels.slice(0, 3).map((hotel: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Hotel',
          name: hotel?.name || 'GuriUp Featured Hotel',
          url: `${BASE_URL}/hotels/${hotel?.slug || hotel?.id || ''}`
        }
      }))
    }
  };

  return (
    <>
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