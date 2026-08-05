import { Metadata } from 'next';
import AgentProfileView from '@/components/AgentProfileView';
import { supabase } from '@/app/lib/supabase';

type Props = {
  params: Promise<{ id: string }>
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://guriup.com';

// BULLETPROOF DATABASE FINDER
async function getAgentSafely(identifier: string) {
  const queries = [
    { col: 'slug', val: identifier, ilike: false },
    { col: '_id', val: identifier, ilike: false },
    { col: 'id', val: identifier, ilike: false },
    { col: 'slug', val: identifier, ilike: true }, // Case-insensitive slug
    { col: 'name', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true }, // Auto-converts dashes to spaces
    { col: 'agencyName', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true },
    { col: 'agency_name', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true },
  ];

  for (const q of queries) {
    try {
      const { data, error } = q.ilike 
        ? await supabase.from('agents').select('*').ilike(q.col, q.val).maybeSingle()
        : await supabase.from('agents').select('*').eq(q.col, q.val).maybeSingle();
      
      if (data && !error) return data;
    } catch (e) {
      // Silently ignore UUID syntax crashes and move to the next check
    }
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const data = await getAgentSafely(id);

    if (!data) {
      throw new Error('Agent not found');
    }

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
      title: 'Agent Not Found | GuriUp',
      description: 'The requested agent profile could not be found.',
    };
  }
}

export default async function AgentPage({ params }: Props) {
  await params;
  return <AgentProfileView />;
}