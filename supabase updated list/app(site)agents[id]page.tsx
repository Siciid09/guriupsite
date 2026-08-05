import { Metadata } from 'next';
import AgentProfileView from '@/components/AgentProfileView';

type Props = {
  params: Promise<{ id: string }>
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch directly from your new Supabase API instead of Firebase
    const res = await fetch(`${BASE_URL}/api/agents?id=${id}&slug=${id}`, {
      next: { revalidate: 60 } // Cache this for 60 seconds for super fast SEO loading
    });

    if (!res.ok) {
      throw new Error('Agent not found');
    }

    const data = await res.json();

    // The API already normalizes the location for us!
    const locationText = data.location && data.location !== 'Unknown Location' 
      ? data.location 
      : 'your area';
      
    const title = `${data.name} | ${data.agencyName || 'Real Estate Agent'}`;
    const description = data.bio 
      ? data.bio.substring(0, 160) + (data.bio.length > 160 ? '...' : '')
      : `Contact ${data.name} for the best property deals in ${locationText}.`;
    
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
  } catch (error) {
    return {
      title: 'Agent Not Found',
      description: 'The requested agent profile could not be found.',
    };
  }
}

export default async function AgentPage({ params }: Props) {
  await params;
  return <AgentProfileView />;
}