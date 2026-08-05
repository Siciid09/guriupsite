require('dotenv').config({ path: '.env.local' });
const admin = require("firebase-admin");
const fs = require("fs");

const OUTPUT_FILE = "my_complete_database.json";

// We explicitly skip these massive collections so the script doesn't freeze
const EXCLUDED_COLLECTIONS = ["analytics", "analytics_views"];

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const db = admin.firestore();

// Helper to handle Firestore custom data types (Timestamps, GeoPoints)
function processFirestoreData(data) {
  if (data === null || data === undefined) return data;
  
  if (data && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    return { latitude: data.latitude, longitude: data.longitude };
  }
  if (data && typeof data.path === 'string' && typeof data.isEqual === 'function') {
    return `[REFERENCE]: ${data.path}`;
  }
  if (Array.isArray(data)) {
    return data.map(item => processFirestoreData(item));
  }
  if (typeof data === 'object') {
    const processedObject = {};
    for (const key in data) {
      processedObject[key] = processFirestoreData(data[key]);
    }
    return processedObject;
  }
  
  return data;
}

// Recursively export a document and ALL of its subcollections (No limits this time!)
async function exportDocument(docRef) {
  const docSnap = await docRef.get();
  let docData = docSnap.exists ? docSnap.data() : null;
  
  if (!docData) return null;

  docData = processFirestoreData(docData);

  const subcollections = await docRef.listCollections();
  for (const subcol of subcollections) {
    docData[subcol.id] = [];
    const snapshot = await subcol.get();
    for (const subdoc of snapshot.docs) {
      const subdocData = await exportDocument(subdoc.ref);
      if (subdocData) {
        docData[subcol.id].push({ _id: subdoc.id, ...subdocData });
      }
    }
  }
  
  return docData;
}

// Main execution function
async function exportCompleteFirestore() {
  console.log("Starting full database export (skipping heavy analytics)...");
  const collections = await db.listCollections();
  const exportData = {};

  for (const col of collections) {
    // Check if the collection is in our exclusion list
    if (EXCLUDED_COLLECTIONS.includes(col.id)) {
      console.log(`⏭️  Skipping excluded collection: ${col.id}`);
      continue;
    }

    console.log(`Exporting root collection: ${col.id}`);
    exportData[col.id] = [];
    const snapshot = await col.get();
    
    for (const doc of snapshot.docs) {
      const docData = await exportDocument(doc.ref);
      if (docData) {
        exportData[col.id].push({ _id: doc.id, ...docData });
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ Success! Essential database completely exported to: ${OUTPUT_FILE}`);
}

exportCompleteFirestore().catch((error) => {
  console.error("Error exporting database:", error);
});