import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Verify Firebase Token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Parse the incoming FormData (File + Role)
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const role = formData.get('role') as string;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // 3. Upload Image to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uid}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile_images') // Make sure this bucket exists in Supabase!
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get the public URL from Supabase
    const { data: publicUrlData } = supabase.storage
      .from('profile_images')
      .getPublicUrl(fileName);
    const downloadUrl = publicUrlData.publicUrl;

    // 4. Update the User record in Supabase
    const { error: userError } = await supabase
      .from('users')
      .update({ photoUrl: downloadUrl, onboardingCompleted: true })
      .eq('_id', uid);

    if (userError) throw userError;

    // 5. Update the Agent or Hotel record in Supabase
    if (role === 'reagent') {
      await supabase.from('agents').update({ profileImageUrl: downloadUrl }).eq('_id', uid);
    } else if (role === 'hoadmin') {
      // Fetch current hotel images
      const { data: hotelData } = await supabase.from('hotels').select('images').eq('_id', uid).single();
      const currentImages = hotelData?.images || [];
      await supabase.from('hotels').update({ images: [downloadUrl, ...currentImages] }).eq('_id', uid);
    }

    return NextResponse.json({ success: true, url: downloadUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Setup API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}