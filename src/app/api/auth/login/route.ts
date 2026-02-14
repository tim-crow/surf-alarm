import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edbdbpnkphybctejcvxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (lookupError || !user) {
      return NextResponse.json(
        { error: 'No account found with that email' },
        { status: 404 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('users')
      .update({ login_code: code, login_code_expires: expiresAt })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save login code:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate login code' },
        { status: 500 }
      );
    }

    const emailFrom = process.env.EMAIL_FROM || 'alerts@swellcheck.co';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: 'SwellCheck - Your login code',
        text: `Your login code is: ${code}\n\nThis code expires in 10 minutes.`,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error('Resend error:', resendError);
      return NextResponse.json(
        { error: 'Failed to send login email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process login' },
      { status: 500 }
    );
  }
}
