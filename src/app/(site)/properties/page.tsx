import PropertiesUI from '@/components/templates/PropertiesUI';

// Helper to fetch data from your internal API
async function getPropertiesData() {
  // Use absolute URL for server-side fetching
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.hiigsitech.com/';
  
  try {
    // 1. Fetch Featured
    const featuredRes = await fetch(`${baseUrl}/api/properties?featured=true`, { cache: 'no-store' });
    
    // 2. Fetch All (Limit 100)
    const allRes = await fetch(`${baseUrl}/api/properties?limit=100`, { cache: 'no-store' });

    // Debug Logs
    if (!featuredRes.ok) console.error(`Featured Props Error: ${featuredRes.status}`);
    if (!allRes.ok) console.error(`All Props Error: ${allRes.status}`);

    const featuredProperties = featuredRes.ok ? await featuredRes.json() : [];
    const allProperties = allRes.ok ? await allRes.json() : [];

    // Combine and Deduplicate
    const featuredIds = new Set(featuredProperties.map((p: any) => p.id));
    const otherProperties = allProperties.filter((p: any) => !featuredIds.has(p.id));

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