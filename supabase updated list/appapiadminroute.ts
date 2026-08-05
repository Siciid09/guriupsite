import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../lib/firebase-admin'; 

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

    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return false;
    
    return userSnap.data()?.role === 'sadmin'; 
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

    let collectionName = '';
    
    switch (resource) {
      case 'users':
        collectionName = 'users';
        break;
      case 'agents':
        collectionName = 'agents';
        break;
      case 'hotels':
        collectionName = 'hotels';
        break;
      case 'properties':
        collectionName = 'property';
        break;
      case 'bookings':
        collectionName = 'bookings';
        break;
      case 'restaurants':
        collectionName = 'restaurants';
        break;
      default:
        return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
    }

    try {
      let queryRef: FirebaseFirestore.Query = adminDb.collection(collectionName);

      // Apply basic Firestore filters if requested
      if (planFilter && planFilter !== 'all') {
        queryRef = queryRef.where('planTier', '==', planFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        queryRef = queryRef.where('status', '==', statusFilter);
      }

      // Fetch limited batch to optimize memory and response time
      const snapshot = await queryRef.limit(Math.min(limitVal, 250)).get();
      
      let data = snapshot.docs.map(doc => {
        const d = doc.data();
        
        // Safe Date Parsing
        let createdAtStr = new Date().toISOString();
        if (d.createdAt?.toDate) createdAtStr = d.createdAt.toDate().toISOString();
        else if (d.joinDate?.toDate) createdAtStr = d.joinDate.toDate().toISOString();
        else if (typeof d.createdAt === 'string') createdAtStr = d.createdAt;

        const name = d.name || d.agencyName || d.hotelName || d.title || d.roomTypeName || 'Unnamed';
        const email = d.email || d.userPhone || d.phone || 'N/A';

        return { 
          id: doc.id, 
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
          const matchId = item.id?.toLowerCase().includes(search);
          return matchName || matchEmail || matchCity || matchId;
        });
      }

      return NextResponse.json({ success: true, count: data.length, data });

    } catch (dbError: any) {
      console.error("Database Error:", dbError.message);
      return NextResponse.json({ 
        error: "Firebase Query Failed", 
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

    const body = await request.json();
    const { resourceId, resourceType, action, payload } = body;
    
    let collectionName = 'users';
    if (resourceType === 'property') collectionName = 'property';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'agent') collectionName = 'agents';
    if (resourceType === 'booking') collectionName = 'bookings';
    if (resourceType === 'restaurant') collectionName = 'restaurants';
    
    const docRef = adminDb.collection(collectionName).doc(resourceId);
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
            planExpiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null
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

    await docRef.update(updateData);

    // Save to subscription_history if plan was promoted
    if (action === 'promote_plan') {
      const isFree = payload.plan === 'free';
      await adminDb.collection('subscription_history').add({
        userId: resourceId,
        planTier: payload.plan || 'pro',
        status: isFree ? 'expired' : 'active',
        startDate: new Date(),
        expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
        amountPaid: 0.00,
        paymentMethod: 'Admin Override',
        createdAt: new Date()
      });
    }

    // --- SMART CASCADE SYNC ---
    if (resourceType === 'agent' || resourceType === 'user') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        const props = await adminDb.collection('property').where('agentId', '==', resourceId).get();
        
        if (!props.empty) {
            const batch = adminDb.batch();
            props.docs.forEach(p => {
                batch.update(p.ref, { 
                    agentVerified: isPro,
                    planTier: updateData.planTier || 'free',
                    status: action === 'ban' ? 'archived' : 'available',
                    isArchived: action === 'ban'
                });
            });
            await batch.commit();
        }
    }

    if (resourceType === 'user' || resourceType === 'hoadmin') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        const hotelSnaps = await adminDb.collection('hotels').where('hotelAdminId', '==', resourceId).get();
        
        if (!hotelSnaps.empty) {
            const batch = adminDb.batch();
            hotelSnaps.docs.forEach(h => {
                batch.update(h.ref, { 
                    isVerified: isPro,
                    planTier: updateData.planTier || 'free',
                    status: action === 'ban' ? 'inactive' : 'active'
                });
            });
            await batch.commit();
        }
    }

    if (resourceType === 'hotel') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        const hotelDoc = await docRef.get();
        const ownerId = hotelDoc.data()?.hotelAdminId || hotelDoc.data()?.ownerId; 
        
        if (ownerId) {
            await adminDb.collection('users').doc(ownerId).update({
                planTier: updateData.planTier || 'free',
                isVerified: isPro
            });
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

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const id = searchParams.get('id');

    if (!resource || !id) {
      return NextResponse.json({ error: 'Missing resource type or id' }, { status: 400 });
    }

    let collectionName = '';
    if (resource === 'users') collectionName = 'users';
    if (resource === 'agents') collectionName = 'agents';
    if (resource === 'hotels') collectionName = 'hotels';
    if (resource === 'properties') collectionName = 'property';
    if (resource === 'bookings') collectionName = 'bookings';
    if (resource === 'restaurants') collectionName = 'restaurants';

    if (!collectionName) {
      return NextResponse.json({ error: 'Invalid resource collection' }, { status: 400 });
    }

    await adminDb.collection(collectionName).doc(id).delete();

    return NextResponse.json({ success: true, message: `Successfully deleted ${resource} with ID ${id}` });
  } catch (error: any) {
    console.error("Admin DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}