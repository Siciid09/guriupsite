import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// =========================================================
// SECURITY HELPER 1: VERIFY FIREBASE TOKEN
// =========================================================
async function getVerifiedUid(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// =========================================================
// SECURITY HELPER 2: STRICT DATABASE ROLE CHECK
// =========================================================
async function verifyAdminOrReagent(uid: string): Promise<boolean> {
  // 🛡️ TS NULL CHECK
  if (!supabaseAdmin) {
    console.error('CRITICAL: Admin client missing.');
    return false;
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`) // Unified Schema
    .maybeSingle(); // 🛡️ Prevent Crash
    
  if (error || !user) return false;
  
  return user.role === 'admin' || user.role === 'reagent';
}

// =========================================================
// BULLETPROOF DATABASE FINDER (For Public GETs)
// =========================================================
async function findAgentSafely(identifier: string) {
  // 🛡️ TS NULL CHECK
  if (!supabaseAdmin) return null;

  const queries = [
    { col: 'slug', val: identifier, ilike: false },
    { col: '_id', val: identifier, ilike: false },
    { col: 'id', val: identifier, ilike: false },
    { col: 'slug', val: identifier, ilike: true },
    { col: 'name', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true },
    { col: 'agencyName', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true },
    { col: 'agency_name', val: `%${identifier.replace(/-/g, ' ')}%`, ilike: true },
  ];

  for (const q of queries) {
    try {
      // 🛡️ TUNNEL FIX: Swapped to supabaseAdmin to avoid RLS blockages
      const { data, error } = q.ilike 
        ? await supabaseAdmin.from('agents').select('*').ilike(q.col, q.val).maybeSingle()
        : await supabaseAdmin.from('agents').select('*').eq(q.col, q.val).maybeSingle();
      
      if (data && !error) return data;
    } catch (e) {
       // Silently ignore UUID syntax crashes on non-UUID slugs
    }
  }
  return null;
}

// =========================================================
// GET: FETCH AGENT(S) (Public View - Safe for standard client)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limitCount = limitParam ? parseInt(limitParam) : 22;
    const offsetCount = offsetParam ? parseInt(offsetParam) : 0;

    // 1. SINGLE AGENT FETCH
    if (id || slug) {
      const identifier = slug || id;
      
      const agentData = await findAgentSafely(identifier as string);

      if (!agentData) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const formattedAgent = await formatAgentData(agentData);
      return NextResponse.json(formattedAgent);
    }

    // 2. FETCH MULTIPLE ELITE AGENTS (Paginated)
    const paidTiers = ['pro', 'premium', 'agent_pro', 'agentpro'];

    // 🛡️ TUNNEL FIX: Swapped to supabaseAdmin
    const { data: rawAgents, error: agentsError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .in('planTier', paidTiers)
      .range(offsetCount, offsetCount + limitCount - 1); 

    if (agentsError) throw new Error(agentsError.message);

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
// PATCH: UPDATE AGENT PROFILE (Strict RBAC & Cross-Table Sync)
// =========================================================
export async function PATCH(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const isAuthorized = await verifyAdminOrReagent(uid);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or reagent role to update agent profiles.' }, { status: 403 });
    }

    const body = await request.json();
    // Safely extract both potential ID formats to prevent undefined target errors
    const { id, _id, ...updateData } = body; 
    const targetId = id || _id;

    if (!targetId) {
       return NextResponse.json({ error: 'Agent ID is required for updating.' }, { status: 400 });
    }

    // 1. Update the Agents Table securely bypassing RLS
    const { error: agentError } = await supabaseAdmin
      .from('agents')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .or(`id.eq.${targetId},_id.eq.${targetId}`);

    if (agentError) throw agentError;

    // 2. Cross-Table Sync: Push crucial profile data to the users table
    const userUpdates: any = {};
    if (updateData.name || updateData.agencyName) userUpdates.name = updateData.name || updateData.agencyName;
    if (updateData.phone) userUpdates.phone = updateData.phone;
    if (updateData.profileImageUrl) userUpdates.photoUrl = updateData.profileImageUrl;

    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .or(`id.eq.${targetId},_id.eq.${targetId}`); // Unified Schema
        
      if (userError) {
         console.error('Warning: Agent updated, but failed to sync with Users table:', userError);
      }
    }

    return NextResponse.json({ success: true, message: 'Agent profile updated and synchronized successfully' });
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
    // 🛡️ TS NULL CHECK
    if (supabaseAdmin) {
      // 🛡️ TUNNEL FIX: Swapped to supabaseAdmin and strictly targets singular 'property' table
      const { count, error } = await supabaseAdmin
        .from('property') 
        .select('*', { count: 'exact', head: true })
        .or(`agentId.eq.${agentId},agent_id.eq.${agentId}`);
        
      if (!error && count !== null) {
        realCount = count;
      } else {
        realCount = agent.totalListings || agent.total_listings || 0;
      }
    } else {
      realCount = agent.totalListings || agent.total_listings || 0;
    }
  } catch (e) {
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