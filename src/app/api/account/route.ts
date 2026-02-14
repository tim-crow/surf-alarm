import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edbdbpnkphybctejcvxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

const USER_FIELDS = 'id, name, email, beach_id, beach_name, min_swell, max_swell, min_tide, max_tide, offshore_max_wind, cross_shore_max_wind, onshore_max_wind, start_hour, end_hour';

function getToken(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('session_token', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data: existing, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('session_token', token)
    .single();

  if (lookupError || !existing) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  const body = await request.json();
  const allowedFields = [
    'name', 'email', 'beach_id', 'beach_name',
    'min_swell', 'max_swell', 'min_tide', 'max_tide',
    'offshore_max_wind', 'cross_shore_max_wind', 'onshore_max_wind',
    'start_hour', 'end_hour',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data: user, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', existing.id)
    .select(USER_FIELDS)
    .single();

  if (updateError || !user) {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }

  return NextResponse.json({ success: true, user });
}
