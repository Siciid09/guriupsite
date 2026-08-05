import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, phone, description } = await request.json();

    // Basic validation
    if (!name || !phone || !description) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Insert a new record into the 'notFound' table
    const { error } = await supabase
      .from('notFound')
      .insert([
        {
          name,
          phone,
          description,
          submittedAt: new Date().toISOString(), // Supabase equivalent to serverTimestamp()
        }
      ]);

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ error: 'Failed to save message to database.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Message sent successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}