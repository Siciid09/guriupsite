import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Verify Firebase Token[cite: 20]
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!supabaseAdmin) {
      throw new Error('Server Configuration Error: Admin client missing.');
    }

    // 2. Parse the incoming FormData (File + Role)[cite: 20]
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const role = formData.get('role') as string;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

    // 3. Upload Image to Firebase Storage (Replaces Supabase Storage)[cite: 20]
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uid}_${Date.now()}.${fileExt}`;
    const filePath = `profile_images/${fileName}`;

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('Server Configuration Error: Firebase Storage bucket not defined.');
    }

    const bucket = admin.storage().bucket(bucketName);
    const fileRef = bucket.file(filePath);

    // Save directly to Firebase Storage bucket
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    // Generate the standard Firebase Storage download URL
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;

    // 4. Update the User record in Supabase (Handling both ID conventions safely)[cite: 20]
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ photoUrl: downloadUrl, onboardingCompleted: true })
      .or(`id.eq.${uid},_id.eq.${uid}`);

    if (userError) throw userError;

    // 5. Update the Agent or Hotel record in Supabase[cite: 20]
    if (role === 'reagent') {
      await supabaseAdmin
        .from('agents')
        .update({ profileImageUrl: downloadUrl })
        .or(`id.eq.${uid},_id.eq.${uid}`);

    } else if (role === 'hoadmin') {
      // CRITICAL FIX: Query by hotelAdminId or ownerId, NOT matching hotel ID to user UID[cite: 20]
      const { data: hotelData } = await supabaseAdmin
        .from('hotels')
        .select('id, _id, images')
        .or(`hotelAdminId.eq.${uid},ownerId.eq.${uid}`)
        .single();

      if (hotelData) {
        const currentImages = hotelData.images || [];
        const targetHotelId = hotelData.id || hotelData._id;
        
        await supabaseAdmin
          .from('hotels')
          .update({ images: [downloadUrl, ...currentImages] })
          .or(`id.eq.${targetHotelId},_id.eq.${targetHotelId}`);
      }
    }

    return NextResponse.json({ success: true, url: downloadUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Setup API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}