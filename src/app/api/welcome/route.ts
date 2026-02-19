import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, beachName } = await request.json();

    if (!email || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Missing email or API key' }, { status: 400 });
    }

    const userName = name || 'there';

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'alerts@swellcheck.co',
        to: [email],
        subject: '🏄 Welcome to SwellCheck!',
        text: `Hey ${userName}!\n\nYou're all set up and ready to go.\n\nWe're now monitoring ${beachName} for your ideal conditions. When swell, tide, and wind all line up, you'll get an email straight away.\n\nWhat happens next:\n• We check conditions every 30 minutes\n• You only get alerted when YOUR thresholds are met\n\nClick here to check and change your settings:\nhttps://www.swellcheck.co/account\n\nSee you in the water!\nSwellCheck\n\n—\nThis is an automated message. Please do not reply to this email.`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
