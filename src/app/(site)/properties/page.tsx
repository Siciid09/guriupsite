import { Metadata } from "next";
import PropertiesUI from "@/components/templates/PropertiesUI";
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

export const metadata: Metadata = {
  title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
  description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide. Explore verified real estate listings on GuriUp.',
  keywords: 'real estate Africa, properties for sale worldwide, buy house Africa, rent apartment globally, commercial property, GuriUp real estate, international property listings',
  openGraph: {
    title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
    description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide.',
    type: 'website',
    siteName: 'GuriUp',
    locale: 'en_US',
    url: `${BASE_URL}/properties`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prime Real Estate & Properties in Africa & The World | GuriUp',
    description: 'Discover top houses, apartments, and commercial properties for sale and rent across Africa and worldwide.',
  },
  alternates: {
    canonical: `${BASE_URL}/properties`,
  }
};

// --- MIRROR THE API'S RICH NORMALIZATION LOGIC ---
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
    currency: p.currency || '$',
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

async function getPropertiesData() {
  try {
    if (!supabaseAdmin) throw new Error("Supabase Admin Client Missing");

    // 1. Fetch raw properties
    const { data: rawProperties } = await supabaseAdmin
      .from('property')
      .select('*')
      .in('status', ['available', 'active', 'rented_out']);

    const propertiesList = (rawProperties || []).filter(p => p.isArchived !== true && p.is_archived !== true);

    // 2. Batch fetch Agents for merging
    const agentIds = [...new Set(propertiesList.map(p => p.agentId || p.agent_id).filter(Boolean))];
    const agentMap: Record<string, any> = {};

    if (agentIds.length > 0) {
      const { data: agentsData } = await supabaseAdmin.from('agents').select('*').in('_id', agentIds);
      (agentsData || []).forEach(agent => { agentMap[agent._id || agent.id] = agent; });
    }

    // 3. Merge and Normalize exactly like the API does
    const allProperties = propertiesList.map(p => {
      const liveAgent = agentMap[p.agentId || p.agent_id] || {};
      return mergeAndNormalize(p, liveAgent);
    });

    // 4. Filter Featured based on normalized data and Pro status
    const featuredProperties = allProperties.filter(p => p.featured && isPaidTier(p.agentPlanTier || 'free'));

    return { featuredProperties, allProperties };
  } catch (error) {
    console.error("PROPERTIES PAGE NATIVE DB FETCH ERROR:", error);
    return { featuredProperties: [], allProperties: [] };
  }
}

export default async function PropertiesPage() {
  const { featuredProperties, allProperties } = await getPropertiesData();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Real Estate & Properties in Africa & The World',
    description: 'Browse houses, apartments, and commercial spaces for sale and rent globally.',
    url: `${BASE_URL}/properties`,
    provider: {
      '@type': 'Organization',
      name: 'GuriUp',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: featuredProperties.slice(0, 3).map((property: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'RealEstateListing',
          name: property?.title || 'GuriUp Premium Property',
          url: `${BASE_URL}/properties/${property?.slug || property?.id || ''}`
        }
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertiesUI
        featuredProperties={featuredProperties as any}
        allProperties={allProperties as any}
      />
    </>
  );
}