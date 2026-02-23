import { Metadata } from "next";
import PropertiesUI from "@/components/templates/PropertiesUI";

export const dynamic = "force-dynamic";

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
    url: 'https://guriup.com/properties', // Update with your actual domain if different
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
    description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide.',
  },
  alternates: {
    canonical: 'https://guriup.com/properties', // SEO: Prevents duplicate content penalties
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

// 3. FETCH DATA HELPER (UNTOUCHED)
async function getPropertiesData() {
  const baseUrl = 
    process.env.NODE_ENV === 'development' 
      ? "http://localhost:3000" 
      : (process.env.NEXT_PUBLIC_BASE_URL || "https://guriup.hiigsitech.com");

  try {
    // --- FETCH DATA ---
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${baseUrl}/api/properties?featured=true`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/properties?limit=300`, { cache: "no-store" }),
    ]);

    if (!featuredRes.ok) console.error(`Featured API Error: ${featuredRes.status}`);
    if (!allRes.ok) console.error(`All Properties API Error: ${allRes.status}`);

    // Parse JSON and cast to the Property array type
    const featuredData: Property[] = featuredRes.ok ? await featuredRes.json() : [];
    const allData: Property[] = allRes.ok ? await allRes.json() : [];

    // --- FILTER & MAP ---
    // We filter for pro/premium and then ensure 'featured' is true for the UI
    const featuredProperties: Property[] = featuredData
      .filter((p: Property) => p.agentPlanTier === "pro" || p.agentPlanTier === "premium")
      .map((p: Property) => ({ ...p, featured: true }));

    const allProperties: Property[] = allData;

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
    url: 'https://guriup.com/properties',
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
          url: `https://guriup.com/properties/${property?.slug || property?.id || ''}`
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