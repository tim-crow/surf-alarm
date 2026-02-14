# SwellCheck Web App

A consumer-facing surf alert application with glass UI design.

## Features

- 🏄 Beautiful glass-style UI
- 📍 Pre-loaded Australian beach locations
- ⚙️ Customizable surf condition thresholds
- 💳 Stripe integration for $4.99/month subscription (30-day free trial)
- 📧 Email alerts via Resend

## Quick Start

```bash
cd webapp
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Frontend:** Next.js 14 + React 18
- **Styling:** Tailwind CSS (Glass UI)
- **Auth & Database:** Supabase (to be configured)
- **Payments:** Stripe (to be configured)
- **Emails:** Resend

## Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PRICE_ID=your_stripe_price_id

# Resend
RESEND_API_KEY=your_resend_api_key

# WillyWeather
WILLYWEATHER_API_KEY=your_willyweather_api_key
```

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

## Pricing Model

- **Free Trial:** 30 days
- **Monthly:** $4.99/month
