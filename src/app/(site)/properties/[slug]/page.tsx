import { Metadata } from 'next';
import { cache } from 'react';
import { getPropertyBySlug } from '@/app/lib/data'; // Utilize established Supabase data fetcher
import PropertyDetailView, { Property, Agent } from '@/components/templates/PropertyClientView';

type Props = {
  params: Promise<{ slug: string }>
};

// 1. FETCH DATA HELPER (Runs on Server) - CACHED TO PREVENT DOUBLE BILLING
const getPropertyData = cache(async (slug: string) => {
  try {
    // Bypass strict TS type collision with 'as any' since data.ts returns a flattened object
    const rawProperty = await getPropertyBySlug(slug) as any;
    
    if (!rawProperty) return null;

    // Satisfy the strict Agent interface by adding uid and email, and cast via unknown
    const agent = {
        uid: rawProperty.agentId || 'unknown-agent-id',
        email: rawProperty.agentEmail || 'contact@guriup.com',
        name: rawProperty.agentName || 'GuriUp Agent',
        photoUrl: rawProperty.agentPhoto || rawProperty.agentImage || null,
        phone: rawProperty.agentPhone || null,
        planTier: rawProperty.planTier || rawProperty.agentPlanTier || 'free',
        isVerified: rawProperty.agentVerified || false,
    } as unknown as Agent;
    
    return { 
      property: rawProperty as Property,
      agent: agent,
      rawProperty: rawProperty // Expose raw data for SEO fields not in the strict Property type
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
  
  // Safely access fields that might only exist on the raw data object
  const price = rawProperty.displayPrice?.toLocaleString() || property.price?.toLocaleString() || 'Contact for Price';
  const bedrooms = rawProperty.bedrooms || '?';
  const bathrooms = rawProperty.bathrooms || '?';
  
  const title = `${property.title} | $${price} | GuriUp`;
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
      canonical: `https://guriup.com/properties/${slug}`, // SEO: Prevents duplicate content issues
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
      price: rawProperty.displayPrice || property.price,
      priceCurrency: 'USD',
      url: `https://guriup.com/properties/${slug}`,
      seller: {
        '@type': 'RealEstateAgent',
        name: agent?.name || 'GuriUp Agent',
        image: agent?.photoUrl || '',
      }
    }
  };

  // Pass CLEAN, NORMALIZED data to Client Component
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