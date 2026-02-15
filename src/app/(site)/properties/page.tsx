import { getFeaturedProperties, getAllProperties } from '../../lib/data';
import PropertiesUI from '@/components/templates/PropertiesUI'; // Ensure path matches your UI component

/**
 * SERVER COMPONENT
 * Fetches data on the server and passes it to the modern UI Client Component.
 */
export default async function PropertiesPage() {
  // Fetch data in parallel for speed
  const [featuredRaw, allRaw] = await Promise.all([
    getFeaturedProperties(),
    getAllProperties(),
  ]);

  /**
   * DATA NORMALIZATION
   * Maps Firebase/Backend data to match the UI requirements.
   * Handles cases where 'area' might be 'size' or nested in 'features'.
   */
  const normalizeProperty = (p: any) => ({
    ...p,
    id: p.id,
    title: p.title || 'Untitled Property',
    price: p.price || 0,
    // Ensures UI always has an array for images
    images: p.images || ['https://via.placeholder.com/800x600?text=No+Image'],
    // Normalizes location from object or string
    location: typeof p.location === 'object' 
      ? `${p.location?.area || ''}${p.location?.area && p.location?.city ? ', ' : ''}${p.location?.city || ''}` 
      : p.location || 'Unknown Location',
    // Fallback for fields that differ between App and Web versions
    bedrooms: p.bedrooms ?? p.features?.bedrooms ?? 0,
    bathrooms: p.bathrooms ?? p.features?.bathrooms ?? 0,
    area: p.area ?? p.size ?? p.features?.area ?? 0,
    isForSale: p.isForSale ?? (p.status !== 'For Rent' && p.status !== 'rented_out'),
    status: p.status || 'available',
  });

  const featuredProperties = featuredRaw.map(normalizeProperty);
  
  // Filter out featured items from the "All" list to prevent duplicates
  const featuredIds = new Set(featuredProperties.map(p => p.id));
  const otherProperties = allRaw
    .filter(p => !featuredIds.has(p.id))
    .map(normalizeProperty);

  //return (
   // <PropertiesUI 
//featuredProperties={featuredProperties} 
  //    allProperties={otherProperties} 
    ///>
  //);
}