import PropertiesUI from "@/components/templates/PropertiesUI";

export const dynamic = 'force-dynamic';

async function getPropertiesData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.hiigsitech.com';
  
  try {
    // 1. Fetch Featured (Strictly filters for Pro/Premium in API)
    const featuredRes = await fetch(`${baseUrl}/api/properties?featured=true`, { cache: 'no-store' });
    
    // 2. Fetch All Listings (Used for the 'Latest' section)
    const allRes = await fetch(`${baseUrl}/api/properties?limit=300`, { cache: 'no-store' });

    if (!featuredRes.ok) console.error(`Featured API Error: ${featuredRes.status}`);
    if (!allRes.ok) console.error(`All Props API Error: ${allRes.ok}`);

    const featuredProperties = featuredRes.ok ? await featuredRes.json() : [];
    const allProperties = allRes.ok ? await allRes.json() : [];

    // Deduplicate: If a property is already in Featured, don't show it in the main list
    const featuredIds = new Set(featuredProperties.map((p: any) => p.id));
    const uniqueOtherProperties = allProperties.filter((p: any) => !featuredIds.has(p.id));

    // Combine them. The UI will handle the logic of which ones to put in the slider.
    return [...featuredProperties, ...uniqueOtherProperties];

  } catch (error) {
    console.error("PROPERTIES PAGE FETCH ERROR:", error);
    return [];
  }
}

export default async function PropertiesPage() {
  const allPropertiesForWeb = await getPropertiesData();

  return (
    <PropertiesUI 
      initialProperties={allPropertiesForWeb} 
    />
  );
}