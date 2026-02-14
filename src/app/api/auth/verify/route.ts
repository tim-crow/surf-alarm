import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const { data: user, error: lookupError } = await supabase
      .from('users')
      .select('id, name, email, beach_id, beach_name, min_swell, max_swell, min_tide, max_tide, offshore_max_wind, cross_shore_max_wind, onshore_max_wind, start_hour, end_hour, login_code, login_code_expires')
      .eq('email', email)
      .single();

    if (lookupError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    const now = new Date();
    const codeExpires = user.login_code_expires ? new Date(user.login_code_expires) : null;

    if (!user.login_code || user.login_code !== code || !codeExpires || codeExpires <= now) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 401 }
      );
    }

    const sessionToken = crypto.randomUUID();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        session_token: sessionToken,
        login_code: null,
        login_code_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to create session:', updateError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        beach_id: user.beach_id,
        beach_name: user.beach_name,
        min_swell: user.min_swell,
        max_swell: user.max_swell,
        min_tide: user.min_tide,
        max_tide: user.max_tide,
        offshore_max_wind: user.offshore_max_wind,
        cross_shore_max_wind: user.cross_shore_max_wind,
        onshore_max_wind: user.onshore_max_wind,
        start_hour: user.start_hour,
        end_hour: user.end_hour,
      },
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    );
  }
}
