import PropertiesUI from '@/components/templates/PropertiesUI';

// Helper to fetch data from your Source of Truth API
async function getPropertiesData() {
  // 1. Determine Base URL Safely
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
    ? process.env.NEXT_PUBLIC_BASE_URL 
    : 'http://localhost:3000'; // Fallback for local dev
  
  try {
    console.log(`Fetching properties from: ${baseUrl}/api/properties`);

    // 2. Fetch Data
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${baseUrl}/api/properties?featured=true`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/properties?limit=100`, { cache: 'no-store' }),
    ]);

    // 3. Error Handling with Details
    if (!featuredRes.ok) {
        const errorText = await featuredRes.text();
        console.error(`Featured API Error (${featuredRes.status}):`, errorText);
    }
    if (!allRes.ok) {
        const errorText = await allRes.text();
        console.error(`All Properties API Error (${allRes.status}):`, errorText);
    }

    if (!featuredRes.ok || !allRes.ok) {
      return [];
    }

    const featuredProperties = await featuredRes.json();
    const allProperties = await allRes.json();

    // 4. Deduplicate logic
    const featuredIds = new Set(featuredProperties.map((p: any) => p.id));
    const otherProperties = allProperties.filter((p: any) => !featuredIds.has(p.id));

    return [...featuredProperties, ...otherProperties];

  } catch (error) {
    console.error("Network/Server Error in properties page:", error);
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