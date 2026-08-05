import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/users?uid=XYZ
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('_id', uid)
    .single();

  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/users (Update Profile, Favorites, or Admin Ban Status)
export async function PATCH(request: Request) {
  try {
    const { uid, name, phone, favorites, isBanned } = await request.json();

    if (!uid) return NextResponse.json({ error: 'UID required' }, { status: 400 });

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (favorites !== undefined) updateData.favorites = favorites;
    if (isBanned !== undefined) updateData.isBanned = isBanned;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('_id', uid);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}