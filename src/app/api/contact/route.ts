import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { name, phone, description } = await request.json();

    // Basic validation
    if (!name || !phone || !description) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Add a new document to the 'notFound' collection
    await addDoc(collection(db, 'notFound'), {
      name,
      phone,
      description,
      submittedAt: serverTimestamp(),
    });

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}