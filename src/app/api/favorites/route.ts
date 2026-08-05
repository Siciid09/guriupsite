import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const body = await request.json();
    const { type, ids } = body; 

    // Validate payload
    if (!type || (type !== 'property' && type !== 'hotel')) {
      return NextResponse.json({ error: 'Invalid type. Must be "property" or "hotel".' }, { status: 400 });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      // If they send an empty list, just return an empty array back
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const table = type === 'hotel' ? 'hotels' : 'property';
    
    // Convert array to a comma-separated string for Supabase .in() query
    const idList = ids.join(',');

    // Fetch using the admin client to bypass RLS, supporting both schemas
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .or(`id.in.(${idList}),_id.in.(${idList})`);

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error('Favorites Fetch Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}