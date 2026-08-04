# Book Vanessa — Vercel-ready demo

A playful, browser-only booking experience built with standard Next.js. It keeps
the complete design, photographs, rejection animations, sample availability,
pricing, and confirmation flow without connecting to Stripe, Google Calendar,
a database, or any other external service.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js.

## Deploy on Vercel

1. Upload this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Leave the framework preset as **Next.js**.
4. Do not add environment variables.
5. Click **Deploy**.

Vercel automatically uses `npm install` and `npm run build`.

## What is intentionally fake

- Availability is generated in the browser for the next 60 days.
- Prices are for entertainment only.
- Checkout collects no card or payment information.
- Confirmation creates no calendar event and sends no email.
- Form data is not submitted to a server.

The site does not offer dating, escort, adult, or sexual services.
