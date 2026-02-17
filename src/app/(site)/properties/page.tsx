import PropertiesUI from "@/components/templates/PropertiesUI";

async function getPropertiesData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.hiigsitech.com/';
  
  try {
    // Fetch Featured properties first
    const featuredRes = await fetch(`${baseUrl}/api/properties?featured=true`, { cache: 'no-store' });
    
    // ✅ Increase limit from 100 → 300 (or higher if you expect more listings)
    const allRes = await fetch(`${baseUrl}/api/properties?limit=300`, { cache: 'no-store' });

    // Debug logs for visibility
    if (!featuredRes.ok) console.error(`Featured Props Error: ${featuredRes.status}`);
    if (!allRes.ok) console.error(`All Props Error: ${allRes.status}`);

    const featuredProperties = featuredRes.ok ? await featuredRes.json() : [];
    const allProperties = allRes.ok ? await allRes.json() : [];

    // Deduplicate featured
    const featuredIds = new Set(featuredProperties.map((p: any) => p.id));
    const otherProperties = allProperties.filter((p: any) => !featuredIds.has(p.id));

    // Combine and return
    return [...featuredProperties, ...otherProperties];

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
