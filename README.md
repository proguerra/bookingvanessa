# Book Vanessa — Vercel-ready website

A playful booking experience built with standard Next.js. It includes the full
design, photographs, rejection animations, 60-day availability, written
applications, promotion codes, pricing, and a confirmation flow.

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

## Current implementation

- Availability is generated in the browser for the next 60 days.
- Booking windows run from 6 PM–10 PM Central Time in 90-minute blocks.
- The promotion codes `bigdickalexg` and `alexguerra` apply a 100% discount.
- Checkout and confirmation currently run in the browser.
- Form data is not submitted to a server.
