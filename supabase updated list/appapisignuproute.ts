import { NextResponse } from 'next/server';
import { adminAuth } from '../../lib/firebase-admin';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
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
      googleUid
    } = body;

    if (!email || !fullName || !phone || !role) {
      return NextResponse.json({ error: 'Missing required fields (name, email, phone, role).' }, { status: 400 });
    }

    let uid = googleUid;

    // 1. Create Firebase Auth User if not using Google Sign-In
    if (!uid && password) {
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          displayName: fullName,
          phoneNumber: phone,
        });
        uid = userRecord.uid;
      } catch (authError: any) {
        return NextResponse.json({ error: authError.message || 'Failed to create Firebase Auth user.' }, { status: 400 });
      }
    } else if (!uid) {
      return NextResponse.json({ error: 'Authentication identifier (UID or password) is required.' }, { status: 400 });
    }

    // 2. Format Phone Number
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
      if (!formattedPhone.startsWith('252')) formattedPhone = `252${formattedPhone}`;
      formattedPhone = `+${formattedPhone}`;
    }

    // 3. Store User Profile in Supabase 'users' table
    const userData = {
      _id: uid,
      uid: uid,
      authMethod: authMethod || 'email_password',
      email: email.trim(),
      emailVerified: !!googleUid,
      name: fullName.trim(),
      phone: formattedPhone,
      photoUrl: photoUrl || '',
      planTier: 'free',
      role: role, // 'user', 'reagent', or 'hoadmin'
      isAgent: role === 'reagent',
      isHotelAdmin: role === 'hoadmin',
      slug: slug || '',
      isBanned: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const { error: userError } = await supabase.from('users').insert([userData]);
    if (userError) {
      console.error('Supabase User Insert Error:', userError);
      return NextResponse.json({ error: 'Failed to save user profile to database.' }, { status: 500 });
    }

    // 4. If Role is Agent (reagent), Store in Supabase 'agents' table
    if (role === 'reagent') {
      const agencyData = {
        _id: uid,
        userid: uid,
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
        specialty: specialty || 'Residential'
      };

      const { error: agentError } = await supabase.from('agents').insert([agencyData]);
      if (agentError) {
        console.error('Supabase Agent Insert Error:', agentError);
        return NextResponse.json({ error: 'Failed to save agency profile.' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      uid, 
      message: 'Account created and stored successfully in Supabase!' 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Signup API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}