import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const { hotelId, userId, userName, rating, comment } = await request.json();

    if (!hotelId || !userId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Insert a new record into the 'hotel_reviews' table
    const { error } = await supabase
      .from('hotel_reviews')
      .insert([
        {
          hotelId, // Links the review to the specific hotel
          userId,
          userName,
          rating,
          comment,
          createdAt: new Date().toISOString(),
        }
      ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: 'Failed to post review.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Review posted successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error posting review:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}