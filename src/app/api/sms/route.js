import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate inputs
    if (!phoneNumber || !message) {
      return NextResponse.json({ error: 'Phone number and message are required.' }, { status: 400 });
    }

    // Get credentials from .env.local
    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;

    // Encode for Basic Auth
    const authString = Buffer.from(`${username}:${apiKey}`).toString('base64');

    // Send to ClickSend API
    const clicksendResponse = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        messages: [
          {
            source: "NextJSTest", // Shows up as the sender name
            body: message,
            to: phoneNumber
          }
        ]
      })
    });

    const data = await clicksendResponse.json();

    if (!clicksendResponse.ok) {
      return NextResponse.json({ error: data }, { status: clicksendResponse.status });
    }

    return NextResponse.json({ success: true, result: data }, { status: 200 });

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}