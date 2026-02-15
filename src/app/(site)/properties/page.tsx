import { getFeaturedProperties, getAllProperties } from '../../lib/data';
import PropertiesUI from '@/components/templates/PropertiesUI'; 

export default async function PropertiesPage() {
  const [featuredRaw, allRaw] = await Promise.all([
    getFeaturedProperties(),
    getAllProperties(),
  ]);

  const normalizeProperty = (p: any) => {
    // 1. Handle the createdAt mismatch
    let dateString = '';
    if (p.createdAt) {
      // If it's a Firestore Timestamp, convert to Date; otherwise use as is
      const dateObj = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      dateString = dateObj.toISOString(); // Forces it into a 'string'
    }

    return {
      ...p,
      id: p.id,
      title: p.title || 'Untitled Property',
      price: p.price || 0,
      discountPrice: p.discountPrice || 0,
      hasDiscount: p.hasDiscount ?? false,
      
      // Fix: Ensure location is an object for web filtering
      location: {
        city: p.location?.city || 'Unknown City',
        area: p.location?.area || 'Unknown Area',
      },

      // Fix: Convert Date/Timestamp to String to satisfy the error
      createdAt: dateString, 

      type: p.type || 'Other',
      bedrooms: p.bedrooms ?? p.features?.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? p.features?.bathrooms ?? 0,
      area: p.area ?? p.size ?? p.features?.size ?? 0,
      
      isForSale: p.isForSale ?? true,
      status: p.status || 'available',
      
      images: p.images?.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
      agentVerified: p.agentVerified ?? false,
      featured: p.featured ?? false,
    };
  };

  const featuredProperties = featuredRaw.map(normalizeProperty);
  const featuredIds = new Set(featuredProperties.map(p => p.id));
  
  const otherProperties = allRaw
    .filter(p => !featuredIds.has(p.id))
    .map(normalizeProperty);

  const allPropertiesForWeb = [...featuredProperties, ...otherProperties];

  return (
    <PropertiesUI 
      initialProperties={allPropertiesForWeb} 
    />
  );
}