import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// You would also get the authenticated user's ID here in a real app

export async function POST(request: Request) {
  try {
    const { hotelId, userId, userName, rating, comment } = await request.json();

    if (!hotelId || !userId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const reviewRef = collection(db, 'hotels', hotelId, 'reviews');
    await addDoc(reviewRef, {
      userId,
      userName,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ message: 'Review posted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}