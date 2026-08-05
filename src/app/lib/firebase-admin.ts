import * as admin from 'firebase-admin';

// Check if variables exist to prevent silent undefined crashes
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error("🔴 FIREBASE ADMIN ERROR: Missing Environment Variables!");
  console.error("Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.local");
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Safely parse the private key, handling both \n strings and actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // Automatically configure the storage bucket using your project ID
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`, 
    });
    console.log("🟢 Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error("🔴 Firebase Admin Initialization Error:", error);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminMessaging = admin.messaging();
const adminStorage = admin.storage(); // <-- ADDED THIS FOR YOUR UPLOAD API

// Export all four!
export { adminDb, adminAuth, adminMessaging, adminStorage };