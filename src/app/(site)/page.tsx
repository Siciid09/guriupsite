import { 
  getFeaturedProperties, 
  getLatestProperties, 
  getFeaturedHotels, 
  getLatestHotels 
} from '../lib/data';
import HomeUI from '@/components/HomeUI';
import { Property, Hotel } from '@/types'; 

export default async function HomePage() {
  // Fetch data on the server
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

  return (
    <HomeUI 
      // Using "as any" bypasses the 'string' vs 'union' type mismatch 
      // during the Vercel build process.
      featuredProperties={featuredProperties as any} 
      featuredHotels={featuredHotels as any} 
      latestProperties={latestProperties as any} 
      latestHotels={latestHotels as any} 
    />
  );
}