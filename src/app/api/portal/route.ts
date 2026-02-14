import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edbdbpnkphybctejcvxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // First check database
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('email', email)
      .single();

    let customerId = user?.stripe_customer_id;

    // If not in database, look up directly in Stripe
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;

        // Save it to the database for next time
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('email', email);
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No subscription found. Complete signup first.' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.swellcheck.co'}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
