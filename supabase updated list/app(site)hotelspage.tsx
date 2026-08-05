import { Metadata } from 'next';
import HotelsUI from '@/components/templates/HotelsUI';

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

async function getHotelsData() {
  try {
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${BASE_URL}/api/hotels?featured=true`, { cache: 'no-store' }),
      fetch(`${BASE_URL}/api/hotels`, { cache: 'no-store' })
    ]);

    const featuredJson = await featuredRes.json();
    const allJson = await allRes.json();

    const rawFeatured = featuredJson.hotels || featuredJson || [];
    const rawAll = allJson.hotels || allJson || [];

    const featuredHotels = Array.isArray(rawFeatured) ? rawFeatured : [];
    const allHotels = Array.isArray(rawAll) ? rawAll : [];

    return { featuredHotels, allHotels };
  } catch (error) {
    console.error("HOTELS PAGE FETCH ERROR:", error);
    return { featuredHotels: [], allHotels: [] };
  }
}

export default async function HotelsPage() {
  const { featuredHotels, allHotels } = await getHotelsData();

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