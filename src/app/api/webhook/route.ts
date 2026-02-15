import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edbdbpnkphybctejcvxl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabaseAdmin = getSupabaseAdmin();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerEmail = session.customer_details?.email;
        
        if (userId) {
          await supabaseAdmin
            .from('users')
            .update({
              stripe_customer_id: session.customer as string,
              subscription_status: 'trialing',
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId);
        }

        // Send welcome email
        if (customerEmail && process.env.RESEND_API_KEY) {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('name, beach_name')
            .eq('id', userId)
            .single();

          const userName = userData?.name || 'there';
          const beachName = userData?.beach_name || 'your beach';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'alerts@swellcheck.co',
              to: [customerEmail],
              subject: '🏄 Welcome to SwellCheck!',
              text: `Hey ${userName}!\n\nYou're all set up and ready to go.\n\nWe're now monitoring ${beachName} for your ideal conditions. When swell, tide, and wind all line up, you'll get an email straight away.\n\nWhat happens next:\n• We check conditions every 30 minutes\n• You only get alerted when YOUR thresholds are met\n• Your 30-day free trial has started — no charge today\n\nClick here to check and change your settings:\nhttps://www.swellcheck.co/account\n\nSee you in the water!\nSwellCheck`,
            }),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        
        if (userId) {
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscription.status,
            })
            .eq('id', userId);
        } else {
          // Try to find by stripe_customer_id
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: subscription.status,
            })
            .eq('stripe_customer_id', subscription.customer as string);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'canceled',
            is_active: false,
          })
          .eq('stripe_customer_id', subscription.customer as string);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.billing_reason === 'subscription_cycle') {
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'active',
            })
            .eq('stripe_customer_id', invoice.customer as string);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'past_due',
          })
          .eq('stripe_customer_id', invoice.customer as string);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
