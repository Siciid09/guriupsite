import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

// Helper function to verify the Firebase ID Token
async function verifyRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const token = authHeader.split('Bearer ')[1];
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// POST /api/orders (Create a new manual payment order securely)
export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    // 1. Authenticate Request
    const decodedToken = await verifyRequest(request);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized request.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      planId, 
      planName, 
      amount, 
      customerName, 
      businessName, 
      businessType, 
      contactPhone, 
      location 
    } = body;

    if (!planId || !amount) {
      return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 });
    }

    // 2. Build Order Payload for Supabase
    const orderPayload = {
      userId: decodedToken.uid,
      planId,
      planName: planName || 'Premium Plan',
      amount: Number(amount),
      customerName: customerName || decodedToken.name || 'Valued Customer',
      businessName: businessName || '',
      businessType: businessType || 'Independent Agent',
      contactPhone: contactPhone || '',
      location: location || '',
      status: 'pending_whatsapp',
      createdAt: new Date().toISOString(),
    };

    // 3. Insert into Supabase 'orders' table (TUNNEL FIX)
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (error) {
      console.error('Supabase Orders Insert Error:', error);
      return NextResponse.json({ error: 'Failed to create order record.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error in orders API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}