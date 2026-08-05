import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/tenants?agentId=XYZ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('agentId', agentId)
    .order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tenants });
}

// POST /api/tenants (Onboard new tenant)
export async function POST(request: Request) {
  try {
    const tenantData = await request.json();

    const { data, error } = await supabase
      .from('tenants')
      .insert([{ ...tenantData, createdAt: new Date().toISOString() }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, tenant: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}