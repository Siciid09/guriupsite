import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Get the phone number and message from the frontend request
    const { to, message } = await request.json();

    // 2. Fetch credentials from environment variables
    const username = process.env.CLICKSEND_USERNAME;
    const apiKey = process.env.CLICKSEND_API_KEY;

    // 3. Encode the credentials to Base64 for Basic Auth as required by ClickSend
    const authHeader = `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;

    // 4. Send the request to ClickSend's SMS endpoint
    const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        messages: [
          {
            to: to, // Ensure this is formatted with the country code (e.g., +252633227084)
            source: "NextJS", // Sender ID (max 11 chars)
            body: message
          }
        ]
      })
    });

    const data = await response.json();

    // 5. Return the ClickSend response back to the frontend
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('SMS Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}