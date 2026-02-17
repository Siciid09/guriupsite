import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  where 
} from 'firebase/firestore';

export const dynamic = 'force-dynamic';

// =======================================================================
// 1. SECURITY: MIDDLEWARE TO CHECK S-ADMIN
// =======================================================================
async function checkSuperAdmin(uid: string | null) {
  if (!uid) return false;
  
  // Check 'users' collection for the requester's role
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return false;
  
  const userData = userSnap.data();
  // STRICT CHECK: Only 'sadmin' (Super Admin) allowed
  return userData.role === 'sadmin'; 
}

// =======================================================================
// 2. GET: FETCH ALL DATA (DASHBOARD VIEW)
// =======================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = request.headers.get('x-admin-uid'); // Passed from frontend auth
    const resource = searchParams.get('resource'); // 'users', 'agents', 'hotels', 'properties'
    const filter = searchParams.get('filter'); // 'banned', 'pending', 'pro'

    // 1. Verify S-Admin
    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin Access Required' }, { status: 403 });
    }

    let q;
    let collectionName = '';

    // 2. Select Collection
    switch (resource) {
      case 'users': collectionName = 'users'; break;
      case 'agents': collectionName = 'agents'; break;
      case 'hotels': collectionName = 'hotels'; break;
      case 'properties': collectionName = 'property'; break;
      default: return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
    }

    // 3. Build Query
    const colRef = collection(db, collectionName);
    
    // Apply Dashboard Filters
    if (filter === 'banned') {
       q = query(colRef, where('status', '==', 'banned'), limit(100));
    } else if (filter === 'pending_verification') {
       q = query(colRef, where('isVerified', '==', false), where('planTier', 'in', ['pro', 'premium']), limit(100));
    } else if (filter === 'archived') {
       q = query(colRef, where('isArchived', '==', true), limit(100));
    } else {
       // Default: Recent items
       q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, count: data.length, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================================================================
// 3. PATCH: UPDATE STATUS (BAN, VERIFY, PROMOTE, ARCHIVE)
// =======================================================================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminUid, resourceId, resourceType, action, payload } = body;
    
    // 1. Verify S-Admin
    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    let collectionName = '';
    // Map resource type to DB collection
    if (resourceType === 'user') collectionName = 'users';
    if (resourceType === 'agent') collectionName = 'agents';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'property') collectionName = 'property';

    const docRef = doc(db, collectionName, resourceId);
    let updateData = {};

    // 2. Switch Action Logic
    switch (action) {
      case 'ban':
        // BAN USER/AGENT: Disable access, hide profile
        updateData = { 
          status: 'banned', 
          isBanned: true,
          planTier: 'free' // Strip paid status
        };
        break;

      case 'unban':
        updateData = { status: 'active', isBanned: false };
        break;

      case 'verify':
        // VERIFY AGENT/HOTEL: Give blue tick
        updateData = { 
          isVerified: true, 
          agentVerified: true, // For properties
          verifiedAt: new Date().toISOString() 
        };
        break;

      case 'promote_plan':
        // GIVE PRO/PREMIUM: Update plan tier
        updateData = { 
          planTier: payload.plan, // 'pro' or 'premium'
          isVerified: true // Auto-verify paid users
        };
        break;

      case 'feature':
        // FEATURE ITEM: Put on homepage
        updateData = { 
          featured: payload.featured, // true/false
          isFeatured: payload.featured 
        };
        break;

      case 'archive':
        // SOFT DELETE: Hide from public, keep in DB
        updateData = { 
          isArchived: true, 
          status: 'archived' 
        };
        break;

      case 'restore':
        // RESTORE FROM ARCHIVE
        updateData = { 
          isArchived: false, 
          status: 'available' 
        };
        break;

      case 'set_draft':
        // SET TO DRAFT (Work in progress)
        updateData = { status: 'draft' };
        break;

      default:
        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // 3. Execute Update
    await updateDoc(docRef, updateData);

    // 4. SPECIAL CASE: If Banning/Promoting an Agent, sync their properties
    if (resourceType === 'agent' && (action === 'ban' || action === 'promote_plan')) {
       // Find all properties by this agent and update their visibility
       const q = query(collection(db, 'property'), where('agentId', '==', resourceId));
       const props = await getDocs(q);
       const batchUpdates = props.docs.map(p => 
         updateDoc(doc(db, 'property', p.id), { 
           agentVerified: action === 'promote_plan',
           isArchived: action === 'ban' // Hide properties if agent is banned
         })
       );
       await Promise.all(batchUpdates);
    }

    return NextResponse.json({ success: true, message: `Action ${action} completed on ${resourceId}` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================================================================
// 4. DELETE: HARD DELETE (PERMANENT REMOVAL)
// =======================================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = request.headers.get('x-admin-uid');
    const resourceId = searchParams.get('id');
    const resourceType = searchParams.get('type');

    // 1. Verify S-Admin
    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (!resourceId || !resourceType) {
      return NextResponse.json({ error: 'Missing ID or Type' }, { status: 400 });
    }

    let collectionName = '';
    if (resourceType === 'user') collectionName = 'users';
    if (resourceType === 'agent') collectionName = 'agents';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'property') collectionName = 'property';

    // 2. Perform Hard Delete
    await deleteDoc(doc(db, collectionName, resourceId));

    return NextResponse.json({ success: true, message: 'Permanently deleted' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}