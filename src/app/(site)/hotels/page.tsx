import { getFeaturedHotels, getAllHotels } from '../../lib/data';
import HotelsUI from '@/components/templates/HotelsUI'; // Adjust path if needed

export default async function HotelsPage() {
  // Fetch data on the server
  const [featuredHotels, allHotels] = await Promise.all([
    getFeaturedHotels(),
    getAllHotels(),
  ]);

  // Filter out featured from all list to avoid duplicates in the "All" section
  const featuredIds = new Set(featuredHotels.map(h => h.id));
  const otherHotels = allHotels.filter(h => !featuredIds.has(h.id));

  // Render the Client UI with data
 // return <HotelsUI featuredHotels={featuredHotels} allHotels={otherHotels} />;
}