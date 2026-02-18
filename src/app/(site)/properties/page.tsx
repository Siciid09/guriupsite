import PropertiesUI from "@/components/templates/PropertiesUI";

export const dynamic = "force-dynamic";

// 1. Define the interface to prevent "any" type errors
interface PropertyData {
  id: string;
  agentPlanTier?: string;
  featured?: boolean;
  [key: string]: any; 
}

async function getPropertiesData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://guriup.hiigsitech.com";

  try {
    // --- FETCH DATA ---
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${baseUrl}/api/properties?featured=true`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/properties?limit=300`, { cache: "no-store" }),
    ]);

    if (!featuredRes.ok) console.error(`Featured API Error: ${featuredRes.status}`);
    if (!allRes.ok) console.error(`All Properties API Error: ${allRes.status}`);

    // 2. FIXED: Changed 'featuredRes.ok.json()' to 'featuredRes.json()'
    const featuredData: PropertyData[] = featuredRes.ok ? await featuredRes.json() : [];
    const allData: PropertyData[] = allRes.ok ? await allRes.json() : [];

    // --- FORCE featured = true for frontend display ---
    const featuredProperties = featuredData
      .filter((p: PropertyData) => p.agentPlanTier === "pro" || p.agentPlanTier === "premium")
      .map((p: PropertyData) => ({ ...p, featured: true }));

    const allProperties = allData;

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