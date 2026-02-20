import PropertiesUI from "@/components/templates/PropertiesUI";

export const dynamic = "force-dynamic";

// 1. Define the full Property interface to match PropertiesUI requirements exactly
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

    // 2. Parse JSON and cast to the Property array type
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

export default async function PropertiesPage() {
  const { featuredProperties, allProperties } = await getPropertiesData();

  return (
    <PropertiesUI
      featuredProperties={featuredProperties}
      allProperties={allProperties}
    />
  );
}