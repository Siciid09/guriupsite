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
      const dateObj = p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      dateString = dateObj.toISOString();
    }

    // 2. Map App Booleans to Web Amenities Array
    // Matches the list in PropertiesUI: 
    // ['Furnished', 'Garden', 'Balcony', 'Pool', 'Parking', 'Gate', 'Gym', 'Ocean View', 'AC', 'Security', 'Elevator', 'Meeting Room', 'Internet', 'Water Available']
    const amenitiesList: string[] = [];
    if (p.isFurnished) amenitiesList.push('Furnished');
    if (p.hasGarden) amenitiesList.push('Garden');
    if (p.hasBalcony) amenitiesList.push('Balcony');
    if (p.hasPool) amenitiesList.push('Pool');
    if (p.hasParking) amenitiesList.push('Parking');
    if (p.hasGate) amenitiesList.push('Gate');
    if (p.hasGym) amenitiesList.push('Gym'); // Note: 'hasGym' might not be in DB based on provided dart file, but included for completeness
    if (p.hasAirConditioning) amenitiesList.push('AC');
    if (p.hasSecurity) amenitiesList.push('Security');
    if (p.hasElevators) amenitiesList.push('Elevator');
    if (p.hasMeetingRoom) amenitiesList.push('Meeting Room');
    if (p.hasInternet) amenitiesList.push('Internet');
    if (p.waterAvailable) amenitiesList.push('Water Available');
    // Add others if needed:
    if (p.hasPorch) amenitiesList.push('Porch');
    if (p.hasFence) amenitiesList.push('Fenced');

    return {
      ...p,
      id: p.id,
      title: p.title || 'Untitled Property',
      price: p.price || 0,
      discountPrice: p.discountPrice || 0,
      hasDiscount: p.hasDiscount ?? false,
      
      location: {
        city: p.location?.city || 'Unknown City',
        area: p.location?.area || 'Unknown Area',
      },

      createdAt: dateString, 

      type: p.type || 'Other',
      bedrooms: p.bedrooms ?? p.features?.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? p.features?.bathrooms ?? 0,
      area: p.area ?? p.size ?? p.features?.size ?? 0,
      
      isForSale: p.isForSale ?? true,
      status: p.status || 'available',
      
      // Fix: Normalize Amenities
      amenities: amenitiesList,

      images: p.images?.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
      agentVerified: p.agentVerified ?? false,
      
      // Fix: Map Plan Tier correctly
      planTier: p.planTier || 'free',
      
      featured: p.featured ?? false,
    };
  };

  // Fix: Filter out archived properties
  const featuredProperties = featuredRaw
    .filter((p: any) => !p.isArchived)
    .map(normalizeProperty);

  const featuredIds = new Set(featuredProperties.map(p => p.id));
  
  const otherProperties = allRaw
    .filter((p: any) => !p.isArchived && !featuredIds.has(p.id))
    .map(normalizeProperty);

  const allPropertiesForWeb = [...featuredProperties, ...otherProperties];

  return (
    <PropertiesUI 
      initialProperties={allPropertiesForWeb} 
    />
  );
}