import { NextResponse } from 'next/server';
// IMPORTANT: You must initialize the Firebase Admin SDK in this file!
// e.g., import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { adminDb, adminAuth } from '../../lib/firebase-admin'; 

export const dynamic = 'force-dynamic';

// --- SECURITY: SUPER ADMIN SECURE TOKEN CHECK ---
async function checkSuperAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  // Require Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify the JWT token securely
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Fetch user role directly from Admin SDK (bypasses security rules)
    const userSnap = await adminDb.collection('users').doc(uid).get();
    if (!userSnap.exists) return false;
    
    return userSnap.data()?.role === 'sadmin'; 
  } catch (e) {
    console.error("Auth validation failed:", e);
    return false;
  }
}

// --- GET: FETCH RESOURCES ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource'); 

    // Secure Check
    if (!await checkSuperAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let queryRef;
    
    try {
      // Use Admin SDK collections
      switch (resource) {
        case 'users':
          queryRef = adminDb.collection('users').limit(50); 
          break;
        case 'agents':
          queryRef = adminDb.collection('agents').limit(50);
          break;
        case 'hotels':
          queryRef = adminDb.collection('hotels').limit(50);
          break;
        case 'properties':
          queryRef = adminDb.collection('property').limit(50);
          break;
        default:
          return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
      }

      const snapshot = await queryRef.get();
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        
        // Safe Date Parsing for Admin SDK
        let createdAtStr = new Date().toISOString();
        if (d.createdAt?.toDate) createdAtStr = d.createdAt.toDate().toISOString();
        else if (d.joinDate?.toDate) createdAtStr = d.joinDate.toDate().toISOString();
        else if (typeof d.createdAt === 'string') createdAtStr = d.createdAt;

        return { 
          id: doc.id, 
          ...d,
          name: d.name || d.agencyName || d.hotelName || d.title || 'Unnamed', 
          email: d.email || 'N/A',
          planTier: d.planTier || 'free',
          createdAt: createdAtStr,
          isVerified: d.isVerified || d.agentVerified || false,
          featured: d.featured || d.isFeatured || false
        };
      });

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

// --- PATCH: UPDATE & SMART SYNC (FLUTTER 2024 COMPLIANT) ---
export async function PATCH(request: Request) {
  try {
    // Note: We still check SuperAdmin using the token in the headers!
    if (!await checkSuperAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    // adminUid is no longer needed in the body since we verify via headers, 
    // but we extract the rest of the payload.
    const { resourceId, resourceType, action, payload } = body;
    
    // 1. Determine target collection
    let collectionName = 'users';
    if (resourceType === 'property') collectionName = 'property';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'agent') collectionName = 'agents';
    
    const docRef = adminDb.collection(collectionName).doc(resourceId);
    let updateData: any = {};

    // 2. Prepare Primary Update
    switch (action) {
      case 'promote_plan':
        const newTier = payload.plan || 'pro'; 
        const isPremium = newTier !== 'free';
        updateData = { 
            planTier: newTier,
            isVerified: isPremium,
            agentVerified: isPremium, 
            featured: isPremium,
            isFeatured: isPremium,
            status: 'active',
            planExpiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null
        };
        break;
      case 'ban':
        updateData = { status: 'banned', isBanned: true, planTier: 'free' };
        break;
      case 'unban':
        updateData = { status: 'active', isBanned: false };
        break;
      default: return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // Use Admin SDK update
    await docRef.update(updateData);

    // 3. --- SMART CASCADE SYNC (FLUTTER APP COMPATIBILITY) ---
    // If we update an AGENT -> Update all their PROPERTIES
    if (resourceType === 'agent' || resourceType === 'user') {
        const isPro = updateData.planTier && updateData.planTier !== 'free';
        const props = await adminDb.collection('property').where('agentId', '==', resourceId).get();
        
        if (!props.empty) {
            const batch = adminDb.batch();
            props.docs.forEach(p => {
                batch.update(p.ref, { 
                    agentVerified: isPro,
                    planTier: updateData.planTier || 'free',
                    status: action === 'ban' ? 'archived' : 'available'
                });
            });
            await batch.commit();
        }
    }

    // If we update a HOTEL ADMIN -> Update all their HOTELS
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin PATCH Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}