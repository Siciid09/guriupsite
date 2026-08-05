import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin'; 
import { supabaseAdmin } from '@/app/lib/supabase'; 
import * as admin from 'firebase-admin'; // 👈 Added for the Firestore Bridge

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Database connection failed.' }, { status: 500 });
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      role,
      businessName,
      whatsappNumber,
      city,
      specialty,
      bio,
      photoUrl,
      coverPhoto,
      slug,
      authMethod,
      firebaseUid 
    } = body;

    if (!email || !fullName || !phone || !role || !firebaseUid) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // 1. Format Phone Number
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
      if (!formattedPhone.startsWith('252')) formattedPhone = `252${formattedPhone}`;
      formattedPhone = `+${formattedPhone}`;
    }

    // 2. Store User Profile in Supabase 'users' table
    const userData = {
      _id: firebaseUid,
      uid: firebaseUid,
      authMethod: authMethod || 'email_password',
      email: email.trim(),
      emailVerified: true, 
      name: fullName.trim(),
      phone: formattedPhone,
      photoUrl: photoUrl || '',
      planTier: 'free',
      role: role, 
      slug: slug || '',
      isBanned: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const { error: userError } = await supabaseAdmin.from('users').insert([userData]);
    
    if (userError) {
      console.error('Supabase User Insert Error:', userError);
      await adminAuth.deleteUser(firebaseUid).catch(() => console.error('Rollback failed'));
      return NextResponse.json({ error: 'Failed to save user profile to database.' }, { status: 500 });
    }

    // 3. If Role is Agent (reagent), Store in Supabase 'agents' table
    if (role === 'reagent') {
      const agencyData = {
        _id: firebaseUid, 
        userid: firebaseUid,
        agencyName: businessName?.trim() || fullName.trim(),
        agentVerified: false,
        isVerified: false,
        analytics: { clicks: 0, leads: 0, views: 0 },
        bio: bio?.trim() || '',
        coverPhoto: coverPhoto || '',
        email: email.trim(),
        featured: false,
        isFeatured: false,
        joinDate: new Date().toISOString(),
        name: businessName?.trim() || fullName.trim(),
        phone: formattedPhone,
        planTier: 'free',
        profileImageUrl: photoUrl || '',
        slug: slug || '',
        status: 'active',
        city: city?.trim() || '',
        ownerName: fullName.trim(),
        whatsappNumber: whatsappNumber?.trim() || formattedPhone,
        type: 'reagent',
        specialties: [specialty || 'Residential'] 
      };

      const { error: agentError } = await supabaseAdmin.from('agents').insert([agencyData]);
      
      if (agentError) {
        console.error('Supabase Agent Insert Error:', agentError);
        await supabaseAdmin.from('users').delete().eq('_id', firebaseUid);
        await adminAuth.deleteUser(firebaseUid).catch(() => console.error('Rollback failed'));
        return NextResponse.json({ error: 'Failed to save agency profile.' }, { status: 500 });
      }
    }

    // 4. 🚨 CRITICAL FIX: THE FIRESTORE LEGACY BRIDGE 
    // Create a stub document in Firestore so your legacy Security Rules pass
    try {
      const db = admin.firestore();
      await db.collection('users').doc(firebaseUid).set({
        role: role,
        email: email.trim(),
        name: fullName.trim(),
        isMigratedToSupabase: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (fsError) {
      console.warn('Non-critical: Failed to create Firestore user stub', fsError);
    }

    return NextResponse.json({ 
      success: true, 
      uid: firebaseUid, 
      message: 'Account created and stored successfully in Supabase!' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}