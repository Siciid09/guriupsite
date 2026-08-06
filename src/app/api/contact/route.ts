import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase'; // 🛡️ FIX: Use Admin to bypass public RLS blocks

export async function POST(request: Request) {
  try {
    // 🛡️ TS NULL CHECK
    if (!supabaseAdmin) {
       return NextResponse.json({ error: 'Server error: Admin client missing.' }, { status: 500 });
    }

    const { name, phone, description } = await request.json();

    // Basic validation
    if (!name || !phone || !description) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Insert a new record into the 'contacts' table
    const { error } = await supabaseAdmin
      .from('contacts')
      .insert([
        {
          _id: crypto.randomUUID(), // 🛡️ CRITICAL FIX: Satisfy NOT NULL constraint
          id: crypto.randomUUID(),  // Fallback ID
          name,
          phone,
          description,
          submittedAt: new Date().toISOString(), 
          createdAt: new Date().toISOString(), // Standardized timestamp fallback
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