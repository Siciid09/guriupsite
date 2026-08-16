import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/locations                  -> all countries
// GET /api/locations?countryId=kenya  -> cities in that country
// GET /api/locations?cityId=nairobi   -> districts in that city
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server error: Admin client missing.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('countryId');
    const cityId = searchParams.get('cityId');

    // --- DISTRICTS for a city ---
    if (cityId) {
      const { data, error } = await supabaseAdmin
        .from('districts')
        .select('_id, name, cityId')
        .eq('cityId', cityId)
        .order('name', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // --- CITIES for a country ---
    if (countryId) {
      const { data, error } = await supabaseAdmin
        .from('cities')
        .select('_id, name, countryId')
        .eq('countryId', countryId)
        .order('name', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // --- ALL COUNTRIES ---
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('_id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Locations GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}