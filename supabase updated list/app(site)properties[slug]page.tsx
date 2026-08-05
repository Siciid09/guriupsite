import { Metadata } from 'next';
import { cache } from 'react';
import { supabase } from '@/app/lib/supabase';
import PropertyDetailView, { Property, Agent } from '@/components/templates/PropertyClientView';

type Props = {
  params: Promise<{ slug: string }>
};

// 1. FETCH DATA HELPER (Runs on Server) - CACHED TO PREVENT DOUBLE BILLING
const getPropertyData = cache(async (slug: string) => {
  let propertyData: any = null;

  // PRIORITY 1: Search by slug field in Supabase 'properties' (or fallback to 'property')
  let { data: slugMatch } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (!slugMatch) {
    const { data: singularSlugMatch } = await supabase
      .from('property')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    slugMatch = singularSlugMatch;
  }

  if (slugMatch) {
    propertyData = slugMatch;
  } else {
    // PRIORITY 2: Fallback to direct ID fetch ('id' or '_id')
    let { data: idMatch } = await supabase
      .from('properties')
      .select('*')
      .eq('id', slug)
      .maybeSingle();

    if (!idMatch) {
      const { data: altIdMatch } = await supabase
        .from('properties')
        .select('*')
        .eq('_id', slug)
        .maybeSingle();
      idMatch = altIdMatch;
    }

    if (!idMatch) {
      const { data: singularIdMatch } = await supabase
        .from('property')
        .select('*')
        .eq('id', slug)
        .maybeSingle();
      idMatch = singularIdMatch;
    }

    propertyData = idMatch;
  }

  if (!propertyData) return null;

  const property = propertyData as Property;
  let agent: Agent | null = null;

  if (property.agentId) {
    // --- FIX 1: Check 'agents' table first (for Pro/Business accounts) ---
    let agentData: any = null;

    const { data: agentById } = await supabase
      .from('agents')
      .select('*')
      .eq('id', property.agentId)
      .maybeSingle();

    if (agentById) {
      agentData = agentById;
    } else {
      const { data: agentByUnderscoreId } = await supabase
        .from('agents')
        .select('*')
        .eq('_id', property.agentId)
        .maybeSingle();
      agentData = agentByUnderscoreId;
    }

    // --- FIX 2: Fallback to 'users' if not found in agents ---
    if (!agentData) {
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', property.agentId)
        .maybeSingle();

      if (userById) {
        agentData = userById;
      } else {
        const { data: userByUnderscoreId } = await supabase
          .from('users')
          .select('*')
          .eq('_id', property.agentId)
          .maybeSingle();
        agentData = userByUnderscoreId;
      }
    }

    if (agentData) {
      // --- FIX 3: Normalize Name & Verification ---
      const planTier = (agentData.planTier || 'free').toLowerCase();
      const isPro = planTier === 'pro' || planTier === 'premium';
      const isVerified = isPro || agentData.isVerified === true;

      const finalName = agentData.agencyName || agentData.businessName || agentData.displayName || agentData.name || 'GuriUp Agent';
      const finalPhoto = agentData.logoUrl || agentData.profileImageUrl || agentData.photoURL || null;

      agent = {
        ...agentData,
        name: finalName,
        planTier: planTier,
        isVerified: isVerified,
        photoUrl: finalPhoto,
        email: agentData.email,
        phone: agentData.phone || agentData.whatsappNumber
      } as Agent;
    }
  }

  return { property, agent };
});

// 2. SEO METADATA GENERATOR
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyData(slug);

  if (!data || !data.property) {
    return { title: 'Property Not Found' };
  }

  const { property } = data;
  const price = property.price?.toLocaleString() || 'Contact for Price';
  const title = `${property.title} | $${price} | GuriUp`;
  const description = `${property.type} for ${property.isForSale ? 'Sale' : 'Rent'} in ${property.location?.city || 'Somaliland'}. ${property.features?.bedrooms || '?'} Bed, ${property.features?.bathrooms || '?'} Bath. ${property.description ? property.description.substring(0, 100) : ''}...`;
  const image = property.images?.[0] || '';

  return {
    title: title,
    description: description,
    keywords: `${property.type} for ${property.isForSale ? 'sale' : 'rent'} in ${property.location?.city || 'Somaliland'}, real estate, GuriUp`,
    openGraph: {
      title: title,
      description: description,
      images: image ? [{ url: image }] : [],
      type: 'website',
      siteName: 'GuriUp',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `https://guriup.com/properties/${slug}`,
    }
  };
}

// 3. MAIN PAGE
export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPropertyData(slug);

  if (!data || !data.property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFBFC]">
        <h1 className="text-2xl font-black text-slate-900">Property Not Found</h1>
        <p className="text-slate-500">The property you are looking for has been removed or does not exist.</p>
      </div>
    );
  }

  const { property, agent } = data;

  // SEO: Real Estate JSON-LD Schema for Google Search Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    image: property.images || [],
    url: `https://guriup.com/properties/${slug}`,
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'USD',
      url: `https://guriup.com/properties/${slug}`,
      seller: {
        '@type': 'RealEstateAgent',
        name: agent?.name || 'GuriUp Agent',
        image: agent?.photoUrl || '',
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailView initialProperty={property} initialAgent={agent} />
    </>
  );
}