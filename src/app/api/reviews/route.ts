import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';
import { adminAuth } from '@/app/lib/firebase-admin';

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

// POST: Create Review (Requires Auth)
export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });

    const decodedToken = await verifyAuth(request);
    if (!decodedToken) return NextResponse.json({ error: 'Unauthorized. Must be logged in to post a review.' }, { status: 401 });

    const body = await request.json();
    const { targetId, targetType, hotelId, rating, comment } = body;

    const finalTargetType = targetType || (hotelId ? 'hotel' : 'unknown');
    const finalTargetId = targetId || hotelId;

    if (!finalTargetId || !rating) {
      return NextResponse.json({ error: 'Missing required fields: targetId/hotelId and rating.' }, { status: 400 });
    }

    let tableName = 'reviews'; 
    const payload: any = {
      userId: decodedToken.uid,
      userName: decodedToken.name || 'Verified User',
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    if (finalTargetType === 'hotel') {
      tableName = 'hotel_reviews';
      payload.hotelId = finalTargetId;
    } else if (finalTargetType === 'agent') {
      tableName = 'agent_reviews';
      payload.agentId = finalTargetId;
    } else {
      payload.targetId = finalTargetId;
      payload.targetType = finalTargetType;
    }

    // 🛡️ TUNNEL FIX: Use supabaseAdmin to bypass strict RLS on review insertion
    const { error } = await supabaseAdmin.from(tableName).insert([payload]);

    if (error) {
      // Fallback for schema discrepancies
      if (tableName === 'agent_reviews') {
         const fallbackPayload = { ...payload, targetId: finalTargetId, targetType: finalTargetType };
         delete fallbackPayload.agentId;
         const { error: fallbackError } = await supabaseAdmin.from('reviews').insert([fallbackPayload]);
         if (fallbackError) throw fallbackError;
      } else {
         throw error;
      }
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

    const { error } = await supabaseAdmin.from(tableType).delete().eq('id', reviewId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}