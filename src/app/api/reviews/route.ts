import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// --- HELPER: Verify Token ---
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split('Bearer ')[1];
    return await adminAuth.verifyIdToken(token);
  } catch (e) {
    return null;
  }
}

// GET: Fetch Reviews (Public)
export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    
    // 🛡️ FIX: Fetch from hotel_reviews using exact DB column "hotel_id"
    let query = supabaseAdmin.from('hotel_reviews').select('*');
    if (hotelId && hotelId !== 'undefined') {
      query = query.eq('hotel_id', hotelId); 
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });
    
    if (error) {
       // Fallback to reviews table using targetId if hotel_reviews fails
       const fallback = await supabaseAdmin.from('reviews').select('*').eq('targetId', hotelId || '').order('createdAt', { ascending: false });
       return NextResponse.json(fallback.data || []);
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create Review (Requires Auth)
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const decodedToken = await verifyAuth(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized. Must be logged in to post a review.' }, { status: 401 });

    const body = await request.json();
    const { targetId, targetType, hotelId, rating, comment } = body;

    const finalTargetType = targetType || (hotelId ? 'hotel' : 'unknown');
    const finalTargetId = targetId || hotelId;

    if (!finalTargetId || !rating) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // 🛡️ FIX: Remove "id" completely. Only use "_id" to match database schema.
    const basePayload: any = {
      _id: crypto.randomUUID(), 
      userId: decodedToken.uid,
      userName: decodedToken.name || 'Verified User',
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    if (finalTargetType === 'hotel') {
      // 🛡️ FIX: Write to hotel_reviews using "hotel_id"
      basePayload.hotel_id = finalTargetId;
      const { error } = await supabaseAdmin.from('hotel_reviews').insert([basePayload]);
      if (error) throw error;
    } else {
      // 🛡️ FIX: Write to general reviews/agents using "targetId"
      basePayload.targetId = finalTargetId;
      basePayload.targetType = finalTargetType;
      basePayload.status = 'approved'; 
      const { error } = await supabaseAdmin.from('reviews').insert([basePayload]);
      if (error) throw error;
    }

    return NextResponse.json({ message: 'Review posted successfully!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: 500 });
  }
}

// DELETE: Moderate Review (Requires admin, hoadmin, or reagent)
export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    
    const decodedToken = await verifyAuth(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');
    const tableType = searchParams.get('type') || 'reviews';

    if (!reviewId) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });

    const { data: user } = await supabaseAdmin.from('users').select('role, isAgent').or(`id.eq.${decodedToken.uid},_id.eq.${decodedToken.uid}`).single();
    const isAuthorized = user?.role === 'admin' || user?.role === 'hoadmin' || user?.role === 'reagent' || user?.isAgent === true;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden. Moderation requires elevated privileges.' }, { status: 403 });
    }

    // 🛡️ FIX: Use _id instead of id since that's what the DB schema uses
    const { error } = await supabaseAdmin.from(tableType).delete().eq('_id', reviewId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}