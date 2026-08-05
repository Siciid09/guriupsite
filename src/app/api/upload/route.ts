import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/app/lib/firebase-admin'; // Standardized import path

export const dynamic = 'force-dynamic';

// ==========================================
// UPLOAD FILE (POST)
// ==========================================
export async function POST(request: NextRequest) {
  try {
    // 1. Verify User is Authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Missing or invalid token.' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 2. Extract File from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'general'; // e.g., 'properties', 'hotels'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to Firebase Admin Storage
    const bucket = adminStorage.bucket();
    const safeFileName = file.name ? file.name.replace(/\s+/g, '_') : 'uploaded_file';
    const fileName = `${folder}/${decodedToken.uid}_${Date.now()}_${safeFileName}`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    // 5. Make Public and Get URL
    await fileRef.makePublic();
    const publicUrl = fileRef.publicUrl();

    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error: any) {
    console.error('Upload error:', error.message);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

// ==========================================
// DELETE FILE (DELETE)
// ==========================================
export async function DELETE(request: NextRequest) {
  try {
    // 1. Verify User is Authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized. Missing or invalid token.' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    // 2. Extract File URL
    const { fileUrl } = await request.json();
    if (!fileUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    // 3. Parse File Path from Public URL and Delete
    const bucket = adminStorage.bucket();
    const bucketName = bucket.name;
    
    // Extracts the file path from a standard Firebase Storage public URL
    // Format: https://storage.googleapis.com/BUCKET_NAME/folder/filename.jpg
    const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
    
    if (fileUrl.startsWith(baseUrl)) {
      const filePath = fileUrl.replace(baseUrl, '');
      const fileRef = bucket.file(filePath);
      
      const [exists] = await fileRef.exists();
      if (exists) {
        await fileRef.delete();
      } else {
        console.warn('File to delete not found in bucket:', filePath);
      }
    }

    return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete error:', error.message);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}