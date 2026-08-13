import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const cityId = searchParams.get('cityId');

    let data = [];
    let error = null;

    if (cityId) {
      // Fetch districts belonging to a specific city
      const res = await supabaseAdmin.from('districts').select('id, name').eq('cityId', cityId);
      data = res.data;
      error = res.error;
    } else if (countryId) {
      // Fetch cities belonging to a specific country
      const res = await supabaseAdmin.from('cities').select('id, name').eq('countryId', countryId);
      data = res.data;
      error = res.error;
    } else {
      // Fetch all available countries
      const res = await supabaseAdmin.from('countries').select('id, name');
      data = res.data;
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Locations API Error:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}