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

  // Safely check both ID naming conventions 
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`) // Unified Schema
    .maybeSingle(); // 🛡️ Prevent Crash
    
  if (error || !user) return false;
  
  return user.role === 'admin' || user.role === 'reagent';
}

// =========================================================
// GET: FETCH TENANTS (Secured)
// =========================================================
export async function GET(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const isAuthorized = await verifyAdminOrReagent(uid);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or reagent role.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const propertyId = searchParams.get('propertyId');

    let query = supabaseAdmin
      .from('tenants')
      .select('*')
      .order('createdAt', { ascending: false });
    
    // Optional query filters
    if (agentId) {
      query = query.eq('agentId', agentId);
    }
    if (propertyId) {
      query = query.eq('propertyId', propertyId);
    }

    const { data: tenants, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, tenants }, { status: 200 });
  } catch (error: any) {
    console.error('Tenants GET Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// =========================================================
// POST: ONBOARD NEW TENANT (Secured)
// =========================================================
export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const isAuthorized = await verifyAdminOrReagent(uid);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or reagent role.' }, { status: 403 });
    }

    const tenantData = await request.json();

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .insert([{ 
        ...tenantData, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, tenant: data }, { status: 201 });
  } catch (error: any) {
    console.error('Tenants POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// =========================================================
// PATCH: UPDATE EXISTING TENANT (Secured)
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
      return NextResponse.json({ error: 'Forbidden: Requires admin or reagent role.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, _id, ...updateData } = body;
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Tenant ID is required for updating.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update({ ...updateData, updatedAt: new Date().toISOString() })
      .or(`id.eq.${targetId},_id.eq.${targetId}`)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, tenant: data }, { status: 200 });
  } catch (error: any) {
    console.error('Tenants PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// =========================================================
// DELETE: REMOVE TENANT (Secured)
// =========================================================
export async function DELETE(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const uid = await getVerifiedUid(request);
    if (!uid) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const isAuthorized = await verifyAdminOrReagent(uid);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Requires admin or reagent role.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const _id = searchParams.get('_id');
    const targetId = id || _id;

    if (!targetId) {
      return NextResponse.json({ error: 'Tenant ID is required for deletion.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tenants')
      .delete()
      .or(`id.eq.${targetId},_id.eq.${targetId}`);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Tenant successfully removed.' }, { status: 200 });
  } catch (error: any) {
    console.error('Tenants DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}