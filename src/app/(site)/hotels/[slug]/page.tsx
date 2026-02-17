import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import HotelDetailView from '@/components/templates/HotelClientView';

// --- FIX: Type matches folder name [slug] ---
type Props = {
  params: Promise<{ slug: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // --- FIX: Await params and extract 'slug' ---
  const { slug } = await params;
  
  // We treat the slug as the ID since that's usually how Firebase URLs work
  const id = slug; 

  const docRef = doc(db, 'hotels', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return {
      title: 'Hotel Not Found',
      description: 'The requested hotel could not be found.',
    };
  }

  const data = snap.data();
  const hotelName = data.name || 'Luxury Hotel';
  const price = data.pricePerNight ? `$${data.pricePerNight}` : 'Check Price';
  
  // Format Location safely
  let locationString = 'Somaliland';
  if (data.location) {
     if (typeof data.location === 'string') locationString = data.location;
     else if (typeof data.location === 'object') {
        locationString = `${data.location.area || ''}, ${data.location.city || ''}`;
     }
  }

  const descriptionText = data.description 
    ? data.description.substring(0, 150).replace(/\n/g, ' ') + '...' 
    : `Book your stay at ${hotelName}.`;

  const title = `${hotelName} | ${locationString} - Starting at ${price}`;
  const description = `Stay at ${hotelName} in ${locationString}. Price: ${price}/night. Contact: ${data.phone || 'us online'}. ${descriptionText}`;
  const imageUrl = data.images && data.images.length > 0 ? data.images[0] : '';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      siteName: 'GuriUp Booking',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  await params; 
  return <HotelDetailView />;
}