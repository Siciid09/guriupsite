import { Metadata } from "next";
import PropertiesUI from "@/components/templates/PropertiesUI";
// ✅ Import direct database functions to bypass HTTP overhead
import { getFeaturedProperties, getAllProperties } from "@/app/lib/data";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

// --- 1. SEO METADATA (Targeting Africa & Global Real Estate) ---
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

// 2. Define the full Property interface to match PropertiesUI requirements exactly (UNTOUCHED)
interface Property {
  id: string;
  slug?: string;
  title: string;
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

// 3. FETCH DATA HELPER (UPDATED to use direct DB calls)
async function getPropertiesData() {
  try {
    // ✅ FIX: Call DB directly instead of HTTP fetch to our own API. 
    // Faster, safer, and immune to domain/ENV mismatch!
    const [featuredData, allData] = await Promise.all([
      getFeaturedProperties(),
      getAllProperties()
    ]);

    // Map to ensure the 'featured' flag is set to true for the UI
    const featuredProperties: Property[] = (featuredData as unknown as Property[]).map(p => ({ 
      ...p, 
      featured: true 
    }));
    
    const allProperties: Property[] = allData as unknown as Property[];

    return { featuredProperties, allProperties };
  } catch (error) {
    console.error("PROPERTIES PAGE FETCH ERROR:", error);
    return { featuredProperties: [], allProperties: [] };
  }
}

// 4. MAIN PAGE
export default async function PropertiesPage() {
  const { featuredProperties, allProperties } = await getPropertiesData();

  // --- SEO JSON-LD: Collection Schema for Google ---
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
    // Safely feeds up to 3 premium properties into the search snippet
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
      {/* Invisible SEO Script for Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* UI Render (UNTOUCHED) */}
      <PropertiesUI
        featuredProperties={featuredProperties}
        allProperties={allProperties}
      />
    </>
  );
}