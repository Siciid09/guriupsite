import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase'; // 🛡️ TUNNEL FIX
import { adminAuth } from '../../lib/firebase-admin'; 

export const dynamic = 'force-dynamic';

// --- SECURITY: SUPER ADMIN SECURE TOKEN CHECK ---
async function checkSuperAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!supabaseAdmin) return false;

    // Check user role in Supabase 'users' table using Admin client
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('role')
      .or(`id.eq.${uid},_id.eq.${uid}`) // Unified ID Check
      .maybeSingle();
    
    return user?.role === 'sadmin'; 
  } catch (e) {
    console.error("Auth validation failed:", e);
    return false;
  }
}

// --- GET: FETCH RESOURCES WITH ADVANCED SEARCH & FILTER ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource'); 
    const search = searchParams.get('search')?.toLowerCase() || '';
    const planFilter = searchParams.get('planTier');
    const statusFilter = searchParams.get('status');
    const limitVal = parseInt(searchParams.get('limit') || '100', 10);

    // Secure Check
    if (!await checkSuperAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing' }, { status: 500 });

    let tableName = '';
    
    switch (resource) {
      case 'users':
        tableName = 'users';
        break;
      case 'agents':
        tableName = 'agents';
        break;
      case 'hotels':
        tableName = 'hotels';
        break;
      case 'properties':
        tableName = 'property'; // FIX: Must point to singular 'property' table
        break;
      case 'bookings':
        tableName = 'bookings';
        break;
      case 'restaurants':
        tableName = 'restaurants';
        break;
      default:
        return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
    }

    try {
      let queryRef = supabaseAdmin.from(tableName).select('*'); // 🛡️ TUNNEL FIX

      // Apply Supabase filters if requested
      if (planFilter && planFilter !== 'all') {
        queryRef = queryRef.eq('planTier', planFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        queryRef = queryRef.eq('status', statusFilter);
      }

      // Fetch limited batch to optimize memory and response time
      const { data: rawData, error: dbError } = await queryRef.limit(Math.min(limitVal, 250));
      
      if (dbError) throw dbError;

      let data = (rawData || []).map((d: any) => {
        // Safe Date Parsing
        let createdAtStr = new Date().toISOString();
        if (d.createdAt) createdAtStr = new Date(d.createdAt).toISOString();
        else if (d.joinDate) createdAtStr = new Date(d.joinDate).toISOString();

        const name = d.name || d.agencyName || d.hotelName || d.title || d.roomTypeName || 'Unnamed';
        const email = d.email || d.userPhone || d.phone || 'N/A';

        return { 
          id: d.id || d._id, 
          ...d,
          name,
          email,
          planTier: d.planTier || 'free',
          createdAt: createdAtStr,
          isVerified: d.isVerified || d.agentVerified || false,
          featured: d.featured || d.isFeatured || false
        };
      });

      // Server-side robust in-memory search across multiple text fields
      if (search) {
        data = data.filter((item: any) => {
          const matchName = item.name?.toLowerCase().includes(search);
          const matchEmail = item.email?.toLowerCase().includes(search);
          const matchCity = item.city?.toLowerCase().includes(search) || item.location?.city?.toLowerCase().includes(search);
          const matchId = String(item.id)?.toLowerCase().includes(search);
          return matchName || matchEmail || matchCity || matchId;
        });
      }

      return NextResponse.json({ success: true, count: data.length, data });

    } catch (dbError: any) {
      console.error("Database Error:", dbError.message);
      return NextResponse.json({ 
        error: "Supabase Query Failed", 
        details: dbError.message 
      }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Server Crash", details: error.message }, { status: 500 });
  }
}

// --- PATCH: UPDATE & SMART CASCADE SYNC ---
export async function PATCH(request: Request) {
  try {
    if (!await checkSuperAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing' }, { status: 500 });

    const body = await request.json();
    const { resourceId, resourceType, action, payload } = body;
    
    // Accept plural resourceTypes sent from the frontend tabs
    let tableName = 'users';
    if (resourceType === 'properties' || resourceType === 'property') tableName = 'property';
    if (resourceType === 'hotels' || resourceType === 'hotel') tableName = 'hotels';
    if (resourceType === 'agents' || resourceType === 'agent') tableName = 'agents';
    if (resourceType === 'bookings' || resourceType === 'booking') tableName = 'bookings';
    if (resourceType === 'restaurants' || resourceType === 'restaurant') tableName = 'restaurants';
    
    let updateData: any = {};

    switch (action) {
      case 'promote_plan':
        const newTier = payload.plan || 'pro'; 
        const isPremium = newTier !== 'free';
        updateData = { 
            planTier: newTier,
            isVerified: isPremium,
            agentVerified: isPremium, 
            status: 'active',
            planExpiryDate: payload.expiryDate ? new Date(payload.expiryDate).toISOString() : null
        };
        break;

      case 'set_featured':
        updateData = {
          featured: payload.isFeatured === true,
          isFeatured: payload.isFeatured === true
        };
        break;

      case 'ban':
        updateData = { status: 'banned', isBanned: true, planTier: 'free' };
        break;

      case 'unban':
        updateData = { status: 'active', isBanned: false };
        break;

      case 'update_status':
        updateData = { status: payload.status || 'active' };
        break;

      default: 
        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // 🛡️ TUNNEL FIX
    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .or(`id.eq.${resourceId},_id.eq.${resourceId}`);

    if (updateError) throw updateError;

    // Save to subscription_history if plan was promoted
    if (action === 'promote_plan') {
      const isFree = payload.plan === 'free';
      await supabaseAdmin.from('subscription_history').insert([{
        userId: resourceId,
        planTier: payload.plan || 'pro',
        status: isFree ? 'expired' : 'active',
        startDate: new Date().toISOString(),
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate).toISOString() : null,
        amountPaid: 0.00,
        paymentMethod: 'Admin Override',
        createdAt: new Date().toISOString()
      }]);
    }

    // --- SMART CASCADE SYNC ---
    if (resourceType === 'agents' || resourceType === 'agent' || resourceType === 'users' || resourceType === 'user') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        await supabaseAdmin
          .from('property') 
          .update({
            agentVerified: isPro,
            planTier: updateData.planTier || 'free',
            status: action === 'ban' ? 'archived' : 'available',
            isArchived: action === 'ban'
          })
          .eq('agentId', resourceId);
    }

    if (resourceType === 'users' || resourceType === 'user' || resourceType === 'hoadmin') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        await supabaseAdmin
          .from('hotels')
          .update({
            isVerified: isPro,
            planTier: updateData.planTier || 'free',
            status: action === 'ban' ? 'inactive' : 'active'
          })
          .eq('hotelAdminId', resourceId);
    }

    if (resourceType === 'hotels' || resourceType === 'hotel') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        
        // Fetch hotel owner ID
        const { data: hotelData } = await supabaseAdmin
          .from('hotels')
          .select('hotelAdminId, ownerId')
          .or(`id.eq.${resourceId},_id.eq.${resourceId}`)
          .maybeSingle();

        const ownerId = hotelData?.hotelAdminId || hotelData?.ownerId;
        
        if (ownerId) {
            await supabaseAdmin
              .from('users')
              .update({
                planTier: updateData.planTier || 'free',
                isVerified: isPro
              })
              .or(`id.eq.${ownerId},_id.eq.${ownerId}`);
        }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: REMOVE RESOURCE SAFELY ---
export async function DELETE(request: Request) {
  try {
    if (!await checkSuperAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!supabaseAdmin) return NextResponse.json({ error: 'Admin client missing' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const id = searchParams.get('id');

    if (!resource || !id) {
      return NextResponse.json({ error: 'Missing resource type or id' }, { status: 400 });
    }

    let tableName = '';
    if (resource === 'users') tableName = 'users';
    if (resource === 'agents') tableName = 'agents';
    if (resource === 'hotels') tableName = 'hotels';
    if (resource === 'properties') tableName = 'property'; 
    if (resource === 'bookings') tableName = 'bookings';
    if (resource === 'restaurants') tableName = 'restaurants';

    if (!tableName) {
      return NextResponse.json({ error: 'Invalid resource collection' }, { status: 400 });
    }

    // 🛡️ TUNNEL FIX
    const { error: deleteError } = await supabaseAdmin
      .from(tableName)
      .delete()
      .or(`id.eq.${id},_id.eq.${id}`);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: `Successfully deleted ${resource} with ID ${id}` });
  } catch (error: any) {
    console.error("Admin DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}