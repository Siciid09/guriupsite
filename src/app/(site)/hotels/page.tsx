import HotelsUI from '@/components/templates/HotelsUI';

// Helper to fetch data from your internal API
async function getHotelsData() {
  // Use absolute URL for server-side fetching
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.hiigsitech.com/';
   
  try {
    const [featuredRes, allRes] = await Promise.all([
      fetch(`${baseUrl}/api/hotels?featured=true&limit=10`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/hotels?limit=50`, { cache: 'no-store' }),
    ]);

    if (!featuredRes.ok || !allRes.ok) {
      console.error("Failed to fetch hotels data");
      return { featuredHotels: [], allHotels: [] };
    }

    const featuredHotels = await featuredRes.json();
    const allHotels = await allRes.json();

    return { featuredHotels, allHotels };
  } catch (error) {
    console.error("Error fetching hotels:", error);
    return { featuredHotels: [], allHotels: [] };
  }
}

export default async function HotelsPage() {
  // 1. Fetch normalized data from your Single Source of Truth API
  const { featuredHotels, allHotels } = await getHotelsData();

  // 2. Pass directly to UI (No local normalization needed anymore)
  return (
    <HotelsUI 
      featuredHotels={featuredHotels} 
      allHotels={allHotels} 
    />
  );
}