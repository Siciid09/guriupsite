import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import AgentProfileView from '@/components/AgentProfileView';

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const docRef = doc(db, 'agents', id);
  let snap = await getDoc(docRef);

  // Fallback to users collection if not in agents
  if (!snap.exists()) {
     const userRef = doc(db, 'users', id);
     snap = await getDoc(userRef);
  }

  if (!snap.exists()) {
    return {
      title: 'Agent Not Found',
      description: 'The requested agent profile could not be found.',
    };
  }

  const data = snap.data();
  // Global text fallback (no specific city hardcoded)
  const locationText = data.city || data.location || 'your area';
  
  const title = `${data.name} | ${data.agencyName || 'Real Estate Agent'}`;
  const description = data.bio 
    ? data.bio.substring(0, 160) + '...' 
    : `Contact ${data.name} for the best property deals in ${locationText}.`;
  
  const imageUrl = data.profileImageUrl || data.photoUrl || data.coverPhoto || '';

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

export default async function AgentPage({ params }: Props) {
  await params;
  return <AgentProfileView />;
}