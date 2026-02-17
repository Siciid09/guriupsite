import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // ⚠️ Check path
import PropertyDetailView, { Property, Agent } from '@/components/templates/PropertyClientView';

type Props = {
  params: Promise<{ slug: string }>
};

// --- FIX: Helper to convert Firebase Timestamps to Strings ---
const sanitizeData = (data: any) => {
  if (!data) return null;
  
  // deeply clone the object to avoid mutating the original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  if (data.createdAt?.seconds) sanitized.createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
  if (data.updatedAt?.seconds) sanitized.updatedAt = new Date(data.updatedAt.seconds * 1000).toISOString();
  if (data.subscriptionExpiresAt?.seconds) sanitized.subscriptionExpiresAt = new Date(data.subscriptionExpiresAt.seconds * 1000).toISOString();

  return sanitized;
};

// 1. FETCH DATA HELPER (Runs on Server)
async function getPropertyData(slug: string) {
  const propertyRef = doc(db, 'property', slug);
  const propertySnap = await getDoc(propertyRef);

  if (!propertySnap.exists()) return null;

  // Get raw data
  const rawProperty = { id: propertySnap.id, ...propertySnap.data() };
  
  // --- FIX: Sanitize Property Data ---
  const property = sanitizeData(rawProperty) as Property;
  
  let agent: Agent | null = null;
  if (property.agentId) {
    const agentRef = doc(db, 'users', property.agentId);
    const agentSnap = await getDoc(agentRef);
    if (agentSnap.exists()) {
      // --- FIX: Sanitize Agent Data ---
      agent = sanitizeData(agentSnap.data()) as Agent;
    }
  }

  return { property, agent };
}

// 2. SEO METADATA GENERATOR
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPropertyData(slug);

  if (!data || !data.property) {
    return { title: 'Property Not Found' };
  }

  const { property } = data;
  const price = property.price.toLocaleString();
  const title = `${property.title} | ${price}`;
  const description = `${property.type} for ${property.isForSale ? 'Sale' : 'Rent'} in ${property.location.city}. ${property.features?.bedrooms || '?'} Bed, ${property.features?.bathrooms || '?'} Bath. ${property.description.substring(0, 100)}...`;
  const image = property.images[0] || '';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [image],
      type: 'website',
      siteName: 'GuriUp',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [image],
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

  // Pass CLEAN data to Client Component
  return <PropertyDetailView initialProperty={data.property} initialAgent={data.agent} />;
}