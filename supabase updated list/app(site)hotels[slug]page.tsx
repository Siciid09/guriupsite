import { Metadata } from 'next';
import { cache } from 'react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import HotelDetailView from '@/components/templates/HotelClientView';

// --- TYPES ---
type Props = {
  params: Promise<{ slug: string }>
};

// --- OPTIMIZATION: Cache the DB call to avoid double-fetching ---
// This ensures Firebase is only hit once per page load, even though
// both generateMetadata and the Page component need the data.
const getHotelData = cache(async (slug: string) => {
  let data: any = null;

  // PRIORITY 1: Search by Slug
  const slugQuery = query(collection(db, 'hotels'), where('slug', '==', slug), limit(1));
  const slugDocs = await getDocs(slugQuery);

  if (!slugDocs.empty) {
    data = { id: slugDocs.docs[0].id, ...slugDocs.docs[0].data() };
  } else {
    // PRIORITY 2: Fallback to direct ID fetch
    const docRef = doc(db, 'hotels', slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      data = { id: snap.id, ...snap.data() };
    }
  }
  return data;
});

// --- STEP 1: MAXIMIZED METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHotelData(slug);

  if (!data) {
    return { title: 'Hotel Not Found | GuriUp' };
  }

  const hotelName = data.name || 'Luxury Hotel';
  const price = data.pricePerNight ? `$${data.pricePerNight}` : 'Check Price';
  
  let locationString = 'Somaliland';
  if (data.location) {
     if (typeof data.location === 'string') locationString = data.location;
     else if (typeof data.location === 'object') {
        locationString = `${data.location.area || ''}, ${data.location.city || ''}`;
     }
  }

  const descriptionText = data.description 
    ? data.description.substring(0, 160).replace(/\n/g, ' ') 
    : `Book your stay at ${hotelName} in ${locationString}.`;

  const title = `${hotelName} | ${locationString} - Starting at ${price}`;
  const images = data.images && data.images.length > 0 ? data.images : ['/default-guriup-og.jpg'];

  return {
    title: title,
    description: descriptionText,
    keywords: `${hotelName}, hotels in ${locationString}, book hotel ${data.location?.city || ''}, GuriUp, best hotels`,
    openGraph: {
      title: title,
      description: descriptionText,
      url: `https://guriup.com/hotels/${slug}`, // Replace with your actual domain
      siteName: 'GuriUp',
      images: images.map((url: string) => ({
        url,
        width: 1200,
        height: 630,
        alt: `${hotelName} in ${locationString}`,
      })),
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: descriptionText,
      images: images,
    },
    // Crucial for Google to know this is the "master" copy of the page
    alternates: {
      canonical: `https://guriup.com/hotels/${slug}`,
    },
  };
}

// --- STEP 2: STRUCTURED DATA (The Rich Snippet Secret) ---
export default async function Page({ params }: Props) {
  const { slug } = await params; 
  const data = await getHotelData(slug);

  if (!data) {
    return <HotelDetailView />; // Client will handle the "Not Found" state
  }

  // Build the Schema.org JSON-LD for Google Search
  // This is what puts the star rating, price, and images directly on Google!
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: data.name,
    description: data.description,
    image: data.images || [],
    url: `https://guriup.com/hotels/${slug}`,
    telephone: data.contactPhone || data.phone || '+252630000000',
    priceRange: data.pricePerNight ? `$${data.pricePerNight}` : '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.location?.city || 'Hargeisa',
      addressRegion: data.location?.area || 'Woqooyi Galbeed',
      addressCountry: 'SO',
    },
    ...(data.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.rating,
        bestRating: '5',
        worstRating: '1',
        ratingCount: '100', // Update this if you have real review counts in your DB
      },
    }),
  };

  return (
    <>
      {/* Inject Structured Data into the head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Render the Client Component */}
      <HotelDetailView />
    </>
  );
}