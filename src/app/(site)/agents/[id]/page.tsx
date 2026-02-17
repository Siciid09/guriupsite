import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // Ensure this matches your path
import AgentProfileView from '@/components/AgentProfileView'; // Ensure this matches your path

// --- FIX: Define params as a Promise ---
type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // --- FIX: Await the params object before using it ---
  const { id } = await params;

  // Now 'id' is a valid string, so Firebase won't crash
  const docRef = doc(db, 'agents', id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return {
      title: 'Agent Not Found',
      description: 'The requested agent profile could not be found.',
    };
  }

  const data = snap.data();
  const title = `${data.name} | ${data.agencyName || 'Real Estate Agent'}`;
  const description = data.bio 
    ? data.bio.substring(0, 160) + '...' 
    : `Contact ${data.name} for the best property deals in ${data.city || 'town'}.`;
  
  const imageUrl = data.profileImageUrl || data.coverPhoto || '';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// --- FIX: Update the Main Component Props too ---
export default async function AgentPage({ params }: Props) {
  // We don't strictly need to await params here if we aren't using the ID 
  // inside this component (since AgentProfileView handles the logic), 
  // but it's good practice.
  await params; 
  
  return <AgentProfileView />;
}