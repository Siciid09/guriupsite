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

// --- SECURITY: CHECK S-ADMIN ---
async function checkSuperAdmin(uid: string | null) {
  if (!uid) return false;
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return false;
  return userSnap.data()?.role === 'sadmin'; 
}

// --- GET: FETCH ALL RESOURCES ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUid = request.headers.get('x-admin-uid');
    const resource = searchParams.get('resource'); // 'users', 'agents', 'hotels', 'properties'

    if (!await checkSuperAdmin(adminUid)) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin Access Required' }, { status: 403 });
    }

    let collectionName = '';
    let dateField = 'createdAt'; 

    switch (resource) {
      case 'users': collectionName = 'users'; break;
      case 'agents': 
        collectionName = 'agents'; 
        dateField = 'joinDate'; 
        break;
      case 'hotels': collectionName = 'hotels'; break;
      case 'properties': collectionName = 'property'; break;
      default: return NextResponse.json({ error: 'Invalid Resource' }, { status: 400 });
    }

    const q = query(collection(db, collectionName), orderBy(dateField, 'desc'), limit(100));
    const snapshot = await getDocs(q);
    
    const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
            id: doc.id, 
            ...d,
            name: d.agencyName || d.name || 'Unnamed', 
            email: d.email || '',
            planTier: d.planTier || 'free',
            createdAt: d[dateField] || new Date().toISOString(), 
            isVerified: d.isVerified || false,
            featured: d.featured || false
        };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PATCH: UPDATE & SMART SYNC ---
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { adminUid, resourceId, resourceType, action, payload } = body;
    
    if (!await checkSuperAdmin(adminUid)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    let collectionName = resourceType === 'property' ? 'property' : `${resourceType}s`;
    const docRef = doc(db, collectionName, resourceId);
    let updateData: any = {};

    switch (action) {
      case 'promote_plan':
        const isPro = payload.plan === 'pro';
        updateData = { 
            planTier: isPro ? 'pro' : 'free',
            isVerified: isPro,
            featured: isPro,
            isFeatured: isPro,
            verifiedAt: isPro ? new Date().toISOString() : null,
            status: 'active'
        };
        break;
      case 'ban':
        updateData = { status: 'banned', isBanned: true, planTier: 'free', isVerified: false, featured: false };
        break;
      case 'unban':
        updateData = { status: 'active', isBanned: false };
        break;
      case 'feature':
        updateData = { featured: payload.featured, isFeatured: payload.featured };
        break;
      default: return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    }

    await updateDoc(docRef, updateData);

    // --- SMART SYNC FOR PROPERTIES ---
    if (resourceType === 'agent' && (action === 'promote_plan' || action === 'ban')) {
       const isPro = payload?.plan === 'pro';
       const isBan = action === 'ban';
       const agentSnap = await getDoc(doc(db, 'agents', resourceId));
       const realUserId = agentSnap.exists() ? (agentSnap.data().userid || resourceId) : resourceId;

       const q = query(collection(db, 'property'), where('agentId', 'in', [resourceId, realUserId]));
       const props = await getDocs(q);
       
       if (!props.empty) {
           const batch = writeBatch(db);
           props.docs.forEach(docSnap => {
               batch.update(docSnap.ref, { 
                   agentVerified: !isBan && isPro,
                   isVerified: !isBan && isPro,
                   featured: !isBan && isPro,
                   isFeatured: !isBan && isPro,
                   planTier: isBan ? 'free' : (isPro ? 'pro' : 'free'),
                   planTierAtUpload: isBan ? 'free' : (isPro ? 'pro' : 'free'),
                   isArchived: isBan,
                   status: isBan ? 'archived' : 'available'
               });
           });
           await batch.commit();
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: SINGLE ITEM ---
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminUid = request.headers.get('x-admin-uid');
  const id = searchParams.get('id');
  const type = searchParams.get('type');

  if (!await checkSuperAdmin(adminUid)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const col = type === 'property' ? 'property' : `${type}s`;
  await deleteDoc(doc(db, col, id!));
  return NextResponse.json({ success: true });
}