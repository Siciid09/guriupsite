import { 
  getFeaturedProperties, 
  getLatestProperties, 
  getFeaturedHotels, 
  getLatestHotels 
} from '../lib/data';
import HomeUI from '@/components/HomeUI';
import { Property, Hotel } from '@/types'; // Ensure correct import

export default async function HomePage() {
  // Fetch data on the server (just like the old design)
  const [
    featuredProperties,
    latestProperties,
    featuredHotels,
    latestHotels,
  ] = await Promise.all([
    getFeaturedProperties(),
    getLatestProperties(),
    getFeaturedHotels(),
    getLatestHotels(),
  ]);

  // Pass the data to the new UI component
  return (
    <HomeUI 
      featuredProperties={featuredProperties} 
      featuredHotels={featuredHotels} 
    />
  );
}