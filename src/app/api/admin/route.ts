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
  where,
  writeBatch
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
  return userData?.role === 'sadmin'; 
}

// =======================================================================
// 2. GET: FETCH ALL DATA (FIXED FOR AGENTS)
// =======================================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = request.headers.get('x-admin-uid');
    const resource = searchParams.get('resource'); // 'users', 'agents', 'hotels', 'properties'
    const filter = searchParams.get('filter'); // 'banned', 'pending', 'pro'

    // 1. Verify S-Admin
    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin Access Required' }, { status: 403 });
    }

    let collectionName = '';
    let dateField = 'createdAt'; // Default sort field

    // 2. Select Collection & Sort Field
    switch (resource) {
      case 'users': 
        collectionName = 'users'; 
        break;
      case 'agents': 
        collectionName = 'agents'; 
        dateField = 'joinDate'; // <--- FIX: Agents use 'joinDate', not 'createdAt'
        break;
      case 'hotels': 
        collectionName = 'hotels'; 
        break;
      case 'properties': 
        collectionName = 'property'; 
        break;
      default: 
        return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
    }

    // 3. Build Query
    const colRef = collection(db, collectionName);
    let q;
    
    // Apply Dashboard Filters
    if (filter === 'banned') {
       q = query(colRef, where('status', '==', 'banned'), limit(100));
    } else if (filter === 'pending_verification') {
       q = query(colRef, where('isVerified', '==', false), where('planTier', 'in', ['pro', 'premium']), limit(100));
    } else if (filter === 'archived') {
       q = query(colRef, where('isArchived', '==', true), limit(100));
    } else {
       // Default: Recent items (using the correct dateField)
       q = query(colRef, orderBy(dateField, 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    
    // 4. Map Data (Normalize fields for Frontend)
    const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
            id: doc.id, 
            ...d,
            // Fallback for Name (Agents use agencyName or name)
            name: d.agencyName || d.name || 'Unnamed Agent', 
            // Fallback for Email
            email: d.email || '',
            // Fallback for Plan
            planTier: d.planTier || 'free',
            // Normalize Date so Frontend table doesn't break
            createdAt: d[dateField] || new Date().toISOString(), 
            // Ensure boolean flags exist
            isVerified: d.isVerified || false,
            featured: d.featured || false
        };
    });

    return NextResponse.json({ success: true, count: data.length, data });

  } catch (error: any) {
    console.error("GET Admin Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================================================================
// 3. PATCH: UPDATE STATUS (2-PLAN LOGIC)
// =======================================================================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminUid, resourceId, resourceType, action, payload } = body;
    
    // 1. Verify S-Admin
    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    let collectionName = '';
    if (resourceType === 'user') collectionName = 'users';
    if (resourceType === 'agent') collectionName = 'agents';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'property') collectionName = 'property';

    const docRef = doc(db, collectionName, resourceId);
    let updateData: any = {};

    // 2. Switch Action Logic
    switch (action) {
      case 'promote_plan':
        const isPro = payload.plan === 'pro';
        
        if (isPro) {
            // === MAKE PRO ===
            updateData = { 
                planTier: 'pro',
                isVerified: true,        
                featured: true,          
                isFeatured: true,        
                verifiedAt: new Date().toISOString(),
                status: 'active'
            };
        } else {
            // === MAKE FREE ===
            updateData = { 
                planTier: 'free',
                isVerified: false,       
                featured: false,         
                isFeatured: false,
                agentVerified: false
            };
        }
        break;

      case 'ban':
        updateData = { 
          status: 'banned', 
          isBanned: true,
          planTier: 'free',
          featured: false, 
          isFeatured: false,
          isVerified: false
        };
        break;

      case 'unban':
        updateData = { status: 'active', isBanned: false };
        break;

      case 'verify':
        updateData = { 
          isVerified: true, 
          agentVerified: true, 
          verifiedAt: new Date().toISOString() 
        };
        break;

      case 'feature':
        updateData = { 
          featured: payload.featured, 
          isFeatured: payload.featured 
        };
        break;

      case 'archive':
        updateData = { isArchived: true, status: 'archived', featured: false };
        break;

      case 'restore':
        updateData = { isArchived: false, status: 'available' };
        break;

      default:
        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    // 3. Execute Update
    await updateDoc(docRef, updateData);

    // 4. SYNC AGENT PROPERTIES
    if (resourceType === 'agent' && (action === 'promote_plan' || action === 'ban')) {
       const isPro = payload?.plan === 'pro';
       const isBan = action === 'ban';

       const q = query(collection(db, 'property'), where('agentId', '==', resourceId));
       const props = await getDocs(q);
       
       if (!props.empty) {
           const batch = writeBatch(db);
           props.docs.forEach(docSnap => {
               const propRef = doc(db, 'property', docSnap.id);
               if (isBan) {
                   batch.update(propRef, { isArchived: true, agentVerified: false, featured: false });
               } else {
                   batch.update(propRef, { 
                       agentVerified: isPro, 
                       isArchived: false 
                   });
               }
           });
           await batch.commit();
       }
    }

    return NextResponse.json({ success: true, message: `Action ${action} completed` });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =======================================================================
// 4. DELETE: HARD DELETE
// =======================================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = request.headers.get('x-admin-uid');
    const resourceId = searchParams.get('id');
    const resourceType = searchParams.get('type');

    const isSadmin = await checkSuperAdmin(adminUid);
    if (!isSadmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (!resourceId || !resourceType) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let collectionName = '';
    if (resourceType === 'user') collectionName = 'users';
    if (resourceType === 'agent') collectionName = 'agents';
    if (resourceType === 'hotel') collectionName = 'hotels';
    if (resourceType === 'property') collectionName = 'property';

    await deleteDoc(doc(db, collectionName, resourceId));

    return NextResponse.json({ success: true, message: 'Permanently deleted' });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}