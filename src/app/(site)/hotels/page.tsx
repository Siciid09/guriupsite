import HotelsUI from '@/components/templates/HotelsUI';
import { getHotelsDataInternal } from '@/app/api/hotels/route';

export const dynamic = 'force-dynamic';

export default async function HotelsPage() {
  // 1. Fetch data directly
  const [featuredData, allData] = await Promise.all([
    // Recommended: Strictly fetch PRO/PREMIUM (isFeatured: true)
    getHotelsDataInternal({ isFeatured: true, limitCount: 10 }),
    
    // Explore All: Fetch EVERYTHING (No filters, limit 100)
    getHotelsDataInternal({ isFeatured: false, limitCount: 100 }),
  ]);

  const featuredHotels = Array.isArray(featuredData) ? featuredData : [];
  const allHotels = Array.isArray(allData) ? allData : [];

  return (
    <HotelsUI 
      featuredHotels={featuredHotels} 
      allHotels={allHotels} 
    />
  );
}