import { Metadata } from 'next';
import { supabaseAdmin } from '@/app/lib/supabase';
import HomeUI from '@/components/HomeUI';

// =========================================================
// 1. SEO METADATA
// =========================================================
export const metadata: Metadata = {
  title: "GuriUp | Buy, Rent & Book Properties Across Africa",
  description:
    "The #1 Platform for Real Estate & Hotels Across Africa. Find houses, apartments, villas for sale or rent, and book luxury hotels instantly.",
  keywords: [
    "GuriUp", "GuriApp", "Guri Up",
    "Real Estate Africa", "Property Listings Africa", "Buy House Africa", "Rent Apartment Africa",
    "Villas for Sale Africa", "Apartments for Rent Africa", "Hotels Africa", "Hotel Booking Africa",
    "Luxury Hotels Africa", "Somaliland Real Estate", "Somalia Property", "Somali Real Estate",
    "Hargeisa Real Estate", "Berbera Real Estate", "Mogadishu Real Estate", "Muqdisho Real Estate",
    "Jigjiga Real Estate", "Ethiopia Property", "East Africa Real Estate", "Kenya Real Estate",
    "Uganda Property", "Tanzania Real Estate", "Djibouti Property",
  ],
  authors: [{ name: "GuriUp Team" }],
  metadataBase: new URL("https://guriup.com"),
  openGraph: {
    title: 'GuriUp | The Best Real Estate & Hotel App',
    description: "Discover Africa's finest real estate and luxury stays. From bustling cities to coastal retreats, GuriUp is the premier platform to find your dream home or book a weekend getaway across the continent. Buy, rent, and explore with confidence. Download the GuriUp app today.",
    url: 'https://guriup.com',
    siteName: 'GuriUp',
    images: [
      {
        url: '/images/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'GuriUp Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GuriUp | Real Estate & Hotels',
    description: 'Buy, Rent, and Book with GuriUp in Somaliland.',
    images: ['/images/og-home.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// =========================================================
// DATA NORMALIZATION HELPERS
// =========================================================
function isPaidTier(plan: string): boolean {
  const tier = (plan || 'free').toLowerCase().trim();
  return ['pro', 'premium', 'agent_pro', 'agentpro', 'admin', 'sadmin'].includes(tier);
}

function mergeAndNormalize(p: any, liveAgentData: any) {
  const livePlan = (liveAgentData.planTier || p.planTier || p.plan_tier || 'free').toLowerCase();
  const isVerified = isPaidTier(livePlan); 
  const isManualVerified = (liveAgentData.isVerified === true) || (p.agentVerified === true);
  const finalVerifiedStatus = isVerified || isManualVerified;

  let createdAt = p.createdAt || p.created_at || new Date().toISOString();
  if (typeof createdAt === 'object' && (createdAt as any).toDate) {
    createdAt = (createdAt as any).toDate().toISOString();
  }

  const amenities: string[] = Array.isArray(p.amenities) ? [...p.amenities] : [];
  const feats = p.features || {};
  if ((p.isFurnished || feats.isFurnished) && !amenities.includes('Furnished')) amenities.push('Furnished');
  if ((p.hasPool || feats.hasPool) && !amenities.includes('Swimming Pool')) amenities.push('Swimming Pool');
  if ((p.hasParking || feats.hasParking) && !amenities.includes('Parking')) amenities.push('Parking');

  const price = Number(p.price) || 0;
  const discountPrice = Number(p.discountPrice || p.discount_price) || 0;
  const hasValidDiscount = (p.hasDiscount === true || p.has_discount === true) && discountPrice > 0;
  const locationObj = typeof p.location === 'object' && p.location !== null ? p.location : {};

  return {
    id: p._id || p.id,
    slug: p.slug || null,
    title: p.title || p.name || 'Untitled Property',
    description: p.description || p.bio || p.details || '',
    price: price,
    discountPrice: hasValidDiscount ? discountPrice : 0,
    hasDiscount: hasValidDiscount,
    displayPrice: hasValidDiscount ? discountPrice : price,
    isForSale: p.isForSale ?? p.is_for_sale ?? true,
    status: p.status || 'available',
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ['https://placehold.co/600x400?text=No+Image'],
    location: {
      city: locationObj.city || p.city || 'Unknown City',
      area: locationObj.area || p.area || 'Unknown Area',
      gpsCoordinates: locationObj.gpsCoordinates || locationObj.coordinates || null,
    },
    bedrooms: Number(p.bedrooms || feats.bedrooms || 0),
    bathrooms: Number(p.bathrooms || feats.bathrooms || 0),
    area: Number(p.area || p.size || feats.size || 0),
    type: p.type || p.propertyType || 'House',
    amenities: amenities,
    agentId: p.agentId || p.agent_id || '',
    agentName: liveAgentData.agencyName || liveAgentData.businessName || liveAgentData.ownerName || liveAgentData.name || p.agentName || 'GuriUp Agent',
    agentPhoto: liveAgentData.profileImageUrl || liveAgentData.logoUrl || p.agentPhoto || null,
    agentPhone: finalVerifiedStatus ? (p.contactPhone || liveAgentData.whatsappNumber || liveAgentData.phone || p.agentPhone) : null,
    agentVerified: finalVerifiedStatus,
    agentPlanTier: livePlan,
    featured: p.featured || p.isFeatured || false,
    createdAt: createdAt,
  };
}

async function getHomePageData() {
  let featuredProperties: any[] = [];
  let latestProperties: any[] = [];
  let featuredHotels: any[] = [];
  let latestHotels: any[] = [];

  try {
    if (!supabaseAdmin) throw new Error("Supabase Admin client missing.");

    // 1. Fetch properties and hotels concurrently
    const [rawPropsRes, rawHotelsRes] = await Promise.all([
      supabaseAdmin.from('property').select('*').in('status', ['available', 'active', 'rented_out']),
      supabaseAdmin.from('hotels').select('*').limit(50)
    ]);

    const propertiesList = (rawPropsRes.data || []).filter(p => p.isArchived !== true && p.is_archived !== true);
    const hotelsList = rawHotelsRes.data || [];

    // 2. Fetch Agents for properties
    const agentIds = [...new Set(propertiesList.map(p => p.agentId || p.agent_id).filter(Boolean))];
    const agentMap: Record<string, any> = {};

    if (agentIds.length > 0) {
      const { data: agentsData } = await supabaseAdmin.from('agents').select('*').in('_id', agentIds);
      (agentsData || []).forEach(agent => { agentMap[agent._id || agent.id] = agent; });
    }

    // 3. Normalize Properties
    const allNormalizedProps = propertiesList.map(p => {
      const liveAgent = agentMap[p.agentId || p.agent_id] || {};
      return mergeAndNormalize(p, liveAgent);
    });

    // Separate Featured vs Latest Properties
    // Featured: Marked featured OR created by a Pro/Paid Agent
    featuredProperties = allNormalizedProps.filter(p => p.featured || p.featured || isPaidTier(p.agentPlanTier));
    
    // If no explicit featured properties exist, fallback to showing top 6 available properties
    if (featuredProperties.length === 0) {
      featuredProperties = allNormalizedProps.slice(0, 6);
    }
    
    latestProperties = allNormalizedProps.slice(0, 8);

    // 4. Normalize Hotels
    const normalizedHotels = hotelsList.map(h => {
      const locObj = typeof h.location === 'object' && h.location !== null ? h.location : {};
      return {
        id: h._id || h.id,
        slug: h.slug || null,
        name: h.name || h.title || 'Untitled Hotel',
        description: h.description || '',
        type: h.type || 'Hotel',
        rating: Number(h.rating) || 4.5,
        pricePerNight: Number(h.pricePerNight || h.price) || 0,
        images: Array.isArray(h.images) && h.images.length > 0 ? h.images : ['https://placehold.co/600x400?text=No+Hotel+Image'],
        location: {
          city: locObj.city || h.city || 'Hargeisa',
          area: locObj.area || h.area || 'City Center',
        },
        planTier: (h.planTier || 'free').toLowerCase(),
        isPro: isPaidTier(h.planTier || 'free') || h.isPro === true,
        featured: h.featured === true || h.isFeatured === true,
      };
    });

    featuredHotels = normalizedHotels.filter(h => h.featured || h.isPro).slice(0, 6);
    if (featuredHotels.length === 0) {
      featuredHotels = normalizedHotels.slice(0, 6);
    }
    
    latestHotels = normalizedHotels.slice(0, 8);

  } catch (error) {
    console.error("🚨 Error fetching homepage data natively:", error);
  }

  return { featuredProperties, latestProperties, featuredHotels, latestHotels };
}

// =========================================================
// 2. MAIN PAGE COMPONENT
// =========================================================
export default async function HomePage() {
  const { featuredProperties, latestProperties, featuredHotels, latestHotels } = await getHomePageData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'GuriUp',
    image: 'https://guriup.com/images/og-home.jpg',
    description: 'The leading real estate and hotel booking platform in Somaliland.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Road 1, Jigjiga Yar',
      addressLocality: 'Hargeisa',
      addressCountry: 'SO'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.562385,
      longitude: 44.077011
    },
    url: 'https://guriup.com',
    telephone: '+252653227084',
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '22:00'
      }
    ]
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HOME UI Component */}
      <HomeUI 
        featuredProperties={featuredProperties} 
        featuredHotels={featuredHotels} 
        latestProperties={latestProperties} 
        latestHotels={latestHotels} 
      />
    </>
  );
}