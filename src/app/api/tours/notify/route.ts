import { NextResponse, NextRequest } from 'next/server';
import { adminAuth, adminMessaging } from '@/app/lib/firebase-admin'; // Removed adminDb
import { supabaseAdmin } from '@/app/lib/supabase';

export const dynamic = 'force-dynamic';

// =========================================================
// SECURITY HELPER: VERIFY FIREBASE AUTH TOKEN
// =========================================================
async function getVerifiedUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (e) {
    return null;
  }
}

// =========================================================
// SECURITY HELPER: STRICT ROLE CHECK
// =========================================================
async function getUserRoleStrict(uid: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .or(`id.eq.${uid},_id.eq.${uid}`) // Unified ID Check
    .maybeSingle();
  return user?.role || null;
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    // ---------------------------------------------------------
    // 1. INTRUSION PREVENTION: VERIFY TOKEN & ROLES
    // ---------------------------------------------------------
    const uid = await getVerifiedUid(request);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized. Missing or invalid token.' }, { status: 401 });
    }

    const role = await getUserRoleStrict(uid);
    const validRoles = ['sadmin', 'admin', 'badmin'];
    
    if (!role || !validRoles.includes(role.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden. You do not have broadcast authority.' }, { status: 403 });
    }

    // ---------------------------------------------------------
    // 2. VALIDATE PAYLOAD
    // ---------------------------------------------------------
    const body = await request.json();
    const { title, messageBody, topic } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Missing title or message body' }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 3. LOG TO SUPABASE HISTORY (Replaced Firestore)
    // ---------------------------------------------------------
    const { error: dbError } = await supabaseAdmin.from('notifications').insert([{
      title: title,
      body: messageBody,
      sentBy: uid,
      topic: topic || 'all_users',
      createdAt: new Date().toISOString()
    }]);

    if (dbError) {
      console.error('Failed to log notification to Supabase:', dbError);
      // We log the error but don't stop the push notification from sending
    }

    // ---------------------------------------------------------
    // 4. TRIGGER FCM PUSH NOTIFICATION
    // ---------------------------------------------------------
    const message = {
      notification: {
        title: title,
        body: messageBody,
      },
      topic: topic || 'all_users', // Default to all_users
    };

    const response = await adminMessaging.send(message);
    
    return NextResponse.json({ 
      success: true, 
      messageId: response 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}