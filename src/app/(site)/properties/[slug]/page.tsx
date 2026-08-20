import { Metadata } from 'next';
import { cache } from 'react';
import { getPropertyBySlug } from '@/app/lib/data'; 
import PropertyDetailView, { Property, Agent } from '@/components/templates/PropertyClientView';
import { supabaseAdmin } from '@/app/lib/supabase';

type Props = {
  params: Promise<{ slug: string }>
};

// BULLETPROOF DATABASE FINDER FOR PROPERTIES
async function getPropertySafely(identifier: string) {
  if (!supabaseAdmin) return null;
  const queries = [
    { col: 'slug', val: identifier, ilike: false },
    { col: '_id', val: identifier, ilike: false },
    { col: 'id', val: identifier, ilike: false },
    { col: 'slug', val: identifier, ilike: true }
  ];
  for (const q of queries) {
    try {
      const { data, error } = q.ilike 
        ? await supabaseAdmin.from('property').select('*').ilike(q.col, q.val).maybeSingle()
        : await supabaseAdmin.from('property').select('*').eq(q.col, q.val).maybeSingle();
      if (data && !error) return data;
    } catch (e) {}
  }
  return null;
}

// 1. FETCH DATA HELPER (Runs on Server) - CACHED
const getPropertyData = cache(async (slug: string) => {
  try {
    const rawProperty = await getPropertySafely(slug) as any;
    
    if (!rawProperty) return null;

    // FIX: Normalize nested objects so the Client Component NEVER receives nulls
    const safeProperty = {
      ...rawProperty,
      details: rawProperty.details || {},
      features: rawProperty.features || {},
      location: rawProperty.location || {},
      rentalDetails: rawProperty.rentalDetails || {},
      saleDetails: rawProperty.saleDetails || {},
      contact: rawProperty.contact || {},
      amenities: Array.isArray(rawProperty.amenities) ? rawProperty.amenities : [],
    };

    const agent = {
        uid: safeProperty.agentId || 'unknown-agent-id',
        email: safeProperty.agentEmail || 'contact@guriup.com',
        name: safeProperty.agentName || 'GuriUp Agent',
        photoUrl: safeProperty.agentPhoto || safeProperty.agentImage || null,
        phone: safeProperty.agentPhone || null,
        planTier: safeProperty.planTier || safeProperty.agentPlanTier || 'free',
        isVerified: safeProperty.agentVerified || false,
    } as unknown as Agent;
    
    return { 
      property: safeProperty as Property,
      agent: agent,
      rawProperty: safeProperty 
    };
  } catch (error) {
    console.error("Error fetching property data from Supabase:", error);
    return null;
  }
});

// 2. SEO METADATA GENERATOR
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyData(slug);

  if (!data || !data.property) {
    return { title: 'Property Not Found' };
  }

  const { property, rawProperty } = data;
  
  // FIX: Safe bedroom/bathroom extraction checking all possible paths
  const bedrooms = rawProperty.bedrooms || rawProperty.details?.bedrooms || rawProperty.features?.bedrooms || '?';
  const bathrooms = rawProperty.bathrooms || rawProperty.details?.bathrooms || rawProperty.features?.bathrooms || '?';
  
  // FIX: Dynamic Currency Formatting for Meta Title
  const currencyCode = property.currency || 'USD';
  const priceValue = rawProperty.displayPrice || property.price || 0;
  
  let formattedPrice = `${currencyCode} ${priceValue.toLocaleString()}`;
  try {
    formattedPrice = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: currencyCode, 
      maximumFractionDigits: 0 
    }).format(priceValue);
  } catch (e) {
    // Fallback if currency code is unusual (e.g., SLSH)
  }
  
  const title = `${property.title} | ${formattedPrice} | GuriUp`;
  const description = `${property.type || 'Property'} for ${property.isForSale ? 'Sale' : 'Rent'} in ${property.location?.city || 'Somaliland'}. ${bedrooms} Bed, ${bathrooms} Bath. ${property.description ? property.description.substring(0, 100) : ''}...`;
  const image = property.images?.[0] || '';

  return {
    title: title,
    description: description,
    keywords: `${property.type || 'Property'} for ${property.isForSale ? 'sale' : 'rent'} in ${property.location?.city || 'Somaliland'}, real estate, GuriUp`,
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

  const { property, agent, rawProperty } = data;

  // FIX: Dynamic currency injected into Google Schema 
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    image: property.images || [],
    url: `https://guriup.com/properties/${slug}`,
    offers: {
      '@type': 'Offer',
      price: rawProperty.displayPrice || property.price || 0,
      priceCurrency: property.currency || 'USD',
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