import { getFeaturedHotels, getAllHotels } from '../../lib/data';
import HotelsUI from '@/components/templates/HotelsUI';

export default async function HotelsPage() {
  const [featuredRaw, allRaw] = await Promise.all([
    getFeaturedHotels(),
    getAllHotels(),
  ]);

  const normalizeHotel = (h: any) => {
    // 1. TRANSLATE AMENITIES: Convert boolean object to string array
    // This matches the 'AMENITIES_LIST' in your HotelsUI.tsx
    const am = h.amenities || {};
    const normalizedAmenities: string[] = [];
    if (am.hasWifi) normalizedAmenities.push('Wi-Fi');
    if (am.hasPool) normalizedAmenities.push('Swimming Pool');
    if (am.hasGym) normalizedAmenities.push('Gym');
    if (am.hasRestaurant) normalizedAmenities.push('Restaurant');
    if (am.hasParking) normalizedAmenities.push('Parking');
    if (am.hasRoomService) normalizedAmenities.push('Room Service');
    if (am.hasSpa) normalizedAmenities.push('Spa');
    if (am.hasBar) normalizedAmenities.push('Bar');
    if (am.hasFrontDesk) normalizedAmenities.push('24/7 Front Desk');

    return {
      ...h,
      id: h.id,
      name: h.name || 'Untitled Hotel',
      pricePerNight: h.pricePerNight || 0,
      images: h.images?.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Image'],
      rating: h.rating || 0,
      
      // 2. Fix Amenities for filtering
      amenities: normalizedAmenities, 

      // 3. Ensure location is an object for the UI helper
      location: {
        city: h.location?.city || 'Unknown City',
        area: h.location?.area || 'Unknown Area',
      },

      // 4. Handle Plan Tiers
      planTier: h.planTier || 'free',
      isPro: h.planTier === 'pro' || h.planTier === 'premium' || h.isPro === true,
    };
  };

  const featuredHotels = featuredRaw.map(normalizeHotel);
  const featuredIds = new Set(featuredHotels.map(h => h.id));
  
  const otherHotels = allRaw
    .filter(h => !featuredIds.has(h.id))
    .map(normalizeHotel);

  return (
    <HotelsUI 
      featuredHotels={featuredHotels} 
      allHotels={otherHotels} 
    />
  );
}