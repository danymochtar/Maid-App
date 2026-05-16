# Pembantu-App

A swipe-to-match marketplace for personal helpers in Malaysia. Cleaning, cooking, errands, eldercare, and more.

Plan: `/root/.claude/plans/i-want-to-create-delightful-curry.md` (or check the commit history).

## Stack

- **Next.js 15** (App Router, RSC, Server Actions) + TypeScript strict
- **Prisma 6** on Prisma Postgres (via Vercel Marketplace)
- **Better Auth** (phone-OTP plugin) + Twilio Verify
- **Billplz** for FPX / DuitNow QR / e-wallets — Stripe doesn't support FPX in MY
- **Framer Motion** for the swipe stack
- **Serwist** for PWA
- **Pusher Channels** for in-app chat
- **Inngest** for booking-lifecycle jobs (payout release, match expiry, reminders)
- **Vercel Blob** for ID/selfie + listing photos
- **Upstash Redis** for rate-limits
- **Tailwind 4 + shadcn/ui** for UI
- **Biome** for lint/format

## Quick start

```bash
# 1. install
npm install

# 2. configure env
cp .env.example .env
#   - Set DATABASE_URL to a local Postgres or `npx prisma dev` URL.
#   - Leave DEV_OTP_BYPASS=1 for local dev (accepts code 000000).

# 3. database
npx prisma migrate dev --name init
npm run db:seed       # 1 admin, 1 test client, 10 helpers across categories

# 4. run
npm run dev           # http://localhost:3000
```

**Test customer**: `test@maidapp.ai` / `test123` (id `test-client-fixed-id`).
The current dev build runs every server action as this user — full Better Auth
session lookup lands in implementation step 3.

Open `/` then tap **Find a helper** to see the swipe stack.

### End-to-end simulation

```bash
npm run db:simulate
```

Walks the test customer through 35 checks across every implemented feature —
login (scrypt), discover stack, feature-flag gating, filters, swipe LRS, swipe
idempotency, pass-hide, mutual-match unlock, chat PII redaction, booking
gated on MATCHED, Billplz X-Signature verification (good + forged + truncated),
rate-limit cap at 20 right-swipes/day, unmatch, block.

## What's wired up (this commit)

- Prisma schema with HelperProfile, HelperListing, Swipe, Match, Booking, PaymentIntent, Dispute, audit/trust models
- Swipe-stack discovery: server action + Framer Motion card stack + match celebration overlay
- `swipeListing` server action with idempotent upsert + rate-limits + mutual-right → MATCHED
- Filters drawer (category, postcode, max rate, skill keyword)
- Billplz webhook stub with X-Signature HMAC verification
- PII redaction utility for chat (strips MY phone formats, emails, social handles)
- Phone OTP starter with `DEV_OTP_BYPASS=1` shortcut for local dev
- PWA manifest + Serwist service worker
- Feature flags for high-trust categories (childcare/eldercare/driver/beauty) defaulted OFF

## What's still stubbed

See the plan's "Implementation Order" — remaining: full Better Auth wiring, helper onboarding wizard, listing CRUD UI, match detail + Pusher chat, booking flow + Billplz bill creation, check-in (geo + photo), Inngest functions, admin dashboard, reviews, mutual rating, Playwright e2e.

## Deploy to Vercel

1. Push branch → import repo on Vercel
2. Add the **Prisma Postgres** marketplace integration (auto-injects `DATABASE_URL` + `DIRECT_URL`)
3. Add the remaining env vars from `.env.example`
4. Region is pinned to `sin1` via `vercel.json`

## Differentiation vs Maideasy

See the plan file. Headline: any-category helpers (not just cleaning), helper-set pricing, mutual swipe match required before booking, in-app chat with PII protection, persistent match relationship for 2-tap re-booking.

## Risks called out in the plan

- Childcare/eldercare/driver/beauty disabled by default until TIER_1 ID+selfie verification ships
- "Pay-after-service" implemented as collect-now-release-later via Billplz balance — not true post-pay
- Free-text skills go through a banned-terms moderation filter
