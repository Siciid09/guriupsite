import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import PropertyDetailView, { Property, Agent } from '@/components/templates/PropertyClientView';

type Props = {
  params: Promise<{ slug: string }>
};

// --- Helper: Convert Firebase Timestamps to Strings ---
const sanitizeData = (data: any) => {
  if (!data) return null;
  
  const sanitized = JSON.parse(JSON.stringify(data));
  
  if (data.createdAt?.seconds) sanitized.createdAt = new Date(data.createdAt.seconds * 1000).toISOString();
  if (data.updatedAt?.seconds) sanitized.updatedAt = new Date(data.updatedAt.seconds * 1000).toISOString();
  if (data.subscriptionExpiresAt?.seconds) sanitized.subscriptionExpiresAt = new Date(data.subscriptionExpiresAt.seconds * 1000).toISOString();

  return sanitized;
};

// 1. FETCH DATA HELPER (Runs on Server)
// 1. FETCH DATA HELPER (Runs on Server)
import { collection, query, where, limit, getDocs } from 'firebase/firestore'; // Make sure these are imported at the top!

async function getPropertyData(slug: string) {
  let propertySnap: any = null;

  // PRIORITY 1: Search by slug field
  const slugQuery = query(collection(db, 'property'), where('slug', '==', slug), limit(1));
  const slugDocs = await getDocs(slugQuery);

  if (!slugDocs.empty) {
    propertySnap = slugDocs.docs[0];
  } else {
    // PRIORITY 2: Fallback to direct ID fetch
    propertySnap = await getDoc(doc(db, 'property', slug));
  }

  if (!propertySnap || !propertySnap.exists()) return null;

  // Get raw data
  const rawProperty = { id: propertySnap.id, ...propertySnap.data() };
  const property = sanitizeData(rawProperty) as Property;
  
  let agent: Agent | null = null;
  
  if (property.agentId) {
    // --- FIX 1: Check 'agents' collection first (for Pro/Business accounts) ---
    let agentRef = doc(db, 'agents', property.agentId);
    let agentSnap = await getDoc(agentRef);

    // --- FIX 2: Fallback to 'users' if not found in agents ---
    if (!agentSnap.exists()) {
      agentRef = doc(db, 'users', property.agentId);
      agentSnap = await getDoc(agentRef);
    }

    if (agentSnap.exists()) {
      const rawAgent = agentSnap.data();
      const sanitizedAgent = sanitizeData(rawAgent);

      // --- FIX 3: Normalize Name & Verification (Match route.ts logic) ---
      // Determine Plan & Verification
      const planTier = (rawAgent.planTier || 'free').toLowerCase();
      const isPro = planTier === 'pro' || planTier === 'premium';
      const isVerified = isPro || rawAgent.isVerified === true;

      // Prioritize Agency/Business Name over User Name
      const finalName = rawAgent.agencyName || rawAgent.businessName || rawAgent.displayName || rawAgent.name || 'GuriUp Agent';
      const finalPhoto = rawAgent.logoUrl || rawAgent.profileImageUrl || rawAgent.photoURL || null;

      // Construct the Agent object explicitly to ensure the View gets what it needs
      agent = {
        ...sanitizedAgent,
        name: finalName,            // Overwrites personal name with Agency name
        planTier: planTier,         // Ensures 'pro' is passed
        isVerified: isVerified,     // Explicitly sets verification
        photoURL: finalPhoto,       // Ensures logo is used if available
        // Preserve other fields
        email: rawAgent.email,
        phone: rawAgent.phone || rawAgent.whatsappNumber
      } as Agent;
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

  // Pass CLEAN, NORMALIZED data to Client Component
  return <PropertyDetailView initialProperty={data.property} initialAgent={data.agent} />;
}