import { Metadata } from "next";
import PropertiesUI from "@/components/templates/PropertiesUI";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

export const metadata: Metadata = {
  title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
  description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide. Explore verified real estate listings on GuriUp.',
  keywords: 'real estate Africa, properties for sale worldwide, buy house Africa, rent apartment globally, commercial property, GuriUp real estate, international property listings',
  openGraph: {
    title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
    description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide.',
    type: 'website',
    siteName: 'GuriUp',
    locale: 'en_US',
    url: `${BASE_URL}/properties`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
    description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide.',
  },
  alternates: {
    canonical: `${BASE_URL}/properties`,
  }
};

interface Property {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  description?: string;
  price: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  isForSale: boolean; 
  status: string;
  images: string[];
  location: { city: string; area: string; };
  bedrooms: number;
  bathrooms: number;
  area?: number; 
  type: string; 
  amenities?: string[]; 
  agentId: string;
  agentName: string; 
  agentVerified: boolean; 
  planTier?: 'free' | 'pro' | 'premium'; 
  agentPlanTier?: string; 
  featured: boolean;
  createdAt: string; 
}

async function getPropertiesData() {
  try {
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${BASE_URL}/api/properties?featured=true`, { cache: 'no-store' }),
      fetch(`${BASE_URL}/api/properties`, { cache: 'no-store' })
    ]);

    const featuredJson = await featuredRes.json();
    const allJson = await allRes.json();

    const rawFeatured = featuredJson.properties || featuredJson || [];
    const rawAll = allJson.properties || allJson || [];

    const featuredProperties: Property[] = (Array.isArray(rawFeatured) ? rawFeatured : []).map(p => ({ 
      ...p, 
      featured: true 
    }));
    
    const allProperties: Property[] = Array.isArray(rawAll) ? rawAll : [];

    return { featuredProperties, allProperties };
  } catch (error) {
    console.error("PROPERTIES PAGE FETCH ERROR:", error);
    return { featuredProperties: [], allProperties: [] };
  }
}

export default async function PropertiesPage() {
  const { featuredProperties, allProperties } = await getPropertiesData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Real Estate & Properties in Africa & The World',
    description: 'Browse houses, apartments, and commercial spaces for sale and rent globally.',
    url: `${BASE_URL}/properties`,
    provider: {
      '@type': 'Organization',
      name: 'GuriUp',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: featuredProperties.slice(0, 3).map((property, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'RealEstateListing',
          name: property?.title || 'GuriUp Premium Property',
          url: `${BASE_URL}/properties/${property?.slug || property?.id || ''}`
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
      <PropertiesUI
        featuredProperties={featuredProperties}
        allProperties={allProperties}
      />
    </>
  );
}