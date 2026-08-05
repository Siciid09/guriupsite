import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// =========================================================
// SECURITY HELPER: VERIFY FIREBASE AUTH TOKEN
// =========================================================
async function getVerifiedUid(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

// =========================================================
// GET: FETCH AGENT(S) (Public View)
// =========================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limitCount = limitParam ? parseInt(limitParam) : 22;
    const offsetCount = offsetParam ? parseInt(offsetParam) : 0;

    // 1. SINGLE AGENT FETCH (By ID or Slug)
    if (id || slug) {
      const identifier = id || slug;
      
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .or(`_id.eq.${identifier},slug.eq.${identifier}`)
        .maybeSingle();

      if (agentError) {
        console.error("Supabase Query Error:", agentError);
      }

      if (!agentData) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const formattedAgent = await formatAgentData(agentData);
      return NextResponse.json(formattedAgent);
    }

    // 2. FETCH MULTIPLE ELITE AGENTS (Paginated)
    const paidTiers = ['pro', 'premium', 'agent_pro', 'agentpro'];

    const { data: rawAgents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .in('planTier', paidTiers)
      .range(offsetCount, offsetCount + limitCount - 1); 

    if (agentsError) {
      throw new Error(agentsError.message);
    }

    const agentsList = rawAgents || [];

    // 3. FETCH REAL LISTING COUNTS IN PARALLEL
    const formattedAgents = await Promise.all(
      agentsList.map(async (agent) => {
        return await formatAgentData(agent);
      })
    );

    formattedAgents.sort((a, b) => b.totalListings - a.totalListings);

    return NextResponse.json({
      agents: formattedAgents,
      hasMore: agentsList.length === limitCount
    });

  } catch (error: any) {
    console.error('Agents API Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE AGENT PROFILE (Secure)
// =========================================================
export async function PATCH(request: Request) {
  try {
    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized. Invalid or missing token.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body; 

    // Security Check: You can only edit your own profile unless you are a system admin
    if (id !== uid) {
      return NextResponse.json({ error: 'Forbidden. You can only edit your own profile.' }, { status: 403 });
    }

    // 1. Update the 'agents' table
    const { error: agentError } = await supabase
      .from('agents')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .eq('_id', id);

    if (agentError) throw agentError;

    // 2. Sync core details to 'users' table to maintain your Source of Truth
    const userUpdates: any = {};
    if (updateData.name || updateData.agencyName) userUpdates.name = updateData.name || updateData.agencyName;
    if (updateData.phone) userUpdates.phone = updateData.phone;
    if (updateData.profileImageUrl) userUpdates.photoUrl = updateData.profileImageUrl;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('_id', id);
    }

    return NextResponse.json({ success: true, message: 'Agent profile updated successfully' });
  } catch (error: any) {
    console.error('Agent Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =========================================================
// HELPER: NORMALIZE AGENT AND COUNT PROPERTIES
// =========================================================
async function formatAgentData(agent: any) {
  const tier = (agent.planTier || agent.plan_tier || 'free').toLowerCase();
  const isVerified = ['pro', 'premium', 'agent_pro', 'agentpro'].includes(tier);
  
  const agentId = agent._id || agent.id || agent.userid;

  let realCount = 0;
  try {
    const { count, error } = await supabase
      .from('property') // Ensuring table name matches your properties route
      .select('*', { count: 'exact', head: true })
      .or(`agentId.eq.${agentId},agent_id.eq.${agentId}`);
      
    if (!error && count !== null) {
      realCount = count;
    } else {
      realCount = agent.totalListings || agent.total_listings || 0;
    }
  } catch (e) {
    console.warn(`Failed to count listings for agent ${agentId}`, e);
    realCount = agent.totalListings || agent.total_listings || 0;
  }

  return {
    id: agentId,
    slug: agent.slug || null,
    name: agent.name || agent.displayName || 'Unknown Agent',
    agencyName: agent.agencyName || agent.agency_name || '',
    profileImageUrl: agent.profileImageUrl || agent.profile_image_url || agent.photoURL || '',
    coverPhoto: agent.coverPhoto || agent.cover_photo || '',
    planTier: tier,
    totalListings: realCount,
    averageRating: Number(agent.averageRating || agent.average_rating || 0),
    phone: agent.phone || agent.whatsappNumber || agent.whatsapp_number || '',
    specialties: Array.isArray(agent.specialties) ? agent.specialties : [],
    isVerified: isVerified,
    location: agent.location || agent.city || 'Hargeisa, Somaliland'
  };
}